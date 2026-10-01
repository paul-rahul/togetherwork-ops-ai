# Togetherwork Support AI — Implementation Plan
**For use with a coding agent. Follow steps in order. Do not skip ahead.**

---

## Overview

Build a working web app prototype — **Togetherwork Operations Intelligence** — that demonstrates AI and automation across all four work streams called out in the job description: customer support, professional services (implementations), knowledge management, and managed services automation.

The app has five pages connected by a left-side navigation. Each page maps directly to a section of the JD. All Claude API calls are made directly from the browser. No backend or database required.

---

## JD-to-feature mapping

| JD work stream | App page | Key JD quote |
|---|---|---|
| Customer Support | Support inbox | "Connect Claude to Zendesk to auto-answer tickets, build AI ticket triage and routing, sentiment detection" |
| Professional Services | Implementations tracker | "Analyze onboarding workflows, build AI-driven implementation workflows, automate data migrations, configs, and documentation generation, integrate AI into PSA/PMO tools e.g. Monday.com" |
| Knowledge and Docs | Knowledge base | "Build AI-powered help centers from documentation and tickets, auto-generate help articles and identify documentation gaps" |
| Managed Services | Automation tasks | "Reduce repeated payroll processing work, build automation for billing, tax, donations and workflows, build integration between Claude and Monday.com" |
| Cross-cutting | Analytics | "Driving measurable customer outcomes — efficiency, CSAT, cost reduction" |

---

## What the app does (full feature list)

### Page 1 — Support inbox
1. Ticket list from multiple Togetherwork brands with status, sentiment badge, and brand pill
2. Claude triage: category, sentiment score, urgency, churn risk, routing decision, confidence score
3. AI-drafted response with knowledge base citations
4. Approve / Edit / Escalate actions that update ticket status live
5. Skeleton loading states and error handling

### Page 2 — Implementations tracker
6. Table of active client onboardings across all verticals
7. Visual 5-stage progress track per client (Discovery → Config → Data Migration → Testing → Go-live)
8. Claude-powered blocker detection — flags at-risk implementations automatically
9. AI-generated onboarding checklist per client (Claude call on row expand)
10. AI-generated configuration documentation per client
11. Monday.com sync status indicator

### Page 3 — Knowledge base
12. Documentation gap detection — ranks unanswered query types by ticket frequency
13. Generate article button triggers Claude to draft a full KB article for any gap
14. Category coverage bars showing percentage of known query types with an answer
15. Recently AI-generated article list
16. Coverage score stat updated live as new articles are generated

### Page 4 — Managed services automation
17. Recurring task queue: payroll, invoicing, tax, donation receipts — each with automation status
18. Exception log — Claude flags financial discrepancies for human review
19. Automation health bars showing success rate per task type over the last 30 days
20. Monday.com sync status (live pulsing indicator)
21. Run workflow button for manual triggers

### Page 5 — Analytics
22. Cross-page metrics: total AI actions, deflection rate, hours saved, churn prevented
23. Ticket volume and deflection rate stacked bar chart (last 7 days)
24. Sentiment distribution grid
25. Top ticket category breakdown bars
26. All stats update live as actions are taken across other pages

---

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | Fast setup, no backend needed |
| Styling | Tailwind CSS v3 | Utility-first, fast to build with |
| API | Anthropic Claude API (`claude-sonnet-4-6`) | Called directly via fetch from the browser |
| State | React useState + useReducer | No Redux needed at this scale |
| Icons | Lucide React | Clean, consistent icon set |
| Fonts | Google Fonts — `DM Sans` (body) + `DM Mono` (badges/codes) | Professional but not generic |

---

## Project structure

```
togetherwork-support-ai/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── layout/
    │   │   ├── Topbar.jsx
    │   │   └── LeftNav.jsx
    │   ├── support/
    │   │   ├── TicketInbox.jsx
    │   │   ├── TicketCard.jsx
    │   │   ├── TicketDetail.jsx
    │   │   ├── AnalysisPanel.jsx
    │   │   ├── ResponseDraft.jsx
    │   │   └── KnowledgeBasePanel.jsx
    │   ├── implementations/
    │   │   ├── ImplementationsPage.jsx
    │   │   ├── ImplementationRow.jsx
    │   │   └── ImplementationDetail.jsx
    │   ├── knowledge/
    │   │   ├── KnowledgeBasePage.jsx
    │   │   ├── GapCard.jsx
    │   │   └── ArticleGenerator.jsx
    │   ├── managed/
    │   │   ├── ManagedServicesPage.jsx
    │   │   ├── TaskRow.jsx
    │   │   └── ExceptionCard.jsx
    │   ├── analytics/
    │   │   └── AnalyticsPage.jsx
    │   └── shared/
    │       ├── StatCard.jsx
    │       ├── BrandPill.jsx
    │       ├── StatusBadge.jsx
    │       └── SkeletonLoader.jsx
    ├── data/
    │   ├── mockTickets.js
    │   ├── mockImplementations.js
    │   ├── mockTasks.js
    │   └── knowledgeBase.js
    └── utils/
        ├── claudeApi.js
        └── prompts.js
```

---

## Step 1 — Project setup

Run the following commands:

```bash
npm create vite@latest togetherwork-ops-ai -- --template react
cd togetherwork-ops-ai
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react
```

### `tailwind.config.js`
```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        tw: {
          navy: "#0F1F3D",
          blue: "#1A56DB",
          lightblue: "#EBF5FF",
          teal: "#0E9F6E",
          amber: "#D97706",
          red: "#E02424",
          gray: "#F9FAFB",
        },
      },
    },
  },
  plugins: [],
};
```

### `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap");

body {
  font-family: "DM Sans", sans-serif;
  background-color: #F9FAFB;
}
```

### `vite.config.js`
```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

---

## Step 2 — Mock data

All mock data is fully hardcoded below. Copy each file exactly as written. Do not generate or randomise any values — use these exact strings, timestamps, and IDs so the app behaves consistently across demo runs.

**Timestamp reference:** Today is May 9, 2026. The 6-month window runs from November 9, 2025 to May 9, 2026. Tickets 1, 2, and 3 fall within the last 10 days (April 29 – May 9), satisfying the 30% recency requirement.

---

### `src/data/mockTickets.js`

```js
const mockTickets = [
  {
    id: "TKT-001",
    brand: "CampBrain",
    vertical: "Camps",
    sender: "Sarah Mitchell",
    email: "sarah@lakeviewcamp.org",
    subject: "Camper registration payment form keeps timing out",
    body: `Hi there,

We have been trying to register our 45 campers for the upcoming summer session but the payment form keeps timing out right after we enter card details and click submit. We have tested this on Chrome, Firefox, and Safari — same result every time. Our registration deadline is this Friday and we have families waiting on confirmation emails. This is becoming a serious problem.

Can someone from your team look at this urgently? We have been a CampBrain customer for three years and have never had an issue like this before.

Thanks,
Sarah`,
    timestamp: "2026-05-09T09:14:00Z",
    status: "open",
    priority: "critical",
  },
  {
    id: "TKT-002",
    brand: "Zen Planner",
    vertical: "Gyms",
    sender: "Marcus Webb",
    email: "marcus@ironridgegym.com",
    subject: "Member login completely broken since plan upgrade yesterday",
    body: `Hello,

We upgraded our Zen Planner plan to the Pro tier yesterday afternoon and now none of our members can log in to the member portal. They are all getting a generic error message that says "Access denied — contact your administrator." I have already tried resetting my own admin password and the issue persists.

We have 380 active members and several have already messaged us on Instagram asking why the app is down. Please help as soon as possible.

