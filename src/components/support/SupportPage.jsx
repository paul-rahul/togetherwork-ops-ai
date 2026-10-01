import { useCallback, useMemo, useState } from "react";
import MetricsDashboard from "../MetricsDashboard.jsx";
import Header from "../Header.jsx";
import TicketInbox from "./TicketInbox.jsx";
import TicketDetail from "./TicketDetail.jsx";

export default function SupportPage({
  tickets,
  setTickets,
  selectedTicketId,
  setSelectedTicketId,
  analyses,
  loadingTickets,
  responses,
  setResponses,
  ticketErrors,
  onRetryTicket,
  articles,
}) {
  const [activeTab, setActiveTab] = useState("inbox");

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find((t) => t.id === selectedTicketId) ?? null;
  }, [tickets, selectedTicketId]);

  const loading = Boolean(selectedTicketId && loadingTickets[selectedTicketId]);
  const analysis = selectedTicketId ? analyses[selectedTicketId] : null;
  const response = selectedTicketId ? responses[selectedTicketId] : null;
  const ticketError = selectedTicketId ? ticketErrors[selectedTicketId] : null;

  const handleApprove = useCallback(() => {
    if (!selectedTicketId) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicketId ? { ...t, status: "auto-resolved" } : t)),
    );
  }, [selectedTicketId, setTickets]);

  const handleEscalate = useCallback(() => {
    if (!selectedTicketId) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicketId ? { ...t, status: "escalated" } : t)),
    );
  }, [selectedTicketId, setTickets]);

  const handleResponseUpdate = useCallback(
    (next) => {
      if (!selectedTicketId) return;
      setResponses((prev) => ({ ...prev, [selectedTicketId]: next }));
    },
    [selectedTicketId, setResponses],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bg)]">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "inbox" ? (
        <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
          <div className="flex h-full min-h-0 w-[300px] shrink-0 flex-col overflow-hidden">
            <TicketInbox
              tickets={tickets}
              selectedTicketId={selectedTicketId}
              onSelect={setSelectedTicketId}
              analyses={analyses}
              loadingTickets={loadingTickets}
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg)]">
            <TicketDetail
              ticket={selectedTicket}
              loading={loading}
              analysis={analysis}
              response={response}
              errorMessage={ticketError}
              onRetryAnalysis={onRetryTicket}
              knowledgeBase={articles}
              onApprove={handleApprove}
              onEscalate={handleEscalate}
              onUpdate={handleResponseUpdate}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <MetricsDashboard tickets={tickets} analyses={analyses} />
        </div>
      )}
    </div>
  );
}
