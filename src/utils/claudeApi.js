// Browser client for the server-side Claude proxy (functions/api/claude.js).
// The browser never holds an API key and never sends a prompt: it names an
// operation ("triage" | "response" | "implementation") and sends demo data.

export class AiError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.status = status;
  }
}

// Failures where the demo should keep working with a labelled offline sample
// instead of showing an error.
const DEGRADABLE_CODES = new Set([
  "ai_unavailable",
  "rate_limited",
  "network_error",
  "upstream_timeout",
  "upstream_error",
]);

export function canDegrade(err) {
  return err instanceof AiError && DEGRADABLE_CODES.has(err.code);
}

export async function callClaude(operation, payload) {
  let response;
  try {
    response = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation, payload }),
    });
  } catch {
    throw new AiError("network_error", "Could not reach the AI service.");
  }

  const raw = await response.text();
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    /* non-JSON error body (for example an HTML error page) */
  }

  if (!response.ok) {
    const err = data?.error;
    throw new AiError(err?.code ?? "request_failed", err?.message ?? "AI request failed.", response.status);
  }
  if (typeof data?.text !== "string" || !data.text) {
    throw new AiError("upstream_error", "The AI service returned an empty response.", response.status);
  }
  return data.text;
}

/** Whether the server has an AI key configured. Resolves false on any failure. */
export async function fetchAiStatus() {
  try {
    const response = await fetch("/api/claude/status", { headers: { Accept: "application/json" } });
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data?.aiAvailable);
  } catch {
    return false;
  }
}
