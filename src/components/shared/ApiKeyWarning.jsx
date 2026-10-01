export default function ApiKeyWarning() {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col items-center justify-center overflow-y-auto bg-[var(--bg)] p-6">
      <div className="w-full max-w-lg rounded-md border border-[var(--gray-100)] bg-[var(--white)] p-6">
        <h1 className="font-sans text-lg font-medium text-[var(--text-primary)]">Claude API key required</h1>
        <p className="mt-3 font-sans text-[13px] leading-relaxed text-[var(--text-secondary)]">
          This demo calls the Anthropic API directly from the browser. Add your key to a{" "}
          <code className="rounded bg-[var(--bg)] px-1 font-mono text-[12px] text-[var(--text-primary)]">.env</code>{" "}
          file in the project root:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md border border-[var(--border-light)] bg-[var(--bg)] p-3 font-mono text-[11px] text-[var(--text-secondary)]">
          VITE_CLAUDE_API_KEY=sk-ant-...
        </pre>
        <p className="mt-4 font-sans text-[13px] text-[var(--text-muted)]">
          Restart the dev server after saving. Never commit real keys — <code className="font-mono text-[11px]">.env</code>{" "}
          is gitignored.
        </p>
      </div>
    </div>
  );
}