Marcus Webb
Iron Ridge Gym`,
    timestamp: "2026-05-07T14:22:00Z",
    status: "open",
    priority: "high",
  },
  {
    id: "TKT-003",
    brand: "Gingr",
    vertical: "Pet Care",
    sender: "Patricia Osei",
    email: "patricia@pawsandplay.co",
    subject: "We were charged twice for the April billing cycle",
    body: `To whom it may concern,

I have been reviewing our billing statements and noticed we were charged $349 twice for the month of April — once on April 1st and again on April 3rd. I have reached out twice before through your chat widget and never received a follow up.

This is really frustrating. We are a small pet care business and a double charge of this size causes real cash flow issues. If this is not resolved quickly we will need to reconsider our subscription.

Please refund the duplicate charge immediately and confirm in writing.

Patricia Osei
Paws and Play`,
    timestamp: "2026-05-03T11:05:00Z",
    status: "open",
    priority: "high",
  },
  {
    id: "TKT-004",
    brand: "Neon CRM",
    vertical: "Nonprofits",
    sender: "James Okafor",
    email: "james@riverdalefoundation.org",
    subject: "How do I export our full member list to CSV?",
    body: `Hi,

Quick question — I need to pull our entire member list into a spreadsheet for our annual report. I can see individual records fine but I cannot find an export button anywhere on the Members page. Could you point me to where the export option is?

Thanks in advance,
James`,
    timestamp: "2026-04-22T16:38:00Z",
    status: "open",
    priority: "low",
  },
  {
    id: "TKT-005",
    brand: "GlueUp",
    vertical: "Associations",
    sender: "Linda Park",
    email: "linda.park@techassoc.org",
    subject: "Setting up event registration — where do I start?",
    body: `Hello Support Team,

We are planning our annual member conference for July and would like to use GlueUp for event registration and ticketing. We have not used this feature before and I am not sure where to begin. 

Do you have a step-by-step guide? Specifically I want to know how to set up different ticket tiers (member, non-member, student) and collect dietary requirements from attendees.

Thank you,
Linda Park
National Tech Professionals Association`,
    timestamp: "2026-04-10T09:51:00Z",
    status: "open",
    priority: "low",
  },
  {
    id: "TKT-006",
    brand: "CampBrain",
    vertical: "Camps",
    sender: "Derek Vasquez",
    email: "derek@pinecrestcamp.com",
    subject: "CSV data import keeps failing at step 3",
    body: `Hi,

We are trying to migrate our camper records from our old system into CampBrain. I exported a CSV file with 1,847 rows and when I try to import it, the upload gets to "Step 3: Validating records" and then shows a red error: "Column mismatch detected — see details." But the details page is blank.

I have tried reformatting the headers three times following your documentation. Nothing works. We need this data in the system before our staff training next week.

Derek`,
    timestamp: "2026-03-28T13:17:00Z",
    status: "open",
    priority: "high",
  },
  {
    id: "TKT-007",
    brand: "GlueUp",
    vertical: "Associations",
    sender: "Henry Nguyen",
    email: "h.nguyen@midwestlegal.org",
    subject: "Forgot password — reset email not arriving",
    body: `Hello,

I have tried resetting my password three times this morning and the reset email is not arriving. I have checked my spam folder. My email is h.nguyen@midwestlegal.org. 

Can you manually reset it or send a new link directly?

Thanks`,
    timestamp: "2026-03-05T08:44:00Z",
    status: "open",
    priority: "medium",
  },
  {
    id: "TKT-008",
    brand: "Neon CRM",
    vertical: "Nonprofits",
    sender: "Amy Chen",
    email: "amy@urbangreens.org",
    subject: "Need help with the API — getting 401 errors on all calls",
    body: `Hi Support,

Our developer is trying to integrate Neon CRM with our internal volunteer management system via the REST API. Every single API call is returning a 401 Unauthorized error even though we generated a new API key yesterday.

Here is what we have tried:
- Regenerated the API key twice
- Confirmed we are passing it in the Authorization header as Bearer [key]
- Tested with both GET and POST endpoints

Is there something about how the key needs to be formatted or scoped? Our developer says the documentation is a bit unclear on authentication setup.

Amy Chen`,
    timestamp: "2026-02-14T15:30:00Z",
    status: "open",
    priority: "medium",
  },
  {
    id: "TKT-009",
    brand: "Gingr",
    vertical: "Pet Care",
    sender: "Tom Reyes",
    email: "tom@furryfriendsdaycare.com",
    subject: "Feature request: bulk appointment booking for repeat clients",
    body: `Hi Gingr team,

Love the product overall. One thing that would save us hours every week is a bulk appointment booking feature for our repeat weekly clients. Right now we have to manually book each dog individually every Monday morning — we have 60 regular weekly clients and it takes our receptionist almost two hours.

Would love to know if this is on the roadmap or if there is a workaround I am missing.

Thanks,
Tom`,
    timestamp: "2026-01-19T10:22:00Z",
    status: "open",
    priority: "low",
  },
  {
    id: "TKT-010",
    brand: "CampBrain",
    vertical: "Camps",
    sender: "Rachel Thornton",
    email: "rachel@blueridgecamp.org",
    subject: "Invoices keep going to the wrong email address",
    body: `Hello,

This is the fourth time I am contacting you about the same issue. Our monthly invoices keep being sent to an old email address (finance@blueridgecamp.com) instead of our current billing address (rachel@blueridgecamp.org). I have updated the billing contact in account settings three times now and the problem keeps recurring after the next billing cycle.

We nearly missed a payment last month because of this. I need someone senior to look at this — it feels like there is a bug saving the contact update.

Rachel Thornton
Blue Ridge Camp`,
    timestamp: "2025-12-03T14:08:00Z",
    status: "open",
    priority: "medium",
  },
];

export default mockTickets;
```

---

### `src/data/knowledgeBase.js`

