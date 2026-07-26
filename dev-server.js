/* ============================================================
   dev-server.js  —  local stand-in for `vercel dev`
   ------------------------------------------------------------
   Serves the static files and runs everything in /api as a
   serverless function, with the same req/res helpers Vercel adds
   (req.query, req.body, res.status().json()).

   Zero dependencies — plain node.

     node dev-server.js            # http://localhost:3000
     PORT=4000 node dev-server.js

   Reads .env.local (then .env) so the Twilio and OpenRouter keys
   behave exactly like they do on Vercel.
   ============================================================ */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

/* ---------- .env.local / .env ---------- */

function loadEnvFile(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return 0;
  let n = 0;
  for (const raw of fs.readFileSync(p, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key in process.env || !val) continue;   // real env wins
    process.env[key] = val;
    n++;
  }
  return n;
}

const envCount = loadEnvFile(".env.local") + loadEnvFile(".env");

/* ---------- static files ---------- */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

function serveStatic(res, pathname) {
  const rel = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const file = path.join(ROOT, rel);

  // Never serve anything outside the project, or any dotfile (.env!).
  if (!file.startsWith(ROOT) || path.basename(file).startsWith(".")) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }).end("404 " + rel); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
}

/* ---------- serverless-function shim ---------- */

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(""));
  });
}

/* Vercel parses JSON and form bodies into an object before your handler
   runs — mirror that so the same code works in both places. */
function parseBody(raw, contentType) {
  if (!raw) return undefined;
  const ct = String(contentType || "");
  if (ct.includes("application/json")) { try { return JSON.parse(raw); } catch { return raw; } }
  if (ct.includes("application/x-www-form-urlencoded")) return Object.fromEntries(new URLSearchParams(raw));
  return raw;
}

function decorate(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.getHeader("Content-Type")) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = (body) => {
    if (Buffer.isBuffer(body) || typeof body === "string") res.end(body);
    else res.json(body);
    return res;
  };
  return res;
}

async function runFunction(req, res, name, url) {
  const file = path.join(ROOT, "api", name + ".js");
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || !fs.existsSync(file)) {
    return decorate(res).status(404).json({ error: "No such function: /api/" + name });
  }

  req.query = Object.fromEntries(url.searchParams);
  if (req.method !== "GET" && req.method !== "HEAD") {
    req.body = parseBody(await readBody(req), req.headers["content-type"]);
  }

  try {
    delete require.cache[require.resolve(file)];   // pick up edits without a restart
    await require(file)(req, decorate(res));
  } catch (err) {
    console.error(`/api/${name} threw:`, err);
    if (!res.headersSent) decorate(res).status(500).json({ error: "Function error: " + err.message });
  }
}

/* ---------- server ---------- */

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const m = url.pathname.match(/^\/api\/([^/]+)\/?$/);
  console.log(req.method, url.pathname);
  if (m) return runFunction(req, res, m[1].replace(/\.js$/, ""), url);
  serveStatic(res, url.pathname);
}).listen(PORT, () => {
  const twilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_TWIML_APP_SID ? "configured" : "not configured (dialer stays simulated)";
  console.log(`\n  Demo running:  http://localhost:${PORT}`);
  console.log(`  Broker portal: http://localhost:${PORT}/broker.html`);
  console.log(`  Env file:      ${envCount ? envCount + " vars loaded" : "none found (.env.local)"}`);
  console.log(`  OpenRouter:    ${process.env.OPENROUTER_API_KEY ? "configured" : "not configured (scripted answers)"}`);
  console.log(`  Twilio:        ${twilio}\n`);
});
