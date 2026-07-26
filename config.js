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

/* ============================================================
   TELEPHONY  —  client-side settings only. NO SECRETS HERE.
   ------------------------------------------------------------
   Twilio credentials live in Vercel's environment variables and are
   used by /api/twilio-token and /api/twilio-voice on the server.

   Vercel → Project → Settings → Environment Variables:
     TWILIO_ACCOUNT_SID      AC...
     TWILIO_API_KEY_SID      SK...
     TWILIO_API_KEY_SECRET   ...
     TWILIO_TWIML_APP_SID    AP...
     TWILIO_CALLER_ID        +1...    your Twilio number
     TWILIO_ALLOWED_NUMBERS  +91...,+66...   (trial: verified numbers)

   With nothing set, the dialer runs its simulation exactly as before.
   ============================================================ */

window.TWILIO_CONFIG = {
  /* Set automatically to the signed-in agent's id at login. */
  identity: "",

  /* TRIAL TESTING: the demo leads carry fictional numbers, and a Twilio
     trial only connects numbers you verified in the Console. Put your own
     verified number here and every call rings it instead — the lead, the
     timer and the timeline entry still show the real lead.
     Clear it for a production deployment. */
  testNumber: "+919109621850",

  /* Self-hosted Voice SDK path, if you'd rather not hit a CDN.
     Leave empty to use Twilio's CDN with jsDelivr/unpkg as fallbacks. */
  sdkUrl: "",

  /* Verbose Twilio SDK logging in the browser console. */
  debug: false
};

/* Demo branding — change these per client pitch */
window.DEMO_BRAND = {
  company: "Siam Estate Group",
  product: "Omnichannel Real Estate AI-CRM",
  country: "Thailand",
  currency: "THB"
};
