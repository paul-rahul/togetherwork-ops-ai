import { PAGE_PATHS } from "../../utils/router.js";

const sections = [
  { header: "Customer Support", page: "support", label: "Support inbox", badgeKey: "openTickets" },
  { header: "Professional Services", page: "implementations", label: "Implementations", badgeKey: "atRisk" },
  { header: "Knowledge", page: "knowledge", label: "Knowledge base", badgeKey: null },
  { header: "Managed Services", page: "managed", label: "Automation tasks", badgeKey: "exceptions" },
  { header: "Reporting", page: "analytics", label: "Analytics", badgeKey: null },
];

export default function LeftNav({ activePage, setActivePage, badges }) {
  return (
    <nav
      className="flex min-h-0 w-[188px] shrink-0 flex-col overflow-y-auto overscroll-y-contain py-5 pl-3 pr-2 font-sans text-[13px]"
      style={{ backgroundColor: "var(--navy)" }}
      aria-label="Primary"
    >
      {sections.map(({ header, page, label, badgeKey }, index) => {
        const isActive = activePage === page;
        const count = badgeKey != null ? badges[badgeKey] : null;
        return (
          <div
            key={page}
            className={
              index > 0
                ? "mt-6 border-t border-white/10 pt-6"
                : ""
            }
          >
            <p className="mb-2.5 px-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
              {header}
            </p>
            <a
              href={PAGE_PATHS[page]}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => {
                // Let modified clicks (new tab/window) use the real link.
                if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                setActivePage(page);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-2.5 text-left font-sans text-[13px] transition-colors active:scale-[0.98] ${
                isActive
                  ? "bg-[var(--blue)] text-[var(--white)]"
                  : "text-[var(--nav-inactive)] hover:bg-[var(--nav-hover)]"
              }`}
            >
              <span className="min-w-0 truncate">{label}</span>
              {count != null && count > 0 ? (
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[11px] font-medium ${
                    isActive
                      ? "bg-[var(--white)] text-[var(--blue)]"
                      : "bg-[var(--nav-hover)] text-[var(--text-faint)]"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </a>
          </div>
        );
      })}
    </nav>
  );
}
