/* ============================================================
   TELEPHONY LAYER  (Requirement 2.1 — VoWiFi / browser calling)
   ------------------------------------------------------------
   Two modes, same interface — exactly like ai.js:

   1. NOT CONFIGURED -> the dialer stays simulated. Nothing on this
                        page breaks, no network calls are made.
   2. CONFIGURED     -> real audio over Twilio Voice from the agent's
                        browser mic. State machine, timer, mute and
                        auto-logging stay unchanged.

   Server side lives in /api/twilio-token and /api/twilio-voice.
   No credentials ever reach this file.
   ============================================================ */

const TW = (() => {
  const cfg = () => window.TWILIO_CONFIG || {};

  /* server: "unknown" before probing, "ready" when the backend has
     Twilio credentials, "absent" on file:// or when unconfigured. */
  let server = "unknown";
  let info = {};                 // { callerId, identity, allowList }
  let device = null;             // Twilio.Device
  let activeCall = null;         // Twilio.Call
  let sdkPromise = null;
  let lastError = null;

  /* The SDK is only fetched when Twilio is actually configured, so an
     offline demo never waits on a CDN. Override with
     window.TWILIO_CONFIG.sdkUrl if you self-host the file.

     Pinned version first so a demo never picks up a breaking change
     mid-pitch. Twilio's own CDN is last — it answers 403 from some
     networks, and a failed attempt costs a round-trip. */
  const SDK_VERSION = "2.18.3";
  const SDK_URLS = [
    `https://cdn.jsdelivr.net/npm/@twilio/voice-sdk@${SDK_VERSION}/dist/twilio.min.js`,
    `https://unpkg.com/@twilio/voice-sdk@${SDK_VERSION}/dist/twilio.min.js`,
    `https://sdk.twilio.com/js/voice/releases/${SDK_VERSION}/twilio.min.js`
  ];

  const isLive = () => server === "ready";

  function status() {
    if (server === "ready") {
      return { live: true, label: "Live calling · Twilio" + (info.callerId ? " · " + info.callerId : "") };
    }
    return { live: false, label: "Simulated calling" };
  }

  /* ---------- backend probe ---------- */

  async function probe() {
    if (server !== "unknown") return server;
    if (typeof location === "undefined" || location.protocol === "file:") {
      server = "absent";
      return server;
    }
    try {
      const res = await fetch(tokenUrl(), { method: "GET" });
      const json = await res.json();
      if (json && json.configured) {
        server = "ready";
        info = { callerId: json.callerId || null, identity: json.identity || null, allowList: json.allowList || [] };
      } else {
        server = "absent";
        if (json && json.missing) lastError = "Missing env: " + json.missing.join(", ");
      }
    } catch {
      server = "absent";
    }
    return server;
  }

  function tokenUrl() {
    return "/api/twilio-token?identity=" + encodeURIComponent(cfg().identity || "agent");
  }

  async function fetchToken() {
    const res = await fetch(tokenUrl(), { method: "GET" });
    const json = await res.json();
    if (!json || !json.configured || !json.token) throw new Error("Twilio is not configured on the server");
    info = { callerId: json.callerId || null, identity: json.identity || null, allowList: json.allowList || [] };
    return json.token;
  }

  /* ---------- SDK loading ---------- */

  const SDK_LOAD_TIMEOUT_MS = 12000;

  function injectScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement("script");
      // A blocked CDN can hang without firing either event — never let the
      // dialer sit in "Dialing…" forever because of that.
      const timer = setTimeout(() => reject(new Error("timed out loading " + src)), SDK_LOAD_TIMEOUT_MS);
      const done = (fn, arg) => { clearTimeout(timer); fn(arg); };
      el.src = src;
      el.async = true;
      el.onload = () => (window.Twilio && window.Twilio.Device
        ? done(resolve, src)
        : done(reject, new Error("loaded but no Twilio.Device")));
      el.onerror = () => done(reject, new Error("failed to load " + src));
      document.head.appendChild(el);
    });
  }

  function loadSdk() {
    if (window.Twilio && window.Twilio.Device) return Promise.resolve();
    if (sdkPromise) return sdkPromise;

    const urls = cfg().sdkUrl ? [cfg().sdkUrl] : SDK_URLS;
    sdkPromise = (async () => {
      let err = null;
      for (const url of urls) {
        try { await injectScript(url); return; } catch (e) { err = e; }
      }
      sdkPromise = null;
      throw new Error("Twilio Voice SDK could not be loaded — " + (err ? err.message : "unknown error"));
    })();
    return sdkPromise;
  }

  /* ---------- device ---------- */

  async function ensureDevice() {
    if (device) return device;
    await loadSdk();
    const token = await fetchToken();

    device = new window.Twilio.Device(token, {
      codecPreferences: ["opus", "pcmu"],
      // Twilio's own logger is noisy; keep the console usable during a pitch.
      logLevel: cfg().debug ? "debug" : "error"
    });

    device.on("error", (e) => {
      lastError = e && e.message ? e.message : String(e);
      console.error("Twilio device error:", lastError);
    });

    // Tokens are short-lived — refresh before they expire mid-call.
    device.on("tokenWillExpire", async () => {
      try { device.updateToken(await fetchToken()); }
      catch (e) { console.error("Token refresh failed:", e.message); }
    });

    await device.register();
    return device;
  }

  /* ---------- calling ---------- */

  /* dial(to, handlers) — handlers: onRinging, onConnected, onEnded, onError.
     Resolves once the call is placed; the handlers drive the UI after that. */
  async function dial(to, handlers) {
    const h = handlers || {};
    lastError = null;

    if (!isLive()) throw new Error("Twilio is not configured");
    if (activeCall) throw new Error("A call is already in progress");

    const dev = await ensureDevice();

    const call = await dev.connect({ params: { To: String(to || "") } });
    activeCall = call;

    call.on("ringing", () => { if (h.onRinging) h.onRinging(); });
    call.on("accept", () => { if (h.onConnected) h.onConnected(); });

    const finish = (reason) => {
      if (activeCall !== call) return;   // already cleaned up
      activeCall = null;
      if (h.onEnded) h.onEnded(reason);
    };
    call.on("disconnect", () => finish("disconnect"));
    call.on("cancel", () => finish("cancel"));
    call.on("reject", () => finish("reject"));

    call.on("error", (e) => {
      lastError = e && e.message ? e.message : String(e);
      activeCall = null;
      if (h.onError) h.onError(lastError);
    });

    return call;
  }

  function hangup() {
    if (activeCall) { try { activeCall.disconnect(); } catch { /* already gone */ } }
    activeCall = null;
  }

  function mute(on) {
    if (!activeCall) return false;
    try { activeCall.mute(Boolean(on)); return true; } catch { return false; }
  }

  const inCall = () => Boolean(activeCall);
  const error = () => lastError;
  const callerId = () => info.callerId || null;

  /* Trial accounts only connect numbers verified in the Twilio Console.
     When TWILIO_ALLOWED_NUMBERS mirrors that list we can warn up front
     instead of letting the agent hear a rejection mid-demo. */
  function isAllowed(number) {
    if (!info.allowList || !info.allowList.length) return true;
    const digits = String(number || "").replace(/[^\d]/g, "");
    if (!digits) return false;
    return info.allowList.some((n) => {
      const d = String(n).replace(/[^\d]/g, "");
      if (!d) return false;
      if (d === digits) return true;
      /* Tolerate a missing country code, but only on long numbers —
         a short suffix match would happily confuse two countries. */
      const shortest = Math.min(d.length, digits.length);
      return shortest >= 10 && (d.endsWith(digits) || digits.endsWith(d));
    });
  }

  return { probe, isLive, status, dial, hangup, mute, inCall, error, callerId, isAllowed };
})();

window.TW = TW;
