# Deployment QA

Checks run on `feat/togetherwork-public-deployment` before any public deployment. All use a mock Anthropic upstream (`ANTHROPIC_API_URL`) so no real key or spend was involved; the real model path is verified separately after the secret is set (see `docs/DEPLOYMENT.md`).

## Automated

| Suite | Command | Result |
|---|---|---|
| Lint | `npm run lint` | clean |
| Build | `npm run build` | succeeds, `dist/` is static only |
| Proxy unit tests | `npm run test:proxy` | 13/13 |
| Functions bundle | `wrangler pages functions build` | compiles |

Proxy tests cover: method and content-type checks, origin check (and `ALLOWED_ORIGINS`), invalid JSON, unknown operations, missing/invalid fields, body-size limit (413), field truncation, kill switch and missing key (503, no upstream call), server-held prompt/model/token cap, per-IP and global rate limits (429 + `Retry-After`), upstream 401/500/empty/unreachable mapped to safe errors with no upstream body or secret echoed, status endpoint secret-free.

## Production bundle secret scan

`dist/` contains none of: `sk-ant`, `ANTHROPIC_API_KEY`, `VITE_CLAUDE_API_KEY`, `anthropic-dangerous-direct-browser-access`, `api.anthropic.com`, `x-api-key`, or any prompt text. It holds only html, js, css and svg.

## Cloudflare Pages runtime (`wrangler pages dev dist`)

- `/`, `/support`, `/implementations`, `/knowledge`, `/managed-services`, `/analytics` all return the app shell (SPA fallback).
- `GET /api/claude/status` -> `{ aiAvailable, model }`, no secret.
- `POST /api/claude` works through the Pages Function; upstream received the server-side key, fixed model and server-held prompt.
- Cross-origin POST -> 403, unknown operation -> 400, oversize -> 413, `Cache-Control: no-store`.

## Browser (headless Chrome, 36 checks)

- Direct links to all five routes: correct URL, document title, active nav item (`aria-current`), no console errors.
- `/` and unknown paths -> `/support`; trailing slash works.
- Nav click pushes history; back/forward and refresh keep the route.
- AI configured: selecting a ticket and expanding an implementation call `/api/claude` only (never an Anthropic host); secret absent from every loaded asset and the status response; no offline badge.
- No key: top bar shows "AI offline · sample mode"; support triage, drafted response and implementation checklist show labelled offline samples; Analytics, Knowledge and Managed services render; no key-gate screen.
- Rate limit (2 per window): the next ticket degrades to a labelled sample instead of an error; direct call returns 429 with `Retry-After`.

## Not covered

- The real Anthropic call (requires the production secret) is verified after deployment.
- Real multi-isolate rate limiting: the in-app limiter is best effort per server instance. The hard backstop is an Anthropic workspace spend limit.
- The app is a dense desktop layout; tablet and phone widths are usable but not redesigned.