```js
export const articles = [
  {
    id: "KB-001",
    title: "Troubleshooting payment form timeouts",
    category: "Billing & Payments",
    brands: ["CampBrain", "GlueUp", "Neon CRM"],
    excerpt: "If your payment form is timing out during checkout, the most common causes are session expiry, browser extension conflicts, or a Stripe webhook misconfiguration.",
    url: "#",
    keywords: ["payment", "timeout", "card", "checkout", "stripe", "billing", "submit"],
  },
  {
    id: "KB-002",
    title: "How to reset a member or admin password",
    category: "Account Access",
    brands: ["GlueUp", "Neon CRM", "Zen Planner", "CampBrain", "Gingr"],
    excerpt: "Admins can trigger a password reset from the Users panel. If the reset email is not arriving, check your spam folder and verify the email address on the account.",
    url: "#",
    keywords: ["password", "reset", "login", "access", "email", "forgot"],
  },
  {
    id: "KB-003",
    title: "Exporting member records to CSV",
    category: "Data & Reporting",
    brands: ["Neon CRM", "GlueUp"],
    excerpt: "To export your full member list, navigate to Members > All Members > Export. You can filter by status, tag, or membership tier before exporting.",
    url: "#",
    keywords: ["export", "csv", "download", "member", "report", "spreadsheet"],
  },
  {
    id: "KB-004",
    title: "Setting up event registration and ticket tiers",
    category: "General How-To",
    brands: ["GlueUp"],
    excerpt: "Create events from the Events module. Use ticket tiers to set different pricing for member, non-member, and student attendees. Custom fields let you collect dietary or accessibility requirements.",
    url: "#",
    keywords: ["event", "registration", "ticket", "tier", "conference", "pricing"],
  },
  {
    id: "KB-005",
    title: "Importing data via CSV — column mapping guide",
    category: "Data & Reporting",
    brands: ["CampBrain", "Neon CRM", "GlueUp"],
    excerpt: "Our import wizard requires specific column headers. Download the template from the Import page and map your existing data to match before uploading.",
    url: "#",
    keywords: ["import", "csv", "upload", "data", "migration", "column", "header"],
  },
  {
    id: "KB-006",
    title: "API authentication — generating and using API keys",
    category: "API & Integrations",
    brands: ["Neon CRM", "GlueUp"],
    excerpt: "API keys are scoped per organisation. Pass the key as a Bearer token in the Authorization header. Keys expire after 90 days unless set to non-expiring in your developer settings.",
    url: "#",
    keywords: ["api", "key", "authentication", "401", "bearer", "token", "developer", "rest"],
  },
  {
    id: "KB-007",
    title: "Updating billing contact and invoice email address",
    category: "Billing & Payments",
    brands: ["CampBrain", "Gingr", "Zen Planner"],
    excerpt: "To change where invoices are sent, go to Account Settings > Billing > Billing Contact. Changes take effect from the next billing cycle. If the old address persists, clear your browser cache and save again.",
    url: "#",
    keywords: ["invoice", "billing", "email", "address", "contact", "update", "change"],
  },
  {
    id: "KB-008",
    title: "Understanding your Togetherwork invoice and charges",
    category: "Billing & Payments",
    brands: ["CampBrain", "GlueUp", "Neon CRM", "Zen Planner", "Gingr"],
    excerpt: "Invoices are generated on the 1st of each month. Each line item corresponds to a module or user seat. Duplicate charges are typically caused by plan upgrades mid-cycle and are automatically credited.",
    url: "#",
    keywords: ["invoice", "charge", "duplicate", "refund", "billing", "statement", "payment"],
  },
  {
    id: "KB-009",
    title: "How to set up a donation page",
    category: "General How-To",
    brands: ["Neon CRM"],
    excerpt: "Use the Fundraising module to create a public-facing donation page. You can customise the amount tiers, add a campaign goal bar, and embed the page on your own website using the provided iframe snippet.",
    url: "#",
    keywords: ["donation", "fundraising", "page", "campaign", "embed", "nonprofit"],
  },
  {
    id: "KB-010",
    title: "Member portal access after a plan upgrade",
    category: "Account Access",
    brands: ["Zen Planner", "GlueUp"],
    excerpt: "After upgrading your plan, member portal permissions may need to be reassigned. Go to Settings > Member Access > Roles and verify that the Member role has Portal access enabled.",
    url: "#",
    keywords: ["portal", "access", "upgrade", "plan", "login", "member", "permission"],
  },
  {
    id: "KB-011",
    title: "Bulk appointment booking for recurring clients",
    category: "General How-To",
    brands: ["Gingr"],
    excerpt: "Use the Recurring Appointments feature under the Scheduling module to set up weekly or monthly bookings for regular clients in one step. You can apply it to multiple pets simultaneously.",
    url: "#",
    keywords: ["appointment", "recurring", "bulk", "booking", "weekly", "schedule"],
  },
  {
    id: "KB-012",
    title: "Configuring Stripe webhooks for payment processing",
    category: "API & Integrations",
    brands: ["CampBrain", "Neon CRM", "Gingr"],
    excerpt: "If payments are processing but confirmation emails are not triggering, your Stripe webhook endpoint may be misconfigured. Verify the endpoint URL in your Stripe dashboard matches the URL in your platform settings.",
    url: "#",
    keywords: ["stripe", "webhook", "payment", "confirmation", "email", "endpoint"],
  },
];

export const documentationGaps = [
  {
    id: "GAP-001",
    title: "Multi-location payroll setup for managed clients",
    category: "Managed Services",
    ticketCount: 23,
    brands: ["CampBrain", "Neon CRM"],
    description: "No article exists covering how managed service clients configure payroll across multiple locations or subsidiaries.",
    generatedContent: null,
  },
  {
    id: "GAP-002",
    title: "Bulk member data import — error code reference",
    category: "Data & Reporting",
    ticketCount: 17,
    brands: ["GlueUp", "Neon CRM", "CampBrain"],
    description: "Existing import guide lacks a reference table for validation error codes shown at Step 3 of the import wizard.",
    generatedContent: null,
  },
  {
    id: "GAP-003",
    title: "Embedding a donation page on an external website",
    category: "General How-To",
    ticketCount: 12,
    brands: ["Neon CRM"],
    description: "No article covers the iframe embed workflow in detail, including CORS settings and how to pass UTM parameters through the embed.",
    generatedContent: null,
  },
  {
    id: "GAP-004",
    title: "API rate limit errors — causes and resolution",
    category: "API & Integrations",
    ticketCount: 9,
    brands: ["Neon CRM", "GlueUp"],
    description: "Developers frequently hit 429 errors without guidance on rate limits per endpoint or how to implement exponential backoff.",
    generatedContent: null,
  },
  {
    id: "GAP-005",
    title: "Tax reconciliation workflow for nonprofit clients",
    category: "Managed Services",
    ticketCount: 8,
    brands: ["Neon CRM"],
    description: "No documentation on the quarterly tax reconciliation process for managed clients filing IRS Form 990.",
    generatedContent: null,
  },
  {
    id: "GAP-006",
    title: "Plan upgrade — resolving member access issues",
    category: "Account Access",
    ticketCount: 7,
    brands: ["Zen Planner", "GlueUp"],
    description: "After a plan upgrade, some user roles lose portal access. No troubleshooting article exists for this specific scenario.",
    generatedContent: null,
  },
  {
    id: "GAP-007",
    title: "Migrating from a legacy system — pre-import checklist",
    category: "Data & Reporting",
    ticketCount: 6,
    brands: ["CampBrain", "Neon CRM"],
    description: "No pre-migration checklist exists for clients transitioning from older systems. Customers frequently submit tickets about data formatting before import.",
    generatedContent: null,
  },
  {
    id: "GAP-008",
    title: "Stripe duplicate charge — how to request a refund",
    category: "Billing & Payments",
    ticketCount: 6,
    brands: ["Gingr", "CampBrain", "Zen Planner"],
    description: "No self-service article explains the refund request process for duplicate billing charges, leading to repeat escalations.",
    generatedContent: null,
  },
  {
    id: "GAP-009",
    title: "Configuring custom fields on registration forms",
    category: "General How-To",
    ticketCount: 5,
    brands: ["CampBrain", "GlueUp"],
    description: "Admins frequently ask how to add conditional custom fields (e.g. dietary requirements, emergency contacts) to registration workflows.",
    generatedContent: null,
  },
  {
    id: "GAP-010",
    title: "Setting up automated payment reminders",
    category: "Billing & Payments",
    ticketCount: 4,
    brands: ["GlueUp", "Neon CRM"],
    description: "No article on configuring automatic overdue payment reminder emails, including cadence settings and how to customise the message.",
    generatedContent: null,
  },
  {
    id: "GAP-011",
    title: "SSO configuration with Microsoft Entra ID",
    category: "API & Integrations",
    ticketCount: 4,
    brands: ["GlueUp", "Neon CRM"],
    description: "Enterprise association clients frequently ask about SAML-based SSO with Microsoft Entra (formerly Azure AD). No guide exists.",
    generatedContent: null,
  },
];

export default articles;
```

---

### `src/data/mockImplementations.js`

Timestamps below reflect realistic start and go-live dates spread across the 6-month window. Two implementations are at-risk with overdue go-live dates.

