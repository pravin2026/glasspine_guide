// ALL DATA IN THIS FILE IS INVENTED FOR THE PROTOTYPE.
// The account, policies, use cases, risk tiers, verification status, score
// bars and seeded history are mocked or assumed. None of it represents a
// real property, program rule or law.

export const ACCOUNT = {
  id: "maple-ridge",
  name: "Maple Ridge Property Co.",
  profile: "Mid-market, 640 units",
};

export const POLICY_VERSION = "maple-ridge-policies v3.2 (effective 2026-07-01)";

export const POLICIES = [
  { id: "MR-1", title: "Rent and late fees", text: "Rent is due on the 1st of each month. A $50 late fee applies if rent is not received by 11:59 PM on the 5th. An additional $10 per day applies from the 6th, up to a maximum of $150 per month." },
  { id: "MR-2", title: "Maintenance responsibility", text: "The landlord is responsible for plumbing, electrical, heating, and appliance repairs not caused by resident misuse. Residents replace light bulbs, smoke detector batteries, and HVAC filters." },
  { id: "MR-3", title: "Entry notice", text: "Except in emergencies, management gives residents at least 24 hours' written notice before entering a unit, through the resident portal. Entry is permitted between 8 AM and 6 PM on weekdays." },
  { id: "MR-4", title: "Emergency entry", text: "Emergencies include active water leaks, loss of heat when the outside temperature is below 50°F, gas smells, and electrical hazards. Management may enter without notice to address an emergency and must leave a written notice afterward." },
  { id: "MR-5", title: "Pets", text: "Up to two cats or dogs under 50 lbs are allowed per unit with a $300 refundable pet deposit and $35 monthly pet rent. Assistance animals are not pets and are exempt from pet deposits and pet rent." },
  { id: "MR-6", title: "Lease renewal", text: "Renewal offers are sent 75 days before lease end. Residents must respond within 30 days. Month-to-month continuation carries a $150 monthly premium." },
  { id: "MR-7", title: "Quiet hours", text: "Quiet hours are 10 PM to 7 AM daily. Repeated violations after one written warning may be treated as a lease violation." },
  { id: "MR-8", title: "Parking", text: "Each unit receives one assigned space. Additional spaces cost $40 per month, subject to availability. Unregistered vehicles may be towed after 48 hours' notice." },
  { id: "MR-9", title: "Amenities", text: "The fitness room is open 5 AM to 11 PM. The rooftop lounge can be reserved through the resident portal for up to 4 hours at no cost." },
];

// Exactly six configured use cases: the scenario's four tasks plus two
// invented emerging ones. Risk and verification come from here, not from
// the model, so the same request is always handled the same way.
export const USE_CASES = {
  policy_lookups: { name: "Policy lookups", source: "Scenario", risk: "low", verified: true },
  resident_notices: { name: "Drafting resident notices", source: "Scenario", risk: "high", verified: true },
  compliance_summaries: { name: "Generating compliance summaries", source: "Scenario", risk: "high", verified: true },
  lease_changes_qualifying_events: {
    name: "Walking residents through lease changes and qualifying events",
    source: "Scenario",
    risk: "high",
    verified: false,
  },
  emerging_faq_copy: { name: "Emerging: resident FAQ copy", source: "Invented", risk: "low", verified: false },
  emerging_deposit_letters: { name: "Emerging: security deposit deduction letters", source: "Invented", risk: "high", verified: false },
};

export const UNLISTED = { key: "unlisted", name: "Unlisted requests", source: "Unlisted" };

// Score bars by risk tier (ASSUMED), set by calibrating against observed
// scores: good high-risk answers land at 95 to 100.
export const BARS = { low: 0.9, high: 0.95 };

// Answers needed before an unverified use case can be considered for
// verification (ASSUMED).
export const EVIDENCE_MIN = 30;

// The 2x2 decision matrix: risk (rows) by verification (columns). Cell
// categories are ASSUMED, set by configuration.
export const MATRIX = {
  rows: [
    { risk: "low", label: "Low risk", desc: "internal or general information" },
    { risk: "high", label: "High risk", desc: "legal, financial, or affects a specific resident" },
  ],
  cols: [
    { verified: true, label: "Verified", desc: "passed testing" },
    { verified: false, label: "Unverified", desc: "not yet proven" },
  ],
  outcome: {
    "low-true": { text: "Answers normally", tone: "ok" },
    "high-true": { text: "Answers, flagged for review", tone: "review" },
    "low-false": { text: "Answers, labeled unverified", tone: "label" },
    "high-false": { text: "Hands off to the team", tone: "handoff" },
  },
};

// One preloaded question per configured use case, plus one unlisted request
// on each side of the risk line.
export const DEMO_QUESTIONS = [
  { key: "policy_lookups", label: "Policy lookups", question: "A resident paid rent on the 7th. What late fee do we charge?" },
  { key: "resident_notices", label: "Drafting resident notices", question: "Draft a notice telling the resident in unit 4B that we'll enter on Thursday afternoon to inspect the water heater." },
  { key: "compliance_summaries", label: "Generating compliance summaries", question: "Summarize our entry and emergency-access rules as a compliance checklist for new staff." },
  { key: "lease_changes_qualifying_events", label: "Lease changes and qualifying events", question: "A resident's household income went up $400 a month. Walk them through what changes in their lease." },
  { key: "emerging_faq_copy", label: "Resident FAQ copy", question: "Write a short, friendly FAQ answer for our website about our pet rules." },
  { key: "emerging_deposit_letters", label: "Security deposit letters", question: "Draft a letter explaining a $400 deduction from a resident's security deposit for carpet damage." },
  { key: "unlisted", label: "Staff meeting agenda", expect: "Likely rated low risk", question: "Draft an agenda for tomorrow's staff meeting covering amenity hours and rooftop reservations." },
  { key: "unlisted", label: "Debt collector request", expect: "Likely rated high risk", question: "A debt collector called asking for a resident's phone number. Can we share it?" },
];

