# Omnichannel Real Estate AI-CRM — Client Prototype

Clickable prototype for the **Proprietary Omnichannel Real Estate AI-CRM & B2B Broker Portal**
requirement document. Covers sections 2.1, 2.2, 2.3, 2.4 and 3.

Professional light theme. No frameworks, no build step, no dependencies.

---

## Run locally

Double-click **`index.html`**. Works offline, from a USB stick.
AI answers are scripted (but still grounded in the real property database).

To test the `/api/*` functions locally — zero dependencies, no vercel login:

```bash
npm start                    # http://localhost:3000
PORT=4000 npm start          # if 3000 is taken
```

`dev-server.js` serves the static files and runs everything in `api/` the same way
Vercel does, reading `.env.local` for keys. Or use the real thing:

```bash
npm i -g vercel && vercel dev
```

⚠ Twilio's webhook must be **publicly reachable**, so `localhost` is fine for the
UI and for browser audio, but live calling needs a deployment (or
`ngrok http 4000`) as the TwiML App's Voice Request URL.

---

## Deploy to Vercel

```bash
cd ai-crm-demo
vercel                # first deploy
vercel --prod         # production
```

Zero config needed — Vercel serves the static files from the root and turns
`api/ai.js` into a serverless function automatically.

### Environment variables

Vercel → your project → **Settings → Environment Variables**:

| Variable | Required | Example |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ yes | `sk-or-v1-…` |
| `OPENROUTER_MODEL` | optional | `openai/gpt-4o-mini` (default) |
| `AI_SITE_URL` | optional | `https://your-app.vercel.app` |
| `AI_SITE_NAME` | optional | `Real Estate AI-CRM` |

Add them to **Production, Preview and Development**, then redeploy
(env vars only take effect on a new deployment).

**Popular `OPENROUTER_MODEL` values:**
`openai/gpt-4o-mini` (cheapest, fine for a demo) ·
`anthropic/claude-sonnet-4.5` · `google/gemini-2.0-flash-001` · `meta-llama/llama-3.3-70b-instruct`

### How the key stays safe

```
Browser  ──POST /api/ai──▶  Vercel function  ──Bearer key──▶  OpenRouter
   ▲                        (key from env)                        │
   └───────────── answer text only ◀────────────────────────────┘
```

The key is **never** in `config.js`, never in the HTML, never in the network tab.
The browser only ever talks to your own `/api/ai`.

`config.js` has an `apiKey` field — that is for **local testing only**. Leave it empty
for any deployment.

### Graceful degradation

| Situation | What the client sees |
|---|---|
| Key set, model responds | Real AI answers, badge reads `Live AI · OpenRouter` |
| Key not set | Scripted answers, badge reads `Simulated AI` |
| Key set but model errors/times out | Silently falls back to scripted — **no error shown** |
| Opened as a local file | Scripted answers |

The demo can never break in front of a client because of an API problem.

---

## Real calling with Twilio (2.1 VoWiFi)

With no Twilio credentials the dialer runs its simulation exactly as before.
Add the env vars and the same screen places **real calls from the browser mic** —
state machine, timer, mute, disposition and timeline logging are the same code.

### One-time setup (≈10 minutes)

1. **Verify the number you will call** — Console → Phone Numbers → *Verified Caller IDs*.
   A trial account connects **only** verified numbers.
2. **Buy a Twilio number** (Console → Phone Numbers → Buy a number, Voice capability).
   Trial credit covers it. Indian numbers need KYC/regulatory docs — a US number
   works fine for a demo.
3. **Create an API key** — Console → Account → *API keys & tokens* → Standard.
   Copy the SID and the secret (shown once).
4. **Create a TwiML App** — Console → Voice → TwiML → *TwiML Apps*.
   Set **Voice Request URL** to `https://<your-app>.vercel.app/api/twilio-voice`, method **POST**.
