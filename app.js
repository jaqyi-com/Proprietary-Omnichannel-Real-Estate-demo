/* ============================================================
   Omnichannel Real Estate AI-CRM — demo application
   Vanilla JS, no build step, no server.
   ============================================================ */

const D = window.DEMO;
const STORE_KEY = "recrm_demo_v2";

/* ---------------- state ---------------- */

const S = {
  role: null,
  me: null,
  page: "dashboard",
  leads: [],
  conversations: {},
  calls: [],
  selectedLeadId: null,
  inboxFilter: "all",
  chat: [],
  call: { state: "idle", leadId: null, seconds: 0, timer: null, muted: false },
  routing: { running: false, steps: [], assigned: null, escalatedTo: null, pct: 0, timer: null },
  aiBusy: false
};

const NAV = [
  ["My Work", [
    ["dashboard",   "Dashboard",        "▤", ["agent", "manager", "executive"]],
    ["inbox",       "Omnichannel Inbox","✉", ["agent", "manager", "executive"]],
    ["pipeline",    "Sales Pipeline",   "▦", ["agent", "manager", "executive"]],
    ["dialer",      "VoWiFi Calling",   "☎", ["agent", "manager"]],
    ["properties",  "Properties",       "⌂", ["agent", "manager", "executive"]]
  ]],
  ["AI Suite (2.2)", [
    ["aichat",      "AI Assistant",     "✦", ["agent", "manager", "executive"]],
    ["aicontent",   "AI Content Studio","✎", ["agent", "manager"]],
    ["competitors", "Competitor Intel", "◎", ["manager", "executive"]],
    ["marketing",   "Marketing Auto",   "◈", ["manager", "executive"]]
  ]],
  ["Management", [
    ["routing",     "Smart Routing",    "⇄", ["manager", "executive"]],
    ["analytics",   "Executive Reports","◉", ["manager", "executive"]],
    ["brokers",     "B2B Brokers",      "⚹", ["manager", "executive"]],
    ["pdpa",        "PDPA Center",      "⛨", ["manager", "executive"]]
  ]]
];

/* ---------------- helpers ---------------- */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const baht = (n) => "฿" + Number(n || 0).toLocaleString("en-US");
const short = (n) => n >= 1e6 ? "฿" + (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? "฿" + Math.round(n / 1e3) + "k" : baht(n);
const clone = (o) => JSON.parse(JSON.stringify(o));
const lead = (id) => S.leads.find((l) => l.id === id);
const agent = (id) => D.AGENTS.find((a) => a.id === id);
const project = (id) => D.PROJECTS.find((p) => p.id === id);
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function chanBadge(key) {
  const c = D.CHANNELS[key] || { icon: "?", color: "#999", label: key };
  return `<span class="chan" style="background:${c.color}" title="${esc(c.label)}">${esc(c.icon)}</span>`;
}

function md(t) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br>");
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = md(msg);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function modal(title, bodyHtml, footHtml = "") {
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.innerHTML = `<div class="modal">
    <div class="card-h"><h3>${esc(title)}</h3><div class="spacer"></div>
      <button class="btn sm ghost" data-x>✕</button></div>
    <div class="card-b">${bodyHtml}</div>
    ${footHtml ? `<div class="card-b" style="border-top:1px solid var(--border)">${footHtml}</div>` : ""}
  </div>`;
  bg.addEventListener("click", (e) => { if (e.target === bg || e.target.hasAttribute("data-x")) bg.remove(); });
  document.body.appendChild(bg);
  return bg;
}

/* ---------------- persistence ---------------- */

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      leads: S.leads, conversations: S.conversations, calls: S.calls, role: S.role
    }));
  } catch (e) { /* demo only */ }
}

function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { saved = null; }
  S.leads = saved?.leads || clone(D.LEADS);
  S.conversations = saved?.conversations || clone(D.CONVERSATIONS);
  S.calls = saved?.calls || clone(D.CALLS);
}

function resetDemo() {
  localStorage.removeItem(STORE_KEY);
  load();
  S.chat = [];
  render();
  toast("Demo data reset to factory state.");
}

/* ---------------- LOGIN ---------------- */

function renderLogin() {
  document.body.innerHTML = `
  <div class="login-wrap">
    <div class="login-card">
      <div class="brandline"><span class="mark">◆</span>
        <span style="font-weight:600;font-size:13.5px">${esc(window.DEMO_BRAND.company)}</span></div>
      <h1>${esc(window.DEMO_BRAND.product)}</h1>
      <p class="sub">${esc(window.DEMO_BRAND.country)} · Select a role to enter
        <span class="demo-flag" style="margin-left:6px">PROTOTYPE DEMO</span></p>

      <div class="role-grid">
        <button class="role-btn" data-role="agent">
          <span class="ico">👤</span>
          <span><b>Sales Agent</b><span>My leads, my pipeline, calling, AI assistant</span></span>
        </button>
        <button class="role-btn" data-role="manager">
          <span class="ico">👔</span>
          <span><b>Sales Manager</b><span>Team view, routing rules, marketing, competitors</span></span>
        </button>
        <button class="role-btn" data-role="executive">
          <span class="ico">🎩</span>
          <span><b>Executive</b><span>Org-wide analytics, ROI, brokers, compliance</span></span>
        </button>
        <button class="role-btn broker" data-broker>
          <span class="ico">🤝</span>
          <span><b>External Broker</b><span>Opens the separate B2B partner portal (2.4)</span></span>
        </button>
      </div>

      <p class="muted" style="margin:22px 0 0;font-size:12px">
        Role-Based Access Control (2.1) — each role sees different menus, data and dashboards.
      </p>
    </div>
  </div>`;

  $$("[data-role]").forEach((b) => b.addEventListener("click", () => {
    S.role = b.dataset.role;
    S.me = D.AGENTS.find((a) => a.role === S.role) || D.AGENTS[0];
    S.page = "dashboard";
    save();
    render();
  }));
  $("[data-broker]").addEventListener("click", () => { window.location.href = "broker.html"; });
}

/* ---------------- SHELL ---------------- */

function visibleNav() {
  return NAV.map(([g, items]) => [g, items.filter(([, , , roles]) => roles.includes(S.role))])
            .filter(([, items]) => items.length);
}

