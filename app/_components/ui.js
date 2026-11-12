"use client";

import { useState } from "react";
import { MATRIX, UNLISTED } from "../../lib/data.js";

const TAGS = { live: "Live AI", mock: "Mock", assumed: "Assumed", sim: "Simulated" };

export function Tag({ kind }) {
  return <span className={`tag tag-${kind}`}>{TAGS[kind]}</span>;
}

export const ACTION_TEXT = {
  answered: "Answered",
  flagged: "Answered, flagged for review",
  labeled: "Answered, labeled unverified",
  "handed off": "Handed off to the team",
};

export const ACTION_TONE = { answered: "ok", flagged: "review", labeled: "label", "handed off": "handoff" };

export const time = (iso) =>
  new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Plain-language explanation of why an answer took its path.
export function pathInfo(e) {
  const verified = e.verification === "Verified";
  const unlisted = e.useCaseKey === UNLISTED.key;
  const noSource = e.action === "handed off" && !(e.risk === "high" && !verified);
  const risk = e.risk === "high" ? "High risk" : "Low risk";
  const prefix = unlisted ? `Unlisted, rated ${e.risk} risk` : `${risk} + ${verified ? "verified" : "unverified"}`;
  const result = {
    answered: "answered normally",
    flagged: "answered, flagged for review",
    labeled: "answered, labeled unverified",
    "handed off": noSource ? "no valid policy source, so handed off to the team" : "handed off to the team",
  }[e.action];
  return { text: `${prefix} → ${result}`, risk: e.risk, verified, tone: ACTION_TONE[e.action] };
}

// The 2x2 matrix in miniature, with this answer's cell filled.
export function MiniGrid({ risk, verified, tone }) {
  const cells = [
    { r: "low", v: true, x: 0, y: 0 },
    { r: "low", v: false, x: 1, y: 0 },
    { r: "high", v: true, x: 0, y: 1 },
    { r: "high", v: false, x: 1, y: 1 },
  ];
  return (
    <svg className="minigrid" viewBox="0 0 30 30" width="30" height="30" aria-hidden="true">
      {cells.map((c) => {
        const on = c.r === risk && c.v === verified;
        return (
          <rect
            key={`${c.r}-${c.v}`}
            x={1 + c.x * 14.5}
            y={1 + c.y * 14.5}
            width="13"
            height="13"
            rx="2.5"
            className={on ? `mg-on tone-${tone}` : "mg-off"}
          />
        );
      })}
    </svg>
  );
}

export function ScoreBar({ entry, bar }) {
  const [open, setOpen] = useState(false);
  if (entry.scoring) return <p className="muted small">Scoring against the account&apos;s policies…</p>;
  if (entry.scoreError) return <p className="error">Scoring didn&apos;t complete: {entry.scoreError}</p>;
  const s = entry.score;
  if (!s) return null;
  const who = entry.author === "team" ? "Team response" : "Guide's answer";
  if (s.noCoverage) {
    return (
      <div className="scorebox">
        <div className="score-head">
          <strong>{who}: no policy coverage</strong> <Tag kind="live" />
        </div>
        <p className="muted small">
          These policies don&apos;t cover this request, so the response isn&apos;t scored. It points to a gap in the policy
          library, not a weak answer.
        </p>
      </div>
    );
  }
  const good = bar == null || s.headline / 100 >= bar;
  return (
    <div className="scorebox">
      <div className="score-head">
        <strong>
          {who}: {s.headline}%
        </strong>
        <span className={`score-state ${good ? "tone-ok" : "tone-review"}`}>{good ? "Above bar" : "Below bar"}</span>
        <Tag kind="live" />
        <button className="linkish" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "Hide details" : "Details"}
        </button>
      </div>
      {s.policyGap && (
        <p className="gap-note">
          <strong>Policy gap:</strong> {s.policyGap} The fix belongs in the policy, not the model.
        </p>
      )}
      <div className="meter" aria-hidden="true">
        <span className={`meter-fill ${good ? "tone-ok" : "tone-review"}`} style={{ width: `${s.headline}%` }} />
        {bar != null && <span className="meter-mark" style={{ left: `${bar * 100}%` }} />}
      </div>
      {open && (
        <div className="score-detail">
          <dl className="dims">
            <div>
              <dt>Grounded</dt>
              <dd>{s.grounded}%</dd>
            </div>
            <div>
              <dt>Accurate</dt>
              <dd>{s.accurate}%</dd>
            </div>
            <div>
              <dt>Complete</dt>
              <dd>{s.complete}%</dd>
            </div>
          </dl>
          <p className="muted small">
            The answer score is the lowest of the three.{bar != null && ` This use case's bar is ${Math.round(bar * 100)}%.`}
          </p>
          {s.summary && <p className="small">{s.summary}</p>}
          {s.issues?.length > 0 && (
            <ul className="issues">
              {s.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
          {s.model && <p className="muted small">Judge: {s.model}</p>}
        </div>
      )}
    </div>
  );
}

export function Feedback({ entry, onVote }) {
  return (
    <div className="feedback">
      <span>Was this helpful?</span>
      <button
        className={entry.feedback === "up" ? "vote on-up" : "vote"}
        aria-pressed={entry.feedback === "up"}
        onClick={() => onVote(entry.feedback === "up" ? null : "up")}
      >
        <span aria-hidden="true">👍</span> Yes
      </button>
      <button
        className={entry.feedback === "down" ? "vote on-down" : "vote"}
        aria-pressed={entry.feedback === "down"}
        onClick={() => onVote(entry.feedback === "down" ? null : "down")}
      >
        <span aria-hidden="true">👎</span> No
      </button>
      {entry.feedback && <span className="muted small">Recorded</span>}
    </div>
  );
}

// A thumbs vote that disagrees with the judge.
export function isDisagreement(e, bar) {
  if (!e.feedback || !e.score || e.score.noCoverage || e.author !== "guide") return false;
  const above = bar == null ? e.score.headline >= 90 : e.score.headline / 100 >= bar;
  return (above && e.feedback === "down") || (!above && e.feedback === "up");
}

export const cellOutcome = (risk, verified) => MATRIX.outcome[`${risk}-${verified}`];
