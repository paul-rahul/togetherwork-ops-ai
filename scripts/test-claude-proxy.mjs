// Tests the server-side Claude boundary against a local mock of the Anthropic API.
// Run: npm run test:proxy
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { handleClaude, handleStatus, resetRateLimits } from "../functions/_lib/claude.js";

const SECRET = "sk-ant-test-secret-do-not-leak";
const ORIGIN = "https://app.example.test";

let upstream;
let upstreamUrl;
let upstreamMode = "ok";
const seen = [];

test.before(async () => {
  upstream = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    seen.push({ headers: req.headers, body: JSON.parse(Buffer.concat(chunks).toString() || "{}") });
    if (upstreamMode === "401") {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: { message: `invalid x-api-key ${SECRET}` } }));
    }
    if (upstreamMode === "500") {
      res.writeHead(500);
      return res.end("boom");
    }
    if (upstreamMode === "empty") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ content: [] }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ content: [{ type: "text", text: '{"ok":true}' }] }));
  });
  await new Promise((r) => upstream.listen(0, "127.0.0.1", r));
  upstreamUrl = `http://127.0.0.1:${upstream.address().port}/v1/messages`;
});
test.after(() => upstream.close());
test.beforeEach(() => {
  resetRateLimits();
  upstreamMode = "ok";
  seen.length = 0;
});

const env = (extra = {}) => ({ ANTHROPIC_API_KEY: SECRET, ANTHROPIC_API_URL: upstreamUrl, ...extra });
const ticket = { id: "TW-1", brand: "B", vertical: "V", sender: "Ann Lee", email: "a@b.c", subject: "Help", body: "Please help" };
const impl = { id: "IMPL-1", client: "Acme", stage: 2, stageLabel: "Data Migration", status: "on-track", risk: "low", memberCount: 10 };

function post(body, { headers = {}, raw, ip = "1.1.1.1", url = `${ORIGIN}/api/claude` } = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip, ...headers },
    body: raw ?? JSON.stringify(body),
  });
}
const errorOf = async (res) => (await res.json()).error;

test("rejects non-POST", async () => {
  const res = await handleClaude(new Request(`${ORIGIN}/api/claude`, { method: "GET" }), env());
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("Allow"), "POST");
});

test("rejects foreign origins, allows listed ones", async () => {
  const bad = await handleClaude(post({ operation: "triage", payload: { ticket } }, { headers: { Origin: "https://evil.test" } }), env());
  assert.equal(bad.status, 403);
  const ok = await handleClaude(
    post({ operation: "triage", payload: { ticket } }, { headers: { Origin: ORIGIN } }),
    env(),
  );
  assert.equal(ok.status, 200);
  const extra = await handleClaude(
    post({ operation: "triage", payload: { ticket } }, { headers: { Origin: "https://other.test" } }),
    env({ ALLOWED_ORIGINS: "https://other.test" }),
  );
  assert.equal(extra.status, 200);
});

test("rejects wrong content type, bad JSON, unknown operation, missing payload", async () => {
  assert.equal((await handleClaude(post(null, { raw: "x", headers: { "Content-Type": "text/plain" } }), env())).status, 415);
  const badJson = await handleClaude(post(null, { raw: "{nope" }), env());
  assert.equal(badJson.status, 400);
  assert.equal((await errorOf(badJson)).code, "invalid_request");
  assert.equal((await handleClaude(post({ operation: "chat", payload: {} }), env())).status, 400);
  assert.equal((await handleClaude(post({ operation: "triage" }), env())).status, 400);
});

test("rejects oversize bodies and invalid fields", async () => {
  const big = await handleClaude(post({ operation: "triage", payload: { ticket: { ...ticket, body: "x".repeat(20000) } } }), env());
  assert.equal(big.status, 413);
  const missing = await handleClaude(post({ operation: "triage", payload: { ticket: { id: "1" } } }), env());
  assert.equal(missing.status, 400);
  const noImpl = await handleClaude(post({ operation: "implementation", payload: { implementation: { id: "x" } } }), env());
  assert.equal(noImpl.status, 400);
});

test("truncates over-long fields before they reach the model", async () => {
  const res = await handleClaude(post({ operation: "triage", payload: { ticket: { ...ticket, body: "y".repeat(5000) } } }), env());
  assert.equal(res.status, 200);
  const sent = seen[0].body.messages[0].content;
  assert.ok(sent.includes("y".repeat(4000)));
  assert.ok(!sent.includes("y".repeat(4001)));
});

