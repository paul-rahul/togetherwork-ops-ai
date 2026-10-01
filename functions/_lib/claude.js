// Server-side Claude boundary for the public deployment.
//
// The browser never sends a prompt. It names one of a few known operations and
// supplies structured demo data; this module validates and truncates that data,
// builds the prompt from the server-held templates, and calls Anthropic with a
// server-side secret. Used by the Cloudflare Pages Functions in functions/api/
// and, in local development, by the Vite middleware in vite.config.js.

import {
  TRIAGE_SYSTEM_PROMPT,
  buildTriageUserMessage,
  RESPONSE_SYSTEM_PROMPT,
  buildResponseUserMessage,
  IMPL_SYSTEM_PROMPT,
  buildImplUserMessage,
} from "./prompts.js";

export const MODEL = "claude-sonnet-4-6";
const DEFAULT_API_URL = "https://api.anthropic.com/v1/messages";
const MAX_BODY_CHARS = 16 * 1024;
const TIMEOUT_MS = 25_000;
const DEFAULT_PER_IP = 20; // AI calls per window per client IP
const DEFAULT_GLOBAL = 300; // AI calls per window per server instance
const WINDOW_MS = 10 * 60 * 1000;

/** Coerce to a bounded string; anything that is not a string or number becomes "". */
function text(value, max) {
  if (typeof value === "string") return value.slice(0, max);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function requireText(value, max, field) {
  const out = text(value, max).trim();
  if (!out) throw new BadRequest(`Missing or invalid "${field}".`);
  return out;
}

class BadRequest extends Error {}

function readTicket(raw) {
  if (!raw || typeof raw !== "object") throw new BadRequest('Missing "ticket".');
  return {
    id: requireText(raw.id, 40, "ticket.id"),
    brand: text(raw.brand, 80),
    vertical: text(raw.vertical, 80),
    sender: text(raw.sender, 120),
    email: text(raw.email, 160),
    subject: requireText(raw.subject, 300, "ticket.subject"),
    body: requireText(raw.body, 4000, "ticket.body"),
  };
}

function readAnalysis(raw) {
  if (!raw || typeof raw !== "object") throw new BadRequest('Missing "analysis".');
  return {
    category: text(raw.category, 80),
    sentiment: text(raw.sentiment, 40),
    urgency: text(raw.urgency, 40),
    churnRisk: Boolean(raw.churnRisk),
    routingDecision: text(raw.routingDecision, 40),
    routingReason: text(raw.routingReason, 400),
  };
}

function readArticles(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 60)
    .map((a) => ({ title: text(a?.title, 160).trim(), category: text(a?.category, 80) }))
    .filter((a) => a.title);
}

function readImplementation(raw) {
  if (!raw || typeof raw !== "object") throw new BadRequest('Missing "implementation".');
  return {
    id: requireText(raw.id, 40, "implementation.id"),
    client: requireText(raw.client, 160, "implementation.client"),
    contactName: text(raw.contactName, 120),
    contactEmail: text(raw.contactEmail, 160),
    product: text(raw.product, 80),
    vertical: text(raw.vertical, 80),
    memberCount: text(raw.memberCount, 12),
    adminCount: text(raw.adminCount, 12),
    stage: text(raw.stage, 4),
    stageLabel: text(raw.stageLabel, 60),
    status: text(raw.status, 40),
    risk: text(raw.risk, 40),
    startDate: text(raw.startDate, 20),
    goLiveDate: text(raw.goLiveDate, 20),
    checklistComplete: text(raw.checklistComplete, 6),
    checklistTotal: text(raw.checklistTotal, 6),
  };
}

const OPERATIONS = {
  triage: {
    maxTokens: 700,
    system: TRIAGE_SYSTEM_PROMPT,
    user: (p) => buildTriageUserMessage(readTicket(p.ticket), readArticles(p.articles)),
  },
  response: {
    maxTokens: 900,
    system: RESPONSE_SYSTEM_PROMPT,
    user: (p) => buildResponseUserMessage(readTicket(p.ticket), readAnalysis(p.analysis)),
  },
  implementation: {
    maxTokens: 1800,
    system: IMPL_SYSTEM_PROMPT,
    user: (p) => buildImplUserMessage(readImplementation(p.implementation)),
  },
};

