import { formatRelativeTime } from "../../utils/formatRelativeTime.js";

const verticalPillStyle = {
  Camps: { backgroundColor: "var(--camp-bg)", color: "var(--camp-text)" },
  Associations: { backgroundColor: "var(--assoc-bg)", color: "var(--assoc-text)" },
  Nonprofits: { backgroundColor: "var(--np-bg)", color: "var(--np-text)" },
  "Pet Care": { backgroundColor: "var(--pet-bg)", color: "var(--pet-text)" },
  Gyms: { backgroundColor: "var(--gym-bg)", color: "var(--gym-text)" },
};

function statusDotStyle(status, analysing) {
  if (analysing) return { backgroundColor: "var(--amber)" };
  if (status === "auto-resolved") return { backgroundColor: "var(--green)" };
  if (status === "escalated") return { backgroundColor: "var(--red)" };
  return { backgroundColor: "var(--gray)" };
}

function sentimentDotColor(sentiment) {
  if (sentiment === "frustrated") return "var(--amber)";
  if (sentiment === "angry") return "var(--red)";
  return "var(--green)";
}

export default function TicketCard({ ticket, selected, onSelect, analysis, analysing }) {
  const pillStyle = verticalPillStyle[ticket.vertical] ?? {
    backgroundColor: "var(--border-light)",
    color: "var(--text-muted)",
  };

  const subjectMax = 52;
  const subjectDisplay =
    ticket.subject.length > subjectMax ? `${ticket.subject.slice(0, subjectMax)}…` : ticket.subject;

  let statusLabel = "Open";
  if (analysing) statusLabel = "Analysing…";
  else if (ticket.status === "auto-resolved") statusLabel = "Auto-Resolved";
  else if (ticket.status === "escalated") statusLabel = "Escalated";

  return (
    <button
      type="button"
      onClick={() => onSelect(ticket.id)}
      style={{
        borderLeftWidth: "4px",
        borderLeftStyle: "solid",
        borderLeftColor: selected ? "var(--blue)" : "transparent",
      }}
      className={`flex w-full flex-col gap-2 border-b border-[var(--border-light)] px-3 py-3 text-left transition-colors active:scale-[0.99] ${
        selected ? "bg-[var(--lightblue)]" : "hover:bg-[var(--bg)]"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${analysing ? "tw-live-dot" : ""}`}
          style={statusDotStyle(ticket.status, analysing)}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex max-w-full items-center rounded-[10px] px-[7px] py-0.5 font-mono text-[11px] font-medium leading-tight"
              style={pillStyle}
            >
              <span className="truncate">{ticket.brand}</span>
              <span className="mx-1 opacity-60" aria-hidden>
                ·
              </span>
              <span className="truncate">{ticket.vertical}</span>
            </span>
            {analysis?.sentiment ? (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: sentimentDotColor(analysis.sentiment) }}
                title={analysis.sentiment}
                aria-label={`Sentiment: ${analysis.sentiment}`}
              />
            ) : null}
          </div>
          <p className="mt-1 font-sans text-[13px] font-medium leading-snug text-[var(--text-primary)]">
            {ticket.sender}
          </p>
          <p className="mt-0.5 truncate font-sans text-[13px] text-[var(--text-secondary)]">{subjectDisplay}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {formatRelativeTime(ticket.timestamp)}
            </span>
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-medium ${
                analysing
                  ? "text-[var(--amber)]"
                  : ticket.status === "auto-resolved"
                    ? "text-[var(--green)]"
                    : ticket.status === "escalated"
                      ? "text-[var(--red)]"
                      : "text-[var(--text-muted)]"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