5. Add the env vars below and redeploy.
6. Open the dialer over **https** and allow the mic. The pill in *Call queue*
   flips from `○ simulated` to `● live`.

### Environment variables

| Variable | Required | Example |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | ✅ | `AC…` |
| `TWILIO_API_KEY_SID` | ✅ | `SK…` |
| `TWILIO_API_KEY_SECRET` | ✅ | (shown once) |
| `TWILIO_TWIML_APP_SID` | ✅ | `AP…` |
| `TWILIO_CALLER_ID` | ✅ | `+15550001111` — your Twilio number |
| `TWILIO_ALLOWED_NUMBERS` | recommended | `+919812345678,+66812345678` |
| `TWILIO_DEFAULT_COUNTRY_CODE` | optional | `66` — prefixes bare local numbers |
| `TWILIO_DIAL_TIMEOUT` | optional | `30` seconds |
| `TWILIO_RECORD` | optional | `false` (default) — see consent note below |
| `TWILIO_AGENT_PHONE`, `TWILIO_PUBLIC_URL`, `TWILIO_AUTH_TOKEN` | optional | only for `/api/twilio-call` |

`.env.example` lists all of them. Copy it to `.env.local` for `vercel dev`.

### Calling a demo lead

The sample leads carry fictional Thai numbers, so a trial account will refuse them.
Set `testNumber` in `config.js` to your verified number — every call rings it while
the UI still shows the real lead, its timer and its timeline entry:

```js
window.TWILIO_CONFIG = { testNumber: "+919812345678", … };
```

`TWILIO_ALLOWED_NUMBERS` is the server-side guard for the same problem: anything
outside the list is refused by `/api/twilio-voice` with a spoken message, and the
dialer shows an amber warning **before** you press call.

### Trial-account reality

- Only **verified** numbers connect. Everything else is rejected.
- Calls are billed against the free trial credit (~$15) — not unlimited.
- Twilio plays *"You have a trial account…"* before every call. Upgrading removes it.
- Caller ID is often rewritten by Indian carriers (TRAI rules). Say so in the pitch.

### Two paths, same UI

```
A (default)  Browser mic ──WebRTC──▶ Twilio ──▶ /api/twilio-voice ──▶ lead's phone
             /api/twilio-token mints a 1-hour JWT. Secret stays on the server.

B (fallback) POST /api/twilio-call ──▶ Twilio rings the AGENT's phone,
             then bridges it to the lead. No mic, no https, no WebRTC.
```

Use **B** when a client laptop blocks mic access mid-pitch — set `TWILIO_AGENT_PHONE`
and POST `{ "to": "+66…" }`.

### Recording

Off by default. `TWILIO_RECORD=true` enables dual-channel recording — but recording a
call without informing both parties is unlawful under Thai PDPA, Indian TRAI rules and
GDPR. Add a spoken disclosure before switching it on. The prototype's `recording`
badge is a UI flag; playback is still stubbed.

---

## Logins

| Role | Menu items | Sees |
|---|---|---|
| **Sales Agent** | 7 | Own leads, pipeline, calling, AI assistant, content studio |
| **Sales Manager** | 12 | + routing matrix, competitors, marketing, analytics, brokers, PDPA |
| **Executive** | 11 | Org-wide analytics, ROI, broker network, compliance |
| **External Broker** | 4 | `broker.html` — commissions + collateral only |

Role selection only, no passwords. Real authentication is Phase 2.

---

## What is real vs simulated

