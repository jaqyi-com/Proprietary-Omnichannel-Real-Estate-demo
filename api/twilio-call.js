/* ============================================================
   /api/twilio-call  —  server-initiated call (fallback path)
   ------------------------------------------------------------
   Use this when browser audio is not an option — blocked mic
   permission, no https, or a client demo on a locked-down laptop.

   Twilio rings the AGENT's own phone first; when the agent picks up,
   Twilio dials the LEAD and bridges the two legs. No WebRTC involved.

   POST /api/twilio-call   { "to": "+66812345678", "agentPhone": "+91..." }
     -> 200 { sid, status, to, agentPhone }

   Required environment variables:
     TWILIO_ACCOUNT_SID       AC...
     TWILIO_CALLER_ID         +1...    your Twilio number
     and ONE of:
       TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET   (preferred)
       TWILIO_AUTH_TOKEN                            (full-access, avoid)

   Optional:
     TWILIO_AGENT_PHONE       default agent leg if the body omits it
     TWILIO_ALLOWED_NUMBERS   allow-list, same as /api/twilio-voice
     TWILIO_PUBLIC_URL        https://your-app.vercel.app
                              (only needed if the forwarded host is wrong)
   ============================================================ */

const TIMEOUT_MS = 15000;

function toE164(raw, defaultCountryCode) {
  let n = String(raw || "").trim().replace(/[^\d+]/g, "");
  if (!n) return null;
  if (n.startsWith("00")) n = "+" + n.slice(2);
  if (!n.startsWith("+")) {
    const cc = String(defaultCountryCode || "").replace(/[^\d]/g, "");
    if (!cc) return null;
    n = "+" + cc + n.replace(/^0+/, "");
  }
  return /^\+[1-9]\d{6,14}$/.test(n) ? n : null;
}

function publicBase(req) {
  const configured = (process.env.TWILIO_PUBLIC_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const callerId = process.env.TWILIO_CALLER_ID;
  const keySid = process.env.TWILIO_API_KEY_SID;
  const keySecret = process.env.TWILIO_API_KEY_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  const user = keySid && keySecret ? keySid : accountSid;
  const pass = keySid && keySecret ? keySecret : authToken;

  if (!accountSid || !callerId || !pass) {
    return res.status(501).json({
      error: "Twilio is not configured for server-initiated calls",
      configured: false
    });
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== "object") return res.status(400).json({ error: "Invalid JSON body" });

  const cc = process.env.TWILIO_DEFAULT_COUNTRY_CODE;
  const to = toE164(body.to, cc);
  const agentPhone = toE164(body.agentPhone || process.env.TWILIO_AGENT_PHONE, cc);

  if (!to) return res.status(400).json({ error: "Invalid or missing 'to' number" });
  if (!agentPhone) return res.status(400).json({ error: "Invalid or missing 'agentPhone' (set TWILIO_AGENT_PHONE)" });

  /* On a trial account BOTH legs must be verified numbers, so check both. */
  const allowList = (process.env.TWILIO_ALLOWED_NUMBERS || "")
    .split(",").map((n) => toE164(n, cc)).filter(Boolean);
  if (allowList.length) {
    const blocked = [to, agentPhone].filter((n) => !allowList.includes(n));
    if (blocked.length) {
      return res.status(403).json({ error: "Number not on the verified allow-list", blocked });
    }
  }

  /* The agent leg answers, then /api/twilio-voice bridges it to the lead. */
  const twimlUrl = `${publicBase(req)}/api/twilio-voice?To=${encodeURIComponent(to)}`;

  const form = new URLSearchParams({
    To: agentPhone,
    From: callerId,
    Url: twimlUrl,
    Method: "POST",
    Timeout: String(Number(process.env.TWILIO_DIAL_TIMEOUT) || 30)
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Calls.json`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: "Basic " + Buffer.from(`${user}:${pass}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form.toString()
      }
    );

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const msg = data && data.message ? data.message : `Twilio error ${upstream.status}`;
      console.error("Twilio call create failed:", upstream.status, msg);
      return res.status(502).json({ error: String(msg), code: data && data.code });
    }

    return res.status(200).json({ sid: data.sid, status: data.status, to, agentPhone });
  } catch (err) {
    const aborted = err.name === "AbortError";
    console.error("Twilio call error:", err.message);
    return res.status(aborted ? 504 : 500).json({ error: aborted ? "Twilio timed out" : "Request to Twilio failed" });
  } finally {
    clearTimeout(timer);
  }
};
