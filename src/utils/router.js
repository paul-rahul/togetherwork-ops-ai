// Minimal History-API routing for the five product areas. No dependency: the app
// only needs one level of readable paths, back/forward, and deep links.
import { useCallback, useEffect, useState } from "react";

export const PAGE_PATHS = {
  support: "/support",
  implementations: "/implementations",
  knowledge: "/knowledge",
  managed: "/managed-services",
  analytics: "/analytics",
};

export const DEFAULT_PAGE = "support";

const PAGE_TITLES = {
  support: "Support inbox",
  implementations: "Implementations",
  knowledge: "Knowledge base",
  managed: "Managed services",
  analytics: "Analytics",
};

/** Returns the page key for a pathname, or null when the path is not a known route. */
export function pageFromPath(pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return Object.keys(PAGE_PATHS).find((key) => PAGE_PATHS[key] === clean) ?? null;
}

export function usePage() {
  const [page, setPage] = useState(() => pageFromPath(window.location.pathname) ?? DEFAULT_PAGE);

  // "/" and unknown paths land on the default page with a canonical URL.
  useEffect(() => {
    if (pageFromPath(window.location.pathname) === null) {
      const { search, hash } = window.location;
      window.history.replaceState(null, "", `${PAGE_PATHS[DEFAULT_PAGE]}${search}${hash}`);
    }
  }, []);

  useEffect(() => {
    const onPop = () => setPage(pageFromPath(window.location.pathname) ?? DEFAULT_PAGE);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.title = `${PAGE_TITLES[page]} · Togetherwork Operations Intelligence`;
  }, [page]);

  const navigate = useCallback((next) => {
    if (!PAGE_PATHS[next]) return;
    if (pageFromPath(window.location.pathname) !== next) {
      window.history.pushState(null, "", PAGE_PATHS[next]);
    }
    setPage(next);
  }, []);

  return [page, navigate];
}
