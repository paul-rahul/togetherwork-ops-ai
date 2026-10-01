import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handleClaude, handleStatus } from "./functions/_lib/claude.js";

// Serves the same handlers as the Cloudflare Pages Functions (functions/api/)
// for `vite dev` and `vite preview`. ANTHROPIC_API_KEY is read here, on the
// server only; it has no VITE_ prefix and is never exposed to client code.
function claudeApiDev(env) {
  const mount = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const path = (req.url ?? "").split("?")[0];
      if (path !== "/api/claude" && path !== "/api/claude/status") return next();

      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const hasBody = req.method !== "GET" && req.method !== "HEAD";
      const request = new Request(`http://${req.headers.host ?? "localhost"}${req.url}`, {
        method: req.method,
        headers: Object.fromEntries(Object.entries(req.headers).filter(([, v]) => typeof v === "string")),
        body: hasBody ? Buffer.concat(chunks) : undefined,
      });

      const response = path === "/api/claude/status" ? handleStatus(env) : await handleClaude(request, env);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(await response.text());
    });
  };
  return { name: "claude-api-dev", configureServer: mount, configurePreviewServer: mount };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), claudeApiDev(env)],
  };
});
