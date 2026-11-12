// Roadmap content for the Roadmap tab, in presentation order.

export const TODAY = {
  situation:
    "Property managers use Guide, a GenAI assistant inside Glasspine Manager, to answer questions and draft work. Most accounts use it daily, and use is expanding into policy lookups, resident notices, compliance summaries, and guidance on lease changes and qualifying events. Teams love it.",
  challenges: [
    "Behavior varies across accounts",
    "Reliability issues are surfacing",
    "Owners and operators want to audit what Guide produces",
  ],
  question: "How do we set Guide up for scale while fixing these, without losing what users love?",
};

export const APPROACH = {
  depth:
    "Scale could mean deeper use, new use cases, or new accounts. Guide already reaches most accounts, and new use cases would multiply the reliability problems, so the goal is deeper use within existing accounts.",
  dimensions: [
    { name: "Trust", text: "Users can rely on each answer." },
    { name: "Dependability", text: "Quality holds over time." },
    { name: "Infrastructure", text: "It handles volume and speed." },
    { name: "Economics", text: "Cost stays in check as use grows." },
  ],
};

export const TRADEOFFS = [
  { decision: "Depth over breadth", why: "Fix reliability in existing use cases before adding new ones.", cost: "No new services in this phase." },
  { decision: "Trust before infrastructure", why: "Grounding, routing, scoring and audit come first.", cost: "The prototype isn't built for high volume yet; that's Phase 2." },
  { decision: "Label, don't block", why: "Unverified use cases still get answers, labeled as unverified.", cost: "Some unproven answers reach users, but experimentation continues." },
  { decision: "Configuration decides risk, not the model", why: "Each use case's risk tier and verification status set its path.", cost: "Predictability over flexibility; every new use case must be classified." },
  { decision: "Unsure means high risk", why: "Claude rates unlisted requests, defaulting to high.", cost: "More handoffs, because the model's risk judgment isn't proven either." },
  { decision: "Score by the weakest dimension", why: "Each answer's score is the lowest of grounded, accurate and complete.", cost: "Harsher scores, but no weakness hides behind strengths." },
  { decision: "A stronger model judges", why: "Opus checks Sonnet's answers.", cost: "Slower and costlier per answer; production would add a judge from another vendor, calibrated against human review." },
];
export const PHASES = [
  {
    id: 0,
    tag: "Phase 0, this prototype",
    dims: ["Trust", "Dependability"],
    head: "Show the safeguards work",
    items: "Grounded, cited answers; routing by risk; handoffs; live scoring; feedback; audit; monitoring.",
    done: "The safeguards work end to end on real questions, and reliability can be measured for each use case.",
    now: true,
  },
  {
    id: 1,
    tag: "Phase 1",
    dims: ["Trust", "Dependability"],
    head: "Make the safeguards complete and dependable",
    items: "Input guardrails, testing every change before release, policy syncing and expiry, full tracing, the verification process.",
    done: "High-risk outputs are traceable and stable for a quarter.",
  },
  {
    id: 2,
    tag: "Phase 2",
    dims: ["Infrastructure", "Economics"],
    head: "Handle many more users, quickly and affordably",
    items: "AI gateway with fallback providers, faster search across large policy libraries, streaming, caching.",
    done: "Speed and cost per answer hold steady as usage grows.",
  },
  {
    id: 3,
    tag: "Phase 3",
    dims: ["Broader use"],
    head: "Support longer conversations",
    items: "Follow-up questions and context, conversation memory, tools loaded by intent.",
    done: "Multi-turn use cases pass the same verification bar.",
  },
];

export const COVERAGE = [
  {
    pillar: "Results quality and accuracy",
    items: [
      { item: "Automated evaluation", status: "Partial", phase: "0, 1", note: "Live judge on every answer; golden datasets and pre-release regression testing later." },
      { item: "Strict grounding and abstention", status: "Built", phase: "0", note: "Citations required and checked; handoff when there's no valid source." },
      { item: "Query disambiguation", status: "Later", phase: "3", note: "Single-turn prototype." },
      { item: "Knowledge base hygiene", status: "Partial", phase: "0, 1", note: "Policy version and effective date recorded; syncing and expiry later." },
    ],
  },
  {
    pillar: "Technical and infrastructure readiness",
    items: [
      { item: "Rate limits and traffic management", status: "Later", phase: "2", note: "Models swappable by configuration." },
      { item: "Retrieval scalability", status: "Later", phase: "2", note: "Small policy library passed whole, appropriate at this size." },
      { item: "Parallel execution and streaming", status: "Partial", phase: "0, 2", note: "Answer shown before the score; no streaming." },
      { item: "Schema enforcement", status: "Partial", phase: "0, 1", note: "Structured outputs validated in code." },
    ],
  },
  {
    pillar: "Cost and context efficiency",
    items: [
      { item: "Tiered model routing", status: "Built", phase: "0", note: "Haiku classifies, Sonnet answers, Opus judges." },
      { item: "Semantic and prompt caching", status: "Later", phase: "2", note: "The static policy library suits prompt caching." },
      { item: "Conversation memory compression", status: "Later", phase: "3", note: "Not applicable to a single-turn prototype." },
      { item: "Dynamic tool injection", status: "Later", phase: "3", note: "No tools yet." },
    ],
  },
  {
    pillar: "Safety, compliance and operational governance",
    items: [
      { item: "Input and output guardrails", status: "Partial", phase: "0, 1", note: "Citation check and risk routing on output; input filtering later." },
      { item: "Human-in-the-loop boundaries", status: "Built", phase: "0", note: "Handoffs, review flags, scored team responses." },
      { item: "Observability and lineage", status: "Partial", phase: "0, 1", note: "Audit record with sources, versions, models and scores; full traces later." },
      { item: "Failure-driven feedback loops", status: "Partial", phase: "0, 1", note: "Thumbs, judge disagreements, no-coverage counts; implicit signals later." },
    ],
  },
];