```js
const mockImplementations = [
  {
    id: "IMPL-001",
    client: "Lakewood Nonprofit Alliance",
    contactName: "Rachel Torres",
    contactEmail: "rachel@lakewood.org",
    product: "Neon CRM",
    vertical: "Nonprofits",
    memberCount: 38,
    adminCount: 2,
    stage: 2,
    stageLabel: "Data Migration",
    status: "on-track",
    risk: "low",
    startDate: "2026-01-12",
    goLiveDate: "2026-06-02",
    checklistComplete: 4,
    checklistTotal: 6,
    aiChecklist: null,
  },
  {
    id: "IMPL-002",
    client: "Summit Camp Group",
    contactName: "Daniel Hirsch",
    contactEmail: "daniel@summitcamps.com",
    product: "CampBrain",
    vertical: "Camps",
    memberCount: 450,
    adminCount: 8,
    stage: 3,
    stageLabel: "Testing — delayed",
    status: "at-risk",
    risk: "high",
    startDate: "2025-12-08",
    goLiveDate: "2026-05-20",
    checklistComplete: 3,
    checklistTotal: 7,
    aiChecklist: null,
  },
  {
    id: "IMPL-003",
    client: "Pacific Paws Pet Care",
    contactName: "Jenny Lau",
    contactEmail: "jenny@pacificpaws.co",
    product: "Gingr",
    vertical: "Pet Care",
    memberCount: 0,
    adminCount: 3,
    stage: 1,
    stageLabel: "Configuration",
    status: "on-track",
    risk: "low",
    startDate: "2026-02-24",
    goLiveDate: "2026-06-14",
    checklistComplete: 2,
    checklistTotal: 6,
    aiChecklist: null,
  },
  {
    id: "IMPL-004",
    client: "Northeast Association Council",
    contactName: "Sandra Yee",
    contactEmail: "sandra@neac.org",
    product: "GlueUp",
    vertical: "Associations",
    memberCount: 1200,
    adminCount: 14,
    stage: 4,
    stageLabel: "Go-live — final checks",
    status: "on-track",
    risk: "low",
    startDate: "2025-11-17",
    goLiveDate: "2026-05-12",
    checklistComplete: 6,
    checklistTotal: 7,
    aiChecklist: null,
  },
  {
    id: "IMPL-005",
    client: "Sunshine Gym Network",
    contactName: "Carlos Mendez",
    contactEmail: "carlos@sunshinefit.com",
    product: "Zen Planner",
    vertical: "Gyms",
    memberCount: 820,
    adminCount: 5,
    stage: 1,
    stageLabel: "Configuration",
    status: "on-track",
    risk: "low",
    startDate: "2026-03-10",
    goLiveDate: "2026-06-28",
    checklistComplete: 2,
    checklistTotal: 6,
    aiChecklist: null,
  },
  {
    id: "IMPL-006",
    client: "Blue Ridge Camp Alliance",
    contactName: "Mark Saunders",
    contactEmail: "mark@blueridgealliance.org",
    product: "CampBrain",
    vertical: "Camps",
    memberCount: 310,
    adminCount: 4,
    stage: 0,
    stageLabel: "Discovery",
    status: "on-track",
    risk: "low",
    startDate: "2026-04-07",
    goLiveDate: "2026-07-15",
    checklistComplete: 1,
    checklistTotal: 6,
    aiChecklist: null,
  },
  {
    id: "IMPL-007",
    client: "Metro Food Bank Coalition",
    contactName: "Tanya Brooks",
    contactEmail: "tanya@metrofoodbank.org",
    product: "Neon CRM",
    vertical: "Nonprofits",
    memberCount: 95,
    adminCount: 6,
    stage: 4,
    stageLabel: "Complete",
    status: "complete",
    risk: "low",
    startDate: "2025-11-03",
    goLiveDate: "2026-04-01",
    checklistComplete: 7,
    checklistTotal: 7,
    aiChecklist: null,
  },
  {
    id: "IMPL-008",
    client: "Capital Dance Academy",
    contactName: "Priya Kapoor",
    contactEmail: "priya@capitaldance.com",
    product: "Zen Planner",
    vertical: "Gyms",
    memberCount: 260,
    adminCount: 3,
    stage: 2,
    stageLabel: "Data Migration — stalled",
    status: "at-risk",
    risk: "high",
    startDate: "2026-03-01",
    goLiveDate: "2026-05-18",
    checklistComplete: 2,
    checklistTotal: 6,
    aiChecklist: null,
  },
];

export default mockImplementations;
```

---

### `src/data/mockTasks.js`

```js
const mockTasks = [
  {
    id: "TASK-001",
    name: "Payroll processing — May cycle",
    type: "payroll",
    icon: "payroll",
    clientCount: 6,
    totalValue: "$248,400",
    description: "Monthly payroll run for 6 managed clients across camps and associations verticals.",
    dueDate: "2026-05-15",
    status: "auto-complete",
    automationRate: 100,
    lastRun: "2026-05-09T09:41:00Z",
    nextRun: "2026-06-09T09:00:00Z",
    exception: null,
  },
  {
    id: "TASK-002",
    name: "Monthly invoicing run — May",
    type: "billing",
    icon: "billing",
    clientCount: 47,
    totalValue: "$31,280",
    description: "Claude generating invoice summaries and sending to billing contacts for all 47 managed clients.",
    dueDate: "2026-05-10",
    status: "running",
    automationRate: 97,
    lastRun: "2026-04-10T08:15:00Z",
    nextRun: null,
    exception: null,
  },
  {
    id: "TASK-003",
    name: "Q2 tax reconciliation",
    type: "tax",
    icon: "tax",
    clientCount: 12,
    totalValue: null,
    description: "Quarterly tax reconciliation for 12 nonprofit managed clients. Includes IRS Form 990 preparation data.",
    dueDate: "2026-05-31",
    status: "needs-review",
    automationRate: 78,
    lastRun: "2026-05-08T14:30:00Z",
    nextRun: "2026-08-31T09:00:00Z",
    exception: {
      severity: "high",
      message: "Summit Camp Group: payroll total ($248,400) does not match invoice records ($247,160). Discrepancy of $1,240 flagged by Claude. Manual review required before filing.",
    },
  },
  {
    id: "TASK-004",
    name: "Donation receipt generation — April",
    type: "donations",
    icon: "donations",
    clientCount: 9,
    totalValue: "$184,200",
    description: "Auto-generated tax receipts for 1,240 individual donations across 9 nonprofit clients. Sent via email.",
    dueDate: "2026-05-05",
    status: "auto-complete",
    automationRate: 100,
    lastRun: "2026-05-01T07:00:00Z",
    nextRun: "2026-06-01T07:00:00Z",
    exception: null,
  },
  {
    id: "TASK-005",
    name: "Member data backup — weekly",
    type: "migration",
    icon: "migration",
    clientCount: 47,
    totalValue: null,
    description: "Weekly encrypted backup of all managed client member records to cold storage. Includes audit log export.",
    dueDate: "2026-05-09",
    status: "auto-complete",
    automationRate: 100,
    lastRun: "2026-05-08T23:00:00Z",
    nextRun: "2026-05-15T23:00:00Z",
    exception: null,
  },
  {
    id: "TASK-006",
    name: "Platform configuration sync — monthly",
    type: "comms",
    icon: "comms",
    clientCount: 47,
    totalValue: null,
    description: "Syncs Monday.com board statuses, open task assignments, and SLA tracking data across all managed client boards.",
    dueDate: "2026-05-15",
    status: "scheduled",
    automationRate: 91,
    lastRun: "2026-04-15T10:00:00Z",
    nextRun: "2026-05-15T10:00:00Z",
    exception: null,
  },
];

export default mockTasks;
```

---

### Analytics seed data (`src/data/analyticsHistory.js`)

This file provides the last-7-days chart data hardcoded so the bar chart always renders correctly even before any tickets are analysed.