// Best-effort limiter. Cloudflare may run several isolates, so this bounds
// bursts per instance rather than guaranteeing a global cap; the hard backstop
// is the Anthropic workspace spend limit (see docs/DEPLOYMENT.md).
const hits = new Map(); // ip -> timestamps
let globalHits = [];

function prune(list, now) {
  while (list.length && now - list[0] > WINDOW_MS) list.shift();
}

function takeRateLimit(ip, env, now = Date.now()) {
  const perIp = Number.parseInt(env.RATE_LIMIT_PER_IP, 10) || DEFAULT_PER_IP;
  const global = Number.parseInt(env.RATE_LIMIT_GLOBAL, 10) || DEFAULT_GLOBAL;
  if (hits.size > 5000) hits.clear();
  const list = hits.get(ip) ?? [];
  prune(list, now);
  prune(globalHits, now);
  if (list.length >= perIp) return Math.max(1, Math.ceil((WINDOW_MS - (now - list[0])) / 1000));
  if (globalHits.length >= global) return Math.max(1, Math.ceil((WINDOW_MS - (now - globalHits[0])) / 1000));
  list.push(now);
  globalHits.push(now);
  hits.set(ip, list);
  return 0;
}

export function resetRateLimits() {
  hits.clear();
  globalHits = [];
}

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extraHeaders },
  });
}

function fail(status, code, message, extraHeaders) {
  return json(status, { error: { code, message } }, extraHeaders);
}

export function aiAvailable(env) {
  return Boolean(String(env.ANTHROPIC_API_KEY ?? "").trim()) && env.AI_ENABLED !== "false";
}

export function handleStatus(env) {
  return json(200, { aiAvailable: aiAvailable(env), model: MODEL });
}

function originAllowed(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // same-origin navigations and non-browser clients send none
  const allowed = new Set([new URL(request.url).origin]);
  for (const extra of String(env.ALLOWED_ORIGINS ?? "").split(",")) {
    if (extra.trim()) allowed.add(extra.trim());
  }
  return allowed.has(origin);
}

export async function handleClaude(request, env) {
  if (request.method !== "POST") return fail(405, "method_not_allowed", "Use POST.", { Allow: "POST" });
  if (!originAllowed(request, env)) return fail(403, "forbidden_origin", "Requests must come from this site.");
  if (!(request.headers.get("Content-Type") ?? "").toLowerCase().startsWith("application/json")) {
    return fail(415, "unsupported_media_type", "Send JSON.");
  }

  const declared = Number.parseInt(request.headers.get("Content-Length") ?? "0", 10);
  if (declared > MAX_BODY_CHARS) return fail(413, "payload_too_large", "Request is too large.");
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return fail(413, "payload_too_large", "Request is too large.");

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_request", "Body must be valid JSON.");
  }
  const operation = OPERATIONS[body?.operation];
  if (!operation || !body.payload || typeof body.payload !== "object") {
    return fail(400, "invalid_request", "Unknown operation or missing payload.");
  }

  let userMessage;
  try {
    userMessage = operation.user(body.payload);
  } catch (err) {
    if (err instanceof BadRequest) return fail(400, "invalid_request", err.message);
    throw err;
  }

  if (!aiAvailable(env)) return fail(503, "ai_unavailable", "AI is not available right now.");

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const retryAfter = takeRateLimit(ip, env);
  if (retryAfter > 0) {
    return fail(429, "rate_limited", "Demo AI request limit reached. Try again later.", {
      "Retry-After": String(retryAfter),
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let upstream;
  try {
    upstream = await fetch(env.ANTHROPIC_API_URL || DEFAULT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: operation.maxTokens,
        system: operation.system,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") return fail(504, "upstream_timeout", "The AI service timed out.");
    return fail(502, "upstream_error", "Could not reach the AI service.");
  } finally {
    clearTimeout(timer);
  }

  if (!upstream.ok) {
    // Never forward the upstream body: it can describe the account or key.
    if ([401, 403, 429, 503, 529].includes(upstream.status)) {
      return fail(503, "ai_unavailable", "AI is not available right now.");
    }
    return fail(502, "upstream_error", "The AI service returned an error.");
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    return fail(502, "upstream_error", "The AI service returned an unreadable response.");
  }
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const out = blocks
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!out) return fail(502, "upstream_error", "The AI service returned an empty response.");
  return json(200, { text: out, model: MODEL });
}