function render() {
  if (!S.role) return renderLogin();

  const unread = S.leads.reduce((n, l) => n + (l.unread || 0), 0);
  const ai = AI.status();

  document.body.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo"><span class="mark">◆</span>
          <span>${esc(window.DEMO_BRAND.company)}<small>Omnichannel AI-CRM</small></span></div>
      </div>
      <nav class="nav">
        ${visibleNav().map(([g, items]) => `
          <div class="nav-group">${esc(g)}</div>
          ${items.map(([id, label, icon]) => `
            <button data-page="${id}" class="${S.page === id ? "active" : ""}">
              <span class="ni">${icon}</span>${esc(label)}
              ${id === "inbox" && unread ? `<span class="badge">${unread}</span>` : ""}
            </button>`).join("")}
        `).join("")}
      </nav>
      <div class="side-foot">
        <div class="who">
          <span class="av">${esc(S.me.avatar)}</span>
          <span><b>${esc(S.me.name)}</b><span>${esc(S.role)}</span></span>
        </div>
        <div class="row" style="margin-top:8px">
          <button class="btn sm ghost" data-reset>Reset data</button>
          <button class="btn sm ghost" data-logout>Switch role</button>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <h2>${esc(pageTitle())}</h2>
        <div class="spacer"></div>
        <span class="ai-badge ${ai.live ? "" : "sim"}">✦ ${esc(ai.label)}</span>
        <span class="demo-flag">DEMO DATA</span>
      </header>
      <div class="content" id="content"></div>
    </div>
  </div>`;

  $$("[data-page]").forEach((b) => b.addEventListener("click", () => { S.page = b.dataset.page; render(); }));
  $("[data-logout]").addEventListener("click", () => { S.role = null; stopCall(true); render(); });
  $("[data-reset]").addEventListener("click", resetDemo);

  renderPage();
}

function pageTitle() {
  for (const [, items] of NAV) for (const [id, label] of items) if (id === S.page) return label;
  return "Dashboard";
}

function renderPage() {
  const c = $("#content");
  const fn = {
    dashboard: pageDashboard, inbox: pageInbox, pipeline: pagePipeline, dialer: pageDialer,
    properties: pageProperties, aichat: pageAiChat, aicontent: pageAiContent,
    competitors: pageCompetitors, marketing: pageMarketing, routing: pageRouting,
    analytics: pageAnalytics, brokers: pageBrokers, pdpa: pagePdpa
  }[S.page];
  if (fn) fn(c); else c.innerHTML = `<div class="empty"><div class="big">🚧</div>Page not found</div>`;
}

/* ============================================================
   1. DASHBOARD  (role-aware — RBAC demo)
   ============================================================ */

function myLeads() {
  if (S.role === "agent") return S.leads.filter((l) => l.agentId === S.me.id || !l.agentId);
  return S.leads;
}

function pageDashboard(c) {
  const ls = myLeads();
  const open = ls.filter((l) => !["won", "lost"].includes(l.stage));
  const won = ls.filter((l) => l.stage === "won");
  const pipelineValue = open.reduce((n, l) => n + (l.budget > 100000 ? l.budget : 0), 0);
  const wonValue = won.reduce((n, l) => n + (l.budget > 100000 ? l.budget : 0), 0);
  const unassigned = S.leads.filter((l) => !l.agentId).length;
  const newToday = S.leads.filter((l) => l.createdAt === "2026-07-25").length;
  const hot = ls.filter((l) => l.score >= 80).length;

  const byChannel = {};
  S.leads.forEach((l) => { byChannel[l.channel] = (byChannel[l.channel] || 0) + 1; });
  const maxCh = Math.max(1, ...Object.values(byChannel));

  const roleLine = {
    agent: "Your personal workspace — only leads assigned to you.",
    manager: "Team-wide view — all agents, routing and campaign performance.",
    executive: "Organisation-wide view — revenue, ROI and compliance."
  }[S.role];

  c.innerHTML = `
  <p class="page-intro">${esc(roleLine)}</p>

  <div class="grid g4" style="margin-bottom:16px">
    ${kpi("Open leads", open.length, `${newToday} new today`, "up")}
    ${kpi("Pipeline value", short(pipelineValue), `${hot} hot leads (score 80+)`, "")}
    ${kpi("Closed won", won.length, short(wonValue) + " revenue", "up")}
    ${kpi(S.role === "agent" ? "Unassigned nearby" : "Unassigned", unassigned, unassigned ? "needs routing" : "all routed", unassigned ? "dn" : "up")}
  </div>

  <div class="grid g2">
    <div class="card">
      <div class="card-h"><h3>Leads by channel — omnichannel ingestion (2.1)</h3></div>
      <div class="card-b">
        ${Object.entries(byChannel).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
          <div class="funnel-row">
            ${chanBadge(k)}
            <span style="width:92px;font-size:12.5px">${esc(D.CHANNELS[k].label)}</span>
            <div class="fb" style="width:${(v / maxCh) * 62}%;background:${D.CHANNELS[k].color}"></div>
            <b style="font-size:12.5px">${v}</b>
          </div>`).join("")}
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>Needs attention</h3><div class="spacer"></div>
        <button class="btn sm" data-page-jump="inbox">Open inbox</button></div>
      <div class="card-b" style="padding:0">
        <div class="table-wrap"><table>
          <thead><tr><th>Lead</th><th>Channel</th><th>Score</th><th>Waiting</th></tr></thead>
          <tbody>
          ${ls.filter((l) => l.unread > 0).slice(0, 6).map((l) => `
            <tr>
              <td><b>${esc(l.name)}</b><br><span class="muted" style="font-size:11.5px">${esc(l.inquiry)} · ${esc(l.language)}</span></td>
              <td>${chanBadge(l.channel)}</td>
              <td><span class="pill ${l.score >= 80 ? "green" : l.score >= 50 ? "amber" : ""}">${l.score}</span></td>
              <td><span class="pill red">${l.unread} unread</span></td>
            </tr>`).join("") || `<tr><td colspan="4" class="muted" style="padding:22px;text-align:center">Nothing waiting 🎉</td></tr>`}
          </tbody>
        </table></div>
      </div>
    </div>
  </div>

  ${S.role !== "agent" ? `
  <div class="card" style="margin-top:16px">
    <div class="card-h"><h3>Team board — live availability (2.1 smart routing)</h3></div>
    <div class="card-b">
      <div class="grid g4">
        ${D.AGENTS.filter((a) => a.role === "agent").map((a) => `
          <div class="card" style="box-shadow:none">
            <div class="card-b">
              <div class="row"><span class="who"><span class="av">${esc(a.avatar)}</span></span>
                <span><b style="font-size:13px">${esc(a.name)}</b><br>
                <span class="muted" style="font-size:11.5px">${esc(a.dept)} · ${esc(a.languages.join("/"))}</span></span></div>
              <div class="row" style="margin-top:9px">
                <span class="pill ${a.availability === "free" ? "green" : a.availability === "busy" ? "amber" : ""}">${esc(a.availability)}</span>
                <span class="muted" style="font-size:11.5px;margin-left:auto">${a.closed}/${a.target} closed</span>
              </div>
              <div class="score-bar" style="margin-top:7px"><i style="width:${Math.min(100, (a.closed / a.target) * 100)}%;background:${a.closed >= a.target ? "var(--green)" : "var(--brand)"}"></i></div>
            </div>
          </div>`).join("")}
      </div>
    </div>
  </div>` : ""}`;

  $$("[data-page-jump]").forEach((b) => b.addEventListener("click", () => { S.page = b.dataset.pageJump; render(); }));
}

function kpi(lbl, val, dl, dir) {
  return `<div class="card kpi"><div class="lbl">${esc(lbl)}</div>
    <div class="val">${esc(val)}</div><div class="dl ${dir}">${esc(dl)}</div></div>`;
}

/* ============================================================
   2. OMNICHANNEL INBOX + CUSTOMER 360
   ============================================================ */

function pageInbox(c) {
  const ls = myLeads().filter((l) => S.inboxFilter === "all" || l.channel === S.inboxFilter)
                      .sort((a, b) => (b.lastAt || "").localeCompare(a.lastAt || ""));
  if (!S.selectedLeadId || !lead(S.selectedLeadId)) S.selectedLeadId = ls[0]?.id || null;
  const L = lead(S.selectedLeadId);

  c.innerHTML = `
  <div class="row wrap" style="margin-bottom:14px">
    <button class="btn sm ${S.inboxFilter === "all" ? "primary" : ""}" data-f="all">All channels</button>
    ${Object.entries(D.CHANNELS).filter(([k]) => k !== "phone").map(([k, ch]) => `
      <button class="btn sm ${S.inboxFilter === k ? "primary" : ""}" data-f="${k}">
        ${chanBadge(k)} ${esc(ch.label)}</button>`).join("")}
  </div>

  <div class="inbox">
    <div class="card">
      <div class="card-h"><h3>Conversations</h3><div class="spacer"></div>
        <span class="pill">${ls.length}</span></div>
      <div class="thread-list">
        ${ls.map((l) => {
          const msgs = S.conversations[l.id] || [];
          const last = msgs[msgs.length - 1];
          return `<div class="thread ${l.id === S.selectedLeadId ? "active" : ""}" data-lead="${l.id}">
            ${chanBadge(l.channel)}
            <div class="t-main">
              <div class="t-top"><b>${esc(l.name)}</b>
                ${l.unread ? `<span class="unread-dot"></span>` : ""}
                <span class="t-time" style="margin-left:auto">${esc((l.lastAt || "").slice(5))}</span></div>
              <div class="prev">${esc(last ? last.text.slice(0, 60) : "No messages yet")}</div>
            </div></div>`;
        }).join("") || `<div class="empty">No conversations on this channel</div>`}
      </div>
    </div>

    <div>${L ? threadView(L) : `<div class="card"><div class="empty"><div class="big">✉</div>Select a conversation</div></div>`}</div>
  </div>`;

  $$("[data-f]").forEach((b) => b.addEventListener("click", () => { S.inboxFilter = b.dataset.f; renderPage(); }));
  $$("[data-lead]").forEach((b) => b.addEventListener("click", () => {
    S.selectedLeadId = b.dataset.lead;
    const l = lead(S.selectedLeadId); if (l) l.unread = 0;
    save(); render();
  }));
  bindThread();
}

function threadView(L) {
  const msgs = S.conversations[L.id] || [];
  const p = project(L.projectId);
  return `
  <div class="card">
    <div class="card-h">
      ${chanBadge(L.channel)}
      <div><h3 style="display:inline">${esc(L.name)}</h3>
        <div class="muted" style="font-size:11.5px">${esc(L.phone)} · ${esc(L.language)} · ${esc(L.inquiry)} · budget ${short(L.budget)}</div></div>
      <div class="spacer"></div>
      <span class="pill ${L.score >= 80 ? "green" : L.score >= 50 ? "amber" : ""}">score ${L.score}</span>
      <button class="btn sm" data-360="${L.id}">Customer 360°</button>
      <button class="btn sm primary" data-callnow="${L.id}">☎ Call</button>
    </div>
    <div class="msgs" id="msgs">
      ${msgs.map((m) => `
        <div class="msg ${m.from}">
          ${md(m.text)}
          <div class="meta">${m.from === "ai" ? "AI Assistant · " : m.from === "agent" ? "Agent · " : ""}${esc(D.CHANNELS[m.channel]?.label || m.channel)} · ${esc(m.at)}</div>
        </div>`).join("")}
    </div>
    <div class="quick">
      <button class="btn sm" data-pitch="${L.id}">✦ Generate personalised pitch</button>
      <button class="btn sm" data-aireply="${L.id}">✦ AI suggest reply</button>
    </div>
    <div class="composer">
      <input type="text" id="reply" placeholder="Reply on ${esc(D.CHANNELS[L.channel].label)}…">
      <button class="btn primary" data-send="${L.id}">Send</button>
    </div>
    <div class="card-b" style="border-top:1px solid var(--border);font-size:12px">
      <span class="muted">Interested in <b>${esc(p ? p.name : "—")}</b> · came from ${esc(D.CHANNELS[L.channel].label)} ·
      assigned to ${esc(L.agentId ? agent(L.agentId).name : "nobody yet")}</span>
    </div>
  </div>`;
}

function pushMsg(leadId, msg) {
  (S.conversations[leadId] = S.conversations[leadId] || []).push(msg);
  const l = lead(leadId); if (l) l.lastAt = msg.at;
  save();
}

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `2026-07-25 ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function bindThread() {
  const send = $("[data-send]");
  if (send) {
    const doSend = () => {
      const id = send.dataset.send;
      const box = $("#reply");
      if (!box.value.trim()) return;
      pushMsg(id, { from: "agent", channel: lead(id).channel, text: box.value.trim(), at: nowStamp() });
      box.value = "";
      renderPage();
      const m = $("#msgs"); if (m) m.scrollTop = m.scrollHeight;
    };
    send.addEventListener("click", doSend);
    $("#reply").addEventListener("keydown", (e) => { if (e.key === "Enter") doSend(); });
  }

  const ai = $("[data-aireply]");
  if (ai) ai.addEventListener("click", async () => {
    const L = lead(ai.dataset.aireply);
    const msgs = S.conversations[L.id] || [];
    const lastCustomer = [...msgs].reverse().find((m) => m.from === "customer");
    ai.disabled = true; ai.textContent = "✦ thinking…";
    const r = await AI.ask(lastCustomer ? lastCustomer.text : L.inquiry + " " + (project(L.projectId)?.name || ""));
    pushMsg(L.id, { from: "ai", channel: L.channel, text: r.text, at: nowStamp() });
    if (r.intent.escalate) {
      pushMsg(L.id, { from: "system", channel: L.channel, text: `⚡ ${r.intent.reason} — conversation escalated to a human agent (Section 5)`, at: nowStamp() });
    }
    renderPage();
    const m = $("#msgs"); if (m) m.scrollTop = m.scrollHeight;
  });

  const pitch = $("[data-pitch]");
  if (pitch) pitch.addEventListener("click", async () => {
    const L = lead(pitch.dataset.pitch);
    pitch.disabled = true; pitch.textContent = "✦ generating…";
    const r = await AI.personalisedPitch(L);
    modal("Hyper-personalised pitch (2.2)", `
      <p class="page-intro">Generated from this lead's channel, language, budget and browsing interest.
        ${r.live ? `<span class="ai-badge">live AI</span>` : `<span class="ai-badge sim">simulated</span>`}</p>
      <div class="card" style="box-shadow:none"><div class="card-b">${md(r.text)}</div></div>
      ${r.units.length ? `<h4>Best matching units</h4><div class="table-wrap"><table>
        <thead><tr><th>Unit</th><th>Type</th><th>Size</th><th>View</th><th>Price</th></tr></thead><tbody>
        ${r.units.map((u) => `<tr><td class="mono">${esc(u.unit)}</td><td>${esc(u.type)}</td>
          <td>${u.sqm} sqm</td><td>${esc(u.view)}</td><td><b>${baht(u.price)}</b></td></tr>`).join("")}
      </tbody></table></div>` : ""}`);
    pitch.disabled = false; pitch.textContent = "✦ Generate personalised pitch";
  });

  const c360 = $("[data-360]");
  if (c360) c360.addEventListener("click", () => customer360(c360.dataset["360"]));

  const cn = $("[data-callnow]");
  if (cn) cn.addEventListener("click", () => { S.call.leadId = cn.dataset.callnow; S.page = "dialer"; render(); });
}

function customer360(id) {
  const L = lead(id);
  const msgs = (S.conversations[id] || []).map((m) => ({ t: m.at, kind: m.from === "ai" ? "ai" : "msg", html: `<b>${m.from === "customer" ? esc(L.name) : m.from === "ai" ? "AI Assistant" : "Agent"}</b> on ${esc(D.CHANNELS[m.channel]?.label || m.channel)}<br>${md(m.text)}` }));
  const cls = S.calls.filter((c) => c.leadId === id).map((c) => ({
    t: c.at, kind: "call",
    html: `<b>${c.direction === "inbound" ? "Inbound" : "Outbound"} call</b> — ${mmss(c.duration)} with ${esc(agent(c.agentId)?.name || "—")}<br>
           <span class="pill ${c.disposition === "interested" ? "green" : c.disposition === "not_interested" ? "red" : "amber"}">${esc(c.disposition)}</span>
           ${c.recording ? `<span class="pill blue">▶ recording</span>` : ""}<br>
           <span class="muted">${esc(c.notes || "")}</span>`
  }));
  const items = [...msgs, ...cls].sort((a, b) => String(a.t).localeCompare(String(b.t)));
  const p = project(L.projectId);

  modal(`Customer 360° — ${L.name}`, `
    <div class="grid g3" style="margin-bottom:14px">
      ${kpi("Lead score", L.score, L.score >= 80 ? "hot" : "warm", L.score >= 80 ? "up" : "")}
      ${kpi("Budget", short(L.budget), esc(L.inquiry), "")}
      ${kpi("Touchpoints", items.length, esc(D.CHANNELS[L.channel].label) + " origin", "")}
    </div>
    <div class="row wrap" style="margin-bottom:14px">
      <span class="pill">${esc(L.phone)}</span><span class="pill">${esc(L.email)}</span>
      <span class="pill">${esc(L.language)}</span>
      <span class="pill ${L.consent ? "green" : "red"}">${L.consent ? "PDPA consent ✓" : "⚠ no consent"}</span>
      <span class="pill blue">${esc(p ? p.name : "—")}</span>
    </div>
    <h4 style="margin:0 0 10px">Unified chronological timeline (2.1)</h4>
    <div class="timeline">
      ${items.map((i) => `<div class="tl-item ${i.kind === "call" ? "call" : i.kind === "ai" ? "ai" : ""}">
        <div class="muted" style="font-size:11px">${esc(i.t)}</div>${i.html}</div>`).join("")}
    </div>`);
}

/* ============================================================
   3. PIPELINE — drag & drop
   ============================================================ */

function pagePipeline(c) {
  const ls = myLeads();
  c.innerHTML = `
  <p class="page-intro">Drag a card to another column to move the deal. Changes are saved. (2.1 — visual drag-and-drop sales pipeline)</p>
  <div class="pipe">
    ${D.STAGES.map((st) => {
      const items = ls.filter((l) => l.stage === st.id);
      const val = items.reduce((n, l) => n + (l.budget > 100000 ? l.budget : 0), 0);
      return `<div class="col" data-stage="${st.id}">
        <div class="col-h"><b>${esc(st.label)}</b><span class="n">${items.length}</span></div>
        <div class="muted" style="font-size:11px;padding:0 3px 8px">${short(val)}</div>
        ${items.map((l) => `
          <div class="deal" draggable="true" data-deal="${l.id}">
            <div class="row"><b>${esc(l.name)}</b>${chanBadge(l.channel)}</div>
            <div class="muted" style="font-size:11.5px">${esc(project(l.projectId)?.name || "—")}</div>
            <div class="row" style="margin-top:6px">
              <span class="amt">${short(l.budget)}</span>
              <span class="muted" style="margin-left:auto;font-size:11px">${esc(l.agentId ? agent(l.agentId).avatar : "—")}</span>
            </div>
            <div class="score-bar"><i style="width:${l.score}%"></i></div>
          </div>`).join("")}
      </div>`;
    }).join("")}
  </div>`;

  let dragId = null;
  $$("[data-deal]").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      dragId = el.dataset.deal; el.classList.add("dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", dragId); } catch (x) {}
      }
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
    el.addEventListener("click", () => customer360(el.dataset.deal));
  });
  $$("[data-stage]").forEach((col) => {
    col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("over"); });
    col.addEventListener("dragleave", () => col.classList.remove("over"));
    col.addEventListener("drop", (e) => {
      e.preventDefault(); col.classList.remove("over");
      const id = dragId || e.dataTransfer.getData("text/plain");
      const L = lead(id);
      if (L && L.stage !== col.dataset.stage) {
        L.stage = col.dataset.stage;
        save();
        toast(`**${L.name}** moved to **${D.STAGES.find((s) => s.id === L.stage).label}**`);
        renderPage();
      }
    });
  });
}

/* ============================================================
   4. VoWiFi DIALER
   ============================================================ */

function pageDialer(c) {
  const L = S.call.leadId ? lead(S.call.leadId) : null;
  const st = S.call.state;
  const label = { idle: "Ready to call", dialing: "Dialing…", ringing: "Ringing…", connected: "Connected", ended: "Call ended" }[st];

  c.innerHTML = `
  <p class="page-intro">Browser-based calling (2.1 VoWiFi). Audio is simulated in this prototype — the call state machine, timer, recording flag and auto-logging to the customer timeline are all real.</p>
  <div class="dialer">
    <div>
      <div class="phone ${st === "ringing" || st === "dialing" ? "ringing" : ""}">
        <div class="pav">${L ? esc(L.name.split(" ").map((w) => w[0]).join("").slice(0, 2)) : "☎"}</div>
        <h3>${esc(L ? L.name : "No lead selected")}</h3>
        <div class="st">${esc(L ? L.phone : "Pick someone from the list")}</div>
        <div class="timer">${st === "connected" || st === "ended" ? mmss(S.call.seconds) : "--:--"}</div>
        <div class="st">${esc(label)} ${st === "connected" ? `<br><span class="rec-dot"></span>recording` : ""}</div>
        ${st === "connected" ? `<div class="wave">${Array.from({ length: 13 }, (_, i) => `<i style="animation-delay:${i * 0.07}s"></i>`).join("")}</div>` : ""}
        <div class="keys">
          ${st === "idle" || st === "ended"
            ? `<button class="kbtn call" data-start ${L ? "" : "disabled"}>☎</button>`
            : `<button class="kbtn mute" data-mute>${S.call.muted ? "🔇" : "🎙"}</button>
               <button class="kbtn hang" data-hang>✖</button>`}
        </div>
      </div>
      ${st === "ended" ? `
      <div class="card" style="margin-top:14px">
        <div class="card-h"><h3>Log this call</h3></div>
        <div class="card-b">
          <div class="field"><label class="f">Disposition</label>
            <select id="disp">
              ${["interested", "not_interested", "callback", "busy", "no_answer", "wrong_number", "connected"].map((d) => `<option>${d}</option>`).join("")}
            </select></div>
          <div class="field"><label class="f">Notes</label><textarea id="notes" rows="3" placeholder="What was discussed?"></textarea></div>
          <button class="btn primary" data-log>Save to customer timeline</button>
        </div>
      </div>` : ""}
    </div>

    <div class="card">
      <div class="card-h"><h3>Call queue</h3><div class="spacer"></div>
        <span class="pill">${myLeads().filter((l) => !["won", "lost"].includes(l.stage)).length} open</span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Lead</th><th>Channel</th><th>Project</th><th>Score</th><th>Last call</th><th></th></tr></thead>
        <tbody>
        ${myLeads().filter((l) => !["won", "lost"].includes(l.stage)).map((l) => {
          const last = S.calls.filter((x) => x.leadId === l.id).sort((a, b) => b.at.localeCompare(a.at))[0];
          return `<tr>
            <td><b>${esc(l.name)}</b><br><span class="mono muted">${esc(l.phone)}</span></td>
            <td>${chanBadge(l.channel)}</td>
            <td style="font-size:12px">${esc(project(l.projectId)?.name || "—")}</td>
            <td><span class="pill ${l.score >= 80 ? "green" : l.score >= 50 ? "amber" : ""}">${l.score}</span></td>
            <td class="muted" style="font-size:12px">${last ? esc(last.at.slice(5)) + " · " + mmss(last.duration) : "never"}</td>
            <td><button class="btn sm primary" data-pick="${l.id}">Select</button></td>
          </tr>`;
        }).join("")}
        </tbody></table></div>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <div class="card-h"><h3>Recent calls — auto-logged with recordings</h3></div>
    <div class="table-wrap"><table>
      <thead><tr><th>When</th><th>Lead</th><th>Agent</th><th>Dir</th><th>Duration</th><th>Disposition</th><th>Recording</th></tr></thead>
      <tbody>
      ${[...S.calls].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8).map((c2) => `
        <tr>
          <td class="muted" style="font-size:12px">${esc(c2.at)}</td>
          <td>${esc(lead(c2.leadId)?.name || "—")}</td>
          <td>${esc(agent(c2.agentId)?.name || "—")}</td>
          <td>${c2.direction === "inbound" ? "↙ in" : "↗ out"}</td>
          <td class="mono">${mmss(c2.duration)}</td>
          <td><span class="pill ${c2.disposition === "interested" ? "green" : c2.disposition === "not_interested" ? "red" : "amber"}">${esc(c2.disposition)}</span></td>
          <td>${c2.recording ? `<button class="btn sm" data-play>▶ Play</button>` : `<span class="muted">—</span>`}</td>
        </tr>`).join("")}
      </tbody></table></div>
  </div>`;

  $$("[data-pick]").forEach((b) => b.addEventListener("click", () => {
    if (S.call.state === "connected") return toast("End the current call first.");
    S.call.leadId = b.dataset.pick; S.call.state = "idle"; S.call.seconds = 0; renderPage();
  }));
  $$("[data-play]").forEach((b) => b.addEventListener("click", () => toast("Recording playback is stubbed in the prototype. Phase 4 streams the real file from on-premise storage.")));
  const start = $("[data-start]"); if (start) start.addEventListener("click", startCall);
  const hang = $("[data-hang]"); if (hang) hang.addEventListener("click", () => stopCall());
  const mute = $("[data-mute]"); if (mute) mute.addEventListener("click", () => { S.call.muted = !S.call.muted; renderPage(); });
  const log = $("[data-log]"); if (log) log.addEventListener("click", logCall);
}

function startCall() {
  const L = lead(S.call.leadId);
  if (!L) return;
  S.call.state = "dialing"; S.call.seconds = 0; renderPage();
  setTimeout(() => {
    if (S.call.state !== "dialing") return;
    S.call.state = "ringing"; renderPage();
    setTimeout(() => {
      if (S.call.state !== "ringing") return;
      S.call.state = "connected";
      S.call.timer = setInterval(() => {
        S.call.seconds++;
        const t = $(".phone .timer"); if (t) t.textContent = mmss(S.call.seconds);
      }, 1000);
      renderPage();
    }, 1800);
  }, 900);
}

function stopCall(silent) {
  clearInterval(S.call.timer); S.call.timer = null;
  if (S.call.state === "connected") { S.call.state = "ended"; if (!silent) renderPage(); }
  else if (!silent) { S.call.state = "idle"; renderPage(); }
}

function logCall() {
  const L = lead(S.call.leadId);
  const disp = $("#disp").value;
  const notes = $("#notes").value;
  S.calls.unshift({
    id: "c_" + Math.random().toString(16).slice(2, 8),
    leadId: L.id, agentId: S.me.id, direction: "outbound",
    duration: S.call.seconds || 1, at: nowStamp(), disposition: disp,
    recording: true, notes
  });
  pushMsg(L.id, { from: "agent", channel: "phone", text: `📞 Call — ${mmss(S.call.seconds)} — ${disp}${notes ? " — " + notes : ""}`, at: nowStamp() });
  if (disp === "interested" && L.stage === "new") L.stage = "contacted";
  S.call.state = "idle"; S.call.seconds = 0;
  save(); renderPage();
  toast(`Call logged to **${L.name}**'s timeline with recording.`);
}

