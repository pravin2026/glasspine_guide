"use client";

import { Fragment, useMemo, useState } from "react";
import { BARS, EVIDENCE_MIN, HISTORICAL_PAIRS, SEED_HISTORY, UNLISTED, USE_CASES } from "../../lib/data.js";
import { ACTION_TEXT, ACTION_TONE, Tag, isDisagreement, time } from "./ui.js";

const barFor = (key) => (key === UNLISTED.key ? null : BARS[USE_CASES[key].risk]);
const pct = (v) => `${(v * 100).toFixed(1)}%`;

function Delta({ now, seed }) {
  if (now == null || seed == null) return null;
  const d = (now - seed) * 100;
  if (Math.abs(d) < 0.05) return null;
  return (
    <span className={`delta ${d > 0 ? "up" : "down"}`}>
      {d > 0 ? "+" : ""}
      {d.toFixed(1)} live
    </span>
  );
}

function computeRows(log, consistency) {
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  return [...Object.keys(USE_CASES), UNLISTED.key].map((key) => {
    const uc = USE_CASES[key];
    const seed = SEED_HISTORY[key];
    const live = log.filter((e) => e.useCaseKey === key && e.score);
    const liveGuide = live.filter((e) => e.author === "guide" && !e.score.noCoverage).map((e) => e.score.headline / 100);
    const liveTeam = live.filter((e) => e.author === "team" && !e.score.noCoverage).map((e) => e.score.headline / 100);
    const guideN = seed.guide.n + liveGuide.length;
    const teamN = seed.human.n + liveTeam.length;
    const n = guideN + teamN;
    const seedN = seed.guide.n + seed.human.n;
    const seedRel = seedN ? (seed.guide.avg * seed.guide.n + seed.human.avg * seed.human.n) / seedN : null;
    const reliability = n ? (seed.guide.avg * seed.guide.n + sum(liveGuide) + seed.human.avg * seed.human.n + sum(liveTeam)) / n : null;
    const c = consistency.counts[key] || { repeats: 0, consistent: 0 };
    const repeats = seed.repeats + c.repeats;
    const cons = repeats ? (seed.consistent + c.consistent) / repeats : null;
    const seedCons = seed.repeats ? seed.consistent / seed.repeats : null;
    const bar = barFor(key);
    const voted = log.filter((e) => e.useCaseKey === key && e.author === "guide" && e.feedback);
    const fbTotal = seed.feedbackTotal + voted.length;
    const fb = fbTotal ? (seed.feedbackUp + voted.filter((e) => e.feedback === "up").length) / fbTotal : null;
    const seedFb = seed.feedbackTotal ? seed.feedbackUp / seed.feedbackTotal : null;
    const disagreements = voted.filter((e) => isDisagreement(e, bar)).length;
    const policyGaps = live.filter((e) => e.score.policyGap).length;
    let health;
    if (!uc) health = { text: "Watch for new use cases", tone: "neutral", group: "watch" };
    else if (uc.verified) health = reliability >= bar ? { text: "Holding", tone: "ok", group: "holding" } : { text: "Below bar: owner review", tone: "handoff", group: "below" };
    else if (n < EVIDENCE_MIN) health = { text: `Building evidence (${n} of ${EVIDENCE_MIN})`, tone: "neutral", group: "building" };
    else health = reliability >= bar ? { text: "Candidate for verification", tone: "ok", group: "building" } : { text: "Below bar", tone: "handoff", group: "below" };
    return {
      key,
      name: uc ? uc.name : UNLISTED.name,
      source: uc ? uc.source : "Unlisted",
      risk: uc ? uc.risk : "mixed",
      verification: uc ? (uc.verified ? "Verified" : "Unverified") : "Unverified",
      reliability,
      seedRel,
      cons,
      seedCons,
      fb,
      seedFb,
      disagreements,
      policyGaps,
      guideN,
      teamN,
      noCov: seed.noCoverage + live.filter((e) => e.score.noCoverage).length,
      bar,
      health,
    };
  });
}

