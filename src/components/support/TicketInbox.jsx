import { useMemo, useState } from "react";
import TicketCard from "./TicketCard.jsx";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "auto-resolved", label: "Auto-Resolved" },
  { id: "escalated", label: "Escalated" },
];

const PRIORITIES = [
  { value: "", label: "All priorities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const selectClass =
  "w-full rounded-md border border-[var(--border)] bg-[var(--white)] px-2 py-1.5 font-sans text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)]";

function ticketMatchesSearch(ticket, raw) {
  const q = String(raw ?? "").trim().toLowerCase();
  if (!q) return true;
  const hay = [
    ticket.id,
    ticket.sender,
    ticket.email,
    ticket.subject,
    ticket.brand,
    ticket.vertical,
    ticket.body,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export default function TicketInbox({ tickets, selectedTicketId, onSelect, analyses, loadingTickets }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [vertical, setVertical] = useState("");
  const [priority, setPriority] = useState("");

  const brandOptions = useMemo(() => {
    const set = new Set(tickets.map((t) => t.brand).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  const verticalOptions = useMemo(() => {
    const set = new Set(tickets.map((t) => t.vertical).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  const counts = useMemo(() => {
    return {
      all: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      "auto-resolved": tickets.filter((t) => t.status === "auto-resolved").length,
      escalated: tickets.filter((t) => t.status === "escalated").length,
    };
  }, [tickets]);

  const filtered = useMemo(() => {
    let list = tickets;
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (brand) {
      list = list.filter((t) => t.brand === brand);
    }
    if (vertical) {
      list = list.filter((t) => t.vertical === vertical);
    }
    if (priority) {
      list = list.filter((t) => t.priority === priority);
    }
    if (search.trim()) {
      list = list.filter((t) => ticketMatchesSearch(t, search));
    }
    return list;
  }, [tickets, statusFilter, brand, vertical, priority, search]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--white)]">
      <div className="shrink-0 border-b border-[var(--border-light)] px-2 py-2">
        <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
          Support inbox
        </p>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 font-sans text-[12px] font-medium transition-colors active:scale-[0.98] ${
                statusFilter === id
                  ? "bg-[var(--lightblue)] text-[var(--blue)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
              }`}
            >
              <span>{label}</span>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--text-secondary)]">
                {counts[id]}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-2 border-t border-[var(--border-light)] pt-3">
          <label className="block">
            <span className="sr-only">Search tickets</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, sender, email…"
              className={`${selectClass} placeholder:text-[var(--text-muted)]`}
              aria-label="Search tickets"
            />
          </label>
          <div className="grid grid-cols-1 gap-2">
            <label className="block">
              <span className="mb-0.5 block font-mono text-[10px] font-medium uppercase tracking-wide text-[var(--text-faint)]">
                Brand
              </span>
              <select
                className={selectClass}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                aria-label="Filter by brand"
              >
                <option value="">All brands</option>
                {brandOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-0.5 block font-mono text-[10px] font-medium uppercase tracking-wide text-[var(--text-faint)]">
                Vertical
              </span>
              <select
                className={selectClass}
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                aria-label="Filter by vertical"
              >
                <option value="">All verticals</option>
                {verticalOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-0.5 block font-mono text-[10px] font-medium uppercase tracking-wide text-[var(--text-faint)]">
                Priority
              </span>
              <select
                className={selectClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                aria-label="Filter by priority"
              >
                {PRIORITIES.map(({ value, label }) => (
                  <option key={value || "all"} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
        {filtered.length === 0 ? (
          <p className="p-4 font-sans text-[13px] text-[var(--text-muted)]">No tickets match these filters.</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {filtered.map((ticket) => (
              <li key={ticket.id}>
                <TicketCard
                  ticket={ticket}
                  selected={selectedTicketId === ticket.id}
                  onSelect={onSelect}
                  analysis={analyses[ticket.id]}
                  analysing={Boolean(loadingTickets[ticket.id])}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