```js
export const weeklyTicketHistory = [
  { day: "Mon", label: "May 4", total: 8, resolved: 5 },
  { day: "Tue", label: "May 5", total: 6, resolved: 4 },
  { day: "Wed", label: "May 6", total: 11, resolved: 7 },
  { day: "Thu", label: "May 7", total: 9, resolved: 6 },
  { day: "Fri", label: "May 8", total: 7, resolved: 5 },
  { day: "Sat", label: "May 9", total: 3, resolved: 0 },
  { day: "Sun", label: "May 10", total: 0, resolved: 0 },
];

export const hoursBaseline = {
  payrollTasksComplete: 4,
  invoiceTasksComplete: 1,
  donationTasksComplete: 1,
  articlesGenerated: 0,
  ticketsAutoResolved: 0,
};

// Minutes saved per automated unit
export const savingsRates = {
  perAutoResolvedTicket: 8,
  perAutoCompletePayrollTask: 90,
  perAutoCompleteInvoiceTask: 45,
  perAutoCompleteDonationTask: 30,
  perGeneratedArticle: 30,
};
```

---

## Step 3 — Claude API utility

### `src/utils/claudeApi.js`

```js
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export async function callClaude(systemPrompt, userMessage) {
  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Claude API call failed");
  }

  const data = await response.json();
  return data.content[0].text;
}
```

Create a `.env` file at the project root:
```
VITE_CLAUDE_API_KEY=your_api_key_here
```

Add `.env` to `.gitignore`.

---

## Step 4 — Prompts

### `src/utils/prompts.js`

Create two prompts: one for analysis, one for response generation. Both must instruct Claude to respond **only in valid JSON** with no preamble or markdown fences.

#### Triage analysis prompt

```js
export const TRIAGE_SYSTEM_PROMPT = `
You are a support ticket triage AI for Togetherwork, a SaaS company serving member-based organizations including camps, associations, nonprofits, gyms, and pet care businesses.

Analyze the support ticket provided and return ONLY a valid JSON object with this exact structure:

{
  "category": string,           // One of: "Billing & Payments" | "Technical Issue" | "Account Access" | "Data & Reporting" | "Feature Request" | "API & Integrations" | "General Inquiry"
  "sentiment": string,          // One of: "positive" | "neutral" | "frustrated" | "angry"
  "sentimentScore": number,     // 1 (very negative) to 5 (very positive)
  "urgency": string,            // One of: "low" | "medium" | "high" | "critical"
  "churnRisk": boolean,         // true if the customer seems at risk of leaving
  "churnRiskReason": string,    // Brief explanation if churnRisk is true, else empty string
  "routingDecision": string,    // One of: "auto-resolve" | "escalate"
  "routingReason": string,      // One sentence explaining why
  "confidence": number,         // 0.0 to 1.0 — how confident you are in the auto-resolve decision
  "suggestedKBArticles": array  // Up to 3 knowledge base article titles most relevant to this ticket
}

Routing rules:
- Auto-resolve if: routine how-to, password reset, simple billing question, confidence > 0.75
- Escalate if: payment failure with urgency high/critical, angry sentiment, churnRisk true, technical error requiring engineering, or confidence < 0.6

Return ONLY the JSON object. No explanation, no markdown.
`;

export function buildTriageUserMessage(ticket, knowledgeBase) {
  return `
Ticket ID: ${ticket.id}
Brand: ${ticket.brand}
Vertical: ${ticket.vertical}
From: ${ticket.sender} <${ticket.email}>
Subject: ${ticket.subject}
Body: ${ticket.body}

Available knowledge base articles:
${knowledgeBase.map(a => `- ${a.title} (${a.category})`).join("\n")}
  `;
}
```

#### Response generation prompt

```js
export const RESPONSE_SYSTEM_PROMPT = `
You are a friendly, professional support agent for Togetherwork. Write a support email response to the customer based on the ticket and triage analysis provided.

Return ONLY a valid JSON object with this exact structure:

{
  "subject": string,          // Reply subject line
  "greeting": string,         // Personalised opening e.g. "Hi Sarah,"
  "body": string,             // Main response body — helpful, empathetic, concise. Use \\n for line breaks.
  "closing": string,          // Professional closing e.g. "Best regards,\\nTogetherwork Support Team"
  "actionItems": array,       // Up to 3 specific next steps as short strings, if applicable
  "escalationNote": string    // If escalating, a brief internal note for the human agent. Else empty string.
}

Tone guidelines:
- Empathetic and human — never robotic
- Acknowledge frustration if sentiment is frustrated or angry
- Be specific — reference their actual issue, not generic boilerplate
- If auto-resolving: provide clear step-by-step instructions
- If escalating: reassure the customer and set clear expectations on next steps

Return ONLY the JSON. No markdown, no explanation.
`;

export function buildResponseUserMessage(ticket, analysis) {
  return `
Ticket: ${ticket.subject}
Customer: ${ticket.sender}
Body: ${ticket.body}

Triage analysis:
- Category: ${analysis.category}
- Sentiment: ${analysis.sentiment}
- Urgency: ${analysis.urgency}
- Churn risk: ${analysis.churnRisk}
- Routing decision: ${analysis.routingDecision}
- Routing reason: ${analysis.routingReason}
  `;
}
```

---

## Step 5 — App layout, navigation, and state

### `src/App.jsx`

The root component manages all global state and page routing. It renders a fixed left nav and a main content area that swaps pages based on `activePage`.

**Layout structure:**
```
<div class="app">               // full viewport, flex column
  <Topbar />                    // 46px fixed top, navy
  <div class="body">            // flex row, fills remaining height
    <LeftNav />                 // 188px fixed left, navy
    <main>                      // flex 1, renders active page
      {activePage === 'support' && <SupportPage />}
      {activePage === 'implementations' && <ImplementationsPage />}
      {activePage === 'knowledge' && <KnowledgeBasePage />}
      {activePage === 'managed' && <ManagedServicesPage />}
      {activePage === 'analytics' && <AnalyticsPage />}
    </main>
  </div>
</div>
```

**Global state shape:**
```js
const [activePage, setActivePage] = useState('support');

// Support page state
const [tickets, setTickets] = useState(mockTickets);
const [selectedTicketId, setSelectedTicketId] = useState(null);
const [analyses, setAnalyses] = useState({});
const [responses, setResponses] = useState({});
const [loadingTickets, setLoadingTickets] = useState({});

// Implementations page state
const [implementations, setImplementations] = useState(mockImplementations);
const [implChecklists, setImplChecklists] = useState({});   // keyed by impl.id
const [loadingImpl, setLoadingImpl] = useState({});

// Knowledge base state
const [articles, setArticles] = useState(knowledgeBase);
const [generatingArticle, setGeneratingArticle] = useState(null); // gap id
const [generatedArticles, setGeneratedArticles] = useState({});   // keyed by gap id

// Managed services state
const [tasks, setTasks] = useState(mockTasks);
const [runningTask, setRunningTask] = useState(null);
```

Pass all relevant state slices and handlers as props to each page component. Keep state global so the Analytics page can read live totals from all pages.

### `src/components/layout/LeftNav.jsx`

Fixed left sidebar (188px wide, navy background). Nav items:
- Section header "Customer Support" → Support inbox (badge: count of open tickets)
- Section header "Professional Services" → Implementations (badge: count of at-risk)
- Section header "Knowledge" → Knowledge base
- Section header "Managed Services" → Automation tasks (badge: count of exceptions)
- Section header "Reporting" → Analytics

Active item: `background: #1A56DB`, white text. Inactive: `color: #94A3B8`, hover `background: #1E3A5F`.

### `src/components/layout/Topbar.jsx`

48px top bar, navy. Left: TW logo mark + "Operations Intelligence · Togetherwork". Right: pulsing green live badge + Reset demo button. The Reset demo button calls a `onReset` prop that clears all `analyses`, `responses`, `implChecklists`, `generatedArticles`, resets all ticket/task statuses, and navigates back to the support page.

---

## Step 6 — Header component

### `src/components/Header.jsx`

A slim top bar showing:
- Togetherwork logo (text-based: "TW" monogram in navy + "Support Intelligence" label)
- A status badge: "Claude Sonnet 4 · Live" with a pulsing green dot
- A simple tab switcher: "Inbox" | "Metrics"

