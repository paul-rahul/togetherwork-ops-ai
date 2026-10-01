import { useMemo } from "react";
import { formatRelativeTime } from "../utils/formatRelativeTime.js";

const CATEGORY_BAR_COLORS = [
  "var(--blue)",
  "var(--green)",
  "var(--amber)",
  "var(--np-text)",
  "var(--assoc-text)",
  "var(--pet-text)",
  "var(--gym-text)",
];

function analysedTickets(tickets, analyses) {
  return tickets.filter((t) => analyses[t.id] != null);
}

function activityOutcome(ticket, analysis) {
  if (ticket.status === "auto-resolved") return "Auto-resolved";
  if (ticket.status === "escalated") return "Escalated";
  if (analysis?.routingDecision === "auto-resolve") return "Pending send";
  if (analysis?.routingDecision === "escalate") return "Pending escalation";
  return "Analysed";
}

export default function MetricsDashboard({ tickets, analyses }) {
  const processed = useMemo(() => analysedTickets(tickets, analyses), [tickets, analyses]);

  const stats = useMemo(() => {
    const n = processed.length;
    let deflected = 0;
    let confSum = 0;
    let churn = 0;
    for (const t of processed) {
      const a = analyses[t.id];
      if (a.routingDecision === "auto-resolve" && t.status === "auto-resolved") deflected += 1;
      if (typeof a.confidence === "number") confSum += a.confidence;
      if (a.churnRisk === true) churn += 1;
    }
    const deflectionPct = n > 0 ? Math.round((deflected / n) * 1000) / 10 : 0;
    const avgConfPct = n > 0 ? Math.round((confSum / n) * 1000) / 10 : 0;
    return {
      total: n,
      deflectionPct,
      avgConfPct,
      churn,
    };
  }, [processed, analyses]);

  const categoryCounts = useMemo(() => {
    const map = new Map();
    for (const t of processed) {
      const c = analyses[t.id]?.category ?? "Unknown";
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [processed, analyses]);

  const maxCategory = useMemo(() => {
    return categoryCounts.reduce((m, [, v]) => Math.max(m, v), 0) || 1;
  }, [categoryCounts]);

  const sentimentCounts = useMemo(() => {
    const keys = ["positive", "neutral", "frustrated", "angry"];
    const map = Object.fromEntries(keys.map((k) => [k, 0]));
    for (const t of processed) {
      const s = analyses[t.id]?.sentiment;
      if (s && map[s] != null) map[s] += 1;
    }
    return map;
  }, [processed, analyses]);

  const recent = useMemo(() => {
    return [...processed]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [processed]);

  const processedN = stats.total;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
          className="rounded-md border border-[var(--gray-100)] p-4"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Tickets processed
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--text-primary)]">{stats.total}</p>
          <p className="mt-0.5 font-sans text-[11px] text-[var(--text-muted)]">With triage analysis</p>
        </div>
        <div
          className="rounded-md border border-[var(--gray-100)] p-4"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Deflection rate
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--green)]">{stats.deflectionPct}%</p>
          <p className="mt-0.5 font-sans text-[11px] text-[var(--text-muted)]">Auto-resolve + sent</p>
        </div>
        <div
          className="rounded-md border border-[var(--gray-100)] p-4"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Avg confidence
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--text-primary)]">
            {stats.avgConfPct}%
          </p>
          <p className="mt-0.5 font-sans text-[11px] text-[var(--text-muted)]">Across analysed tickets</p>
        </div>
        <div
          className="rounded-md border border-[var(--gray-100)] p-4"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Churn risk
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--amber)]">{stats.churn}</p>
          <p className="mt-0.5 font-sans text-[11px] text-[var(--text-muted)]">Flagged in triage</p>
        </div>
      </div>

      {processedN === 0 ? (
        <p className="font-sans text-[13px] text-[var(--text-muted)]">
          Analyse tickets from the Inbox tab to populate metrics.
        </p>
      ) : (
        <>
          <section>
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Category breakdown
            </h3>
            <div className="mt-3 space-y-2 rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-4">
              {categoryCounts.map(([category, count], i) => (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between gap-2 font-sans text-[12px] text-[var(--text-secondary)]">
                    <span className="min-w-0 truncate">{category}</span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--text-muted)]">{count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-light)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(count / maxCategory) * 100}%`,
                        backgroundColor: CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Sentiment distribution
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {["positive", "neutral", "frustrated", "angry"].map((key) => {
                const count = sentimentCounts[key];
                const pct = processedN > 0 ? Math.round((count / processedN) * 1000) / 10 : 0;
                const label = key.charAt(0).toUpperCase() + key.slice(1);
                const border =
                  key === "positive" || key === "neutral"
                    ? "var(--green)"
                    : key === "frustrated"
                      ? "var(--amber)"
                      : "var(--red)";
                return (
                  <div
                    key={key}
                    className="rounded-full border px-3 py-1.5 font-sans text-[12px]"
                    style={{ borderColor: border, color: "var(--text-secondary)" }}
                  >
                    <span className="font-medium">{label}</span>{" "}
                    <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Recent activity
            </h3>
            <ul className="mt-3 space-y-2 rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-3">
              {recent.map((t) => {
                const a = analyses[t.id];
                const confPct =
                  typeof a.confidence === "number" ? Math.round(a.confidence * 1000) / 10 : "—";
                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-light)] py-2 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[11px] text-[var(--text-muted)]">{t.id}</p>
                      <p className="truncate font-sans text-[13px] font-medium text-[var(--text-primary)]">
                        {t.subject}
                      </p>
                    </div>
                    <div className="shrink-0 text-right font-sans text-[12px]">
                      <p
                        className="font-medium"
                        style={{
                          color:
                            activityOutcome(t, a) === "Auto-resolved"
                              ? "var(--green)"
                              : activityOutcome(t, a) === "Escalated"
                                ? "var(--red)"
                                : "var(--text-muted)",
                        }}
                      >
                        {activityOutcome(t, a)}
                      </p>
                      <p className="font-mono text-[11px] text-[var(--text-muted)]">
                        {confPct}% · {formatRelativeTime(t.timestamp)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
