"use client";

import { NOT_DOING_YET } from "../../lib/data.js";
import { APPROACH, COVERAGE, PHASES, TODAY, TRADEOFFS } from "../../lib/roadmap.js";

const STATUS_CLASS = { Built: "pill-built", Partial: "pill-partial", Later: "pill-later" };

export default function RoadmapTab() {
  const all = COVERAGE.flatMap((p) => p.items);
  const n = (s) => all.filter((i) => i.status === s).length;
  return (
    <div className="roadmap">
      <section className="today" aria-label="Today: where Guide stands">
        <p className="today-tag">Today: where Guide stands</p>
        <p>{TODAY.situation}</p>
        <ul className="challenges">
          {TODAY.challenges.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="question">{TODAY.question}</p>
      </section>

      <section className="approach" aria-label="Approach">
        <h2>Approach: scale means depth</h2>
        <p className="muted">{APPROACH.depth}</p>
        <div className="dims-grid">
          {APPROACH.dimensions.map((d) => (
            <div key={d.name} className="dim-card">
              <strong>{d.name}</strong>
              <span>{d.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Phases">
        <h2>Four phases</h2>
        <ol className="phases">
          {PHASES.map((p) => (
            <li key={p.id} className={p.now ? "phase now" : "phase"}>
              <span className="phase-dot" aria-hidden="true" />
              <div className="phase-body">
                <div className="phase-top">
                  <p className="phase-tag">{p.tag}</p>
                  <span className="dim-tags">
                    {p.dims.map((d) => (
                      <span key={d} className="dim-tag">
                        {d}
                      </span>
                    ))}
                  </span>
                </div>
                <h3>{p.head}</h3>
                <p>{p.items}</p>
                <p className="muted small">Done when: {p.done}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="tradeoffs" aria-label="Key decisions and tradeoffs">
        <h2>Key decisions and tradeoffs</h2>
        <ol>
          {TRADEOFFS.map((t) => (
            <li key={t.decision}>
              <p>
                <strong>{t.decision}.</strong> {t.why}
              </p>
              <p className="tradeoff">
                <span>Tradeoff:</span> {t.cost}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="decisions" aria-label="Intentionally not doing yet">
        <h2>Intentionally not doing yet</h2>
        <p className="muted small">Each with what would change the decision.</p>
        <ul>
          {NOT_DOING_YET.map((d) => (
            <li key={d.item}>
              <strong>{d.item}.</strong> {d.trigger}
            </li>
          ))}
        </ul>
      </section>

      <section className="coverage" aria-label="Enterprise readiness checklist">
        <h2>Enterprise readiness checklist</h2>
        <p className="muted small">
          The detailed engineering checklist behind the roadmap, grouped by area: {n("Built")} built, {n("Partial")} partial,{" "}
          {n("Later")} later.
        </p>
        {COVERAGE.map((p) => (
          <details key={p.pillar}>
            <summary>
              <span>{p.pillar}</span>
              <span className="pill-row">
                {p.items.map((it) => (
                  <span key={it.item} className={`dot ${STATUS_CLASS[it.status]}`} title={`${it.item}: ${it.status}`} />
                ))}
              </span>
            </summary>
            <ul className="cov-list">
              {p.items.map((it) => (
                <li key={it.item}>
                  <span className={`pill ${STATUS_CLASS[it.status]}`}>{it.status}</span>
                  <div>
                    <p className="cov-item">
                      {it.item} <span className="muted small">Phase {it.phase}</span>
                    </p>
                    <p className="muted small">{it.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
    </div>
  );
}
