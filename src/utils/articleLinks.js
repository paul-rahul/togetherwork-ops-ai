/**
 * Resolves a stable, working URL for a knowledge-base article.
 * Mock data uses `url: "#"`; this falls back to a web search scoped to the article title.
 */
export function resolveArticleUrl(article) {
  if (!article) return "#";
  const u = article.url;
  if (typeof u === "string" && u !== "#" && /^https?:\/\//i.test(u.trim())) {
    return u.trim();
  }
  const id = typeof article.id === "string" ? article.id : "";
  const title = typeof article.title === "string" ? article.title : "";
  const query = [title, "Togetherwork", id].filter(Boolean).join(" ");
  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
}
