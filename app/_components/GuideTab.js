"use client";

import { useState } from "react";
import { ACCOUNT, BARS, DEMO_QUESTIONS, MATRIX, USE_CASES, UNLISTED } from "../../lib/data.js";
import { ACTION_TEXT, ACTION_TONE, Feedback, MiniGrid, ScoreBar, Tag, pathInfo, time } from "./ui.js";

const barFor = (key) => (key === UNLISTED.key ? null : BARS[USE_CASES[key].risk]);

function Matrix({ ask, loading, active }) {
  const cell = (risk, verified) => {
    const out = MATRIX.outcome[`${risk}-${verified}`];
    const qs = DEMO_QUESTIONS.filter((d) => {
      const uc = USE_CASES[d.key];
      return uc && uc.risk === risk && uc.verified === verified;
    });
    const isActive = active && active.risk === risk && active.verified === verified;
    return (
      <div className={`cell tone-${out.tone}${isActive ? " is-active" : ""}`} key={`${risk}-${verified}`}>
        <p className="cell-outcome">{out.text}</p>
        {qs.map((d) => (
          <button key={d.question} className="qbtn" onClick={() => ask(d.question)} disabled={loading} title={d.question}>
            <span className="qbtn-label">{d.label}</span>
            <span className="qbtn-src">{USE_CASES[d.key].source}</span>
          </button>
        ))}
      </div>
    );
  };
  const unlisted = DEMO_QUESTIONS.filter((d) => d.key === UNLISTED.key);
  return (
    <section className="matrix-wrap" aria-label="Try a question">
      <div className="matrix-title">
        <h2>Try a question</h2>
        <Tag kind="assumed" />
      </div>
      <p className="muted small">Each use case sits where its risk and verification put it. The cell names what Guide does.</p>
      <div className="matrix" role="group">
        {MATRIX.cols.map((c) => (
          <span key={c.label} className="axis axis-col">
            {c.label}
            <span className="axis-desc">({c.desc})</span>
          </span>
        ))}
        {MATRIX.rows.map((r) => (
          <div className="matrix-row" key={r.risk}>
            <span className="axis axis-row">
              {r.label} <span className="axis-desc">({r.desc})</span>
            </span>
            {MATRIX.cols.map((c) => cell(r.risk, c.verified))}
          </div>
        ))}
      </div>
      <div className={`unlisted${active && active.unlisted ? " is-active" : ""}`}>
        <p className="cell-outcome">Unlisted requests: risk rated by Claude, unsure counts as high</p>
        <div className="unlisted-qs">
          {unlisted.map((d) => (
            <button key={d.question} className="qbtn" onClick={() => ask(d.question)} disabled={loading} title={d.question}>
              <span className="qbtn-label">{d.label}</span>
              <span className="qbtn-src">{d.expect}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="muted small">Or type anything, including requests Guide has never seen.</p>
    </section>
  );
}

function Sources({ sources }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="sources">
      <div className="chips">
        <span className="muted small">Sources</span>
        {sources.map((p) => (
          <button
            key={p.id}
            className={`chip${open === p.id ? " on" : ""}`}
            onClick={() => setOpen(open === p.id ? null : p.id)}
            aria-expanded={open === p.id}
          >
            {p.id} {p.title}
          </button>
        ))}
        <Tag kind="mock" />
      </div>
      {sources
        .filter((p) => p.id === open)
        .map((p) => (
          <p key={p.id} className="clause">
            {p.text}
          </p>
        ))}
    </div>
  );
}

function AfterCard({ shown, entry, team, setTeam, updateEntry, score }) {
  const info = pathInfo(shown);
  const bar = barFor(entry.useCaseKey);
  const handoff = shown.action === "handed off";
  return (
    <article className={`answer edge-${info.tone}`}>
      <div className="answer-head">
        <span className="answer-mode">With safeguards</span>
        <Tag kind="live" />
        {shown.action === "flagged" && <span className="status tone-review">Needs review before it goes to a resident</span>}
        {shown.action === "labeled" && <span className="status tone-label">Unverified use case</span>}
        {handoff && <span className="status tone-handoff">Handed off</span>}
      </div>
      <div className="pathline">
        <MiniGrid risk={info.risk} verified={info.verified} tone={info.tone} />
        <div>
          <p className="path-text">{info.text}</p>
          <p className="muted small">
            {shown.useCase} ({shown.source}) <Tag kind="assumed" />
            {shown.riskReason && <> Claude&apos;s reason: {shown.riskReason}</>}
          </p>
        </div>
      </div>

      {handoff ? (
        <>
          <p className="handoff-note">
            Sent to the {ACCOUNT.name} team. {shown.reason}
          </p>
          <div className="team">
            <label htmlFor="team-response" className="team-label">
              Team response <Tag kind="sim" />
            </label>
            <textarea
              id="team-response"
              value={entry.author === "team" && entry.teamResponse ? entry.teamResponse : team}
              onChange={(e) => setTeam(e.target.value)}
              rows={4}
              disabled={entry.author === "team"}
            />
            {entry.author !== "team" && (
              <button
                className="primary"
                disabled={!team.trim()}
                onClick={() => {
                  updateEntry(entry.id, { teamResponse: team.trim() });
                  score(entry.id, entry.question, team.trim(), "team");
                }}
              >
                Submit and score
              </button>
            )}
            <ScoreBar entry={entry} bar={bar} />
          </div>
        </>
      ) : (
        <>
          {shown.action === "labeled" && (
            <p className="label-note">
              This use case hasn&apos;t passed the verification bar yet. Guide still answers so new uses aren&apos;t blocked,
              but check it before relying on it.
            </p>
          )}
          <div className="answer-body">{shown.answer}</div>
          <Sources sources={shown.sources} />
          <ScoreBar entry={entry} bar={bar} />
          <Feedback entry={entry} onVote={(v) => updateEntry(entry.id, { feedback: v })} />
        </>
      )}
    </article>
  );
}

function AuditTimeline({ log, mode }) {
  return (
    <section className="audit" aria-label="Audit trail">
      <h2>Audit trail</h2>
      {mode === "before" && <p className="muted small">Today&apos;s Guide keeps no record, so nothing is added here.</p>}
      {log.length === 0 && mode === "after" && (
        <p className="muted small">Ask a question with safeguards on. Each answer is recorded here with its score, path and versions.</p>
      )}
      <ol className="timeline">
        {log.map((e) => (
          <li key={e.id} className={`tone-${ACTION_TONE[e.action]}`}>
            <details>
              <summary>
                <span className="tl-action">{ACTION_TEXT[e.action]}</span>
                <span className="tl-q">{e.question}</span>
                <span className="muted small">
                  {time(e.timestamp)}
                  {e.score && (e.score.noCoverage ? ", team: no coverage" : `, ${e.author === "team" ? "team " : ""}${e.score.headline}%`)}
                </span>
              </summary>
              <dl className="record">
                <dt>Account</dt>
                <dd>{e.account}</dd>
                <dt>Use case</dt>
                <dd>
                  {e.useCase} ({e.source})
                </dd>
                <dt>Risk</dt>
                <dd>
                  {e.risk}
                  {e.riskReason && `: ${e.riskReason}`}
                </dd>
                <dt>Verification</dt>
                <dd>{e.verification}</dd>
                <dt>Sources</dt>
                <dd>{e.sources.length ? e.sources.map((s) => s.id).join(", ") : "None"}</dd>
                <dt>Answered by</dt>
                <dd>{e.author === "team" ? "Team (simulated)" : e.author === "guide" ? "Guide" : "Awaiting team"}</dd>
                <dt>Score</dt>
                <dd>
                  {e.score
                    ? e.score.noCoverage
                      ? "No policy coverage"
                      : `${e.score.headline}% (grounded ${e.score.grounded}, accurate ${e.score.accurate}, complete ${e.score.complete})`
                    : "Not scored yet"}
                </dd>
                <dt>Judge issues</dt>
                <dd>{e.score?.issues?.length ? e.score.issues.join("; ") : e.score ? "None" : "Not scored yet"}</dd>
                <dt>Policy gap</dt>
                <dd>{e.score?.policyGap || "None"}</dd>
                <dt>Feedback</dt>
                <dd>{e.author !== "guide" ? "Not applicable" : e.feedback === "up" ? "Thumbs up" : e.feedback === "down" ? "Thumbs down" : "None"}</dd>
                <dt>Prompt</dt>
                <dd>{e.promptVersion}</dd>
                <dt>Models</dt>
                <dd>{[e.models.routing, e.models.answer, e.score?.model].filter(Boolean).join(", ")}</dd>
                <dt>Policies</dt>
                <dd>{e.policyVersion}</dd>
              </dl>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function GuideTab(p) {
  const { mode, setMode, question, setQuestion, ask, loading, stage, error, setError, shown, entry, otherMode, ranOther, log } = p;
  const active = shown && shown.mode === "after" ? { ...pathInfo(shown), unlisted: shown.useCaseKey === UNLISTED.key } : null;
  return (
    <div className="guide-grid">
      <Matrix ask={ask} loading={loading} active={active && !active.unlisted ? active : active && { unlisted: true }} />

      <div className="guide-main">
        <h2>Guide assistant</h2>
        <div className="segmented" role="radiogroup" aria-label="Guide version">
          <button role="radio" aria-checked={mode === "before"} className={mode === "before" ? "on" : ""} onClick={() => setMode("before")}>
            <span className="seg-kicker">Before</span>
            <strong>Today&apos;s Guide</strong>
            <span>Same policies and model, no safeguards</span>
          </button>
          <button role="radio" aria-checked={mode === "after"} className={mode === "after" ? "on" : ""} onClick={() => setMode("after")}>
            <span className="seg-kicker">After</span>
            <strong>With safeguards</strong>
            <span className="layer-chips">
              <span className="layer">Trust</span>
              <span className="layer">Dependability</span>
            </span>
          </button>
        </div>

        <div className="ask">
          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask();
            }}
            placeholder="Ask Guide anything a property manager might ask"
            rows={3}
            aria-label="Question for Guide"
          />
          <button className="primary" onClick={() => ask()} disabled={loading}>
            {loading ? "Working…" : `Ask Guide (${mode === "after" ? "with safeguards" : "today's Guide"})`}
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loading && (
          <p className="stage" aria-live="polite">
            {stage}
          </p>
        )}
        {!loading && ranOther && !shown && (
          <p className="hint">You ran this question in {otherMode === "after" ? "With safeguards" : "Today's Guide"}. Ask it here to compare.</p>
        )}

        {shown && shown.mode === "before" && (
          <article className="answer before">
            <div className="answer-head">
              <span className="answer-mode">Today&apos;s Guide</span>
              <Tag kind="live" /> <Tag kind="sim" />
            </div>
            <div className="answer-body">{shown.answer}</div>
            <p className="missing">No requirement to cite. No risk check or handoff. Not scored or recorded.</p>
          </article>
        )}
        {shown && shown.mode === "after" && entry && <AfterCard shown={shown} entry={entry} {...p} />}

        <AuditTimeline log={log} mode={mode} />
      </div>
    </div>
  );
}
