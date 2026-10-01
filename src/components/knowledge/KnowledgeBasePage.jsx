import { useMemo, useState } from "react";
import { BookOpen, FileSearch, Search } from "lucide-react";
import { documentationGaps } from "../../data/knowledgeBase.js";
import { resolveArticleUrl } from "../../utils/articleLinks.js";

export default function KnowledgeBasePage({ articles, generatedArticles }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const articleCount = articles?.length ?? 0;
  const generatedN = Object.keys(generatedArticles ?? {}).filter((id) => generatedArticles[id] != null).length;

  const categories = useMemo(() => {
    const set = new Set((articles ?? []).map((a) => a.category).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const list = articles ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((a) => {
      if (category && a.category !== category) return false;
      if (!q) return true;
      const blob = [a.title, a.excerpt, a.category, ...(a.brands ?? []), ...(a.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [articles, query, category]);

  const gapCategories = useMemo(() => {
    const set = new Set(documentationGaps.map((g) => g.category));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, []);

  const [gapCat, setGapCat] = useState("");
  const filteredGaps = useMemo(() => {
    return documentationGaps.filter((g) => !gapCat || g.category === gapCat);
  }, [gapCat]);

  const selectClass =
    "rounded-md border border-[var(--border)] bg-[var(--white)] px-2 py-1.5 font-sans text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)]";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-6 font-sans text-sm text-[var(--text-primary)]">
      <header className="mb-6">
        <h1 className="text-base font-medium">Knowledge base</h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--text-muted)]">
          Published articles and documentation gaps surfaced from support volume. AI-drafted articles for each gap are
          planned, not yet built.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-lg border border-[var(--gray-100)] bg-[var(--white)] px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Published</p>
            <p className="mt-1 font-sans text-xl font-semibold tabular-nums">{articleCount}</p>
          </div>
          <div className="rounded-lg border border-[var(--gray-100)] bg-[var(--white)] px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Gaps tracked</p>
            <p className="mt-1 font-sans text-xl font-semibold tabular-nums">{documentationGaps.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--gray-100)] bg-[var(--white)] px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">AI drafts</p>
            <p className="mt-1 font-sans text-xl font-semibold tabular-nums">{generatedN}</p>
          </div>
        </div>
      </header>

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 shrink-0 text-[var(--blue)]" aria-hidden />
            <h2 className="font-sans text-[15px] font-medium">Articles</h2>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <label className="relative flex min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, topic, brand…"
                className={`w-full pl-8 ${selectClass}`}
                aria-label="Search articles"
              />
            </label>
            <select className={`min-w-[160px] ${selectClass}`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--gray-100)] bg-[var(--white)]">
          <ul className="m-0 divide-y divide-[var(--border-light)] p-0">
            {filteredArticles.length === 0 ? (
              <li className="px-4 py-8 text-center font-sans text-[13px] text-[var(--text-muted)]">No articles match your filters.</li>
            ) : (
              filteredArticles.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-[var(--text-muted)]">{a.id}</p>
                      <p className="mt-0.5 font-sans text-[13px] font-medium leading-snug text-[var(--text-primary)]">{a.title}</p>
                      <p className="mt-1 line-clamp-2 font-sans text-[12px] leading-relaxed text-[var(--text-secondary)]">{a.excerpt}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                          {a.category}
                        </span>
                        {(a.brands ?? []).slice(0, 4).map((b) => (
                          <span
                            key={b}
                            className="rounded border border-[var(--border-light)] bg-[var(--white)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]"
                          >
                            {b}
                          </span>
                        ))}
                        {(a.brands ?? []).length > 4 ? (
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">+{a.brands.length - 4}</span>
                        ) : null}
                      </div>
                    </div>
                    <a
                      href={resolveArticleUrl(a)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 self-start font-mono text-[11px] font-medium text-[var(--blue)] hover:underline"
                    >
                      View
                    </a>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 shrink-0 text-[var(--amber)]" aria-hidden />
            <h2 className="font-sans text-[15px] font-medium">Documentation gaps</h2>
          </div>
          <select className={`min-w-[180px] ${selectClass}`} value={gapCat} onChange={(e) => setGapCat(e.target.value)} aria-label="Filter gaps by category">
            <option value="">All gap categories</option>
            {gapCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--gray-100)] bg-[var(--white)]">
          <ul className="m-0 divide-y divide-[var(--border-light)] p-0">
            {filteredGaps.map((g) => {
              const draft = generatedArticles?.[g.id];
              return (
                <li key={g.id} className="px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-[var(--text-muted)]">{g.id}</span>
                        <span className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                          {g.category}
                        </span>
                        <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--amber)]">{g.ticketCount} tickets</span>
                      </div>
                      <p className="mt-1 font-sans text-[13px] font-medium text-[var(--text-primary)]">{g.title}</p>
                      <p className="mt-1 font-sans text-[12px] leading-relaxed text-[var(--text-secondary)]">{g.description}</p>
                      <p className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">Brands: {(g.brands ?? []).join(", ")}</p>
                    </div>
                    <div className="shrink-0 sm:pt-5">
                      {draft ? (
                        <span className="inline-flex rounded border border-[var(--green)] bg-[var(--routing-auto-bg)] px-2 py-1 font-mono text-[11px] font-medium text-[var(--green)]">
                          Draft ready
                        </span>
                      ) : (
                        <span className="inline-flex rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 font-mono text-[11px] text-[var(--text-muted)]">
                          No draft
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
