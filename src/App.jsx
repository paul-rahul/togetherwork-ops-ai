// DESIGN SYSTEM NOTE FOR CURSOR:
// All colours come from CSS variables defined in index.css (see :root block).
// Never hardcode hex values in component files — always reference the variable.
// Font: DM Sans for all body text, DM Mono for IDs/badges/metrics.
// No shadows. No gradients. No border-radius above 12px.
// Status colours: green=auto-resolved, amber=analysing/warning, red=escalated/churn, gray=open.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Topbar from "./components/layout/Topbar.jsx";
import LeftNav from "./components/layout/LeftNav.jsx";
import SupportPage from "./components/support/SupportPage.jsx";
import ImplementationsPage from "./components/implementations/ImplementationsPage.jsx";
import KnowledgeBasePage from "./components/knowledge/KnowledgeBasePage.jsx";
import ManagedServicesPage from "./components/managed/ManagedServicesPage.jsx";
import AnalyticsPage from "./components/analytics/AnalyticsPage.jsx";
import mockTickets from "./data/mockTickets.js";
import mockImplementations from "./data/mockImplementations.js";
import mockTasks from "./data/mockTasks.js";
import initialArticles from "./data/knowledgeBase.js";
import { hoursBaseline, savingsRates, weeklyTicketHistory } from "./data/analyticsHistory.js";
import { callClaude, canDegrade, fetchAiStatus } from "./utils/claudeApi.js";
import { parseModelJson } from "./utils/parseModelJson.js";
import { sampleImplementation, sampleResponse, sampleTriage } from "./utils/offlineSamples.js";
import { usePage } from "./utils/router.js";

function clone(data) {
  return structuredClone(data);
}