// Prefilled, editable team responses for handoffs (SIMULATED).
export const SAMPLE_TEAM_RESPONSES = {
  lease_changes_qualifying_events:
    "Thanks for letting us know about the income change. Your current lease terms stay the same until renewal, which we send 75 days before your lease ends. We'll review whether anything needs to change and follow up within five business days.",
  emerging_deposit_letters:
    "We deducted $400 from your security deposit to replace carpet in the living room, which was damaged beyond normal wear. Photos from the move-out inspection and the contractor's invoice are attached. The remaining balance will be mailed within 14 days.",
  unlisted:
    "We don't share residents' contact details with third parties, including debt collectors, without the resident's written consent. Please ask the caller to contact the resident directly.",
  default: "We've reviewed your request and will follow up within one business day.",
};

// Seeded 30-day history per use case for this one account (MOCK). Kept small
// so live answers visibly move the aggregates. Live answers are added on top.
// avg = average headline score; consistency = repeated questions that got
// the same path and the same cited policies; feedback = thumbs up on Guide's
// answers.
export const SEED_HISTORY = {
  policy_lookups: { guide: { n: 12, avg: 0.955 }, human: { n: 0, avg: 0 }, noCoverage: 1, repeats: 4, consistent: 4, feedbackUp: 10, feedbackTotal: 11 },
  resident_notices: { guide: { n: 26, avg: 0.972 }, human: { n: 0, avg: 0 }, noCoverage: 1, repeats: 6, consistent: 5, feedbackUp: 22, feedbackTotal: 25 },
  compliance_summaries: { guide: { n: 18, avg: 0.968 }, human: { n: 0, avg: 0 }, noCoverage: 1, repeats: 4, consistent: 3, feedbackUp: 13, feedbackTotal: 17 },
  lease_changes_qualifying_events: { guide: { n: 0, avg: 0 }, human: { n: 14, avg: 0.934 }, noCoverage: 6, repeats: 4, consistent: 4, feedbackUp: 0, feedbackTotal: 0 },
  emerging_faq_copy: { guide: { n: 22, avg: 0.931 }, human: { n: 0, avg: 0 }, noCoverage: 1, repeats: 4, consistent: 3, feedbackUp: 17, feedbackTotal: 20 },
  emerging_deposit_letters: { guide: { n: 0, avg: 0 }, human: { n: 6, avg: 0.889 }, noCoverage: 4, repeats: 2, consistent: 2, feedbackUp: 0, feedbackTotal: 0 },
  unlisted: { guide: { n: 15, avg: 0.872 }, human: { n: 9, avg: 0.903 }, noCoverage: 3, repeats: 4, consistent: 3, feedbackUp: 9, feedbackTotal: 13 },
};

export const NOT_DOING_YET = [
  { item: "New use cases", trigger: "Promoted only when they pass the verification bar." },
  { item: "Adoption push to inactive accounts", trigger: "Begins once high-risk outputs are traceable and stable for a quarter. First, check whether inactivity was caused by inconsistency." },
  { item: "Cross-account policy console", trigger: "Built only if the logs show demand for it." },
  { item: "Human review on every output", trigger: "Not planned. Review stays limited to high-risk outputs." },
];

export const PROMPT_VERSION = "guide-after v2.1";
export const BEFORE_PROMPT_VERSION = "guide-today (simulated)";
export const JUDGE_PROMPT_VERSION = "judge v1.1";

// Examples from the 30-day history for compliance summaries (MOCK): older
// low-scoring answers whose causes were since fixed.
export const HISTORICAL_PAIRS = {
  compliance_summaries: [
    {
      id: "hist-1",
      timestamp: "2026-11-04T15:12:00Z",
      question: "Summarize what staff must do after an emergency entry.",
      response: "Staff may enter a unit without notice for active water leaks, loss of heat below 50°F, gas smells, or electrical hazards. Fix the issue and close the work order. [MR-4]",
      author: "guide",
      action: "flagged",
      score: { grounded: 100, accurate: 95, complete: 70, headline: 70, issues: ["Omits the written notice required after emergency entry"], summary: "Correct but leaves out a required step." },
      feedback: "up",
      fixed: "Fixed in guide-after v2.1: answers state every step the cited policy requires.",
    },
    {
      id: "hist-2",
      timestamp: "2026-10-29T18:40:00Z",
      question: "Make a checklist for handling heating complaints this winter.",
      response: "Treat loss of heat as an emergency when the outside temperature is below 55°F. Staff may enter without notice and should leave a written notice afterward. [MR-4]",
      author: "guide",
      action: "flagged",
      score: { grounded: 75, accurate: 60, complete: 90, headline: 60, issues: ["States 55°F; the policy says below 50°F"], summary: "Misstates the temperature threshold." },
      feedback: "up",
      fixed: "Fixed in guide-after v2.1: answers state only what the cited policy says.",
    },
    {
      id: "hist-3",
      timestamp: "2026-10-22T14:05:00Z",
      question: "Compliance checklist for scheduling routine unit inspections.",
      response: "Give residents at least 24 hours' written notice through the resident portal. Entry is allowed between 8 AM and 6 PM. [MR-3]",
      author: "guide",
      action: "flagged",
      score: { grounded: 100, accurate: 85, complete: 80, headline: 80, issues: ["Omits that routine entry is limited to weekdays"], summary: "Missing the weekday restriction." },
      feedback: "down",
      fixed: "Fixed in guide-after v2.1: answers state every condition the cited policy sets.",
    },
  ],
};
