/* ============================================================
   /api/twilio-voice  —  TwiML webhook
   ------------------------------------------------------------
   Twilio calls THIS url when the browser client (or /api/twilio-call)
   places a call. It answers with TwiML telling Twilio who to dial.

   Wire it up in Console → Voice → TwiML Apps → your app:
     Voice Request URL:  https://<your-app>.vercel.app/api/twilio-voice
     HTTP method:        POST

   Required environment variables:
     TWILIO_CALLER_ID         +1...   your Twilio number (the caller ID)

   Optional:
     TWILIO_ALLOWED_NUMBERS   +9198...,+66...   hard allow-list.
                              On a TRIAL account Twilio only connects
                              numbers you verified in the Console, so
                              mirroring them here gives a clear spoken
                              error instead of a silent failure.
     TWILIO_RECORD            "true" to record calls (off by default —
                              recording consent is a legal requirement
                              in most jurisdictions, incl. TH/IN/EU).
     TWILIO_DIAL_TIMEOUT      seconds to ring before giving up (default 30)

   The destination arrives as the `To` parameter — from the Voice SDK
   (Device.connect({ params: { To } })) or from the ?To= query string
   used by /api/twilio-call.
   ============================================================ */

const DEFAULT_TIMEOUT = 30;

const escXml = (v) =>
  String(v == null ? "" : v).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

/* Vercel parses form-encoded bodies into an object, but be defensive:
   Twilio posts application/x-www-form-urlencoded, and `vercel dev`
   sometimes hands the raw string through. */
function readParams(req) {
  const out = Object.assign({}, req.query || {});
  let body = req.body;
  if (typeof body === "string") {
    body = Object.fromEntries(new URLSearchParams(body));
  }
  if (body && typeof body === "object") Object.assign(out, body);
  return out;
}

/* Accept what a CRM realistically stores — "+66 81 234 5678",
   "081-234-5678" — and normalise to E.164 where possible. */
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

function say(res, message) {
  res.setHeader("Content-Type", "text/xml; charset=utf-8");
  return res.status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="alice">${escXml(message)}</Say><Hangup/></Response>`
  );
}

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const params = readParams(req);
  const callerId = process.env.TWILIO_CALLER_ID;

  if (!callerId) {
    console.error("TWILIO_CALLER_ID is not set — cannot place outbound calls.");
    return say(res, "This demo is not configured for outbound calling yet.");
  }

  const to = toE164(params.To || params.to, process.env.TWILIO_DEFAULT_COUNTRY_CODE);
  if (!to) {
    return say(res, "Sorry, the number for this lead is not a valid phone number.");
  }

  const allowList = (process.env.TWILIO_ALLOWED_NUMBERS || "")
    .split(",").map((n) => toE164(n, process.env.TWILIO_DEFAULT_COUNTRY_CODE)).filter(Boolean);

  if (allowList.length && !allowList.includes(to)) {
    console.warn("Blocked outbound call to non-allow-listed number:", to);
    return say(res, "That number is not on the verified list for this trial account.");
  }

  const timeout = Number(process.env.TWILIO_DIAL_TIMEOUT) || DEFAULT_TIMEOUT;
  const record = process.env.TWILIO_RECORD === "true";

  /* answerOnBridge keeps the caller hearing real ringback until the
     lead actually answers — that is what makes the dialer feel live. */
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${escXml(callerId)}" answerOnBridge="true" timeout="${timeout}"${record ? ' record="record-from-answer-dual"' : ""}>
    <Number>${escXml(to)}</Number>
  </Dial>
</Response>`;

  res.setHeader("Content-Type", "text/xml; charset=utf-8");
  return res.status(200).send(xml);
};
