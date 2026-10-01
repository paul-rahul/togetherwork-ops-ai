export default function Topbar({ onReset, aiAvailable }) {
  // aiAvailable: null while the server status is loading, false when no AI key is configured.
  const ai = aiAvailable === false ? "offline" : aiAvailable ? "live" : "checking";
  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-4"
      style={{ backgroundColor: "var(--navy)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-medium text-[var(--white)]"
          style={{ backgroundColor: "var(--blue)" }}
          aria-hidden
        >
          TW
        </div>
        <span className="font-sans text-sm font-medium text-[var(--white)]">
          Operations Intelligence · Prototype
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2" data-ai-status={ai}>
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              ai === "live" ? "tw-live-dot bg-[var(--green)]" : ai === "offline" ? "bg-[var(--amber)]" : "bg-[var(--gray)]"
            }`}
            aria-hidden
          />
          <span className="font-mono text-[11px] text-[var(--text-faint)]">
            {ai === "live" ? "Claude Sonnet 4.6 · Live" : ai === "offline" ? "AI offline · sample mode" : "Checking AI…"}
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[var(--text-secondary)] bg-transparent px-2.5 py-1 font-mono text-[11px] text-[var(--text-faint)] transition-colors hover:text-[var(--white)]"
        >
          Reset demo
        </button>
      </div>
    </header>
  );
}
