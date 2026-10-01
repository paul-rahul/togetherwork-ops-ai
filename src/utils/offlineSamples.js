// Deterministic offline samples used only when the AI service is unavailable,
// rate limited, or fails. They are simple keyword rules over the demo data, not
// model output, and every result carries `offline: true` so the UI can label it.

const has = (text, words) => words.some((w) => text.includes(w));

function categorize(text) {
  if (has(text, ["invoice", "charge", "payment", "refund", "billing", "card", "payout", "fee", "deposit"])) {
    return "Billing & Payments";
  }
  if (has(text, ["api", "webhook", "integration", "401", "token", "sync"])) return "API & Integrations";
  if (has(text, ["password", "log in", "login", "locked", "access", "permission", "sso", "2fa"])) return "Account Access";
  if (has(text, ["report", "export", "dashboard", "csv", "import", "data"])) return "Data & Reporting";
  if (has(text, ["feature", "would be nice", "ability to", "add support", "wish"])) return "Feature Request";
  if (has(text, ["error", "bug", "crash", "not working", "broken", "fail", "down", "slow"])) return "Technical Issue";
  return "General Inquiry";
}

function wordSet(value) {
  return new Set(
    String(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
}

export function sampleTriage(ticket, articles = []) {
  const text = `${ticket.subject} ${ticket.body}`.toLowerCase();
  const category = categorize(text);
  const angry = has(text, ["unacceptable", "furious", "terrible", "worst", "ridiculous", "lawsuit"]);
  const frustrated = has(text, ["frustrat", "still not", "again", "disappoint", "waiting", "urgent", "asap", "third time"]);
  const positive = has(text, ["thank", "great", "love", "appreciate"]);
  const sentiment = angry ? "angry" : frustrated ? "frustrated" : positive ? "positive" : "neutral";
  const sentimentScore = { angry: 1, frustrated: 2, neutral: 3, positive: 5 }[sentiment];
  const blocked = has(text, ["cannot", "can't", "unable", "all of our", "all members", "failed", "locked out", "outage"]);
  const urgency = angry && blocked ? "critical" : frustrated || blocked ? "high" : category === "Feature Request" ? "low" : "medium";
  const churnRisk = has(text, ["cancel", "switch to", "competitor", "leaving", "terminate", "refund"]);
  const escalate =
    churnRisk ||
    angry ||
    ((category === "Billing & Payments" || category === "Technical Issue") && (urgency === "high" || urgency === "critical"));

  const ticketWords = wordSet(text);
  const suggestedKBArticles = articles
    .map((a) => ({
      title: a.title,
      score: [...wordSet(`${a.title} ${a.category ?? ""}`)].filter((w) => ticketWords.has(w)).length,
    }))
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((a) => a.title);

  return {
    category,
    sentiment,
    sentimentScore,
    urgency,
    churnRisk,
    churnRiskReason: churnRisk ? "The message mentions cancelling, switching or a refund." : "",
    routingDecision: escalate ? "escalate" : "auto-resolve",
    routingReason: escalate
      ? "Keyword rules flagged churn language, strong negative sentiment or a high-urgency billing/technical issue."
      : "Keyword rules found a routine request with no escalation signals.",
    confidence: escalate ? 0.58 : 0.82,
    suggestedKBArticles,
    offline: true,
  };
}

export function sampleResponse(ticket, analysis) {
  const first = String(ticket.sender ?? "").trim().split(/\s+/)[0] || "there";
  const escalating = analysis.routingDecision === "escalate";
  const body = escalating
    ? `Thanks for flagging this, and I'm sorry for the disruption. I've passed your ticket to a specialist on our team who will review "${ticket.subject}" and follow up with you directly.\nIn the meantime, please reply with any extra detail (screenshots, timestamps, affected accounts) that could speed things up.`
    : `Thanks for getting in touch about "${ticket.subject}". Here are the quickest steps to resolve it:\n1. Review the related help article linked below.\n2. Try the steps in your account settings.\n3. Reply to this email if anything still looks wrong and we'll take a closer look.`;
  return {
    subject: `Re: ${ticket.subject}`,
    greeting: `Hi ${first},`,
    body,
    closing: "Best regards,\nTogetherwork Support Team",
    actionItems: escalating
      ? ["A specialist reviews the ticket", "Customer receives a follow-up", "Agent confirms resolution"]
      : ["Follow the linked article", "Reply if the issue persists"],
    escalationNote: escalating ? `Offline sample: routed by keyword rules (${analysis.routingReason})` : "",
    offline: true,
  };
}

const STAGE_TASKS = [
  "Confirm scope, stakeholders and success criteria",
  "Configure organization settings, roles and permissions",
  "Validate migrated member and billing data",
  "Run user acceptance testing with the client's admins",
  "Train staff and complete the go-live cutover",
];

export function sampleImplementation(impl) {
  const stage = Number.parseInt(impl.stage, 10) || 0;
  const atRisk = impl.status === "at-risk" || impl.risk === "high";
  return {
    checklistItems: STAGE_TASKS.map((task, i) => ({
      id: i + 1,
      task,
      complete: i < stage,
      notes: i === stage ? `In progress: ${impl.stageLabel}` : "",
    })),
    blockers: atRisk
      ? [
          {
            severity: "high",
            description: `Timeline risk: ${impl.client} is flagged ${impl.status} with go-live on ${impl.goLiveDate}.`,
          },
        ]
      : [],
    configDoc: `Client: ${impl.client}\nProduct: ${impl.product}\nVertical: ${impl.vertical}\nMembers: ${impl.memberCount}\nAdmins: ${impl.adminCount}\nStage: ${impl.stageLabel}\nGo-live: ${impl.goLiveDate}`,
    nextAction: `Complete the "${impl.stageLabel}" stage and confirm the remaining items with ${impl.contactName || "the client contact"}.`,
    offline: true,
  };
}
