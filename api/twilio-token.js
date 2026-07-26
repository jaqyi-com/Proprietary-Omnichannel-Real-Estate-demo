/* ============================================================
   /api/twilio-token  —  Vercel serverless function
   ------------------------------------------------------------
   Mints a short-lived Twilio Voice Access Token so the browser
   can place calls with the Voice JS SDK. The API key secret
   NEVER leaves the server.

   Required environment variables:
     TWILIO_ACCOUNT_SID       AC...
     TWILIO_API_KEY_SID       SK...      (Console → Account → API keys)
     TWILIO_API_KEY_SECRET    ...        (shown once when the key is created)
     TWILIO_TWIML_APP_SID     AP...      (Console → Voice → TwiML Apps)
     TWILIO_CALLER_ID         +1...      (your Twilio number, used as caller ID)

   The TwiML App's "Voice Request URL" must point at:
     https://<your-app>.vercel.app/api/twilio-voice   (HTTP POST)

   GET /api/twilio-token?identity=agent_1
     -> 200 { configured: true, token, identity, ttl, callerId }
     -> 200 { configured: false, missing: [...] }   when not set up

   No secrets are ever returned — only the signed JWT.
   ============================================================ */

const crypto = require("crypto");

const TTL_SECONDS = 3600;          // Twilio maximum is 24h; 1h is plenty
const IDENTITY_MAX = 40;

const b64url = (input) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/* Twilio Access Token = HS256 JWT signed with the API key secret.
   The `cty` header and the grants shape are what the Voice SDK expects. */
function mintAccessToken({ accountSid, keySid, secret, appSid, identity, ttl }) {
  const iat = Math.floor(Date.now() / 1000);

  const header = { alg: "HS256", typ: "JWT", cty: "twilio-fpa;v=1" };
  const payload = {
    jti: `${keySid}-${iat}`,
    iss: keySid,
    sub: accountSid,
    iat,
    exp: iat + ttl,
    grants: {
      identity,
      voice: {
        // outgoing = browser can dial out through this TwiML App
        outgoing: { application_sid: appSid },
        // incoming = Twilio can ring this browser client by identity
        incoming: { allow: true }
      }
    }
  };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = b64url(crypto.createHmac("sha256", secret).update(signingInput).digest());
  return `${signingInput}.${signature}`;
}

/* Voice SDK identities allow a limited character set. Anything else is
   dropped rather than rejected, so a stray lead name can't break the demo. */
function cleanIdentity(raw) {
  const cleaned = String(raw || "").replace(/[^A-Za-z0-9_.\-]/g, "").slice(0, IDENTITY_MAX);
  return cleaned || "agent";
}

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const env = {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID: process.env.TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET: process.env.TWILIO_API_KEY_SECRET,
    TWILIO_TWIML_APP_SID: process.env.TWILIO_TWIML_APP_SID
  };
  const missing = Object.keys(env).filter((k) => !env[k]);

  // Not an error — the dialer simply stays in simulated mode.
  if (missing.length) {
    return res.status(200).json({ configured: false, missing });
  }

  const identity = cleanIdentity(req.query && req.query.identity);

  try {
    const token = mintAccessToken({
      accountSid: env.TWILIO_ACCOUNT_SID,
      keySid: env.TWILIO_API_KEY_SID,
      secret: env.TWILIO_API_KEY_SECRET,
      appSid: env.TWILIO_TWIML_APP_SID,
      identity,
      ttl: TTL_SECONDS
    });

    return res.status(200).json({
      configured: true,
      token,
      identity,
      ttl: TTL_SECONDS,
      // Public caller ID, safe to show in the UI ("calling from …")
      callerId: process.env.TWILIO_CALLER_ID || null,
      // Lets the UI warn "trial: only verified numbers" before dialing
      allowList: (process.env.TWILIO_ALLOWED_NUMBERS || "")
        .split(",").map((n) => n.trim()).filter(Boolean)
    });
  } catch (err) {
    console.error("Twilio token mint failed:", err.message);
    return res.status(500).json({ error: "Could not mint access token" });
  }
};
