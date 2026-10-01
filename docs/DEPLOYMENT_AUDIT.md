# Public deployment audit

Audit of the repository at commit `6e23c9c` (initial commit) before any public-deployment changes. It records what the code actually does so that portfolio copy can follow the implementation, not the README or the original build spec.

## Implementation status

| Area | Status | Evidence |
|---|---|---|
| Support inbox | **Implemented** | 353 seeded tickets (`src/data/mockTickets.js`, `scripts/seed-mock-tickets.mjs`); status, brand, vertical, priority filters and search (`TicketInbox.jsx`); inbox / metrics tabs (`Header.jsx`, `MetricsDashboard.jsx`) |
| AI triage + drafted response | **Implemented** (requires a Claude key) | `App.jsx` `runTicketAnalysis` runs triage then response; prompts in `prompts.js`; `parseModelJson()` tolerates fenced/wrapped JSON; in-flight guard (`ticketTriageInFlightRef`); retry clears cache |
| Approve / escalate | **Implemented** | `SupportPage.jsx` updates ticket status in client state only (no persistence) |
| Implementations tracker | **Implemented** (checklists require a Claude key) | Metric cards are filters, row expand, one Claude call per implementation (`implLoadInFlightRef`), checklist / blockers / config doc / next action (`ImplementationDetail.jsx`) |
| Knowledge base | **Partially implemented** | Article metrics, search/category filter, working links, documentation gaps with draft badges. **No** Claude article-generation flow (`generatedArticles` is never populated) and **no** coverage bars |
| Managed services | **Partially implemented** | Task metrics, status filters, exception callouts, scheduled -> running -> complete simulation (timer driven, not a real integration). **No** 30-day health bars or Monday pulse |
| Analytics | **Implemented, partly modeled** | Live counts from client state. "Hours saved" is computed from assumed minutes-per-unit constants in `analyticsHistory.js` (`savingsRates`), so it is a model, not a measurement |
| Routing | **Not implemented** | Page is `useState` in `App.jsx`; no URLs, no back/forward, no deep links |
| Persistence / auth / telemetry | **Not implemented** | All state is in memory; Reset restores the seeds |
| Real integrations (Zendesk, Monday.com, payroll, etc.) | **Not implemented** | Mock data only |

## Security finding (blocks public deployment)

`src/utils/claudeApi.js` calls `https://api.anthropic.com/v1/messages` from the browser with `x-api-key: import.meta.env.VITE_CLAUDE_API_KEY` and the `anthropic-dangerous-direct-browser-access` header. Vite inlines `VITE_*` values into the bundle, so any key supplied at build time would be readable by every visitor. `App.jsx` additionally refuses to render without that key (`ApiKeyWarning`).

Resolution (see the proxy work): Claude calls move behind a server-side Cloudflare Pages Function; the key exists only as a server-side secret; the browser sends an operation name plus structured data, never a prompt.

## Other findings

- `package-lock.json` was out of sync with `package.json` (`@emnapi/*`), so `npm ci` failed on a clean clone. Regenerated.
- The footer and top bar use Togetherwork's name and a "TW" mark. A public deployment needs an explicit statement that this is an independent prototype with synthetic data.
- `KnowledgeBasePage.jsx` shows internal copy ("Step 17 preview").
- `docs/TW_Support_AI_Implementation_Plan.md` is the original agent build spec for the browser-key prototype. Its API-key and footer notes are superseded by `docs/DEPLOYMENT.md`.
- Top bar says "Claude Sonnet 4.6 · Live" unconditionally, even without a working key.

## Baseline

- `npm run lint`: clean
- `npm run build`: succeeds, output `dist/` (single JS chunk ~479 kB)
- Build output inspected after the change set; see `docs/DEPLOYMENT.md`.
