import { useMemo } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { resolveArticleUrl } from "../../utils/articleLinks.js";

export default function KnowledgeBasePanel({ suggestedArticleTitles, knowledgeBase }) {
  const matched = useMemo(() => {
    const titles = Array.isArray(suggestedArticleTitles) ? suggestedArticleTitles : [];
    return titles
      .map((title) => knowledgeBase.find((a) => a.title === title))
      .filter(Boolean);
  }, [suggestedArticleTitles, knowledgeBase]);

  if (matched.length === 0) {
    return (
      <div className="rounded-md border border-[var(--border-light)] bg-[var(--bg)] p-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
          Knowledge base
        </p>
        <p className="mt-1 font-sans text-[12px] text-[var(--text-muted)]">No matching articles for this ticket.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
        Knowledge base
      </p>
      <ul className="m-0 list-none space-y-2 p-0">
        {matched.map((article) => {
          const href = resolveArticleUrl(article);
          return (
            <li key={article.id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open article: ${article.title}`}
                className="flex gap-3 rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-3 text-left no-underline transition-colors hover:border-[var(--blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.99]"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: "var(--lightblue)", color: "var(--blue)" }}
                  aria-hidden
                >
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[13px] font-medium leading-snug text-[var(--text-primary)]">{article.title}</p>
                  <span className="mt-1 inline-block rounded bg-[var(--lightblue)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--blue)]">
                    {article.category}
                  </span>
                  <div className="mt-2 inline-flex items-center gap-0.5 font-sans text-[12px] font-medium text-[var(--blue)]">
                    View article
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
