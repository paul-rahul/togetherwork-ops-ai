/**
 * Strips common LLM wrappers (markdown fences, leading prose) and parses JSON.
 */

function stripMarkdownFences(raw) {
  let s = String(raw ?? "").trim();
  if (!s) return s;
  // Entire response is one fenced block
  const wholeFence = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```\s*$/i;
  const whole = s.match(wholeFence);
  if (whole) return whole[1].trim();
  // Preamble then ```json ... ```
  const open = s.match(/```(?:json)?\s*\r?\n?/i);
  const closeIdx = s.lastIndexOf("```");
  if (open && closeIdx > open.index + open[0].length) {
    const inner = s.slice(open.index + open[0].length, closeIdx).trim();
    if (inner.startsWith("{") || inner.startsWith("[")) return inner;
  }
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "");
    s = s.replace(/\s*```$/s, "");
  }
  return s.trim();
}

/** Extract top-level `{ ... }` with string-aware brace matching. */
function sliceBalancedObject(s, startIdx) {
  const start = s.indexOf("{", startIdx);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

export function parseModelJson(text) {
  let s = stripMarkdownFences(text);

  try {
    return JSON.parse(s);
  } catch {
    // Preamble after strip, e.g. "Here is the analysis:\n{"
    const slice = sliceBalancedObject(s, 0);
    if (slice) {
      try {
        return JSON.parse(slice);
      } catch {
        // fall through
      }
    }
    throw new Error("INVALID_MODEL_JSON");
  }
}