Pass `activeTab` and `setActiveTab` as props.

---

## Step 7 — Ticket inbox

### `src/components/TicketInbox.jsx`

Renders a scrollable list of `TicketCard` components. Props: `tickets`, `selectedTicketId`, `onSelect`.

Add a simple filter bar at the top with buttons: All | Open | Auto-Resolved | Escalated. Filter state is local to this component.

Show a count badge next to each filter label.

### `src/components/TicketCard.jsx`

Each card shows:
- Brand name + vertical as a small pill (colour-coded by vertical: camps=blue, associations=purple, nonprofits=teal, pet care=amber, gyms=coral)
- Sender name + truncated subject line
- Relative timestamp (e.g. "2h ago")
- Status badge: Open (gray) | Auto-Resolved (green) | Escalated (red) | Analysing... (animated pulse)
- Sentiment icon if analysis exists: a small coloured dot (green=positive/neutral, amber=frustrated, red=angry)

Highlight the selected card with a left border accent and light background.

---

## Step 8 — Ticket detail

### `src/components/TicketDetail.jsx`

The right panel. Shows:
- Ticket header: subject, sender email, brand/vertical pills, timestamp, priority badge
- Full ticket body in a clean reading card
- If `loading[ticketId]` is true: a skeleton loading state with the label "Claude is analysing this ticket..."
- If analysis exists: renders `AnalysisPanel` and `ResponseDraft` side by side (or stacked on narrow viewports)
- If no ticket selected: a centred empty state with a subtle illustration placeholder and text "Select a ticket to begin analysis"

---

## Step 9 — Analysis panel

### `src/components/AnalysisPanel.jsx`

Props: `analysis`, `ticket`

Renders the Claude triage output in a structured card:

**Top section — key signals (2x2 grid):**
- Category (with icon)
- Urgency level (colour-coded badge: low=gray, medium=amber, high=orange, critical=red)
- Sentiment (with score bar, 1–5)
- Confidence score (circular progress indicator or progress bar, colour-coded: green >0.8, amber 0.6–0.8, red <0.6)

**Routing decision section:**
- Large badge: "Auto-Resolve" (green) or "Escalate to Human" (red)
- Routing reason text below

**Churn risk section (only if churnRisk is true):**
- A prominent amber warning banner with a flag icon and the churnRiskReason text

**Knowledge base section:**
- Renders `KnowledgeBasePanel` inline

---

## Step 10 — Knowledge base panel

### `src/components/KnowledgeBasePanel.jsx`

Props: `suggestedArticleTitles`, `knowledgeBase`

Matches the titles from Claude's analysis against the full knowledge base data. Renders each matched article as a compact card showing title, category tag, and a "View article" link (href="#").

---

## Step 11 — Response draft

### `src/components/ResponseDraft.jsx`

Props: `response`, `ticketId`, `routingDecision`, `onApprove`, `onEscalate`, `onUpdate`

Renders the Claude-generated email draft:
- Email preview card showing subject, greeting, body (with line breaks rendered), closing
- Action items list (if present) — rendered as numbered steps
- An "Edit response" toggle that converts the body into a `<textarea>` for inline editing

**Action buttons at the bottom:**
- If routingDecision is "auto-resolve":
  - Primary button: "Approve & Send" (green, with send icon) — calls `onApprove`
  - Secondary button: "Escalate Instead" (outline, red) — calls `onEscalate`
- If routingDecision is "escalate":
  - Primary button: "Confirm Escalation" (red) — calls `onEscalate`
  - Secondary button: "Override & Auto-Resolve" (outline, green) — calls `onApprove`

If `escalationNote` is present, show it in a dimmed internal note box above the buttons labelled "Internal note for agent".

---

## Step 12 — Metrics dashboard

### `src/components/MetricsDashboard.jsx`

Props: `tickets`, `analyses`

Only show tickets that have been analysed. Renders:

**Top row — 4 stat cards:**
- Total tickets processed (count of tickets with analysis)
- Deflection rate — percentage with routingDecision "auto-resolve" and status "auto-resolved"
- Avg confidence score — mean of all confidence scores, shown as percentage
- Churn risk tickets — count of tickets where churnRisk is true

**Category breakdown:**
- A simple horizontal bar chart built with plain divs (no chart library needed). One bar per category. Bar width proportional to count. Use Tailwind colour classes.

**Sentiment distribution:**
- Four small pill counters side by side: Positive, Neutral, Frustrated, Angry — each with a count and percentage

**Recent activity feed:**
- Last 5 processed tickets listed with outcome (auto-resolved or escalated), confidence score, and time.

---

## Step 13 — Loading and error states

Throughout the app, handle these states explicitly:

- **Analysing state**: When `loading[ticketId]` is true, show an animated skeleton in the right panel. Display the message: "Claude is reading this ticket..." followed by "Generating response draft..." after 2 seconds.
- **API error state**: If the Claude call fails, show an error card with the message and a "Retry" button that re-triggers the analysis.
- **Empty inbox**: If no tickets match the active filter, show a small empty state message.
- **No API key**: On app load, check for `VITE_CLAUDE_API_KEY`. If missing, show a full-screen warning card with setup instructions rather than crashing silently.

---

## Step 14 — Visual design details

Follow these design rules precisely to make the app look polished:

- **Colour palette**: Navy `#0F1F3D` for headings and key UI chrome. Blue `#1A56DB` for primary actions. Teal `#0E9F6E` for success/auto-resolve states. Amber `#D97706` for warnings. Red `#E02424` for escalation/churn risk. Light gray `#F9FAFB` for background.
- **Vertical colour coding** (use consistently across all components):
  - Camps: blue
  - Associations: purple
  - Nonprofits: teal
  - Pet Care: amber
  - Gyms/Wellness: coral/orange
- **Typography**: DM Sans for all body text. DM Mono for ticket IDs, confidence scores, and badge labels. No font sizes below 11px.
- **Spacing**: Use Tailwind's spacing scale consistently. Cards have `p-4` internal padding. Sections separated by `gap-4` or `gap-6`.
- **Borders**: Subtle `border border-gray-100` on cards. No heavy shadows. Selected states use a `border-l-4` left accent.
- **Animations**: Add a CSS pulse animation to the green "live" indicator in the header. Add a subtle fade-in (`opacity-0 → opacity-100` over 200ms) when analysis results appear.
- **Confidence bar**: Render as a thin horizontal bar (h-1.5, rounded) coloured green/amber/red based on value.

---

## Step 15 — Final wiring and cleanup (all pages)

1. In `App.jsx`, import all components, mock data files, and wire all props and handlers to each page.
2. Ticket analysis: selecting a ticket triggers a Claude call only if not already in `analyses` cache.
3. Implementation detail: expanding a row triggers a Claude call only if not already in `implChecklists` cache.
4. KB article generation: clicking Generate on a gap triggers a Claude call only if `generatedArticles[gap.id]` is empty.
5. Test all 5 pages in sequence. Verify that actions on one page visibly update the Analytics page stats.
6. The Reset demo button must clear: `analyses`, `responses`, `implChecklists`, `generatedArticles`, reset all ticket statuses to "open", reset all task statuses to original mock values, and navigate to the Support page.
7. Run through the full demo flow before the interview: open a ticket → approve it → check analytics updated → generate a KB article → check coverage score updated → expand an implementation → view the checklist.
8. No unhandled promise rejections or missing React key warnings in the browser console.

---

## Step 16 — New page implementations tracker

### `src/data/mockImplementations.js`

