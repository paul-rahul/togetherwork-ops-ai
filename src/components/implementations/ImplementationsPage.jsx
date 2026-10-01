import { Fragment, useCallback, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import ImplementationDetail from "./ImplementationDetail.jsx";

const verticalPillStyle = {
  Camps: { backgroundColor: "var(--camp-bg)", color: "var(--camp-text)" },
  Associations: { backgroundColor: "var(--assoc-bg)", color: "var(--assoc-text)" },
  Nonprofits: { backgroundColor: "var(--np-bg)", color: "var(--np-text)" },
  "Pet Care": { backgroundColor: "var(--pet-bg)", color: "var(--pet-text)" },
  Gyms: { backgroundColor: "var(--gym-bg)", color: "var(--gym-text)" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "on-track", label: "On track" },
  { id: "at-risk", label: "At risk" },
  { id: "stalled", label: "Stalled" },
];

function isStalledLabel(stageLabel) {
  const s = String(stageLabel ?? "").toLowerCase();
  return s.includes("stall") || s.includes("delay");
}

function formatGoLive(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StageDots({ implementation }) {
  const total = 5;
  const stage = Math.min(Math.max(Number(implementation.stage) || 0, 0), 4);
  const complete = implementation.status === "complete";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1" role="img" aria-label="Stage progress">
        {Array.from({ length: total }, (_, idx) => {
          let bg = "var(--stage-future)";
          let pulse = false;
          if (complete) {
            bg = "var(--green)";
          } else if (idx < stage) {
            bg = "var(--green)";
          } else if (idx === stage) {
            bg = "var(--blue)";
            pulse = true;
          }
          return (
            <span
              key={idx}
              className={`h-2 w-2 rounded-full ${pulse ? "tw-pulse-dot" : ""}`}
              style={{ backgroundColor: bg }}
            />
          );
        })}
      </div>
      <span
        className={`text-[11px] ${implementation.status === "at-risk" ? "text-[var(--amber)]" : "text-[var(--text-muted)]"}`}
      >
        {implementation.stageLabel}
      </span>
    </div>
  );
}

function aiStatusLabel(impl, implChecklists, loadingImpl) {
  if (loadingImpl?.[impl.id]) return "Generating…";
  if (implChecklists?.[impl.id]) return "Ready";
  return "Not run";
}

function riskBadgeClass(risk) {
  if (risk === "high") return "bg-[var(--routing-escalate-bg)] text-[var(--red)] border-[var(--routing-escalate-border)]";
  return "bg-[var(--border-light)] text-[var(--text-muted)] border-[var(--border)]";
}

function StatCardButton({ label, value, accentClass, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors hover:bg-[var(--bg)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ${
        selected
          ? "border-[var(--blue)] bg-[var(--lightblue)] ring-1 ring-[var(--blue)]"
          : "border-[var(--gray-100)] bg-[var(--white)]"
      } ${accentClass ?? ""}`}
    >
      <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-sans text-xl font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
    </button>
  );
}

export default function ImplementationsPage({
  implementations,
  implChecklists,
  loadingImpl,
  runImplementationChecklist,
  implChecklistErrors,
  onRetryImplChecklist,
  onChecklistItemsChange,
}) {
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const applyFilter = useCallback((id) => {
    setExpandedId(null);
    setFilter(id);
  }, []);

  const toggleImplRow = useCallback((implId) => {
    setExpandedId((id) => (id === implId ? null : implId));
  }, []);

  const activeList = useMemo(
    () => implementations.filter((i) => i.status !== "complete"),
    [implementations],
  );

  const metrics = useMemo(() => {
    const active = activeList.length;
    const onTrack = implementations.filter((i) => i.status === "on-track").length;
    const atRisk = implementations.filter((i) => i.status === "at-risk").length;
    const pctSum = activeList.reduce((acc, i) => {
      const t = i.checklistTotal || 1;
      return acc + (i.checklistComplete / t) * 100;
    }, 0);
    const avgPct = active ? Math.round(pctSum / active) : 0;
    return { active, onTrack, atRisk, avgPct };
  }, [implementations, activeList]);

  const filtered = useMemo(() => {
    return implementations.filter((i) => {
      if (filter === "all") return true;
      if (filter === "active") return i.status !== "complete";
      if (filter === "on-track") return i.status === "on-track";
      if (filter === "at-risk") return i.status === "at-risk";
      if (filter === "stalled") return isStalledLabel(i.stageLabel);
      return true;
    });
  }, [implementations, filter]);

  return (
    <div className="min-h-0 flex-1 overflow-auto p-6 font-sans text-sm text-[var(--text-primary)]">
      <header className="mb-4">
        <h1 className="text-base font-medium">Implementations</h1>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          PSA onboarding tracker · expand a row for AI checklist and config doc
        </p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCardButton
          label="Active implementations"
          value={metrics.active}
          selected={filter === "active"}
          onClick={() => applyFilter("active")}
        />
        <StatCardButton
          label="On track"
          value={metrics.onTrack}
          accentClass="border-l-[3px] border-l-[var(--green)]"
          selected={filter === "on-track"}
          onClick={() => applyFilter("on-track")}
        />
        <StatCardButton
          label="At risk"
          value={metrics.atRisk}
          accentClass="border-l-[3px] border-l-[var(--amber)]"
          selected={filter === "at-risk"}
          onClick={() => applyFilter("at-risk")}
        />
        <StatCardButton
          label="Average completion %"
          value={`${metrics.avgPct}%`}
          selected={filter === "all"}
          onClick={() => applyFilter("all")}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => applyFilter(f.id)}
            className={`rounded-full border px-3 py-1 font-mono text-[11px] font-medium ${
              filter === f.id
                ? "border-[var(--blue)] bg-[var(--lightblue)] text-[var(--blue)]"
                : "border-[var(--border)] bg-[var(--white)] text-[var(--text-muted)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--gray-100)] bg-[var(--white)]">
        <table className="w-full min-w-[880px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--gray-100)] font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Stage progress</th>
              <th className="px-3 py-2 font-medium">AI status</th>
              <th className="px-3 py-2 font-medium">Risk</th>
              <th className="px-3 py-2 font-medium">Go-live</th>
              <th className="px-3 py-2 font-medium text-right" scope="col">
                <span className="sr-only">Expand row</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((impl) => {
              const pill =
                verticalPillStyle[impl.vertical] ?? {
                  backgroundColor: "var(--border-light)",
                  color: "var(--text-muted)",
                };
              const expanded = expandedId === impl.id;
              return (
                <Fragment key={impl.id}>
                  <tr
                    tabIndex={0}
                    className={`cursor-pointer border-b border-[var(--gray-100)] last:border-b-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--blue)] ${
                      expanded ? "bg-[var(--lightblue)] ring-1 ring-inset ring-[var(--blue)]" : "hover:bg-[var(--bg)]"
                    }`}
                    onClick={() => toggleImplRow(impl.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleImplRow(impl.id);
                      }
                    }}
                    aria-expanded={expanded}
                    aria-controls={expanded ? `impl-detail-${impl.id}` : undefined}
                    aria-label={`${impl.client}, ${impl.product}. ${expanded ? "Expanded" : "Collapsed"}. Press Enter or Space to toggle details.`}
                  >
                    <td className="px-3 py-2 align-top">
                      <p className="font-medium text-[var(--text-primary)]">{impl.client}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        {impl.memberCount.toLocaleString()} members · {impl.adminCount} admins
                      </p>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span
                        className="inline-block max-w-[140px] truncate rounded px-2 py-0.5 font-mono text-[11px] font-medium"
                        style={pill}
                        title={impl.product}
                      >
                        {impl.product}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <StageDots implementation={impl} />
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-[11px] text-[var(--text-secondary)]">
                      {aiStatusLabel(impl, implChecklists, loadingImpl)}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 font-mono text-[11px] font-medium uppercase ${riskBadgeClass(impl.risk)}`}
                      >
                        {impl.risk}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-[11px] text-[var(--text-secondary)]">
                      {formatGoLive(impl.goLiveDate)}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <span className="pointer-events-none inline-flex items-center gap-0.5 font-mono text-[11px] font-medium text-[var(--blue)]" aria-hidden>
                        View
                        {expanded ? (
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </span>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="border-b border-[var(--gray-100)] bg-[var(--border-light)]">
                      <td id={`impl-detail-${impl.id}`} colSpan={7} className="p-0">
                        <ImplementationDetail
                          implementation={impl}
                          cached={implChecklists[impl.id]}
                          loading={Boolean(loadingImpl[impl.id])}
                          error={implChecklistErrors[impl.id]}
                          onRequestChecklist={runImplementationChecklist}
                          onRetryChecklist={onRetryImplChecklist}
                          onChecklistItemsChange={onChecklistItemsChange}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
