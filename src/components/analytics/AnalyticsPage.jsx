import { useMemo } from "react";

const CATEGORY_COLORS = [
  "var(--blue)",
  "var(--green)",
  "var(--amber)",
  "var(--np-text)",
  "var(--assoc-text)",
];

function countGeneratedArticles(generatedArticles) {
  return Object.keys(generatedArticles ?? {}).filter((id) => generatedArticles[id] != null).length;
}

function implAiChecklistCount(implementations, implChecklists) {
  const ids = new Set();
  // Offline samples are rule-based, not AI output, so they are not counted.
  for (const i of implementations ?? []) {
    if (i?.aiChecklist != null && !i.aiChecklist.offline) ids.add(i.id);
  }
  for (const id of Object.keys(implChecklists ?? {})) {
    if (implChecklists[id] != null && !implChecklists[id].offline) ids.add(id);
  }
  return ids.size;
}

export default function AnalyticsPage({
  tickets,
  analyses,
  implementations,
  implChecklists,
  generatedArticles,
  tasks,
  weeklyTicketHistory,
  savingsRates,
  hoursBaseline,
}) {
  const analysedIds = useMemo(
    () => Object.keys(analyses ?? {}).filter((id) => !analyses[id]?.offline),
    [analyses],
  );
  const analysedN = analysedIds.length;

  const totalAiActions = useMemo(() => {
    return (
      analysedN +
      countGeneratedArticles(generatedArticles) +
      implAiChecklistCount(implementations, implChecklists)
    );
  }, [analysedN, generatedArticles, implementations, implChecklists]);

  const autoResolvedTickets = useMemo(
    () => (tickets ?? []).filter((t) => t.status === "auto-resolved").length,
    [tickets],
  );
  const totalTickets = (tickets ?? []).length;
  const deflectionPct =
    totalTickets > 0 ? Math.round((autoResolvedTickets / totalTickets) * 1000) / 10 : 0;
  const baselineResolved = hoursBaseline?.ticketsAutoResolved ?? 0;
  const baselineTotal = 10;
  const baselineDeflectionPct =
    baselineTotal > 0 ? Math.round((baselineResolved / baselineTotal) * 1000) / 10 : 0;
  const deflectionDelta = Math.round((deflectionPct - baselineDeflectionPct) * 10) / 10;

  const autoCompletePayroll = (tasks ?? []).filter((t) => t.type === "payroll" && t.status === "auto-complete").length;
  const autoCompleteInvoice = (tasks ?? []).filter((t) => t.type === "billing" && t.status === "auto-complete").length;
  const autoCompleteDonations = (tasks ?? []).filter((t) => t.type === "donations" && t.status === "auto-complete").length;
  const articlesGeneratedN = countGeneratedArticles(generatedArticles);

  const hoursSaved = useMemo(() => {
    const minutes =
      autoResolvedTickets * (savingsRates?.perAutoResolvedTicket ?? 0) +
      autoCompletePayroll * (savingsRates?.perAutoCompletePayrollTask ?? 0) +
      autoCompleteInvoice * (savingsRates?.perAutoCompleteInvoiceTask ?? 0) +
      autoCompleteDonations * (savingsRates?.perAutoCompleteDonationTask ?? 0) +
      articlesGeneratedN * (savingsRates?.perGeneratedArticle ?? 0);
    return Math.round((minutes / 60) * 10) / 10;
  }, [
    autoResolvedTickets,
    autoCompletePayroll,
    autoCompleteInvoice,
    autoCompleteDonations,
    articlesGeneratedN,
    savingsRates,
  ]);

  const churnPrevented = useMemo(() => {
    return (tickets ?? []).filter((t) => {
      const a = analyses?.[t.id];
      return a?.churnRisk === true && t.status === "auto-resolved";
    }).length;
  }, [tickets, analyses]);

  const sentimentCounts = useMemo(() => {
    const keys = ["positive", "neutral", "frustrated", "angry"];
    const map = Object.fromEntries(keys.map((k) => [k, 0]));
    for (const id of analysedIds) {
      const s = analyses[id]?.sentiment;
      if (s && map[s] != null) map[s] += 1;
    }
    return map;
  }, [analysedIds, analyses]);

  const topCategories = useMemo(() => {
    const map = new Map();
    for (const id of analysedIds) {
      const c = analyses[id]?.category ?? "Unknown";
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [analysedIds, analyses]);

  const maxCat = topCategories.reduce((m, [, v]) => Math.max(m, v), 0) || 1;
  const maxDayTotal = Math.max(...(weeklyTicketHistory ?? []).map((d) => d.total), 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-4">
      <h1 className="font-sans text-base font-medium text-[var(--text-primary)]">Analytics</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total AI actions" value={totalAiActions} sub="Analysed + articles + checklists" />
        <StatCard
          label="Deflection rate"
          value={`${deflectionPct}%`}
          sub={deflectionDelta >= 0 ? `+${deflectionDelta}% vs baseline` : `${deflectionDelta}% vs baseline`}
          valueColor="var(--green)"
        />
        <StatCard label="Hours saved" value={`${hoursSaved}h`} sub="From automation rates" />
        <StatCard label="Churn prevented" value={churnPrevented} sub="At-risk + auto-resolved" valueColor="var(--amber)" />
      </div>

      <section>
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
          Ticket volume (7 days)
        </h2>
        <div className="mt-3 flex h-44 gap-2 rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-4">
          {(weeklyTicketHistory ?? []).map((d) => {
            const totalPct = maxDayTotal > 0 ? (d.total / maxDayTotal) * 100 : 0;
            const resolvedFrac = d.total > 0 ? d.resolved / d.total : 0;
            return (
              <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div className="flex w-full max-w-[32px] flex-1 flex-col justify-end">
                  <div
                    className="relative w-full rounded-t bg-[var(--blue)]"
                    style={{
                      height: `${totalPct}%`,
                      minHeight: d.total ? "4px" : "0",
                    }}
                    title={`${d.label}: ${d.total} total, ${d.resolved} resolved`}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t bg-[var(--green)]"
                      style={{ height: `${resolvedFrac * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">{d.day}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-4">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Sentiment (analysed)
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["positive", "neutral", "frustrated", "angry"].map((key) => {
              const c = sentimentCounts[key];
              const pct = analysedN > 0 ? Math.round((c / analysedN) * 1000) / 10 : 0;
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <div key={key} className="rounded-md bg-[var(--bg)] p-3 text-center">
                  <p className="font-sans text-[12px] font-medium text-[var(--text-primary)]">{label}</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--text-primary)]">{c}</p>
                  <p className="font-mono text-[11px] text-[var(--text-muted)]">{pct}%</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-4">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Top categories
          </h2>
          <div className="mt-3 space-y-2">
            {topCategories.length === 0 ? (
              <p className="font-sans text-[13px] text-[var(--text-muted)]">No triage data yet.</p>
            ) : (
              topCategories.map(([cat, count], i) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between gap-2 font-sans text-[12px] text-[var(--text-secondary)]">
                    <span className="min-w-0 truncate">{cat}</span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--text-muted)]">{count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-light)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / maxCat) * 100}%`,
                        backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, valueColor }) {
  return (
    <div
      className="rounded-md border border-[var(--gray-100)] p-4"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums" style={{ color: valueColor ?? "var(--text-primary)" }}>
        {value}
      </p>
      {sub ? <p className="mt-0.5 font-sans text-[11px] text-[var(--text-muted)]">{sub}</p> : null}
    </div>
  );
}