This file is fully defined in Step 2. Import it directly — do not recreate it. The 8 implementations are already populated with realistic client names, products, stages, and dates. IMPL-002 (Summit Camp Group) and IMPL-008 (Capital Dance Academy) are pre-set as at-risk with past-due go-live dates. IMPL-007 (Metro Food Bank Coalition) is pre-set as complete.

### `src/components/implementations/ImplementationsPage.jsx`

Top metrics strip (4 stat cards): Active implementations, On track (green), At risk (amber), Average completion %.

Filter toolbar with pills: All | On track | At risk | Stalled.

Table columns: Client (name + member count sub-label), Product (brand pill), Stage progress (5-dot track + label), AI status, Risk badge, Go-live date, View link.

Stage progress: 5 coloured dots in a row. Done = `#0E9F6E`, Active = `#1A56DB` with pulse, Future = `#E2E8F0`. If at-risk, label text is amber.

Clicking "View →" expands `ImplementationDetail` below the table row — not a modal.

### `src/components/implementations/ImplementationDetail.jsx`

On first expand, calls Claude with the implementation record. System prompt instructs Claude to return JSON:

```js
{
  "checklistItems": [{ "id": 1, "task": string, "complete": boolean, "notes": string }],
  "blockers": [{ "severity": "low"|"medium"|"high", "description": string }],
  "configDoc": string,
  "nextAction": string
}
```

Render: checklist with toggleable checkboxes, blocker cards (only if blockers exist), config doc in a scrollable card, next action in a highlighted banner, and a Copy config doc button.

Add `IMPL_SYSTEM_PROMPT` and `buildImplUserMessage(implementation)` to `src/utils/prompts.js`.

---

## Step 17 — New page knowledge base

### Extended `src/data/knowledgeBase.js`

Add a `documentationGaps` export array alongside articles:

```js
export const documentationGaps = [
  {
    id: "GAP-001",
    title: "Multi-location payroll setup",
    category: "Managed Services",
    ticketCount: 23,
    brands: ["CampBrain", "Neon CRM"],
    generatedContent: null,
  },
  // 10 more gaps covering: data import/export, donation embed, API rate limits,
  // bulk member management, event registration troubleshooting, etc.
];
```

### `src/components/knowledge/KnowledgeBasePage.jsx`

Top metrics strip: Total articles, AI-generated count, Coverage score (amber if below 75%), Gaps detected (red).

Two-column layout:

Left card — Documentation gaps sorted by ticketCount descending. Each row: large red count, gap title, category tag, Generate button. On click, sets `generatingArticle` and calls Claude.

Right card — Category coverage horizontal bar chart (plain divs). Green if over 80%, amber 60–80%, red below 60%. Below chart: recently generated articles list.

The initial coverage percentages to hardcode per category (from the gap data in Step 2):

```js
const coverageData = [
  { category: "Billing & Payments",   coverage: 88 },
  { category: "Account Access",       coverage: 95 },
  { category: "Data & Reporting",     coverage: 61 },
  { category: "API & Integrations",   coverage: 42 },
  { category: "Onboarding",           coverage: 74 },
  { category: "Managed Services",     coverage: 55 },
];
```

Each time an article is generated for a gap in that category, increment the coverage by 5 (capped at 100). This gives visible feedback in the demo.

Add `KB_ARTICLE_SYSTEM_PROMPT` to prompts.js. Claude returns JSON: `{ title, category, summary, body, relatedArticles }`.

After generation, store in `generatedArticles[gap.id]`. Replace the Generate button with "View article". Coverage score recalculates based on gaps remaining.

---

## Step 18 — New page managed services automation

### `src/data/mockTasks.js`

This file is fully defined in Step 2. Import it directly — do not recreate it. The 6 tasks are already populated with realistic names, client counts, values, and timestamps. TASK-002 (Monthly invoicing) starts with status "running". TASK-003 (Q2 tax reconciliation) has a non-null exception with a $1,240 discrepancy message. TASK-006 (Platform configuration sync) has status "scheduled" — this is the task the Run workflow button will trigger.

### `src/components/managed/ManagedServicesPage.jsx`

Top metrics strip: Tasks automated (%), Hours saved, Exceptions flagged (red), Last run timestamp.

Two-column layout:

Left card — Recurring task queue. Each task row: icon, name, meta description, status badge. Status badges: auto-complete (green), running (blue + pulse), needs-review (amber), scheduled (gray). Exception banner renders below any task with a non-null exception.

Right card — Automation health bar chart (last 30 days). One bar per task type. Below: Monday.com sync status as a live pulsing indicator row.

Run workflow button: picks the first "scheduled" task, sets it to "running", waits 2 seconds, then sets to "auto-complete" with updated lastRun. Pure UI simulation — no Claude call.

---

## Step 19 — New page analytics

### `src/components/analytics/AnalyticsPage.jsx`

All numbers derive from live state passed as props. Stats must visibly change as the user takes actions on other pages.

Top metrics strip:
- Total AI actions: count of analysed tickets + count of generated articles + count of impl checklists with aiChecklist not null
- Deflection rate: auto-resolved tickets / total tickets (green, show +delta vs baseline)
- Hours saved: computed using `savingsRates` from `analyticsHistory.js` — `(autoResolvedTickets × 8) + (autoCompletePayroll × 90) + (autoCompleteInvoice × 45) + (autoCompleteDonations × 30) + (generatedArticles × 30)`, displayed as hours rounded to 1 decimal
- Churn prevented: count of tickets where analysis shows `churnRisk === true` and ticket status is `auto-resolved`

Ticket volume chart: use `weeklyTicketHistory` from `analyticsHistory.js` as the base. Each of the 7 entries maps to one bar group (day label + total + resolved). Built with plain divs — no chart library. Blue portion = total, green overlay = resolved, sized proportionally.

Bottom two columns:

Left — Sentiment distribution 2×2 grid. Counts come from the `analyses` object in state — tally each `sentiment` value. Show percentage of analysed tickets. If no tickets have been analysed yet, show 0% across all four cells.

Right — Top ticket categories horizontal bars. Tally `category` values from the `analyses` object. Show top 5 by count with bars coloured per vertical mapping from the design spec.

**Important:** add `analyticsHistory.js` to the import list in `App.jsx`. Pass `weeklyTicketHistory` and `savingsRates` as props to `AnalyticsPage`.

---

## API key setup note for the demo

For the interview demo, the API key is passed via the `.env` file locally. The app should include a visible but unobtrusive note in the UI footer: "Demo mode · Powered by Claude Sonnet 4 · Togetherwork Support Intelligence Prototype"

Do NOT hardcode the API key anywhere in the source files.

---

---

## Design theme and visual spec

### Aesthetic direction

**Industrial precision meets enterprise clarity.** This is a tool that ops teams and support leads will use under pressure. The design should feel fast, confident, and information-dense without being cluttered. Think Bloomberg terminal meets modern SaaS — dark navy chrome anchoring clean white content surfaces, with sharp colour-coded signal badges doing the work that paragraphs of text would otherwise require.

No gradients. No decorative illustration. No rounded hero sections. Every element earns its place by carrying information.

---

### Colour palette (use exactly these hex values)

