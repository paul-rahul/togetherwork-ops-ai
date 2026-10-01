/**
 * Regenerates src/data/mockTickets.js with exactly 353 tickets.
 * Preserves the first 10 handcrafted entries from the current file, then fills with deterministic mock rows.
 *
 * Run from repo root: node scripts/seed-mock-tickets.mjs
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const TOTAL = 353;
const HANDCRAFTED_COUNT = 10;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockTicketsPath = path.join(__dirname, "../src/data/mockTickets.js");

const { default: current } = await import(`${pathToFileURL(mockTicketsPath).href}?t=${Date.now()}`);
const handcrafted = current.slice(0, HANDCRAFTED_COUNT);

const PRESETS = [
  { brand: "CampBrain", vertical: "Camps" },
  { brand: "Zen Planner", vertical: "Gyms" },
  { brand: "Gingr", vertical: "Pet Care" },
  { brand: "Neon CRM", vertical: "Nonprofits" },
  { brand: "GlueUp", vertical: "Associations" },
];

const SUBJECT_LEADS = [
  "Billing discrepancy on last invoice",
  "Member portal login loop after SSO change",
  "Export to CSV missing several columns",
  "API rate limit lower than documented",
  "Mobile app crashes on checkout step",
  "Duplicate notifications for the same event",
  "Cannot assign staff to overlapping shifts",
  "Report scheduler stopped running last week",
  "Webhook deliveries failing with 500 errors",
  "Feature request: bulk archive for old records",
  "Timezone wrong on automated reminder emails",
  "Integration with QuickBooks disconnects nightly",
  "Permission error when opening shared dashboard",
  "Slow page load on registrations over 500 rows",
  "Refund request for accidental double charge",
  "Data import validation errors without line numbers",
  "Two-factor SMS codes delayed 10+ minutes",
  "Custom field not appearing on public form",
  "Search returns no results for known member name",
  "Need guidance on API authentication headers",
];

const PRIORITIES = ["critical", "high", "medium", "low"];

function padId(n) {
  return `TKT-${String(n).padStart(3, "0")}`;
}

function generateTicket(index) {
  const i = index - HANDCRAFTED_COUNT - 1;
  const { brand, vertical } = PRESETS[i % PRESETS.length];
  const subject = `${SUBJECT_LEADS[i % SUBJECT_LEADS.length]} (${brand})`;
  const sender = `Demo User ${index}`;
  const email = `support-seed-${index}@example.invalid`;
  const priority = PRIORITIES[i % PRIORITIES.length];
  const day = 1 + (i % 28);
  const month = 1 + (i % 12);
  const year = 2025 + (i % 2);
  const timestamp = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String((10 + (i % 8)) % 24).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}:00Z`;
  const body = `Hello Togetherwork Support,

This is seeded ticket ${padId(index)} for UI and load testing. Topic: ${subject}

We opened this from our ${vertical} (${brand}) environment. Please treat as non-production demo data.

Thanks,
${sender}`;

  return {
    id: padId(index),
    brand,
    vertical,
    sender,
    email,
    subject,
    body,
    timestamp,
    status: "open",
    priority,
  };
}

const generated = [];
for (let n = HANDCRAFTED_COUNT + 1; n <= TOTAL; n += 1) {
  generated.push(generateTicket(n));
}

const all = [...handcrafted, ...generated];

const fileBody = `const mockTickets = ${JSON.stringify(all, null, 2)};

export default mockTickets;
`;

writeFileSync(mockTicketsPath, fileBody, "utf8");
console.log(`Wrote ${all.length} tickets to ${path.relative(process.cwd(), mockTicketsPath)}`);
