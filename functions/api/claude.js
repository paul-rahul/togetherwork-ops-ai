import { handleClaude } from "../_lib/claude.js";

// POST /api/claude  { operation: "triage" | "response" | "implementation", payload }
export function onRequest({ request, env }) {
  return handleClaude(request, env);
}