| Feature | Status |
|---|---|
| Role-based menus, data, dashboards | 🟢 Real |
| Omnichannel inbox, filtering, replying | 🟢 Real |
| Customer 360° unified timeline | 🟢 Real |
| Pipeline drag-and-drop (persists) | 🟢 Real |
| Smart routing matrix + escalation timer | 🟢 Real logic (6s instead of 5min) |
| Call state machine, timer, auto-logging | 🟢 Real |
| RAG retrieval over property database | 🟢 Real |
| **AI generation (with key)** | 🟢 **Real — OpenRouter** |
| Analytics, funnels, ROI, leaderboard | 🟢 Real (computed live) |
| Broker commissions, tiers, vault listing | 🟢 Real |
| PDPA erase + data export | 🟢 Real (actually deletes) |
| **Call audio (with Twilio env vars)** | 🟢 **Real — browser mic to a real phone** |
| Call audio (no credentials) | 🟡 Simulated — no telephony |
| AI wording (no key) | 🟡 Scripted |
| Recording playback, file downloads | 🟡 Stubbed |
| Channel connections (LINE/WhatsApp/…) | 🔴 Not connected — Phase 2 |
| Auth, multi-user, real database | 🔴 Phase 2 |

---

## Suggested 10-minute client walkthrough

1. **Login as Sales Agent** — "every role gets a different system" (2.1 RBAC)
2. **Omnichannel Inbox** — filter LINE, then WhatsApp. "Nine sources, one screen"
3. Open **Pim Charoensuk** → **Customer 360°** — chats, calls, recordings on one timeline
4. Back in the thread → **✦ Generate personalised pitch** (2.2)
5. **Pipeline** — drag a card from Viewing to Negotiation. "It saves"
6. **VoWiFi Calling** — select a lead, call, watch ring → connect → recording, hang up,
   log a disposition, then reopen Customer 360° — the call is on the timeline
7. **AI Assistant** — ask *"What's the price of a 2BR at Sukhumvit Grand?"*
   Point at the source chips: "it cannot invent a price, it reads the database"
   Then *"I want to book a viewing"* → watch it escalate to a human (Section 5)
8. **Switch role → Manager** — note the menu grew
9. **Smart Routing** — Chinese + Investment, press Route, **let the timer run out**
   → auto-escalation. "A lead is never dropped"
10. **Competitor Intel** → Run analysis (2.2)
11. **Switch role → Executive** → **Executive Reports**, then **PDPA Center** →
    erase a customer, watch the consent log flip to "erased" (Section 3)
12. **Sign out → External Broker** → the separate gold partner portal (2.4)

Press **Reset data** in the sidebar before each pitch.

---

## Files

```
index.html      internal CRM shell
broker.html     external B2B partner portal (self-contained)
config.js           branding + local-test key slot (no secrets)
data.js             projects, units, leads, chats, competitors, brokers
ai.js               RAG retrieval + proxy client + scripted fallback
twilio.js           telephony client — live Twilio or simulation
app.js              all 13 internal screens
styles.css          professional light theme
api/ai.js           ← serverless: OpenRouter proxy
api/twilio-token.js ← serverless: mints the Voice access token
api/twilio-voice.js ← serverless: TwiML webhook, dials the lead
api/twilio-call.js  ← serverless: server-initiated call (fallback path)
.env.example        every env var, with comments
package.json        node engine + check script
```

Run `npm run check` to syntax-check everything.

---

## Honest notes for the pitch

- Call it a **clickable prototype with sample data**, not a working product.
  Section 6 (phased delivery) means the client expects exactly this.
- All names, prices and projects are **fictional**.
- Section 4 requires **100% IP transfer** and prohibits wrapping existing CRMs —
  this code is written from scratch. The only third-party code is the **Twilio Voice
  SDK**, loaded at runtime *only* when live calling is switched on. Twilio is carrier
  infrastructure, not a CRM: every screen, data model and workflow is ours, and the
  telephony layer is one swappable file (`twilio.js` + three `api/twilio-*` functions)
  if the client prefers their own SIP/VoWiFi provider.
- Live calling needs **https** and mic permission. Rehearse it on the client's network
  before the pitch, and keep the simulation as the fallback (clear the env vars or
  the dialer falls back on its own if Twilio errors).
- Anyone with the Vercel URL can open the demo. Add Vercel password protection
  (Settings → Deployment Protection) before sharing it outside the client team,
  since the OpenRouter key is billed per call.
