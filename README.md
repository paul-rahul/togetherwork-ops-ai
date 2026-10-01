# Togetherwork Operations Intelligence

Independent prototype web app for **Support / Operations AI** (support triage, implementations PSA, knowledge gaps, managed automation, cross-page analytics). It is not affiliated with or endorsed by Togetherwork, and all data is synthetic. Claude is called through a **server-side Cloudflare Pages Function** (`functions/api/claude.js`); the browser never holds an API key.

Public deployment: see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) (secure proxy, cost protection, Cloudflare steps), [`docs/DEPLOYMENT_AUDIT.md`](docs/DEPLOYMENT_AUDIT.md) (what is implemented) and [`docs/DEPLOYMENT_QA.md`](docs/DEPLOYMENT_QA.md).

**Authoritative build spec:** [`docs/TW_Support_AI_Implementation_Plan.md`](docs/TW_Support_AI_Implementation_Plan.md) — follow steps **in order** when extending the app.

---

## Quick start

```bash
cd togetherwork-ops-ai
npm ci
cp .env.example .env     # add ANTHROPIC_API_KEY (optional; see below)
npm run dev
```

**Environment**

- `ANTHROPIC_API_KEY` in `.env` is a **server-side** secret read by the dev middleware and the Pages Function. It has no `VITE_` prefix and is never bundled into browser code. Do not commit real keys; `.env` is gitignored.
- Without a key the app still runs: AI panels show rule-based samples labelled "Offline sample · AI unavailable".
- The browser calls `POST /api/claude` with `{ operation, payload }` (`src/utils/claudeApi.js`); prompts and the model (`claude-sonnet-4-6`) are held server-side in `functions/_lib/`.

**Routes**

`/support`, `/implementations`, `/knowledge`, `/managed-services`, `/analytics` (`/` redirects to `/support`).

**Fonts**

- **DM Sans** / **DM Mono** are linked from `index.html` (not duplicated as a late `@import` in CSS).

**Design rules (in-repo)**

- Colours: **CSS variables** in `src/index.css` (`:root`). Avoid raw hex in component files; use `var(--…)` tokens.
- Prompts return **JSON only**; parse Claude output via the resilient **`parseModelJson()`** helper after `callClaude()` returns text (handles fenced / wrapped JSON).
- The knowledge-base and managed-services pages, and some analytics refinements, are partially implemented (see below). Analytics "hours saved" is modeled from assumed rates, not measured.

---

## Current app highlights

- **Support inbox**
  - **353 demo tickets** seeded via `src/data/mockTickets.js` / `scripts/seed-mock-tickets.mjs` (first 10 are handcrafted, the rest are deterministic mock data).
  - Fixed-height layout with **scroll confined to the inbox list and detail pane** instead of the full page.
  - Inbox supports **status filters, search, brand filter, vertical filter, and priority filter**.
  - Triage + response generation is live against Claude; parsing is hardened against fenced / wrapped JSON responses.
  - Support-side knowledge-base suggestions now have **working outbound links** instead of dead `#` links.

- **Implementations**
  - Metrics cards are **clickable filters**.
  - The implementations table supports **full-row click / keyboard toggle** to open details.
  - Expanding a row runs Claude once per implementation and shows checklist, blockers, config doc, and next action.

- **Knowledge base**
  - Page now shows **published article metrics**, **article search/filter UI**, and **documentation gaps** with draft state badges.
  - Article links resolve through `src/utils/articleLinks.js` so mock entries still open a useful destination.

- **Managed services**
  - Page now shows **task metrics**, **status filters**, **exception callouts**, and **Run workflow** simulation for scheduled jobs.

---

## Implementation progress (plan steps)