function Pairs({ rowKey, log, bar }) {
  const [order, setOrder] = useState("newest");
  const live = log
    .filter((e) => e.useCaseKey === rowKey)
    .map((e) => ({ ...e, response: e.author === "team" ? e.teamResponse : e.answer, mock: false }));
  const hist = (HISTORICAL_PAIRS[rowKey] || []).map((h) => ({ ...h, mock: true }));
  let pairs = [...live, ...hist];
  pairs.sort((a, b) =>
    order === "newest"
      ? new Date(b.timestamp) - new Date(a.timestamp)
      : (a.score && !a.score.noCoverage ? a.score.headline : 101) - (b.score && !b.score.noCoverage ? b.score.headline : 101)
  );
  return (
    <div className="pairs">
      <div className="pairs-head">
        <span className="muted small">
          {live.length} from this session{hist.length > 0 && `, ${hist.length} examples from history`}
          {hist.length > 0 && (
            <>
              {" "}
              <Tag kind="mock" />
            </>
          )}
        </span>
        <div className="sorter" role="radiogroup" aria-label="Sort answers">
          <button role="radio" aria-checked={order === "newest"} className={order === "newest" ? "on" : ""} onClick={() => setOrder("newest")}>
            Newest first
          </button>
          <button role="radio" aria-checked={order === "lowest"} className={order === "lowest" ? "on" : ""} onClick={() => setOrder("lowest")}>
            Lowest score first
          </button>
        </div>
      </div>
      {pairs.length === 0 && (
        <p className="muted small">No individual answers yet. Ask a question for this use case on the Guide tab, and it appears here.</p>
      )}
      <ol className="pair-list">
        {pairs.map((e) => {
          const s = e.score;
          const disagree = isDisagreement(e, bar);
          return (
            <li key={e.id} className={`pair tone-${ACTION_TONE[e.action]}`}>
              <div className="pair-top">
                <span className="small muted">
                  {time(e.timestamp)}, {e.author === "team" ? "team" : e.author === "guide" ? "Guide" : "awaiting team"},{" "}
                  {ACTION_TEXT[e.action].toLowerCase()}
                </span>
                {e.mock && <Tag kind="mock" />}
              </div>
              <p className="pair-q">{e.question}</p>
              {e.response ? <p className="pair-a">{e.response}</p> : <p className="muted small">No response yet.</p>}
              <div className="pair-score">
                {s ? (
                  s.noCoverage ? (
                    <span className="small">No policy coverage</span>
                  ) : (
                    <>
                      <strong>{s.headline}%</strong>
                      <span className="small muted">
                        grounded {s.grounded}, accurate {s.accurate}, complete {s.complete}
                      </span>
                    </>
                  )
                ) : (
                  <span className="small muted">Not scored</span>
                )}
                {e.feedback && <span className="small">{e.feedback === "up" ? "👍 Helpful" : "👎 Not helpful"}</span>}
                {disagree && <span className="small tone-text-review">Judge disagreement</span>}
              </div>
              {s?.policyGap && (
                <p className="gap-note small">
                  <strong>Policy gap:</strong> {s.policyGap}
                </p>
              )}
              {e.fixed && <p className="fixed-note small">{e.fixed}</p>}
              {s?.issues?.length > 0 && (
                <ul className="issues small">
                  {s.issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function MonitoringTab({ log, consistency }) {
  const rows = useMemo(() => computeRows(log, consistency), [log, consistency]);
  const [open, setOpen] = useState(null);
  const count = (g) => rows.filter((r) => r.health.group === g).length;
  const liveScored = log.filter((e) => e.score).length;
  return (
    <div className="monitoring">
      <p className="lede">
        <strong>Dependability:</strong> does verified stay verified? Each use case starts from a 30-day history <Tag kind="mock" />, and every answer scored in
        this session is added on top.
      </p>
      <div className="stats">
        <div>
          <strong>{count("holding")}</strong>
          <span>holding above bar</span>
        </div>
        <div>
          <strong className="tone-text-handoff">{count("below")}</strong>
          <span>below bar</span>
        </div>
        <div>
          <strong>{count("building")}</strong>
          <span>building evidence</span>
        </div>
        <div>
          <strong>{liveScored}</strong>
          <span>scored this session</span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="mon">
          <thead>
            <tr>
              <th>Use case</th>
              <th>Reliability vs bar</th>
              <th>Consistency</th>
              <th>User feedback</th>
              <th>Scored (Guide / team)</th>
              <th>Policy gaps</th>
              <th>No coverage</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = open === r.key;
              const good = r.bar == null || (r.reliability ?? 0) >= r.bar;
              return (
                <Fragment key={r.key}>
                  <tr className={isOpen ? "row-open" : ""}>
                    <td>
                      <button className="rowbtn" onClick={() => setOpen(isOpen ? null : r.key)} aria-expanded={isOpen}>
                        <span className="caret" aria-hidden="true">
                          {isOpen ? "▾" : "▸"}
                        </span>
                        <span>
                          <span className="row-name">{r.name}</span>
                          <span className="row-meta">
                            {r.source}, {r.risk} risk, {r.verification.toLowerCase()}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className="rel">
                        <span>{r.reliability == null ? "None yet" : pct(r.reliability)}</span>
                        {r.reliability != null && (
                          <span className="meter small-meter" aria-hidden="true">
                            <span className={`meter-fill ${good ? "tone-ok" : "tone-review"}`} style={{ width: `${r.reliability * 100}%` }} />
                            {r.bar != null && <span className="meter-mark" style={{ left: `${r.bar * 100}%` }} />}
                          </span>
                        )}
                        <span className="muted small">{r.bar == null ? "No bar" : `Bar ${Math.round(r.bar * 100)}%`}</span>
                      </div>
                      <Delta now={r.reliability} seed={r.seedRel} />
                    </td>
                    <td>
                      {r.cons == null ? "None yet" : pct(r.cons)}
                      <Delta now={r.cons} seed={r.seedCons} />
                    </td>
                    <td>
                      {r.fb == null ? "None" : pct(r.fb)}
                      <Delta now={r.fb} seed={r.seedFb} />
                      {r.disagreements > 0 && (
                        <span className="note-line tone-text-review">
                          {r.disagreements} judge disagreement{r.disagreements > 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                    <td>
                      {r.guideN} / {r.teamN}
                    </td>
                    <td className={r.policyGaps > 0 ? "tone-text-review strong" : ""}>{r.policyGaps}</td>
                    <td>{r.noCov}</td>
                    <td>
                      <span className={`health tone-text-${r.health.tone}`}>{r.health.text}</span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="drill">
                      <td colSpan={8}>
                        <Pairs rowKey={r.key} log={log} bar={r.bar} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="notes">
        <p>
          <strong>Reliability</strong> is the average answer score, the lowest of grounded, accurate and complete for each answer, across
          Guide&apos;s answers and team responses. <strong>Consistency</strong> is the share of repeated questions that took
          the same path with the same cited policies. <strong>User feedback</strong> is the share of thumbs up; it measures
          usefulness, not correctness, so it stays out of reliability, and a vote that contradicts the judge is counted as a
          disagreement.
        </p>
        <p>
          <strong>Bars</strong> <Tag kind="assumed" /> are {Math.round(BARS.low * 100)}% for low risk and{" "}
          {Math.round(BARS.high * 100)}% for high risk. A verified use case below its bar goes to its owner for review rather
          than being demoted automatically. An unverified use case needs {EVIDENCE_MIN} scored answers above its bar to become a
          candidate for verification. <strong>No coverage</strong> counts team responses to requests the policies don&apos;t
          cover; they point to gaps in the policy library, so they stay out of reliability. <strong>Policy gaps</strong> count
          answers this session where the judge traced the problem to an ambiguous or silent policy rather than to Guide.
        </p>
        <p className="muted small">Click a use case to see its individual questions and answers.</p>
      </div>
    </div>
  );
}