/* ============================================================
   5. PROPERTIES
   ============================================================ */

function pageProperties(c) {
  c.innerHTML = `
  <p class="page-intro">This is the knowledge base the AI answers from (Section 5 — RAG grounding). Changing a price here changes what the AI says.</p>
  <div class="grid g3" style="margin-bottom:16px">
    ${D.PROJECTS.map((p) => {
      const us = D.UNITS.filter((u) => u.projectId === p.id);
      const av = us.filter((u) => u.status === "available").length;
      return `<div class="card"><div class="card-b">
        <div class="row"><b>${esc(p.name)}</b><span class="pill ${av ? "green" : "red"}" style="margin-left:auto">${av} available</span></div>
        <div class="muted" style="font-size:12px;margin:4px 0 8px">${esc(p.location)}</div>
        <div class="row wrap" style="gap:5px">
          <span class="pill">${esc(p.type)}</span>
          <span class="pill">${esc(p.completion)}</span>
          <span class="pill blue">${baht(p.pricePerSqm)}/sqm</span>
        </div>
        <div class="muted" style="font-size:11.5px;margin-top:8px">🚉 ${esc(p.bts)}</div>
        <div class="muted" style="font-size:11.5px;margin-top:4px">${esc(p.facilities.join(" · "))}</div>
      </div></div>`;
    }).join("")}
  </div>

  <div class="card">
    <div class="card-h"><h3>Unit inventory</h3><div class="spacer"></div>
      <select id="pf" style="width:auto"><option value="">All projects</option>
        ${D.PROJECTS.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></div>
    <div class="table-wrap"><table id="utab">
      <thead><tr><th>Unit</th><th>Project</th><th>Tower</th><th>Type</th><th>Size</th><th>Floor</th><th>View</th><th>Price</th><th>Status</th></tr></thead>
      <tbody>${unitRows("")}</tbody>
    </table></div>
  </div>`;
  $("#pf").addEventListener("change", (e) => { $("#utab tbody").innerHTML = unitRows(e.target.value); });
}

