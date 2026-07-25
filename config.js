/* ============================================================
   CONFIG  —  client-side settings only. NO SECRETS HERE.
   ------------------------------------------------------------
   The OpenRouter key lives in Vercel's environment variables and
   is used by /api/ai.js on the server. It is never sent to the
   browser.

   Vercel → Project → Settings → Environment Variables:
     OPENROUTER_API_KEY = sk-or-v1-...      (required)
     OPENROUTER_MODEL   = openai/gpt-4o-mini (optional)
     AI_SITE_URL        = https://your-app.vercel.app (optional)
     AI_SITE_NAME       = Real Estate AI-CRM (optional)

   With no key set, every screen still works — the AI answers
   are scripted but still grounded in the real property database.
   ============================================================ */

window.AI_CONFIG = {
  /* LOCAL TESTING ONLY. Leave empty for any deployment.
     A key here is visible to anyone who opens the page source. */
  apiKey: "",
  model: "",

  /* If the model errors or times out mid-demo, fall back to the
     scripted answer instead of showing the client an error. */
  fallbackToScripted: true,
  timeoutMs: 25000
};

/* Demo branding — change these per client pitch */
window.DEMO_BRAND = {
  company: "Siam Estate Group",
  product: "Omnichannel Real Estate AI-CRM",
  country: "Thailand",
  currency: "THB"
};
