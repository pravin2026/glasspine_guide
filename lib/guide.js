import Anthropic from "@anthropic-ai/sdk";
import {
  ACCOUNT,
  POLICIES,
  POLICY_VERSION,
  USE_CASES,
  UNLISTED,
  PROMPT_VERSION,
  BEFORE_PROMPT_VERSION,
  JUDGE_PROMPT_VERSION,
} from "./data.js";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const CLASSIFY_MODEL = process.env.CLASSIFY_MODEL || "claude-haiku-5-5";
const ANSWER_MODEL = process.env.ANSWER_MODEL || "claude-sonnet-5-5";
const JUDGE_MODEL = process.env.JUDGE_MODEL || "claude-opus-5-5";

const LIBRARY = POLICIES.map((p) => `[${p.id}] ${p.title}: ${p.text}`).join("\n");

async function call({ model, system, user, maxTokens }) {
  const msg = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  return { text, model: msg.model };
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error(`Model returned no JSON: ${clean.slice(0, 160)}`);
  return JSON.parse(clean.slice(start, end + 1));
}

const pct = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));

// ---------- BEFORE: today's Guide (simulated, Option B) ----------
// Same policies and same model as After, none of the controls: no citing
// requirement, no risk check, no handoff, no score, no record.

export async function runBefore(question) {
  const { text, model } = await call({
    model: ANSWER_MODEL,
    maxTokens: 800,
    system:
      `You are a helpful assistant for the property management team at ${ACCOUNT.name}. ` +
      `Here are the company's policies for reference:\n${LIBRARY}\n\nAnswer the request directly and helpfully.`,
    user: question,
  });
  return { mode: "before", answer: text, model, promptVersion: BEFORE_PROMPT_VERSION };
}

// ---------- AFTER ----------

// 1. Classify (live). Listed use cases take risk and status from
//    configuration. Unlisted requests get a model risk rating; unsure = high.
async function classify(question) {
  const list = Object.entries(USE_CASES).map(([k, u]) => `- ${k}: ${u.name}`).join("\n");
  const { text, model } = await call({
    model: CLASSIFY_MODEL,
    maxTokens: 300,
    system: "You route requests for Glasspine Guide, an assistant for property management teams. Respond with JSON only.",
    user:
      `Use cases:\n${list}\n\nRequest: """${question}"""\n\n` +
      "Pick the use case that fits, or other if none fits.\n" +
      "Only if you pick other, also rate risk. Rate high if the request involves any of: legal or compliance matters " +
      "(including fair housing, screening, accommodations); money (fees, charges, refunds, deposits, rent amounts); " +
      "personal data (resident information, credit, health, disability); safety (gas, fire, carbon monoxide, mold, security, emergencies); " +
      "anything sent outside the company or that commits the company. Otherwise rate low. If unsure, rate high.\n\n" +
      'Return {"use_case": "<key or other>", "risk": "<low or high, only for other>", "risk_reason": "<one short sentence, only for other>"}.',
  });
  const out = parseJSON(text);
  if (USE_CASES[out.use_case]) return { key: out.use_case, model };
  return {
    key: UNLISTED.key,
    risk: out.risk === "low" ? "low" : "high", // anything other than an explicit low counts as high
    riskReason: out.risk_reason || "No reason given, so treated as high risk.",
    model,
  };
}

// 2. Grounded answer (live).
async function groundedAnswer(question, key) {
  const residentFacing = ["resident_notices", "emerging_faq_copy", "emerging_deposit_letters", "lease_changes_qualifying_events"].includes(key);
  const { text, model } = await call({
    model: ANSWER_MODEL,
    maxTokens: 900,
    system:
      "You are Glasspine Guide. Use ONLY the account policies provided. Never rely on outside knowledge of laws or typical practice. " +
      "State only what the cited policies support, and use details given in the request as they are. For anything neither the policies nor the request specify, " +
      "use a bracketed placeholder such as [time]. Do not add advice, promises or procedures the policies don't state. Cite only policies you actually relied on. " +
      "If the policies do not cover the request, set covered to false and do not guess. Respond with JSON only.",
    user:
      `Account policies (${POLICY_VERSION}):\n${LIBRARY}\n\nRequest: """${question}"""\n\n` +
      (residentFacing ? "Write the requested resident-facing text in a clear, respectful tone.\n\n" : "Answer concisely.\n\n") +
      'Return {"answer": "<text>", "citations": ["<policy ids you relied on>"], "covered": <true or false>}.',
  });
  return { ...parseJSON(text), model };
}

// 3. Citation check (code).
function checkCitations(citations) {
  const ids = new Set(POLICIES.map((p) => p.id));
  const cited = Array.isArray(citations) ? [...new Set(citations)] : [];
  return { valid: cited.filter((id) => ids.has(id)), invalid: cited.filter((id) => !ids.has(id)) };
}

