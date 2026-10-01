import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";

function severityBlockerClass(severity) {
  if (severity === "high") return "border-[var(--red)] bg-[var(--routing-escalate-bg)]";
  if (severity === "medium") return "border-[var(--amber)] bg-[var(--churn-banner-bg)]";
  return "border-[var(--border)] bg-[var(--border-light)]";
}

function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const checklistItems = Array.isArray(raw.checklistItems)
    ? raw.checklistItems.map((it, i) => ({
        id: typeof it.id === "number" ? it.id : i + 1,
        task: String(it.task ?? ""),
        complete: Boolean(it.complete),
        notes: String(it.notes ?? ""),
      }))
    : [];
  const blockers = Array.isArray(raw.blockers)
    ? raw.blockers.map((b) => ({
        severity: ["low", "medium", "high"].includes(b.severity) ? b.severity : "medium",
        description: String(b.description ?? ""),
      }))
    : [];
  return {
    checklistItems,
    blockers,
    configDoc: String(raw.configDoc ?? ""),
    nextAction: String(raw.nextAction ?? ""),
  };
}

export default function ImplementationDetail({
  implementation,
  cached,
  loading,
  error,
  onRequestChecklist,
  onRetryChecklist,
  onChecklistItemsChange,
}) {
  const [copied, setCopied] = useState(false);
  const normalized = useMemo(() => normalizePayload(cached), [cached]);

  useEffect(() => {
    if (normalized) return;
    if (loading) return;
    if (error) return;
    void onRequestChecklist(implementation.id);
  }, [implementation.id, normalized, loading, error, onRequestChecklist]);

  const handleToggle = useCallback(
    (itemId) => {
      if (!normalized) return;
      const next = normalized.checklistItems.map((it) =>
        it.id === itemId ? { ...it, complete: !it.complete } : it,
      );
      onChecklistItemsChange(implementation.id, next);
    },
    [normalized, onChecklistItemsChange, implementation.id],
  );

  const copyConfig = useCallback(async () => {
    if (!normalized?.configDoc) return;
    try {
      await navigator.clipboard.writeText(normalized.configDoc);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [normalized]);

  if (loading && !normalized) {
    return (
      <div className="flex items-center gap-2 border-t border-[var(--gray-100)] bg-[var(--border-light)] px-4 py-6 font-sans text-[13px] text-[var(--text-muted)]">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--blue)]" aria-hidden />
        Generating implementation checklist…
      </div>
    );
  }

  if (error && !normalized) {
    return (
      <div className="space-y-3 border-t border-[var(--gray-100)] bg-[var(--routing-escalate-bg)] px-4 py-4 font-sans text-[13px]">
        <p className="text-[var(--red)]">{error}</p>
        <button
          type="button"
          className="rounded-md border border-[var(--border)] bg-[var(--white)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-primary)]"
          onClick={() => onRetryChecklist(implementation.id)}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!normalized) {
    return null;
  }

  return (
    <div className="space-y-4 border-t border-[var(--gray-100)] bg-[var(--border-light)] px-4 py-4 font-sans text-[13px] text-[var(--text-secondary)]">
      {normalized.nextAction ? (
        <div className="rounded-md border border-[var(--churn-banner-border)] bg-[var(--churn-banner-bg)] px-3 py-2 text-[var(--text-primary)]">
          <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--amber)]">
            Next action
          </span>
          <p className="mt-1 text-[13px] leading-snug">{normalized.nextAction}</p>
        </div>
      ) : null}

      <div>
        <h3 className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Checklist
        </h3>
        <ul className="space-y-2">
          {normalized.checklistItems.map((item) => (
            <li
              key={item.id}
              className="flex gap-2 rounded-md border border-[var(--gray-100)] bg-[var(--white)] px-3 py-2"
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)] accent-[var(--blue)]"
                checked={item.complete}
                onChange={() => handleToggle(item.id)}
                aria-label={item.task}
              />
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] ${item.complete ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>
                  {item.task}
                </p>
                {item.notes ? (
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{item.notes}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {normalized.blockers.length > 0 ? (
        <div>
          <h3 className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Blockers
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {normalized.blockers.map((b, idx) => (
              <li
                key={`${b.severity}-${idx}`}
                className={`rounded-md border px-3 py-2 text-[12px] ${severityBlockerClass(b.severity)}`}
              >
                <span className="font-mono text-[11px] uppercase text-[var(--text-muted)]">{b.severity}</span>
                <p className="mt-1 text-[var(--text-primary)]">{b.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Config documentation
          </h3>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--white)] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--text-primary)]"
            onClick={copyConfig}
            disabled={!normalized.configDoc}
          >
            <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
            {copied ? "Copied" : "Copy config doc"}
          </button>
        </div>
        <div className="max-h-48 overflow-y-auto rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-[var(--text-secondary)]">
          {normalized.configDoc || "—"}
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Refreshing…
        </p>
      ) : null}
    </div>
  );
}