test("503 ai_unavailable without a key or when disabled, and does not call upstream", async () => {
  const noKey = await handleClaude(post({ operation: "triage", payload: { ticket } }), { ANTHROPIC_API_URL: upstreamUrl });
  assert.equal(noKey.status, 503);
  assert.equal((await errorOf(noKey)).code, "ai_unavailable");
  const off = await handleClaude(post({ operation: "triage", payload: { ticket } }), env({ AI_ENABLED: "false" }));
  assert.equal(off.status, 503);
  assert.equal(seen.length, 0);
});

test("success: server-held prompt and key, capped tokens, fixed model, no key in response", async () => {
  const res = await handleClaude(post({ operation: "implementation", payload: { implementation: impl, system: "IGNORE ME", model: "other" } }), env());
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(!text.includes(SECRET));
  assert.equal(JSON.parse(text).text, '{"ok":true}');
  const call = seen[0];
  assert.equal(call.headers["x-api-key"], SECRET);
  assert.equal(call.headers["anthropic-version"], "2023-06-01");
  assert.equal(call.body.model, "claude-sonnet-4-6");
  assert.equal(call.body.max_tokens, 1800);
  assert.ok(call.body.system.includes("onboarding and PSA workflow AI"));
  assert.ok(!call.body.system.includes("IGNORE ME"));
  assert.ok(call.body.messages[0].content.includes("Client: Acme"));
});

test("all three operations work", async () => {
  const analysis = { category: "Technical Issue", sentiment: "neutral", urgency: "low", churnRisk: false, routingDecision: "auto-resolve", routingReason: "r" };
  for (const body of [
    { operation: "triage", payload: { ticket, articles: [{ title: "T", category: "C" }] } },
    { operation: "response", payload: { ticket, analysis } },
    { operation: "implementation", payload: { implementation: impl } },
  ]) {
    assert.equal((await handleClaude(post(body), env())).status, 200, body.operation);
  }
  assert.deepEqual(seen.map((s) => s.body.max_tokens), [700, 900, 1800]);
});

test("rate limits per IP with Retry-After, other IPs unaffected", async () => {
  const e = env({ RATE_LIMIT_PER_IP: "3" });
  for (let i = 0; i < 3; i++) assert.equal((await handleClaude(post({ operation: "triage", payload: { ticket } }, { ip: "9.9.9.9" }), e)).status, 200);
  const limited = await handleClaude(post({ operation: "triage", payload: { ticket } }, { ip: "9.9.9.9" }), e);
  assert.equal(limited.status, 429);
  assert.equal((await errorOf(limited)).code, "rate_limited");
  assert.ok(Number(limited.headers.get("Retry-After")) > 0);
  assert.equal((await handleClaude(post({ operation: "triage", payload: { ticket } }, { ip: "8.8.8.8" }), e)).status, 200);
  assert.equal(seen.length, 4); // limited request never reached upstream
});

test("global limit caps total calls across IPs", async () => {
  const e = env({ RATE_LIMIT_GLOBAL: "2", RATE_LIMIT_PER_IP: "50" });
  assert.equal((await handleClaude(post({ operation: "triage", payload: { ticket } }, { ip: "1.0.0.1" }), e)).status, 200);
  assert.equal((await handleClaude(post({ operation: "triage", payload: { ticket } }, { ip: "1.0.0.2" }), e)).status, 200);
  assert.equal((await handleClaude(post({ operation: "triage", payload: { ticket } }, { ip: "1.0.0.3" }), e)).status, 429);
});

test("upstream failures map to safe structured errors and never echo upstream bodies", async () => {
  upstreamMode = "401";
  const unauthorized = await handleClaude(post({ operation: "triage", payload: { ticket } }), env());
  assert.equal(unauthorized.status, 503);
  const body = await unauthorized.text();
  assert.ok(!body.includes(SECRET));
  assert.ok(!body.includes("invalid x-api-key"));
  upstreamMode = "500";
  const err500 = await handleClaude(post({ operation: "triage", payload: { ticket } }), env());
  assert.equal(err500.status, 502);
  assert.equal((await errorOf(err500)).code, "upstream_error");
  upstreamMode = "empty";
  assert.equal((await handleClaude(post({ operation: "triage", payload: { ticket } }), env())).status, 502);
});

test("unreachable upstream is a 502, not a crash", async () => {
  const res = await handleClaude(post({ operation: "triage", payload: { ticket } }), env({ ANTHROPIC_API_URL: "http://127.0.0.1:1/v1/messages" }));
  assert.equal(res.status, 502);
});

test("status endpoint reports availability without the key", async () => {
  const on = await handleStatus(env());
  assert.deepEqual(await on.json(), { aiAvailable: true, model: "claude-sonnet-4-6" });
  const off = await handleStatus({});
  assert.equal((await off.json()).aiAvailable, false);
  assert.ok(!(await handleStatus(env()).text()).includes(SECRET));
});