| Step | Topic | Status |
|------|--------|--------|
| **1** | Vite + React, Tailwind **v3**, PostCSS, Lucide, `tailwind.config.js`, `vite.config.js`, `index.css` | Done |
| **2** | Mock data: `mockTickets.js`, `knowledgeBase.js` (articles + `documentationGaps`), `mockImplementations.js`, `mockTasks.js`, `analyticsHistory.js` | Done |
| **3** | `src/utils/claudeApi.js`, `.env` / `.gitignore` for secrets | Done |
| **4** | `src/utils/prompts.js` — triage + response builders | Done (+ impl prompts in step 16) |
| **5** | `App.jsx` shell, `Topbar`, `LeftNav`, global routing / stubs | Done |
| **6** | `Header.jsx`, Support **Inbox / Metrics** tabs | Done |
| **7** | `TicketInbox`, `TicketCard`, `formatRelativeTime.js`, inbox column width | Done |
| **8** | `TicketDetail`, stubs for `AnalysisPanel` / `ResponseDraft` | Done |
| **9** | Full `AnalysisPanel` (signals, routing, churn, KB embed) | Done |
| **10** | `KnowledgeBasePanel` (in support detail; article match, icon tile, working “View article” links) | Done |
| **11** | Full `ResponseDraft`; Approve / Escalate / body updates wired to ticket + response state | Done |
| **12** | `MetricsDashboard` + Metrics tab | Done |
| **13** | `ApiKeyWarning`, `ticketErrors` + Retry (clears cache), skeletons, App triage + draft flow, `claudeApi` reads error bodies via `text()` then JSON when possible | Done |
| **14** | Design tokens in `index.css` (incl. `--gray-100`, `--bg`, `--stage-future`), fonts in `index.html`, min font **11px** in UI, card borders, `button:active` scale, motion utilities | Done |
| **15** | App guards (`analysesRef`, triage in-flight), Reset clears errors + impl cache, **`AnalyticsPage`** live metrics from props, app shell / viewport scrolling polish, support inbox filters + scrollable panes | Done |
| **16** | **Implementations tracker:** `ImplementationsPage` (metrics, filters, table, expand row), `ImplementationDetail` (Claude on first expand, checklist / blockers / config doc / next action), `IMPL_*` prompts | Done |
| **17** | **Knowledge base page** | Partially done: page now renders article metrics, article search/category filters, working links, and documentation gaps with draft state. Generate-to-Claude flow and coverage bars still pending. |
| **18** | **Managed services page** | Partially done: page now renders task metrics, status filters, exception states, and scheduled → running → complete workflow simulation. Remaining polish from plan still pending. |

---

## Next steps (resume here)

Work through the plan file in order from **Step 17** / **18** remaining items, then **Step 19** onward.

| Step | Topic | Notes |
|------|--------|--------|
| **17** | **Knowledge base page** | Remaining: coverage bars / scores, Generate → Claude (`KB_ARTICLE_*` prompts), persistence into `generatedArticles[gap.id]`, coverage +5% per category cap 100. **Current:** article browser + documentation gap list are implemented. |
| **18** | **Managed services page** | Remaining: 30-day health bars, Monday pulse, and any remaining plan polish. **Current:** metrics strip, task queue, status filters, exceptions, and Run workflow simulation are implemented. |
| **19** | **Analytics** | Plan “Analytics page” refinements; much of the live analytics work may already live in `AnalyticsPage.jsx` — diff against plan § Step 19 and its feature list. |
| **Post–19** | **Polish** | No stray hex in components, no unhandled rejections, console clean (keys, etc.). |

Optional plan extras not strictly gated to a single step: **Monday.com** row on Implementations (plan feature list § Page 2 item 11) — add when aligning all pages to the “full feature list” in the plan overview.

---

## Key files (for resuming)

| Area | Files |
|------|--------|
| Entry / shell | `src/main.jsx`, `src/App.jsx`, `src/index.css`, `index.html` |
| Layout | `src/components/layout/Topbar.jsx`, `LeftNav.jsx` |
| Support | `src/components/support/*`, `src/components/shared/ApiKeyWarning.jsx` |
| Implementations | `src/components/implementations/ImplementationsPage.jsx`, `ImplementationDetail.jsx` |
| Knowledge / Managed / Analytics | `src/components/knowledge/KnowledgeBasePage.jsx`, `src/components/managed/ManagedServicesPage.jsx`, `src/components/analytics/AnalyticsPage.jsx` |
| Data | `src/data/*.js` |
| Claude (browser) | `src/utils/claudeApi.js`, `src/utils/parseModelJson.js`, `src/utils/offlineSamples.js`, `src/utils/router.js`, `src/utils/articleLinks.js` |
| Claude (server) | `functions/api/claude.js`, `functions/api/claude/status.js`, `functions/_lib/claude.js`, `functions/_lib/prompts.js` |
| Demo seeding | `scripts/seed-mock-tickets.mjs` |

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run seed:tickets` | Regenerate `src/data/mockTickets.js` (353 tickets; keeps first 10 handcrafted) |
| `npm run test:proxy` | Test the server-side Claude proxy against a mock Anthropic API |
| `npm run pages:dev` | Build, then run the real Cloudflare Pages runtime locally |
| `npm run deploy` | Build and deploy `dist/` to the Pages project (needs Cloudflare login) |

---

## Reset behaviour

**Reset** (top bar) restores mock data and clears AI caches / demo state (analyses, responses, implementation checklists, generated articles, task run simulation state, etc.). Use it when demoing from a known baseline.

---

*Last README update: support / implementations UX polish landed; Steps **17** and **18** are partially implemented, with **Step 19** analytics refinements still next after remaining KB / managed work.*
