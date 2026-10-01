const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export async function callClaude(systemPrompt, userMessage) {
  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    let message = "Claude API call failed";
    const text = await response.text();
    try {
      const err = JSON.parse(text);
      message = err.error?.message || message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    throw new Error(message);
  }

  const data = await response.json();
  const blocks = Array.isArray(data.content) ? data.content : [];
  const textParts = blocks
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text);
  return textParts.join("\n").trim() || blocks[0]?.text || "";
}