export async function runAfter(question) {
  const t0 = Date.now();
  const routing = await classify(question);
  const uc = USE_CASES[routing.key];
  const risk = uc ? uc.risk : routing.risk;
  const verified = uc ? uc.verified : false;

  const base = {
    mode: "after",
    timestamp: new Date().toISOString(),
    account: ACCOUNT.name,
    useCaseKey: routing.key,
    useCase: uc ? uc.name : "Unlisted request",
    source: uc ? uc.source : "Unlisted",
    risk,
    riskReason: uc ? null : routing.riskReason,
    verification: verified ? "Verified" : "Unverified",
    promptVersion: PROMPT_VERSION,
    policyVersion: POLICY_VERSION,
  };

  if (risk === "high" && !verified) {
    return {
      ...base,
      action: "handed off",
      reason: uc
        ? `${uc.name} is high risk and hasn't passed the verification bar, so Guide routes it to your team instead of answering.`
        : "This request isn't a configured use case and was rated high risk, so Guide routes it to your team instead of answering.",
      answer: null,
      sources: [],
      models: { routing: routing.model },
      ms: Date.now() - t0,
    };
  }

  const draft = await groundedAnswer(question, routing.key);
  const check = checkCitations(draft.citations);
  const sources = POLICIES.filter((p) => check.valid.includes(p.id));

  if (!draft.covered || sources.length === 0) {
    return {
      ...base,
      action: "handed off",
      reason:
        check.invalid.length > 0
          ? `The answer cited policies that don't exist (${check.invalid.join(", ")}), so Guide routes it to your team.`
          : "The account's policies don't cover this, so Guide routes it to your team instead of guessing.",
      answer: null,
      sources: [],
      models: { routing: routing.model, answer: draft.model },
      ms: Date.now() - t0,
    };
  }

  let action = "answered";
  if (risk === "high") action = "flagged";
  else if (!verified) action = "labeled";

  return {
    ...base,
    action,
    answer: draft.answer,
    sources,
    invalidCitations: check.invalid,
    models: { routing: routing.model, answer: draft.model },
    ms: Date.now() - t0,
  };
}

// ---------- JUDGE (live) ----------
// Scores Guide's answers and the team's handoff responses the same way:
// grounded, accurate, complete. Headline = the lowest of the three.

export async function runJudge({ question, answer, author }) {
  const t0 = Date.now();
  const { text, model } = await call({
    model: JUDGE_MODEL,
    maxTokens: 900,
    system:
      "You audit answers written for a property management company against that company's policies. Be strict and specific. Respond with JSON only.",
    user:
      `Company policies (${POLICY_VERSION}):\n${LIBRARY}\n\n` +
      `Request: """${question}"""\n\nAnswer (written by ${author === "team" ? "a member of the team" : "an AI assistant"}): """${answer}"""\n\n` +
      "First decide whether these policies cover the subject of the request at all. Then score three dimensions from 0 to 100:\n" +
      "- grounded: share of the answer's factual statements that are supported by the policies, with nothing invented\n" +
      "- accurate: whether the policies are applied correctly to this request (amounts, dates, conditions)\n" +
      "- complete: whether it answers the whole request and includes what the task requires, judged against what the policies can support\n" +
      "Do not count as unsupported: details supplied by the request itself (names, unit numbers, days, times), bracketed placeholders, " +
      "or neutral courtesy lines (greetings, sign-offs, an invitation to contact the office).\n" +
      "If a problem comes from the policy itself being ambiguous, contradictory or silent on something the request needs, describe it in policy_gap " +
      "in one short sentence naming the policy; otherwise leave policy_gap empty.\n" +
      'Return {"covered": <true or false>, "grounded": <0-100>, "accurate": <0-100>, "complete": <0-100>, ' +
      '"issues": ["<each unsupported, incorrect or missing item, in a short phrase>"], "policy_gap": "<one short sentence or empty>", "summary": "<one short sentence>"}.',
  });
  const out = parseJSON(text);
  const grounded = pct(out.grounded);
  const accurate = pct(out.accurate);
  const complete = pct(out.complete);
  const noCoverage = author === "team" && out.covered === false;
  return {
    noCoverage,
    grounded,
    accurate,
    complete,
    headline: noCoverage ? null : Math.min(grounded, accurate, complete),
    issues: Array.isArray(out.issues) ? out.issues.slice(0, 6) : [],
    policyGap: typeof out.policy_gap === "string" && out.policy_gap.trim() ? out.policy_gap.trim() : null,
    summary: out.summary || "",
    model,
    judgeVersion: JUDGE_PROMPT_VERSION,
    ms: Date.now() - t0,
  };
}