function unitRows(pid) {
  return D.UNITS.filter((u) => !pid || u.projectId === pid).map((u) => `
    <tr>
      <td class="mono"><b>${esc(u.unit)}</b></td>
      <td style="font-size:12px">${esc(project(u.projectId).name)}</td>
      <td style="font-size:12px">${esc(u.tower)}</td>
      <td>${esc(u.type)}</td>
      <td>${u.sqm} sqm</td>
      <td>${u.floor || "—"}</td>
      <td>${esc(u.view)}</td>
      <td><b>${baht(u.price)}</b></td>
      <td><span class="pill ${u.status === "available" ? "green" : u.status === "reserved" ? "amber" : "red"}">${esc(u.status)}</span></td>
    </tr>`).join("");
}

/* ============================================================
   6. AI ASSISTANT (RAG)
   ============================================================ */

const SUGGESTIONS = [
  "What's the price of a 2BR at Sukhumvit Grand?",
  "Which units are still available in Phuket?",
  "What facilities does Riverside have?",
  "What rental yield can I expect?",
  "ราคา 1 ห้องนอน Riverside เท่าไหร่",
  "I want to book a viewing this weekend"
];

function pageAiChat(c) {
  const ai = AI.status();
  c.innerHTML = `
  <div class="ai-chat">
    <div class="card">
      <div class="card-h"><h3>Conversational Customer AI</h3>
        <span class="ai-badge ${ai.live ? "" : "sim"}">${esc(ai.label)}</span></div>
      <div class="msgs" id="chatbox" style="max-height:420px">
        ${S.chat.length ? S.chat.map(renderChatMsg).join("") : `
          <div class="msg ai">Hello 👋 I'm the ${esc(window.DEMO_BRAND.company)} assistant. I can answer questions about
          project layouts, prices and unit availability — grounded in the live property database, so I never invent numbers.
          <div class="meta">AI Assistant · RAG</div></div>`}
      </div>
      <div class="quick">
        ${SUGGESTIONS.map((s) => `<button class="btn sm" data-q="${esc(s)}">${esc(s)}</button>`).join("")}
      </div>
      <div class="composer">
        <input type="text" id="ask" placeholder="Ask about prices, layouts, availability…">
        <button class="btn primary" data-ask>Send</button>
      </div>
    </div>

    <div>
      <div class="card" style="margin-bottom:14px">
        <div class="card-h"><h3>How this works</h3></div>
        <div class="card-b" style="font-size:12.5px">
          <div class="step on"><span class="dot">1</span><span><b>Retrieve</b><br><span class="muted">Search the local project + unit database</span></span></div>
          <div class="step on"><span class="dot">2</span><span><b>Ground</b><br><span class="muted">Only matched records are given to the model</span></span></div>
          <div class="step on"><span class="dot">3</span><span><b>Answer</b><br><span class="muted">No hallucinated prices — sources shown</span></span></div>
          <div class="step on"><span class="dot">4</span><span><b>Escalate</b><br><span class="muted">Hot or angry → hand to a human</span></span></div>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><h3>Deployed on</h3></div>
        <div class="card-b">
          ${["line", "whatsapp", "telegram", "web1", "web2", "phone"].map((k) => `
            <div class="row" style="margin-bottom:7px">${chanBadge(k)}
              <span style="font-size:12.5px">${esc(D.CHANNELS[k].label)}</span>
              <span class="pill green" style="margin-left:auto">active</span></div>`).join("")}
          <p class="muted" style="font-size:11.5px;margin:10px 0 0">Target: 50–100 inquiries/day handled without a human (Section 5).</p>
        </div>
      </div>
    </div>
  </div>`;

  const send = async () => {
    const box = $("#ask");
    const q = box.value.trim();
    if (!q || S.aiBusy) return;
    box.value = "";
    await askAI(q);
  };
  $("[data-ask]").addEventListener("click", send);
  $("#ask").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  $$("[data-q]").forEach((b) => b.addEventListener("click", () => askAI(b.dataset.q)));
}

