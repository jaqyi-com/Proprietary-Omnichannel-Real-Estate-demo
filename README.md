# Omnichannel Real Estate AI-CRM — Client Prototype

Clickable prototype for the **Proprietary Omnichannel Real Estate AI-CRM & B2B Broker Portal**
requirement document. Covers sections 2.1, 2.2, 2.3, 2.4 and 3.

Professional light theme. No frameworks, no build step, no dependencies.

---

## Run locally

Double-click **`index.html`**. Works offline, from a USB stick.
AI answers are scripted (but still grounded in the real property database).

To test the AI proxy locally:

```bash
npm i -g vercel
vercel dev            # then open http://localhost:3000
```

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
| Call **audio** | 🟡 Simulated — no telephony |
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
config.js       branding + local-test key slot (no secrets)
data.js         projects, units, leads, chats, competitors, brokers
ai.js           RAG retrieval + proxy client + scripted fallback
app.js          all 13 internal screens
styles.css      professional light theme
api/ai.js       ← Vercel serverless function (holds nothing, reads env)
package.json    node engine + check script
```

Run `npm run check` to syntax-check everything.

---

## Honest notes for the pitch

- Call it a **clickable prototype with sample data**, not a working product.
  Section 6 (phased delivery) means the client expects exactly this.
- All names, prices and projects are **fictional**.
- Section 4 requires **100% IP transfer** and prohibits wrapping existing CRMs —
  this code is written from scratch with zero third-party libraries.
- Anyone with the Vercel URL can open the demo. Add Vercel password protection
  (Settings → Deployment Protection) before sharing it outside the client team,
  since the OpenRouter key is billed per call.