```css
:root {
  /* Core */
  --navy:       #0F1F3D;   /* topbar, headings, logo */
  --blue:       #1A56DB;   /* primary actions, links, selected states */
  --lightblue:  #EBF5FF;   /* selected ticket bg, info fills */
  --bg:         #F8FAFC;   /* app background, signal grid cells */
  --white:      #FFFFFF;   /* cards, sidebar, header */

  /* Status */
  --green:      #0E9F6E;   /* auto-resolved, approved, positive sentiment */
  --amber:      #D97706;   /* warnings, frustrated sentiment, medium urgency */
  --red:        #E02424;   /* escalated, churn risk, angry, critical urgency */
  --gray:       #94A3B8;   /* open/unanalysed status dots, timestamps */

  /* Vertical brand colours */
  --camp-bg:    #DBEAFE;  --camp-text:   #1E40AF;   /* Camps */
  --assoc-bg:   #EDE9FE;  --assoc-text:  #5B21B6;   /* Associations */
  --np-bg:      #CCFBF1;  --np-text:     #0F766E;   /* Nonprofits */
  --pet-bg:     #FEF3C7;  --pet-text:    #92400E;   /* Pet Care */
  --gym-bg:     #FFEDD5;  --gym-text:    #C2410C;   /* Gyms/Wellness */

  /* Borders */
  --border:     #E2E8F0;   /* standard card borders */
  --border-light: #F1F5F9; /* subtle dividers inside cards */

  /* Text */
  --text-primary:   #0F1F3D;
  --text-secondary: #334155;
  --text-muted:     #64748B;
  --text-faint:     #94A3B8;
}
```

---

### Typography

```css
/* Load in index.html <head> */
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Use case | Font | Size | Weight |
|---|---|---|---|
| App body, labels | DM Sans | 13–14px | 400 |
| Card headings, subjects | DM Sans | 13–15px | 500 |
| Page-level headings | DM Sans | 16–18px | 500 |
| Ticket IDs, badge labels, mono values | DM Mono | 9–11px | 400–500 |
| Confidence scores, metrics | DM Mono | 18–22px | 600 |
| Section labels (uppercase) | DM Mono | 9–10px | 500, letter-spacing: 0.06em |

Never use font sizes below 9px. Never use font-weight 700 or above.

---

### Layout structure

```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR (48px) — navy background                        │
│  [TW logo] [Support Intelligence]    [live badge] [reset]│
├─────────────────────────────────────────────────────────┤
│  METRICS BAR (64px) — white, 4 stat cards side by side  │
├──────────────────┬──────────────────────────────────────┤
│                  │                                       │
│  TICKET INBOX    │  TICKET DETAIL PANEL                  │
│  (280px fixed)   │  (flex: 1)                            │
│                  │                                       │
│  - filter pills  │  - detail header (subject, meta)      │
│  - ticket cards  │  - ticket body card                   │
│                  │  - [analysis panel] [response panel]  │
│                  │    side by side in a 2-col grid        │
│                  │                                       │
└──────────────────┴──────────────────────────────────────┘
```

Total app height: 680px minimum. The sidebar and main content area should both scroll independently.

---

### Component-level design specs

#### Topbar
- Background: `--navy`
- Logo mark: 28×28px square, `--blue` background, 6px border-radius, white "TW" in DM Mono 11px
- Live badge: pulsing 6×6px green dot (`animation: pulse 2s infinite`, opacity 1→0.4) + "Claude Sonnet 4 · Live" in DM Mono 11px, color `--text-faint`
- Reset demo button: transparent background, 0.5px border `#334155`, DM Mono 11px, color `--text-faint`

#### Metrics bar
- 4 equal-width stat cards in a CSS grid
- Each card: `background: --bg`, border-radius 6px, padding 8px 10px
- Label: DM Mono 9px uppercase, color `--text-faint`
- Value: DM Mono 18–20px, weight 600
- Deflection rate value in `--green`. Churn risk value in `--amber`.
- Sub-label: DM Sans 9px, color `--text-muted`

#### Ticket cards (inbox)
- Default: transparent background, `border-left: 3px solid transparent`
- Hover: background `--bg`
- Selected: `background: --lightblue`, `border-left: 3px solid --blue`
- Status dot: 6×6px circle, left of brand pill
  - Open: `--gray`
  - Analysing: `--amber` with pulse animation
  - Auto-resolved: `--green`
  - Escalated: `--red`
- Brand pill: DM Mono 9px, 2px 7px padding, 10px border-radius, use vertical colour vars

#### Analysis panel (left half of bottom row)
- Signal grid: 2×2 CSS grid of `--bg` cells
- Confidence bar: 4px height, border-radius 2px, colour-coded
  - ≥0.80: `--green`
  - 0.60–0.79: `--amber`
  - <0.60: `--red`
- Routing decision block:
  - Auto-resolve: `background: #ECFDF5`, icon circle `--green`
  - Escalate: `background: #FFF5F5`, `border: 0.5px solid #FECACA`, icon circle `--red`
- Churn risk banner: `background: #FFFBEB`, `border: 0.5px solid #FCD34D`, amber text
- KB articles: compact list with 24×24px icon squares (`--lightblue` fill, `--blue` icon color)

#### Response draft panel (right half of bottom row)
- Email preview: `background: --bg`, border-radius 6px inside the card
- Action items: numbered list with DM Mono blue numbers
- Action buttons full-width at the bottom, stacked or side-by-side depending on routing decision:
  - Approve/confirm: solid fill (`--green` for approve, `--blue` for escalate confirm)
  - Secondary: transparent with matching coloured border

#### Loading / skeleton state
When `loading[ticketId]` is true, show two skeleton blocks in the analysis + response positions:
- Animated shimmer using CSS `@keyframes shimmer` (background-position shifting on a linear-gradient)
- Display text above the skeleton: "Claude is reading this ticket..." in DM Sans 13px, `--text-muted`

---

### Micro-interactions and animation

```css
/* Status dot pulse (analysing state) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* Analysis results fade in when Claude returns */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.analysis-result {
  animation: fadeIn 0.2s ease-out;
}

/* Skeleton shimmer */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton {
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}

/* Button press */
button:active {
  transform: scale(0.98);
}
```

---

### Cursor-specific instructions

When using Cursor to build this app, add the following comment at the top of `App.jsx`:

```jsx
// DESIGN SYSTEM NOTE FOR CURSOR:
// All colours come from CSS variables defined in index.css (see :root block).
// Never hardcode hex values in component files — always reference the variable.
// Font: DM Sans for all body text, DM Mono for IDs/badges/metrics.
// No shadows. No gradients. No border-radius above 12px.
// Status colours: green=auto-resolved, amber=analysing/warning, red=escalated/churn, gray=open.
```

---

## Definition of done

The app is complete when:

**Support inbox**
- [ ] All 10 mock tickets visible in inbox
- [ ] Selecting a ticket triggers a real Claude API call and shows triage analysis
- [ ] Analysis panel shows category, sentiment, urgency, confidence, routing decision
- [ ] Response draft shows a complete Claude-generated email reply
- [ ] Approve / Escalate / Edit actions update ticket status live

**Implementations tracker**
- [ ] All 8 mock implementations visible in the table with stage progress dots
- [ ] At-risk implementations highlighted with amber stage label and high risk badge
- [ ] Expanding a row triggers a Claude call and renders checklist, blockers, config doc
- [ ] Checklist items are toggleable

**Knowledge base**
- [ ] Documentation gaps displayed and sorted by ticket count
- [ ] Clicking Generate on a gap calls Claude and renders the full article
- [ ] Coverage score and AI-generated count update after each generation
- [ ] Category coverage bars reflect the gaps remaining

**Managed services**
- [ ] All 6 tasks visible with correct status badges
- [ ] Exception banner renders below the tax reconciliation task
- [ ] Run workflow button transitions a task from scheduled → running → auto-complete
- [ ] Monday.com sync indicator is visible and pulsing

**Analytics**
- [ ] All 4 stat cards show numbers derived from live state
- [ ] Approving a ticket on the Support page increases the deflection rate on Analytics
- [ ] Generating a KB article increases the AI actions count on Analytics
- [ ] Sentiment grid reflects actual sentiment values from ticket analyses

**Cross-cutting**
- [ ] Reset demo button clears all Claude-generated state across all pages
- [ ] Left nav badges update as tickets are resolved and exceptions are addressed
- [ ] No console errors or unhandled rejections during a full demo walkthrough
- [ ] App is visually polished enough to run as a live demo in a 30-minute interview
