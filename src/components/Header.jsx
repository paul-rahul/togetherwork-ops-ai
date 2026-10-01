export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--white)] px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-medium text-[var(--white)]"
          style={{ backgroundColor: "var(--navy)" }}
          aria-hidden
        >
          TW
        </div>
        <span className="truncate font-sans text-sm font-medium text-[var(--text-primary)]">
          Support Intelligence
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className="tw-live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--green)]"
            aria-hidden
          />
          <span className="font-mono text-[11px] text-[var(--text-muted)]">Claude Sonnet 4.6 · Live</span>
        </div>
        <div
          className="flex rounded-md p-0.5"
          style={{ borderWidth: "0.5px", borderColor: "var(--border)", borderStyle: "solid" }}
          role="tablist"
          aria-label="Support view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "inbox"}
            onClick={() => setActiveTab("inbox")}
            className={`rounded px-3 py-1.5 font-sans text-[13px] font-medium transition-colors active:scale-[0.98] ${
              activeTab === "inbox"
                ? "bg-[var(--blue)] text-[var(--white)]"
                : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg)]"
            }`}
          >
            Inbox
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "metrics"}
            onClick={() => setActiveTab("metrics")}
            className={`rounded px-3 py-1.5 font-sans text-[13px] font-medium transition-colors active:scale-[0.98] ${
              activeTab === "metrics"
                ? "bg-[var(--blue)] text-[var(--white)]"
                : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg)]"
            }`}
          >
            Metrics
          </button>
        </div>
      </div>
    </header>
  );
}
