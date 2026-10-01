import { createElement } from "react";
import {
  BarChart2,
  CheckCircle2,
  Code2,
  CreditCard,
  Flag,
  HelpCircle,
  KeyRound,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react";
import initialKbArticles from "../../data/knowledgeBase.js";
import KnowledgeBasePanel from "./KnowledgeBasePanel.jsx";

function categoryIcon(category) {
  switch (category) {
    case "Billing & Payments":
      return CreditCard;
    case "Technical Issue":
      return Wrench;
    case "Account Access":
      return KeyRound;
    case "Data & Reporting":
      return BarChart2;
    case "Feature Request":
      return Sparkles;
    case "API & Integrations":
      return Code2;
    default:
      return HelpCircle;
  }
}

function urgencyStyle(urgency) {
  if (urgency === "critical") return { backgroundColor: "var(--border-light)", color: "var(--red)" };
  if (urgency === "high") return { backgroundColor: "var(--border-light)", color: "var(--orange)" };
  if (urgency === "medium") return { backgroundColor: "var(--border-light)", color: "var(--amber)" };
  return { backgroundColor: "var(--border-light)", color: "var(--gray)" };
}

function confidenceBarColor(confidence) {
  if (confidence >= 0.8) return "var(--green)";
  if (confidence >= 0.6) return "var(--amber)";
  return "var(--red)";
}

export default function AnalysisPanel({ analysis, knowledgeBase = initialKbArticles }) {
  const confidence = typeof analysis.confidence === "number" ? analysis.confidence : 0;
  const sentimentScore = typeof analysis.sentimentScore === "number" ? analysis.sentimentScore : 3;
  const pct = Math.round(Math.min(1, Math.max(0, confidence)) * 100);
  const isAuto = analysis.routingDecision === "auto-resolve";

  return (
    <div className="rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-4">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
        Triage analysis
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-md bg-[var(--bg)] p-3">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Category
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--lightblue)] text-[var(--blue)]">
              {createElement(categoryIcon(analysis.category), {
                className: "h-4 w-4",
                "aria-hidden": true,
              })}
            </span>
            <span className="font-sans text-[13px] font-medium leading-tight text-[var(--text-primary)]">
              {analysis.category}
            </span>
          </div>
        </div>

        <div className="rounded-md bg-[var(--bg)] p-3">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Urgency
          </p>
          <div className="mt-2">
            <span
              className="inline-block rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide"
              style={urgencyStyle(analysis.urgency)}
            >
              {analysis.urgency}
            </span>
          </div>
        </div>

        <div className="rounded-md bg-[var(--bg)] p-3">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Sentiment
          </p>
          <p className="mt-1 font-sans text-[13px] font-medium capitalize text-[var(--text-primary)]">
            {analysis.sentiment}{" "}
            <span className="font-mono text-[11px] text-[var(--text-muted)]">({sentimentScore}/5)</span>
          </p>
          <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-[var(--border-light)]">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-full flex-1 rounded-sm"
                style={{
                  backgroundColor: n <= sentimentScore ? "var(--blue)" : "transparent",
                  opacity: n <= sentimentScore ? 1 : 0.35,
                }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-md bg-[var(--bg)] p-3">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Confidence
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--text-primary)]">{pct}%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-light)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: confidenceBarColor(confidence),
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="mt-4 rounded-md border p-4"
        style={{
          backgroundColor: isAuto ? "var(--routing-auto-bg)" : "var(--routing-escalate-bg)",
          borderColor: isAuto ? "transparent" : "var(--routing-escalate-border)",
          borderWidth: isAuto ? "0" : "0.5px",
          borderStyle: "solid",
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: isAuto ? "var(--green)" : "var(--red)" }}
          >
            {isAuto ? (
              <CheckCircle2 className="h-5 w-5 text-[var(--white)]" aria-hidden />
            ) : (
              <XCircle className="h-5 w-5 text-[var(--white)]" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="font-mono text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: isAuto ? "var(--green)" : "var(--red)" }}
            >
              {isAuto ? "Auto-Resolve" : "Escalate to Human"}
            </p>
            <p className="mt-1 font-sans text-[13px] leading-snug text-[var(--text-secondary)]">
              {analysis.routingReason}
            </p>
          </div>
        </div>
      </div>

      {analysis.churnRisk ? (
        <div
          className="mt-4 flex gap-3 rounded-md border p-3"
          style={{
            backgroundColor: "var(--churn-banner-bg)",
            borderColor: "var(--churn-banner-border)",
            borderWidth: "0.5px",
            borderStyle: "solid",
          }}
        >
          <Flag className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber)]" aria-hidden />
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--amber)]">
              Churn risk
            </p>
            <p className="mt-1 font-sans text-[13px] leading-snug text-[var(--text-secondary)]">
              {analysis.churnRiskReason || "Customer may be at risk of churning."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 border-t border-[var(--border-light)] pt-4">
        <KnowledgeBasePanel
          suggestedArticleTitles={analysis.suggestedKBArticles}
          knowledgeBase={knowledgeBase}
        />
      </div>
    </div>
  );
}
