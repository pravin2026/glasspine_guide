"use client";

import { useRef, useState } from "react";
import { ACCOUNT, SAMPLE_TEAM_RESPONSES } from "../lib/data.js";
import GuideTab from "./_components/GuideTab.js";
import MonitoringTab from "./_components/MonitoringTab.js";
import RoadmapTab from "./_components/RoadmapTab.js";
import { Tag } from "./_components/ui.js";

const norm = (q) => q.toLowerCase().replace(/[^a-z0-9$ ]/g, " ").replace(/\s+/g, " ").trim();

async function post(body) {
  const res = await fetch("/api/guide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Guide could not complete the request.");
  return data;
}

export default function Home() {
  const [tab, setTab] = useState("guide");
  const [mode, setMode] = useState("after");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState({ before: null, after: null });
  const [log, setLog] = useState([]);
  const [team, setTeam] = useState("");
  const [consistency, setConsistency] = useState({ firsts: {}, counts: {} });
  const stageTimer = useRef(null);

  const q = question.trim();
  const shown = results[mode] && results[mode].question === q ? results[mode].data : null;
  const otherMode = mode === "after" ? "before" : "after";
  const ranOther = Boolean(results[otherMode] && results[otherMode].question === q);
  const entry = shown && shown.mode === "after" ? log.find((e) => e.id === shown.logId) : null;
  const liveScored = log.filter((e) => e.score).length;

  function updateEntry(id, patch) {
    setLog((l) => l.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function trackConsistency(data, text) {
    const key = `${data.useCaseKey}|${norm(text)}`;
    const sig = `${data.action}|${data.sources.map((s) => s.id).sort().join(",")}`;
    setConsistency((c) => {
      if (!(key in c.firsts)) return { ...c, firsts: { ...c.firsts, [key]: sig } };
      const prev = c.counts[data.useCaseKey] || { repeats: 0, consistent: 0 };
      return {
        ...c,
        counts: { ...c.counts, [data.useCaseKey]: { repeats: prev.repeats + 1, consistent: prev.consistent + (c.firsts[key] === sig ? 1 : 0) } },
      };
    });
  }

  async function score(id, text, answer, author) {
    updateEntry(id, { scoring: true, scoreError: null, author });
    try {
      const s = await post({ mode: "judge", question: text, answer, author });
      updateEntry(id, { scoring: false, score: s });
    } catch (e) {
      updateEntry(id, { scoring: false, scoreError: e.message });
    }
  }

  async function ask(nextQ) {
    const text = (nextQ ?? question).trim();
    if (!text) {
      setError("Enter a question for Guide first.");
      return;
    }
    setQuestion(text);
    setLoading(true);
    setError("");
    setStage(mode === "after" ? "Classifying the request…" : "Answering…");
    clearTimeout(stageTimer.current);
    if (mode === "after") stageTimer.current = setTimeout(() => setStage("Checking the account's policies and drafting an answer…"), 1500);
    try {
      const data = await post({ mode, question: text });
      if (data.mode === "after") {
        const id = crypto.randomUUID();
        data.logId = id;
        setLog((l) => [{ ...data, id, question: text, author: data.answer ? "guide" : null, score: null }, ...l]);
        trackConsistency(data, text);
        setTeam(SAMPLE_TEAM_RESPONSES[data.useCaseKey] || SAMPLE_TEAM_RESPONSES.default);
        if (data.answer) score(id, text, data.answer, "guide");
      }
      setResults((r) => ({ ...r, [mode]: { question: text, data } }));
    } catch (e) {
      setError(e.message);
    } finally {
      clearTimeout(stageTimer.current);
      setLoading(false);
      setStage("");
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" rx="2" className="brand-a" />
            <rect x="12" y="1" width="9" height="9" rx="2" className="brand-b" />
            <rect x="1" y="12" width="9" height="9" rx="2" className="brand-b" />
            <rect x="12" y="12" width="9" height="9" rx="2" className="brand-a" />
          </svg>
          <span>Glasspine Manager</span>
        </div>
        <div className="acct">
          <span>{ACCOUNT.name}</span>
          <Tag kind="mock" />
        </div>
      </header>

      <div className="shell">
        <section className="hero">
          <h1>Glasspine Guide: Today vs. With Safeguards</h1>
          <p className="hero-sub">
            With safeguards adds two things. <strong>Trust:</strong> answers grounded in the account&apos;s policies, accurate
            and complete, with risky ones flagged or handed to a person. <strong>Dependability:</strong> quality monitored over
            time against a bar.
          </p>
          <p className="legend">
            <Tag kind="live" /> real model call <Tag kind="mock" /> invented data <Tag kind="assumed" /> my assumption{" "}
            <Tag kind="sim" /> stands in for something real
          </p>
        </section>

        <nav className="tabs" role="tablist" aria-label="Sections">
          <button role="tab" aria-selected={tab === "guide"} className={tab === "guide" ? "on" : ""} onClick={() => setTab("guide")}>
            Guide
          </button>
          <button role="tab" aria-selected={tab === "monitoring"} className={tab === "monitoring" ? "on" : ""} onClick={() => setTab("monitoring")}>
            Monitoring
            {liveScored > 0 && <span className="count">{liveScored} live</span>}
          </button>
          <button role="tab" aria-selected={tab === "roadmap"} className={tab === "roadmap" ? "on" : ""} onClick={() => setTab("roadmap")}>
            Roadmap
          </button>
        </nav>

        {tab === "guide" && (
          <GuideTab
            mode={mode}
            setMode={setMode}
            question={question}
            setQuestion={setQuestion}
            ask={ask}
            loading={loading}
            stage={stage}
            error={error}
            setError={setError}
            shown={shown}
            entry={entry}
            otherMode={otherMode}
            ranOther={ranOther}
            log={log}
            team={team}
            setTeam={setTeam}
            updateEntry={updateEntry}
            score={score}
          />
        )}
        {tab === "monitoring" && <MonitoringTab log={log} consistency={consistency} />}
        {tab === "roadmap" && <RoadmapTab />}
      </div>
    </div>
  );
}