function renderChatMsg(m) {
  if (m.role === "user") return `<div class="msg customer">${md(m.text)}</div>`;
  if (m.role === "system") return `<div class="msg system">${md(m.text)}</div>`;
  return `<div class="msg ai">${md(m.text)}
    ${m.sources?.length ? `<div>${m.sources.map((s) => `<span class="src">📄 ${esc(s)}</span>`).join("")}</div>` : ""}
    <div class="meta">${m.live ? "Live AI" : "Simulated AI"} · grounded in property DB</div></div>`;
}

async function askAI(q) {
  S.aiBusy = true;
  S.chat.push({ role: "user", text: q });
  renderPage();
  const box = $("#chatbox");
  box.insertAdjacentHTML("beforeend", `<div class="msg ai" id="typing"><span class="typing"><i></i><i></i><i></i></span></div>`);
  box.scrollTop = box.scrollHeight;

  const r = await AI.ask(q);
  S.chat.push({ role: "ai", text: r.text, sources: r.sources, live: r.live });
  if (r.intent.escalate) {
    const target = D.AGENTS.find((a) => a.role === "agent" && a.availability === "free");
    S.chat.push({
      role: "system",
      text: `⚡ **${r.intent.reason}** → routed to **${target ? target.name : "the next available agent"}** via the smart routing matrix.`
    });
  }
  S.aiBusy = false;
  renderPage();
  const b2 = $("#chatbox"); if (b2) b2.scrollTop = b2.scrollHeight;
}

/* ============================================================
   7. AI CONTENT STUDIO
   ============================================================ */

function pageAiContent(c) {
  c.innerHTML = `
  <p class="page-intro">Gen-AI ad copy built into the agent dashboard (2.2 — Ad Copy Optimization).</p>
  <div class="grid g2">
    <div class="card">
      <div class="card-h"><h3>Generate ad copy</h3></div>
      <div class="card-b">
        <div class="field"><label class="f">Platform</label>
          <select id="plat"><option>TikTok</option><option>Instagram</option><option>Facebook Ads</option></select></div>
        <div class="field"><label class="f">Project</label>
          <select id="proj">${D.PROJECTS.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></div>
        <div class="field"><label class="f">Tone</label>
          <select id="tone"><option>Luxury</option><option>Urgent / promotional</option><option>Investor-focused</option><option>Friendly Thai</option></select></div>
        <button class="btn primary" data-gen>✦ Generate 3 variants</button>
      </div>
    </div>
    <div class="card">
      <div class="card-h"><h3>Output</h3><div class="spacer"></div><span id="genbadge"></span></div>
      <div class="card-b" id="genout"><div class="empty"><div class="big">✎</div>Pick a platform and generate</div></div>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <div class="card-h"><h3>Running A/B tests (2.2 — continuous testing)</h3></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Campaign</th><th>Variant A</th><th>CTR A</th><th>Variant B</th><th>CTR B</th><th>Winner</th></tr></thead>
      <tbody>${D.AB_TESTS.map((t) => `
        <tr><td style="font-size:12px"><b>${esc(t.campaign)}</b></td>
        <td style="font-size:12px">${esc(t.variantA)}</td><td>${t.ctrA}%</td>
        <td style="font-size:12px">${esc(t.variantB)}</td><td>${t.ctrB}%</td>
        <td><span class="pill green">${esc(t.winner)} wins (+${((t.ctrB / t.ctrA - 1) * 100).toFixed(0)}%)</span></td></tr>`).join("")}
      </tbody></table></div>
  </div>`;

  $("[data-gen]").addEventListener("click", async () => {
    const btn = $("[data-gen]");
    btn.disabled = true; btn.textContent = "✦ generating…";
    $("#genout").innerHTML = `<div class="row"><span class="typing"><i></i><i></i><i></i></span> <span class="muted">writing variants…</span></div>`;
    const r = await AI.generateAdCopy($("#plat").value, $("#proj").value, $("#tone").value);
    $("#genbadge").innerHTML = `<span class="ai-badge ${r.live ? "" : "sim"}">${r.live ? "live AI" : "simulated"}</span>`;
    $("#genout").innerHTML = r.variants.map((v, i) => `
      <div class="card" style="box-shadow:none;margin-bottom:10px"><div class="card-b">
        <div class="row"><span class="pill blue">Variant ${String.fromCharCode(65 + i)}</span>
          <button class="btn sm" style="margin-left:auto" data-copy="${esc(v)}">Copy</button></div>
        <div style="margin-top:7px">${md(v)}</div>
      </div></div>`).join("");
    $$("[data-copy]").forEach((b) => b.addEventListener("click", () => {
      navigator.clipboard?.writeText(b.dataset.copy); toast("Copied to clipboard.");
    }));
    btn.disabled = false; btn.textContent = "✦ Generate 3 variants";
  });
}

/* ============================================================
   8. COMPETITOR INTELLIGENCE
   ============================================================ */

