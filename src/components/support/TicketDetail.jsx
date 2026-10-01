import { useEffect, useState } from "react";
import AnalysisPanel from "./AnalysisPanel.jsx";
import ResponseDraft from "./ResponseDraft.jsx";
import { formatTicketTimestamp } from "../../utils/formatTicketTimestamp.js";

const verticalPillStyle = {
  Camps: { backgroundColor: "var(--camp-bg)", color: "var(--camp-text)" },
  Associations: { backgroundColor: "var(--assoc-bg)", color: "var(--assoc-text)" },
  Nonprofits: { backgroundColor: "var(--np-bg)", color: "var(--np-text)" },
  "Pet Care": { backgroundColor: "var(--pet-bg)", color: "var(--pet-text)" },
  Gyms: { backgroundColor: "var(--gym-bg)", color: "var(--gym-text)" },
};

function priorityLabel(priority) {
  if (priority === "critical") return "Critical";
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

function priorityStyle(priority) {
  if (priority === "critical") return { color: "var(--red)" };
  if (priority === "high") return { color: "var(--amber)" };
  if (priority === "medium") return { color: "var(--text-secondary)" };
  return { color: "var(--text-muted)" };
}

function noop() {}

function AnalysisLoadingBlock({ ticketId }) {
  const [phase2, setPhase2] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setPhase2(true), 2000);
    return () => window.clearTimeout(t);
  }, [ticketId]);

  return (
    <div className="space-y-3" aria-busy="true">
      <p className="font-sans text-[13px] text-[var(--text-muted)]">Claude is reading this ticket...</p>
      {phase2 ? (
        <p className="font-sans text-[13px] text-[var(--text-muted)]">Generating response draft...</p>
      ) : null}
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-24 w-full" />
    </div>
  );
}

export default function TicketDetail({
  ticket,
  loading,
  analysis,
  response,
  errorMessage,
  onRetryAnalysis,
  knowledgeBase,
  onApprove = noop,
  onEscalate = noop,
  onUpdate = noop,
}) {
  if (!ticket) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 overflow-hidden px-6 py-10">
        <div
          className="h-24 w-24 shrink-0 rounded-md border-2 border-dashed border-[var(--gray-100)] bg-[var(--bg)]"
          aria-hidden
        />
        <p className="max-w-xs text-center font-sans text-[13px] text-[var(--text-muted)]">
          Select a ticket to begin analysis
        </p>
      </div>
    );
  }

  const pillStyle = verticalPillStyle[ticket.vertical] ?? {
    backgroundColor: "var(--border-light)",
    color: "var(--text-muted)",
  };

  const routingDecision = analysis?.routingDecision ?? null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
          <header className="shrink-0 space-y-2 border-b border-[var(--border-light)] pb-4">
            <h2 className="font-sans text-[15px] font-medium leading-snug text-[var(--text-primary)]">{ticket.subject}</h2>
            <p className="font-sans text-[13px] text-[var(--text-secondary)]">{ticket.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-[10px] px-[7px] py-0.5 font-mono text-[11px] font-medium"
                style={pillStyle}
              >
                {ticket.brand} · {ticket.vertical}
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">{formatTicketTimestamp(ticket.timestamp)}</span>
              <span
                className="font-mono text-[11px] font-semibold uppercase tracking-wide"
                style={priorityStyle(ticket.priority)}
              >
                {priorityLabel(ticket.priority)}
              </span>
            </div>
          </header>

          <div className="shrink-0 rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-4">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">Message</p>
            <div className="mt-3 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {ticket.body}
            </div>
          </div>

          {errorMessage && !loading ? (
            <div
              className="shrink-0 rounded-md border p-4"
              style={{
                backgroundColor: "var(--routing-escalate-bg)",
                borderColor: "var(--routing-escalate-border)",
                borderWidth: "0.5px",
                borderStyle: "solid",
              }}
              role="alert"
            >
              <p className="font-sans text-[13px] leading-snug text-[var(--red)]">{errorMessage}</p>
              <button
                type="button"
                onClick={() => onRetryAnalysis(ticket.id)}
                className="mt-3 w-full rounded-md border border-[var(--red)] bg-[var(--white)] py-2 font-sans text-[13px] font-medium text-[var(--red)] active:scale-[0.98]"
              >
                Retry
              </button>
            </div>
          ) : null}

          {loading ? <AnalysisLoadingBlock key={ticket.id} ticketId={ticket.id} /> : null}

          {!loading && analysis ? (
            <div className="analysis-result grid shrink-0 gap-4 md:grid-cols-2">
              <AnalysisPanel analysis={analysis} knowledgeBase={knowledgeBase} />
              <ResponseDraft
                key={ticket.id}
                response={response}
                routingDecision={routingDecision}
                onApprove={onApprove}
                onEscalate={onEscalate}
                onUpdate={onUpdate}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
