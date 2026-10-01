export default function OfflineBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border border-[var(--border)] bg-[var(--border-light)] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[var(--text-secondary)] ${className}`}
      title="The AI service was unavailable, so this is a rule-based sample, not model output."
    >
      Offline sample · AI unavailable
    </span>
  );
}