function pageCompetitors(c) {
  const ourAvg = Math.round(D.PROJECTS.reduce((n, p) => n + p.pricePerSqm, 0) / D.PROJECTS.length);
  const theirAvg = Math.round(D.COMPETITORS.reduce((n, x) => n + x.pricePerSqm, 0) / D.COMPETITORS.length);
  const max = Math.max(ourAvg, ...D.COMPETITORS.map((x) => x.pricePerSqm));

  c.innerHTML = `
  <p class="page-intro">Scraping &amp; synthesising engine — monitors competitor public footprints and turns them into strategy (2.2).</p>

  <div class="grid g4" style="margin-bottom:16px">
    ${kpi("Competitors tracked", D.COMPETITORS.length, "public listings + ads", "")}
    ${kpi("Our avg price/sqm", baht(ourAvg), theirAvg > ourAvg ? `${(((theirAvg - ourAvg) / theirAvg) * 100).toFixed(1)}% below market` : "above market", theirAvg > ourAvg ? "up" : "dn")}
    ${kpi("Market avg price/sqm", baht(theirAvg), "5 direct rivals", "")}
    ${kpi("Last scrape", "2h ago", "auto every 6h", "")}
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>Price positioning</h3></div>
    <div class="card-b">
      <div class="funnel-row"><span style="width:180px;font-size:12.5px"><b>US (avg)</b></span>
        <div class="fb" style="width:${(ourAvg / max) * 70}%;background:var(--green)"></div><b>${baht(ourAvg)}</b></div>
      ${D.COMPETITORS.map((x) => `
        <div class="funnel-row"><span style="width:180px;font-size:12.5px">${esc(x.project)}</span>
          <div class="fb" style="width:${(x.pricePerSqm / max) * 70}%"></div>
          <span>${baht(x.pricePerSqm)}</span></div>`).join("")}
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>Competitor watchlist</h3></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Company</th><th>Project</th><th>฿/sqm</th><th>Current promo</th><th>Sold</th><th>Trend</th><th>Active channels</th></tr></thead>
      <tbody>${D.COMPETITORS.map((x) => `
        <tr><td><b>${esc(x.name)}</b></td><td>${esc(x.project)}</td>
        <td class="mono">${baht(x.pricePerSqm)}</td>
        <td style="font-size:12px">${esc(x.promo)}</td>
        <td><div class="row"><span>${x.sold}%</span><div class="score-bar" style="width:56px"><i style="width:${x.sold}%"></i></div></div></td>
        <td><span class="pill ${x.trend === "up" ? "green" : x.trend === "down" ? "red" : ""}">${x.trend === "up" ? "▲" : x.trend === "down" ? "▼" : "▬"} ${esc(x.trend)}</span></td>
        <td style="font-size:11.5px">${esc(x.channels.join(", "))}</td></tr>`).join("")}
      </tbody></table></div>
  </div>

  <div class="card">
    <div class="card-h"><h3>✦ AI strategic recommendations</h3><div class="spacer"></div>
      <span id="cibadge"></span>
      <button class="btn primary sm" data-analyse>Run analysis</button></div>
    <div class="card-b" id="ciout"><div class="empty"><div class="big">◎</div>Click “Run analysis” to generate strategy from the data above</div></div>
  </div>`;

  $("[data-analyse]").addEventListener("click", async () => {
    const b = $("[data-analyse]"); b.disabled = true; b.textContent = "analysing…";
    $("#ciout").innerHTML = `<div class="row"><span class="typing"><i></i><i></i><i></i></span> <span class="muted">reading competitor data…</span></div>`;
    const r = await AI.analyseCompetitors();
    $("#cibadge").innerHTML = `<span class="ai-badge ${r.live ? "" : "sim"}">${r.live ? "live AI" : "simulated"}</span>`;
    $("#ciout").innerHTML = r.insights.map((t, i) => `
      <div class="step on" style="border-bottom:1px dashed var(--border);padding:11px 0">
        <span class="dot">${i + 1}</span><span>${md(t)}</span></div>`).join("");
    b.disabled = false; b.textContent = "Re-run analysis";
  });
}

/* ============================================================
   9. MARKETING AUTOMATION
   ============================================================ */

function pageMarketing(c) {
  const tot = D.CAMPAIGNS.reduce((a, x) => ({
    spend: a.spend + x.spend, leads: a.leads + x.leads, deals: a.deals + x.deals, clicks: a.clicks + x.clicks
  }), { spend: 0, leads: 0, deals: 0, clicks: 0 });
  const revenue = tot.deals * 11000000;

  c.innerHTML = `
  <p class="page-intro">Zero-manual-intervention marketing: segmentation, scheduling, bidding and A/B testing (2.2).</p>

  <div class="grid g4" style="margin-bottom:16px">
    ${kpi("Ad spend (MTD)", short(tot.spend), "4 active campaigns", "")}
    ${kpi("Leads generated", tot.leads.toLocaleString(), `${baht(Math.round(tot.spend / tot.leads))} cost per lead`, "")}
    ${kpi("Deals closed", tot.deals, `${((tot.deals / tot.leads) * 100).toFixed(1)}% conversion`, "up")}
    ${kpi("ROAS", (revenue / tot.spend).toFixed(1) + "×", short(revenue) + " attributed", "up")}
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>Campaign performance</h3></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Campaign</th><th>Channel</th><th>Budget</th><th>Spend</th><th>Leads</th><th>CPL</th><th>Deals</th><th>ROAS</th><th>Status</th></tr></thead>
      <tbody>${D.CAMPAIGNS.map((x) => {
        const cpl = Math.round(x.spend / x.leads);
        const roas = (x.deals * 11000000) / x.spend;
        return `<tr><td><b style="font-size:12.5px">${esc(x.name)}</b>
          <div class="score-bar" style="margin-top:5px"><i style="width:${(x.spend / x.budget) * 100}%"></i></div></td>
          <td style="font-size:12px">${esc(x.channel)}</td>
          <td>${short(x.budget)}</td><td>${short(x.spend)}</td>
          <td>${x.leads}</td><td class="mono">${baht(cpl)}</td><td>${x.deals}</td>
          <td><span class="pill ${roas > 200 ? "green" : roas > 100 ? "amber" : "red"}">${roas.toFixed(0)}×</span></td>
          <td><span class="pill ${x.status === "active" ? "green" : ""}">${esc(x.status)}</span></td></tr>`;
      }).join("")}</tbody></table></div>
  </div>

  <div class="grid g2">
    <div class="card">
      <div class="card-h"><h3>Automated segments</h3><div class="spacer"></div>
        <button class="btn sm primary" data-seg>+ New segment</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Segment</th><th>Rule</th><th>Size</th><th>Channel</th></tr></thead>
        <tbody>${D.SEGMENTS.map((s) => `<tr>
          <td><b style="font-size:12.5px">${esc(s.name)}</b></td>
          <td class="mono" style="font-size:11px">${esc(s.rule)}</td>
          <td><span class="pill blue">${s.size}</span></td>
          <td style="font-size:12px">${esc(s.channel)}</td></tr>`).join("")}
        </tbody></table></div>
    </div>

    <div class="card">
      <div class="card-h"><h3>Automation rules</h3></div>
      <div class="card-b">
        ${[
          ["New lead, no reply in 5 min", "→ escalate to next free agent", true],
          ["Lead score crosses 80", "→ notify agent + push notification", true],
          ["No contact for 30 days", "→ move to nurture email sequence", true],
          ["CTR drops below 1.0%", "→ pause variant, shift budget to winner", true],
          ["Budget 80% consumed", "→ alert manager, auto-rebid", false]
        ].map(([a, b, on]) => `
          <div class="row" style="padding:9px 0;border-bottom:1px dashed var(--border)">
            <span style="flex:1"><b style="font-size:12.5px">${esc(a)}</b><br>
              <span class="muted" style="font-size:11.5px">${esc(b)}</span></span>
            <span class="pill ${on ? "green" : ""}">${on ? "ON" : "OFF"}</span></div>`).join("")}
      </div>
    </div>
  </div>`;

  $("[data-seg]").addEventListener("click", () => toast("Segment builder is a Phase 2 feature — the prototype shows the four live segments."));
}

/* ============================================================
   10. SMART ROUTING + ESCALATION
   ============================================================ */

