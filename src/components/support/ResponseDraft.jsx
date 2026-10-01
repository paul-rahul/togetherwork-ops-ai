import { useState } from "react";
import { Send } from "lucide-react";
import OfflineBadge from "../shared/OfflineBadge.jsx";

export default function ResponseDraft({
  response,
  routingDecision,
  onApprove,
  onEscalate,
  onUpdate,
}) {
  const [editing, setEditing] = useState(false);
  const [draftBody, setDraftBody] = useState("");

  if (!response) {
    return (
      <div className="rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-4">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
          Response draft
        </p>
        <p className="mt-2 font-sans text-[13px] text-[var(--text-muted)]">Draft will appear here once generated.</p>
      </div>
    );
  }

  const isAuto = routingDecision === "auto-resolve";
  const actionItems = Array.isArray(response.actionItems) ? response.actionItems : [];
  const escalationNote = typeof response.escalationNote === "string" ? response.escalationNote.trim() : "";

  const beginEdit = () => {
    setDraftBody(response.body ?? "");
    setEditing(true);
  };

  const finishEdit = () => {
    onUpdate({ ...response, body: draftBody });
    setEditing(false);
  };

  return (
    <div className="flex min-h-0 flex-col rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-4">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--border-light)] pb-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
          Response draft
        </p>
        {response.offline ? <OfflineBadge /> : null}
        <button
          type="button"
          onClick={() => (editing ? finishEdit() : beginEdit())}
          className="shrink-0 rounded border border-[var(--border)] bg-[var(--white)] px-2 py-1 font-sans text-[12px] font-medium text-[var(--blue)] transition-colors hover:bg-[var(--bg)] active:scale-[0.98]"
        >
          {editing ? "Done editing" : "Edit response"}
        </button>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-auto">
        <div className="rounded-md bg-[var(--bg)] p-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-faint)]">Subject</p>
          <p className="mt-1 font-sans text-[13px] font-medium text-[var(--text-primary)]">{response.subject}</p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-[var(--text-faint)]">Greeting</p>
          <p className="mt-1 font-sans text-[13px] text-[var(--text-secondary)]">{response.greeting}</p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-[var(--text-faint)]">Body</p>
          {editing ? (
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={10}
              className="mt-2 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--white)] p-3 font-sans text-[13px] leading-relaxed text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)]"
            />
          ) : (
            <div className="mt-2 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {response.body}
            </div>
          )}
          <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-[var(--text-faint)]">Closing</p>
          <div className="mt-1 whitespace-pre-wrap font-sans text-[13px] text-[var(--text-secondary)]">
            {response.closing}
          </div>
        </div>

        {actionItems.length > 0 ? (
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Action items
            </p>
            <ul className="m-0 mt-2 list-none space-y-2 p-0">
              {actionItems.map((item, i) => (
                <li key={i} className="flex gap-2 font-sans text-[13px] text-[var(--text-secondary)]">
                  <span className="w-5 shrink-0 font-mono text-[13px] font-semibold text-[var(--blue)]">{i + 1}.</span>
                  <span className="min-w-0 flex-1 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {escalationNote ? (
        <div className="mt-4 rounded-md border border-[var(--border-light)] bg-[var(--bg)] p-3">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Internal note for agent
          </p>
          <p className="mt-1 font-sans text-[12px] leading-snug text-[var(--text-secondary)]">{escalationNote}</p>
        </div>
      ) : null}

      <div className="mt-4 flex w-full shrink-0 flex-col gap-2 border-t border-[var(--border-light)] pt-4">
        {isAuto ? (
          <>
            <button
              type="button"
              onClick={onApprove}
              className="flex w-full items-center justify-center gap-2 rounded-md py-2.5 font-sans text-[13px] font-medium text-[var(--white)] active:scale-[0.98]"
              style={{ backgroundColor: "var(--green)" }}
            >
              <Send className="h-4 w-4 shrink-0" aria-hidden />
              Approve &amp; Send
            </button>
            <button
              type="button"
              onClick={onEscalate}
              className="w-full rounded-md border py-2.5 font-sans text-[13px] font-medium active:scale-[0.98]"
              style={{ borderColor: "var(--red)", color: "var(--red)", backgroundColor: "transparent" }}
            >
              Escalate Instead
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onEscalate}
              className="w-full rounded-md py-2.5 font-sans text-[13px] font-medium text-[var(--white)] active:scale-[0.98]"
              style={{ backgroundColor: "var(--red)" }}
            >
              Confirm Escalation
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="w-full rounded-md border py-2.5 font-sans text-[13px] font-medium active:scale-[0.98]"
              style={{ borderColor: "var(--green)", color: "var(--green)", backgroundColor: "transparent" }}
            >
              Override &amp; Auto-Resolve
            </button>
          </>
        )}
      </div>
    </div>
  );
}
