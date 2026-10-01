import { useCallback, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2, PlayCircle, Users } from "lucide-react";
import { formatRelativeTime } from "../../utils/formatRelativeTime.js";

function formatDue(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusLabel(status) {
  if (status === "auto-complete") return "Completed";
  if (status === "running") return "Running";
  if (status === "needs-review") return "Needs review";
  if (status === "scheduled") return "Scheduled";
  return status;
}

function statusStyle(status) {
  if (status === "auto-complete") return "border-[var(--green)] bg-[var(--routing-auto-bg)] text-[var(--green)]";
  if (status === "running") return "border-[var(--amber)] bg-[var(--churn-banner-bg)] text-[var(--amber)]";
  if (status === "needs-review") return "border-[var(--orange)] bg-[var(--routing-escalate-bg)] text-[var(--orange)]";
  return "border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)]";
}

export default function ManagedServicesPage({ tasks, setTasks, runningTask, setRunningTask }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const timerRef = useRef(null);

  const n = tasks?.length ?? 0;
  const withExceptions = useMemo(() => (tasks ?? []).filter((t) => t.exception != null).length, [tasks]);
  const runningCount = useMemo(() => (tasks ?? []).filter((t) => t.status === "running").length, [tasks]);

  const filtered = useMemo(() => {
    const list = tasks ?? [];
    if (statusFilter === "all") return list;
    if (statusFilter === "exceptions") return list.filter((t) => t.exception != null);
    return list.filter((t) => t.status === statusFilter);
  }, [tasks, statusFilter]);

  const runWorkflow = useCallback(
    (taskId) => {
      if (runningTask != null) return;
      const task = (tasks ?? []).find((t) => t.id === taskId);
      if (!task || task.status !== "scheduled") return;

      setRunningTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "running", nextRun: null } : t)),
      );

      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        const finished = new Date().toISOString();
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: "auto-complete",
                  automationRate: 100,
                  lastRun: finished,
                  nextRun: t.dueDate ? `${t.dueDate}T10:00:00Z` : null,
                  exception: null,
                }
              : t,
          ),
        );
        setRunningTask(null);
        timerRef.current = null;
      }, 2200);
    },
    [runningTask, tasks, setRunningTask, setTasks],
  );

  const counts = useMemo(() => {
    const list = tasks ?? [];
    return {
      all: list.length,
      scheduled: list.filter((t) => t.status === "scheduled").length,
      running: list.filter((t) => t.status === "running").length,
      "needs-review": list.filter((t) => t.status === "needs-review").length,
      "auto-complete": list.filter((t) => t.status === "auto-complete").length,
      exceptions: list.filter((t) => t.exception != null).length,
    };
  }, [tasks]);

  const filterPills = [
    { id: "all", label: "All" },
    { id: "scheduled", label: "Scheduled" },
    { id: "running", label: "Running" },
    { id: "needs-review", label: "Review" },
    { id: "auto-complete", label: "Done" },
    { id: "exceptions", label: "Exceptions" },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-6 font-sans text-sm text-[var(--text-primary)]">
      <header className="mb-6">
        <h1 className="text-base font-medium">Automation tasks</h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--text-muted)]">
          Managed workflows across billing, payroll, backups, and sync. Run a scheduled task to simulate the pipeline
          (scheduled → running → completed).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-lg border border-[var(--gray-100)] bg-[var(--white)] px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">In queue</p>
            <p className="mt-1 font-sans text-xl font-semibold tabular-nums">{n}</p>
          </div>
          <div className="rounded-lg border border-[var(--gray-100)] bg-[var(--white)] px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Running now</p>
            <p className="mt-1 font-sans text-xl font-semibold tabular-nums">{runningCount}</p>
          </div>
          <div className="rounded-lg border border-[var(--gray-100)] border-l-[3px] border-l-[var(--red)] bg-[var(--white)] px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Exceptions</p>
            <p className="mt-1 font-sans text-xl font-semibold tabular-nums text-[var(--red)]">{withExceptions}</p>
          </div>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {filterPills.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-medium transition-colors active:scale-[0.98] ${
              statusFilter === f.id
                ? "border-[var(--blue)] bg-[var(--lightblue)] text-[var(--blue)]"
                : "border-[var(--border)] bg-[var(--white)] text-[var(--text-muted)]"
            }`}
          >
            <span>{f.label}</span>
            <span className="tabular-nums opacity-80">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-[var(--gray-100)] bg-[var(--white)] px-4 py-8 text-center font-sans text-[13px] text-[var(--text-muted)]">
            No tasks match this filter.
          </p>
        ) : (
          filtered.map((task) => {
            const simulating = runningTask === task.id;
            const canRun = task.status === "scheduled" && runningTask == null;
            return (
              <article
                key={task.id}
                className="rounded-lg border border-[var(--gray-100)] bg-[var(--white)] p-4 shadow-none"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">{task.id}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${statusStyle(task.status)}`}
                      >
                        {simulating ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
                        {statusLabel(task.status)}
                      </span>
                    </div>
                    <h2 className="mt-1 font-sans text-[14px] font-medium leading-snug text-[var(--text-primary)]">{task.name}</h2>
                    <p className="mt-1 font-sans text-[12px] leading-relaxed text-[var(--text-secondary)]">{task.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[11px] text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {task.clientCount} clients
                      </span>
                      {task.totalValue ? (
                        <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">{task.totalValue}</span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                        Due {formatDue(task.dueDate)}
                      </span>
                      <span>Automation {task.automationRate}%</span>
                      {task.lastRun ? <span>Last run {formatRelativeTime(task.lastRun)}</span> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    {canRun ? (
                      <button
                        type="button"
                        onClick={() => runWorkflow(task.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--blue)] bg-[var(--lightblue)] px-3 py-2 font-mono text-[11px] font-medium text-[var(--blue)] transition-colors hover:bg-[var(--white)] active:scale-[0.98]"
                      >
                        <PlayCircle className="h-3.5 w-3.5" aria-hidden />
                        Run workflow
                      </button>
                    ) : simulating ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--amber)]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        Processing…
                      </span>
                    ) : task.status === "running" ? (
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">Batch run active</span>
                    ) : task.status === "auto-complete" ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--green)]">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        Idle
                      </span>
                    ) : null}
                  </div>
                </div>

                {task.exception ? (
                  <div
                    className="mt-4 flex gap-2 rounded-md border p-3"
                    style={{
                      borderColor: "var(--routing-escalate-border)",
                      backgroundColor: "var(--routing-escalate-bg)",
                    }}
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--red)]" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--red)]">
                        {task.exception.severity} severity
                      </p>
                      <p className="mt-1 font-sans text-[12px] leading-relaxed text-[var(--text-secondary)]">{task.exception.message}</p>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