function pageRouting(c) {
  const agents = D.AGENTS.filter((a) => a.role === "agent");
  c.innerHTML = `
  <p class="page-intro">Matrix-based lead assignment by language and inquiry type, with a time-based escalation protocol (2.1).</p>

  <div class="grid g2" style="margin-bottom:16px">
    <div class="card">
      <div class="card-h"><h3>Routing matrix</h3></div>
      <div class="card-b" style="padding:0">
        <div class="table-wrap"><table class="matrix" id="mtx">
          <thead><tr><th>Language ↓ / Type →</th>${D.INQUIRY_TYPES.map((t) => `<th>${esc(t)}</th>`).join("")}</tr></thead>
          <tbody>
          ${D.LANGUAGES.map((lang) => `<tr><td><b>${esc(lang)}</b></td>
            ${D.INQUIRY_TYPES.map((t) => {
              const a = pickAgent(lang, t);
              return `<td data-cell="${esc(lang)}|${esc(t)}" style="font-size:11.5px">${a ? esc(a.name.split(" ")[0]) : "<span class='muted'>—</span>"}</td>`;
            }).join("")}</tr>`).join("")}
          </tbody></table></div>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>Simulate a new lead</h3></div>
      <div class="card-b">
        <div class="field"><label class="f">Language</label>
          <select id="rl">${D.LANGUAGES.map((l) => `<option>${l}</option>`).join("")}</select></div>
        <div class="field"><label class="f">Inquiry type</label>
          <select id="rt">${D.INQUIRY_TYPES.map((t) => `<option>${t}</option>`).join("")}</select></div>
        <div class="field"><label class="f">Escalation window</label>
          <select id="rw"><option value="6">6 seconds (demo speed)</option><option value="12">12 seconds</option></select></div>
        <button class="btn primary" data-route>⇄ Route this lead</button>
        <p class="muted" style="font-size:11.5px;margin-bottom:0">In production the window is 5 minutes; sped up here so you can watch it.</p>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h"><h3>Routing trace</h3></div>
    <div class="card-b" id="trace"><div class="empty"><div class="big">⇄</div>Run a simulation to see the routing and escalation trace</div></div>
  </div>`;

  $("[data-route]").addEventListener("click", () => runRouting($("#rl").value, $("#rt").value, Number($("#rw").value)));
}

function pickAgent(lang, type, exclude = []) {
  return D.AGENTS.find((a) =>
    a.role === "agent" && a.online && !exclude.includes(a.id) &&
    a.languages.includes(lang) &&
    (a.specialties.includes(type) || (type === "After-sales" && a.dept === "Support"))
  ) || D.AGENTS.find((a) => a.role === "agent" && a.online && !exclude.includes(a.id) && a.languages.includes(lang))
    || D.AGENTS.find((a) => a.role === "agent" && a.online && !exclude.includes(a.id));
}

function runRouting(lang, type, windowSec) {
  clearInterval(S.routing.timer);
  const first = pickAgent(lang, type);
  const second = pickAgent(lang, type, first ? [first.id] : []);
  const cell = $(`[data-cell="${lang}|${type}"]`);
  $$(".hit").forEach((e) => e.classList.remove("hit"));
  if (cell) cell.classList.add("hit");

  const t = $("#trace");
  t.innerHTML = `
    <div class="step on done"><span class="dot">1</span><span><b>Lead received</b><br>
      <span class="muted">${esc(lang)} · ${esc(type)} · matched matrix cell</span></span></div>
    <div class="step on" id="s2"><span class="dot">2</span><span><b>Assigned to ${esc(first ? first.name : "—")}</b><br>
      <span class="muted">${esc(first ? first.languages.join("/") + " · " + first.dept + " · " + first.availability : "")}</span>
      <div class="esc-bar" style="margin-top:7px"><i id="bar" style="width:0%"></i></div>
      <span class="muted" style="font-size:11.5px" id="cd">waiting for response… ${windowSec}s</span></span></div>
    <div class="step" id="s3"><span class="dot">3</span><span><b>Escalation</b><br>
      <span class="muted">if no response, auto-forward to next available team member</span></span></div>`;

  let el = 0;
  S.routing.timer = setInterval(() => {
    el += 0.1;
    const pct = Math.min(100, (el / windowSec) * 100);
    const bar = $("#bar"); const cd = $("#cd");
    if (bar) bar.style.width = pct + "%";
    if (cd) cd.textContent = `waiting for response… ${Math.max(0, windowSec - el).toFixed(1)}s`;
    if (el >= windowSec) {
      clearInterval(S.routing.timer);
      const s2 = $("#s2"); const s3 = $("#s3");
      if (cd) cd.innerHTML = `<span class="pill red">no response — SLA breached</span>`;
      if (s2) s2.classList.remove("done");
      if (s3) {
        s3.classList.add("on", "done");
        s3.innerHTML = `<span class="dot">3</span><span><b>Escalated to ${esc(second ? second.name : "manager queue")}</b><br>
          <span class="muted">auto-forwarded after ${windowSec}s · original agent notified</span>
          <br><span class="pill green" style="margin-top:6px">✓ lead never dropped</span></span>`;
      }
      toast(`Escalated to **${second ? second.name : "manager queue"}** after no response.`);
    }
  }, 100);
}

/* ============================================================
   11. EXECUTIVE ANALYTICS
   ============================================================ */

