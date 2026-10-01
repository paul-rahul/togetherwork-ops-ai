import { handleStatus } from "../../_lib/claude.js";

// GET /api/claude/status -> { aiAvailable, model } (never returns the key)
export function onRequestGet({ env }) {
  return handleStatus(env);
}
