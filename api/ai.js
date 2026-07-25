/* ============================================================
   /api/ai  —  Vercel serverless function
   ------------------------------------------------------------
   Proxies AI requests to OpenRouter so the API key stays in
   Vercel's environment and is NEVER shipped to the browser.

   Required Vercel environment variable:
     OPENROUTER_API_KEY   sk-or-v1-...

   Optional:
     OPENROUTER_MODEL     default: openai/gpt-4o-mini
     AI_SITE_URL          your deployment URL (OpenRouter attribution)
     AI_SITE_NAME         app name shown in OpenRouter dashboard

   GET  /api/ai   -> { configured: bool, model: string }
   POST /api/ai   -> { system, user, maxTokens? } -> { text, model }
   ============================================================ */

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const MAX_INPUT_CHARS = 24000;
const TIMEOUT_MS = 25000;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const key = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  // Health probe — lets the frontend show "Live AI" vs "Simulated AI"
  if (req.method === "GET") {
    return res.status(200).json({ configured: Boolean(key), model: key ? model : null });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!key) {
    // Not an error — the frontend falls back to scripted answers.
    return res.status(501).json({ error: "OPENROUTER_API_KEY is not set", configured: false });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const system = String(body.system || "").slice(0, MAX_INPUT_CHARS);
  const user = String(body.user || "").slice(0, MAX_INPUT_CHARS);
  if (!user) return res.status(400).json({ error: "Missing 'user' field" });

  const maxTokens = Math.min(Math.max(Number(body.maxTokens) || 700, 64), 2000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": process.env.AI_SITE_URL || "https://localhost",
        "X-Title": process.env.AI_SITE_NAME || "Real Estate AI-CRM"
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: user }
        ]
      })
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const msg = data?.error?.message || data?.error || `OpenRouter error ${upstream.status}`;
      console.error("OpenRouter failed:", upstream.status, msg);
      return res.status(502).json({ error: String(msg) });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    if (!text) return res.status(502).json({ error: "Empty response from model" });

    return res.status(200).json({ text, model: data.model || model });
  } catch (err) {
    const aborted = err.name === "AbortError";
    console.error("AI proxy error:", err.message);
    return res.status(aborted ? 504 : 500).json({ error: aborted ? "Model timed out" : "Upstream request failed" });
  } finally {
    clearTimeout(timer);
  }
};