function pageAnalytics(c) {
  const stages = D.STAGES.filter((s) => !["won", "lost"].includes(s.id));
  const counts = D.STAGES.map((s) => S.leads.filter((l) => l.stage === s.id).length);
  const maxC = Math.max(...counts, 1);
  const won = S.leads.filter((l) => l.stage === "won");
  const revenue = won.reduce((n, l) => n + (l.budget > 1e5 ? l.budget : 0), 0);
  const spend = D.CAMPAIGNS.reduce((n, x) => n + x.spend, 0);
  const agents = D.AGENTS.filter((a) => a.role === "agent");
  const byChan = {};
  S.leads.forEach((l) => { byChan[l.channel] = (byChan[l.channel] || 0) + 1; });
  const maxCh = Math.max(1, ...Object.values(byChan));
  const avgScore = S.leads.length ? Math.round(S.leads.reduce((n, l) => n + l.score, 0) / S.leads.length) : 0;
  const avgHandle = S.calls.length ? Math.round(S.calls.reduce((n, c2) => n + c2.duration, 0) / S.calls.length) : 0;

  c.innerHTML = `
  <p class="page-intro">Cross-functional reporting: marketing spend, organic pipeline and support — one view (2.3).</p>

  <div class="grid g4" style="margin-bottom:16px">
    ${kpi("Revenue closed", short(revenue), `${won.length} deals`, "up")}
    ${kpi("Marketing spend", short(spend), "month to date", "")}
    ${kpi("Blended ROI", (revenue / spend).toFixed(1) + "×", "revenue ÷ spend", "up")}
    ${kpi("Avg lead score", avgScore, "quality index", "")}
  </div>

  <div class="grid g2" style="margin-bottom:16px">
    <div class="card">
      <div class="card-h"><h3>Pipeline funnel</h3></div>
      <div class="card-b">
        ${D.STAGES.map((s, i) => `
          <div class="funnel-row">
            <span style="width:110px;font-size:12.5px">${esc(s.label)}</span>
            <div class="fb" style="width:${(counts[i] / maxC) * 62}%;${s.id === "won" ? "background:var(--green)" : s.id === "lost" ? "background:var(--red)" : ""}"></div>
            <b>${counts[i]}</b></div>`).join("")}
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>Lead source mix</h3></div>
      <div class="card-b">
        <div class="bars">
          ${Object.entries(byChan).sort((a, b) => b[1] - a[1]).map(([k, v]) => `
            <div class="b"><i style="height:${(v / maxCh) * 100}%;background:${D.CHANNELS[k].color}"></i>
              <span>${esc(D.CHANNELS[k].icon)}</span></div>`).join("")}
        </div>
        <div class="legend" style="margin-top:12px">
          ${Object.entries(byChan).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) =>
            `<span><i style="background:${D.CHANNELS[k].color}"></i>${esc(D.CHANNELS[k].label)} (${v})</span>`).join("")}
        </div>
      </div>
    </div>
  </div>

  <div class="grid g2">
    <div class="card">
      <div class="card-h"><h3>Agent leaderboard — individual visibility (2.3)</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Agent</th><th>Languages</th><th>Leads</th><th>Closed</th><th>Target</th><th>Attainment</th></tr></thead>
        <tbody>${agents.sort((a, b) => b.closed - a.closed).map((a) => {
          const n = S.leads.filter((l) => l.agentId === a.id).length;
          const pct = Math.round((a.closed / a.target) * 100);
          return `<tr><td><div class="row"><span class="av" style="width:26px;height:26px;border-radius:50%;background:var(--brand);color:#fff;display:grid;place-items:center;font-size:10px;font-weight:700">${esc(a.avatar)}</span>
            <b style="font-size:12.5px">${esc(a.name)}</b></div></td>
            <td style="font-size:11.5px">${esc(a.languages.join(", "))}</td>
            <td>${n}</td><td><b>${a.closed}</b></td><td>${a.target}</td>
            <td><div class="row"><span class="pill ${pct >= 100 ? "green" : pct >= 70 ? "amber" : "red"}">${pct}%</span>
              <div class="score-bar" style="width:64px"><i style="width:${Math.min(100, pct)}%;background:${pct >= 100 ? "var(--green)" : "var(--brand)"}"></i></div></div></td></tr>`;
        }).join("")}</tbody></table></div>
    </div>

    <div class="card">
      <div class="card-h"><h3>Channel ROI</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Channel</th><th>Spend</th><th>Leads</th><th>Deals</th><th>Rev/฿ spent</th></tr></thead>
        <tbody>${D.CAMPAIGNS.filter((x) => x.status === "active").map((x) => {
          const r = (x.deals * 11000000) / x.spend;
          return `<tr><td style="font-size:12.5px"><b>${esc(x.channel)}</b></td>
            <td>${short(x.spend)}</td><td>${x.leads}</td><td>${x.deals}</td>
            <td><span class="pill ${r > 200 ? "green" : r > 100 ? "amber" : "red"}">${r.toFixed(0)}×</span></td></tr>`;
        }).join("")}</tbody></table></div>
      <div class="card-b" style="border-top:1px solid var(--border)">
        <span class="muted" style="font-size:11.5px">Support metrics: ${S.calls.length} calls logged ·
        avg handle time ${mmss(avgHandle)} ·
        ${S.leads.filter((l) => l.inquiry === "After-sales").length} after-sales tickets</span>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   12. B2B BROKERS (internal view)
   ============================================================ */

function pageBrokers(c) {
  const tot = D.BROKERS.reduce((a, b) => ({ sales: a.sales + b.ytdSales, pending: a.pending + b.pending, paid: a.paid + b.paid, deals: a.deals + b.deals }), { sales: 0, pending: 0, paid: 0, deals: 0 });
  c.innerHTML = `
  <p class="page-intro">Internal management view of the external broker network (2.4). Brokers see their own portal — open it from the login screen.</p>

  <div class="grid g4" style="margin-bottom:16px">
    ${kpi("Active brokers", D.BROKERS.filter((b) => b.status === "active").length, `${D.BROKERS.length} total`, "")}
    ${kpi("Broker-sourced sales", short(tot.sales), `${tot.deals} deals YTD`, "up")}
    ${kpi("Commission pending", short(tot.pending), "awaiting payout", "dn")}
    ${kpi("Commission paid", short(tot.paid), "year to date", "")}
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>Broker network</h3><div class="spacer"></div>
      <button class="btn sm" onclick="window.open('broker.html','_blank')">Open partner portal ↗</button></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Agency</th><th>Contact</th><th>Tier</th><th>Rate</th><th>YTD sales</th><th>Deals</th><th>Pending</th><th>Paid</th><th>Status</th></tr></thead>
      <tbody>${D.BROKERS.map((b) => `
        <tr><td><b>${esc(b.name)}</b></td><td style="font-size:12px">${esc(b.contact)}</td>
        <td><span class="pill ${b.tier === "Platinum" ? "gold" : b.tier === "Gold" ? "amber" : "blue"}">${esc(b.tier)}</span></td>
        <td>${b.rate}%</td><td><b>${short(b.ytdSales)}</b></td><td>${b.deals}</td>
        <td>${b.pending ? `<span class="pill amber">${short(b.pending)}</span>` : "<span class='muted'>—</span>"}</td>
        <td>${short(b.paid)}</td>
        <td><span class="pill ${b.status === "active" ? "green" : "amber"}">${esc(b.status)}</span></td></tr>`).join("")}
      </tbody></table></div>
  </div>

  <div class="grid g2">
    <div class="card">
      <div class="card-h"><h3>Commission tier structure</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Tier</th><th>Qualifying YTD sales</th><th>Commission rate</th><th>Brokers</th></tr></thead>
        <tbody>${D.TIERS.map((t) => `<tr>
          <td><span class="pill ${t.tier === "Platinum" ? "gold" : t.tier === "Gold" ? "amber" : "blue"}">${esc(t.tier)}</span></td>
          <td>${t.min ? short(t.min) + "+" : "—"}</td><td><b>${t.rate}%</b></td>
          <td>${D.BROKERS.filter((b) => b.tier === t.tier).length}</td></tr>`).join("")}
        </tbody></table></div>
    </div>
    <div class="card">
      <div class="card-h"><h3>Shared collateral vault</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Updated</th></tr></thead>
        <tbody>${D.COLLATERAL.slice(0, 6).map((f) => `<tr>
          <td style="font-size:12.5px">${esc(f.name)}</td><td><span class="pill">${esc(f.type)}</span></td>
          <td class="muted">${esc(f.size)}</td><td class="muted">${esc(f.updated)}</td></tr>`).join("")}
        </tbody></table></div>
    </div>
  </div>`;
}

/* ============================================================
   13. PDPA CENTER
   ============================================================ */

function pagePdpa(c) {
  const withConsent = S.leads.filter((l) => l.consent).length;
  c.innerHTML = `
  <p class="page-intro">Thailand Personal Data Protection Act controls (Section 3). Consent logging, retention and the Right to be Forgotten.</p>

  <div class="grid g4" style="margin-bottom:16px">
    ${kpi("Records held", S.leads.length, "customer profiles", "")}
    ${kpi("With valid consent", withConsent, `${S.leads.length - withConsent} missing`, S.leads.length - withConsent ? "dn" : "up")}
    ${kpi("Data residency", "On-prem", "PII never leaves Thailand", "up")}
    ${kpi("Retention policy", "24 months", "auto-purge enabled", "")}
  </div>

  <div class="grid g2" style="margin-bottom:16px">
    <div class="card">
      <div class="card-h"><h3>Where data lives (hybrid deployment)</h3></div>
      <div class="card-b">
        ${[
          ["☁️ AWS Singapore", "App layer, web entry points, LLM API calls", "cloud"],
          ["🏢 On-premise (Bangkok)", "Customer PII, call recordings, contracts", "onprem"],
          ["🔒 Private tunnel", "Encrypted link — LLM reads PII without storing it", "tunnel"]
        ].map(([a, b, k]) => `
          <div class="row" style="padding:10px 0;border-bottom:1px dashed var(--border)">
            <span style="flex:1"><b style="font-size:13px">${esc(a)}</b><br>
              <span class="muted" style="font-size:12px">${esc(b)}</span></span>
            <span class="pill ${k === "onprem" ? "green" : "blue"}">${k === "onprem" ? "PII" : "no PII"}</span></div>`).join("")}
        <p class="muted" style="font-size:11.5px;margin:12px 0 0">No customer PII is ever used to train public models.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-h"><h3>Right to be Forgotten</h3></div>
      <div class="card-b">
        <p class="muted" style="margin-top:0;font-size:12.5px">Select a customer to permanently erase all their data — profile, messages and call logs. This really deletes from the demo dataset.</p>
        <div class="field"><label class="f">Customer</label>
          <select id="forget">${S.leads.map((l) => `<option value="${l.id}">${esc(l.name)} — ${esc(l.phone)}</option>`).join("")}</select></div>
        <button class="btn danger" data-forget>⛨ Erase all data for this person</button>
        <div class="field" style="margin-top:14px"><label class="f">Data export (portability)</label>
          <button class="btn" data-export>⬇ Export their data as JSON</button></div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-h"><h3>Consent log — immutable audit trail</h3></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Customer</th><th>Legal basis</th><th>Purpose</th><th>Captured</th><th>Retention</th><th>Status</th></tr></thead>
      <tbody>${D.CONSENT_LOG.map((r) => {
        const alive = S.leads.some((l) => l.id === r.leadId);
        return `<tr><td><b>${esc(r.name)}</b></td>
          <td style="font-size:12px">${esc(r.basis)}</td><td style="font-size:12px">${esc(r.purpose)}</td>
          <td class="muted" style="font-size:12px">${esc(r.at)}</td><td>${esc(r.retention)}</td>
          <td>${!alive ? `<span class="pill red">erased</span>`
            : r.basis.includes("Not yet") ? `<span class="pill amber">⚠ blocked</span>`
            : `<span class="pill green">valid</span>`}</td></tr>`;
      }).join("")}</tbody></table></div>
  </div>`;

  $("[data-forget]").addEventListener("click", () => {
    const id = $("#forget").value;
    const L = lead(id);
    if (!L) return toast("No customer records left to erase.");
    if (!confirm(`Permanently erase all data for ${L.name}? This cannot be undone.`)) return;
    S.leads = S.leads.filter((l) => l.id !== id);
    delete S.conversations[id];
    S.calls = S.calls.filter((c2) => c2.leadId !== id);
    if (S.selectedLeadId === id) S.selectedLeadId = null;
    save(); renderPage();
    toast(`All data for **${L.name}** erased — profile, messages and call logs.`);
  });

  $("[data-export]").addEventListener("click", () => {
    const id = $("#forget").value;
    const L = lead(id);
    if (!L) return toast("No customer records left to export.");
    const payload = { profile: L, conversations: S.conversations[id] || [], calls: S.calls.filter((c2) => c2.leadId === id) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pdpa-export-${L.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    toast("Data export downloaded (PDPA portability).");
  });
}

/* ---------------- boot ---------------- */

load();
render();

/* Ask the backend whether an OpenRouter key is configured, then refresh
   just the status badge — no full re-render, so it can't interrupt anyone. */
AI.probe().then(() => {
  const badge = $(".ai-badge");
  if (!badge) return;
  const st = AI.status();
  badge.className = "ai-badge" + (st.live ? "" : " sim");
  badge.textContent = "✦ " + st.label;
});