export default function App() {
  const [activePage, setActivePage] = usePage();
  // null until the server answers; false when no AI key is configured there.
  const [aiAvailable, setAiAvailable] = useState(null);
  useEffect(() => {
    let cancelled = false;
    void fetchAiStatus().then((ok) => {
      if (!cancelled) setAiAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [tickets, setTickets] = useState(() => clone(mockTickets));
  const ticketsRef = useRef(tickets);
  ticketsRef.current = tickets;

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [analyses, setAnalyses] = useState({});
  const analysesRef = useRef(analyses);
  analysesRef.current = analyses;
  const [responses, setResponses] = useState({});
  const [loadingTickets, setLoadingTickets] = useState({});
  const [ticketErrors, setTicketErrors] = useState({});
  const ticketTriageInFlightRef = useRef(new Set());

  const [implementations, setImplementations] = useState(() => clone(mockImplementations));
  const implementationsRef = useRef(implementations);
  implementationsRef.current = implementations;
  const [implChecklists, setImplChecklists] = useState({});
  const implChecklistsRef = useRef(implChecklists);
  implChecklistsRef.current = implChecklists;
  const [loadingImpl, setLoadingImpl] = useState({});
  const implLoadInFlightRef = useRef(new Set());
  const [implChecklistErrors, setImplChecklistErrors] = useState({});

  const [articlesState, setArticles] = useState(() => clone(initialArticles));
  const articlesRef = useRef(articlesState);
  articlesRef.current = articlesState;
  const [generatingArticle, setGeneratingArticle] = useState(null);
  const [generatedArticles, setGeneratedArticles] = useState({});

  const [tasks, setTasks] = useState(() => clone(mockTasks));
  const [runningTask, setRunningTask] = useState(null);

  const navBadges = useMemo(() => {
    const openTickets = tickets.filter((t) => t.status === "open").length;
    const atRisk = implementations.filter((i) => i.status === "at-risk").length;
    const exceptions = tasks.filter((t) => t.exception != null).length;
    return { openTickets, atRisk, exceptions };
  }, [tickets, implementations, tasks]);

  const runTicketAnalysis = useCallback(async (ticketId) => {
    if (ticketTriageInFlightRef.current.has(ticketId)) return;
    if (analysesRef.current[ticketId]) {
      return;
    }

    const ticket = ticketsRef.current.find((t) => t.id === ticketId);
    if (!ticket) return;

    ticketTriageInFlightRef.current.add(ticketId);
    setLoadingTickets((prev) => ({ ...prev, [ticketId]: true }));
    setTicketErrors((prev) => {
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });

    try {
      const articleRefs = articlesRef.current.map(({ title, category }) => ({ title, category }));
      let analysis;
      try {
        const triageText = await callClaude("triage", { ticket, articles: articleRefs });
        try {
          analysis = parseModelJson(triageText);
        } catch {
          throw new Error("Could not parse triage response as JSON.");
        }
      } catch (err) {
        if (!canDegrade(err)) throw err;
        analysis = sampleTriage(ticket, articleRefs);
      }
      setAnalyses((prev) => ({ ...prev, [ticketId]: analysis }));

      let response;
      try {
        if (analysis.offline) throw Object.assign(new Error("offline"), { offline: true });
        const responseText = await callClaude("response", { ticket, analysis });
        try {
          response = parseModelJson(responseText);
        } catch {
          throw new Error("Could not parse draft response as JSON.");
        }
      } catch (err) {
        if (!err.offline && !canDegrade(err)) throw err;
        response = sampleResponse(ticket, analysis);
      }
      setResponses((prev) => ({ ...prev, [ticketId]: response }));
    } catch (err) {
      setAnalyses((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
      setResponses((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
      setTicketErrors((prev) => ({
        ...prev,
        [ticketId]: err instanceof Error ? err.message : "Claude API call failed",
      }));
    } finally {
      ticketTriageInFlightRef.current.delete(ticketId);
      setLoadingTickets((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (!selectedTicketId) return;
    if (analyses[selectedTicketId]) return;
    if (ticketErrors[selectedTicketId]) return;
    void runTicketAnalysis(selectedTicketId);
  }, [selectedTicketId, analyses, ticketErrors, runTicketAnalysis]);

  const runImplementationChecklist = useCallback(async (implId, { force = false } = {}) => {
    if (implLoadInFlightRef.current.has(implId)) return;
    if (!force && implChecklistsRef.current[implId]) return;

    const impl = implementationsRef.current.find((i) => i.id === implId);
    if (!impl) return;

    implLoadInFlightRef.current.add(implId);
    setLoadingImpl((prev) => ({ ...prev, [implId]: true }));
    setImplChecklistErrors((prev) => {
      const next = { ...prev };
      delete next[implId];
      return next;
    });

    try {
      let data;
      try {
        const record = { ...impl };
        delete record.aiChecklist;
        const text = await callClaude("implementation", { implementation: record });
        try {
          data = parseModelJson(text);
        } catch {
          throw new Error("Could not parse implementation checklist response as JSON.");
        }
      } catch (err) {
        if (!canDegrade(err)) throw err;
        data = sampleImplementation(impl);
      }
      setImplChecklists((prev) => ({ ...prev, [implId]: data }));
      setImplementations((prev) =>
        prev.map((i) => (i.id === implId ? { ...i, aiChecklist: data } : i)),
      );
    } catch (err) {
      setImplChecklists((prev) => {
        const next = { ...prev };
        delete next[implId];
        return next;
      });
      setImplementations((prev) =>
        prev.map((i) => (i.id === implId ? { ...i, aiChecklist: null } : i)),
      );
      setImplChecklistErrors((prev) => ({
        ...prev,
        [implId]: err instanceof Error ? err.message : "Claude API call failed",
      }));
    } finally {
      implLoadInFlightRef.current.delete(implId);
      setLoadingImpl((prev) => {
        const next = { ...prev };
        delete next[implId];
        return next;
      });
    }
  }, []);

  const onRetryImplChecklist = useCallback(
    (implId) => {
      if (!implId) return;
      setImplChecklistErrors((prev) => {
        const next = { ...prev };
        delete next[implId];
        return next;
      });
      void runImplementationChecklist(implId, { force: true });
    },
    [runImplementationChecklist],
  );

  const onChecklistItemsChange = useCallback((implId, checklistItems) => {
    setImplChecklists((prev) => {
      const base = prev[implId];
      if (!base || typeof base !== "object") return prev;
      return { ...prev, [implId]: { ...base, checklistItems } };
    });
    setImplementations((prev) =>
      prev.map((i) => {
        if (i.id !== implId || !i.aiChecklist || typeof i.aiChecklist !== "object") return i;
        return { ...i, aiChecklist: { ...i.aiChecklist, checklistItems } };
      }),
    );
  }, []);

  const handleRetryTicket = useCallback((ticketId) => {
    if (!ticketId) return;
    setAnalyses((prev) => {
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });
    setResponses((prev) => {
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });
    setTicketErrors((prev) => {
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setActivePage("support");
    setSelectedTicketId(null);
    setAnalyses({});
    setResponses({});
    setLoadingTickets({});
    setTicketErrors({});
    ticketTriageInFlightRef.current.clear();
    setImplChecklists({});
    setLoadingImpl({});
    setImplChecklistErrors({});
    implLoadInFlightRef.current.clear();
    setGeneratedArticles({});
    setGeneratingArticle(null);
    setRunningTask(null);
    setTickets(clone(mockTickets));
    setTasks(clone(mockTasks));
    setImplementations(clone(mockImplementations));
    setArticles(clone(initialArticles));
  }, [setActivePage]);

  const supportProps = {
    tickets,
    setTickets,
    selectedTicketId,
    setSelectedTicketId,
    analyses,
    responses,
    setResponses,
    loadingTickets,
    setLoadingTickets,
    ticketErrors,
    onRetryTicket: handleRetryTicket,
    articles: articlesState,
  };

  const implementationsProps = {
    implementations,
    implChecklists,
    loadingImpl,
    runImplementationChecklist,
    implChecklistErrors,
    onRetryImplChecklist,
    onChecklistItemsChange,
  };

  const knowledgeProps = {
    articles: articlesState,
    setArticles,
    generatingArticle,
    setGeneratingArticle,
    generatedArticles,
    setGeneratedArticles,
  };

  const managedProps = {
    tasks,
    setTasks,
    runningTask,
    setRunningTask,
  };

  const analyticsProps = {
    tickets,
    analyses,
    articles: articlesState,
    implementations,
    implChecklists,
    generatedArticles,
    tasks,
    weeklyTicketHistory,
    savingsRates,
    hoursBaseline,
  };

  return (
    <div className="app flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg)]">
      <Topbar onReset={handleReset} aiAvailable={aiAvailable} />
      <div className="body flex min-h-0 flex-1 flex-row overflow-hidden">
        <LeftNav activePage={activePage} setActivePage={setActivePage} badges={navBadges} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg)]">
          {activePage === "support" ? (
            <SupportPage {...supportProps} />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
              {activePage === "implementations" && <ImplementationsPage {...implementationsProps} />}
              {activePage === "knowledge" && <KnowledgeBasePage {...knowledgeProps} />}
              {activePage === "managed" && <ManagedServicesPage {...managedProps} />}
              {activePage === "analytics" && <AnalyticsPage {...analyticsProps} />}
            </div>
          )}
        </main>
      </div>
      <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--white)] px-4 py-2 text-center font-sans text-[11px] text-[var(--text-muted)]">
        Independent prototype by Rahul Paul · Synthetic demo data · Not affiliated with or endorsed by Togetherwork ·
        Claude Sonnet 4.6
      </footer>
    </div>
  );
}
