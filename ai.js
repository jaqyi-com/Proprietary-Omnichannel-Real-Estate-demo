/* ============================================================
   AI LAYER  (Requirement 2.2 + Section 5)
   ------------------------------------------------------------
   Two modes, same interface:

   1. NO API KEY  -> real retrieval over the local property
                     database + scripted phrasing.
                     The FACTS are real, the wording is canned.
   2. API KEY SET -> the same retrieved facts are sent to your
                     LLM as RAG context. Real generated answers.

   Set the key in config.js. Nothing else changes.
   ============================================================ */

const AI = (() => {
  const cfg = () => window.AI_CONFIG || {};

  /* server = state of the /api/ai proxy:
     "unknown" before probing, "ready" if a key is configured server-side,
     "absent" when running from file:// or with no key set in Vercel.     */
  let server = "unknown";
  let serverModel = null;

  const localKey = () => (cfg().apiKey || "").trim();
  const isLive = () => server === "ready" || Boolean(localKey());

  /* Ask the backend whether a key is configured. Safe to call anywhere —
     resolves to "absent" when opened as a local file. */
  async function probe() {
    if (server !== "unknown") return server;
    if (typeof location === "undefined" || location.protocol === "file:") {
      server = "absent";
      return server;
    }
    try {
      const res = await fetch("/api/ai", { method: "GET" });
      const json = await res.json();
      server = json.configured ? "ready" : "absent";
      serverModel = json.model || null;
    } catch {
      server = "absent";
    }
    return server;
  }

  /* ---------- RETRIEVAL (the "R" in RAG) ---------- */

  function retrieve(question) {
    const q = String(question || "").toLowerCase();
    const D = window.DEMO;
    const hits = [];

    const matchedProjects = D.PROJECTS.filter((p) => {
      const hay = `${p.name} ${p.location} ${p.type} ${p.towers.join(" ")}`.toLowerCase();
      const words = hay.split(/[\s,]+/).filter((w) => w.length > 3);
      // whole-word match only, so "viewing" does not match "Wing"
      const hit = words.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(q));
      return hit ||
             (q.includes("sukhumvit") && p.id === "prj_sukhumvit") ||
             (q.includes("riverside") && p.id === "prj_riverside") ||
             (q.includes("river") && p.id === "prj_riverside") ||
             (q.includes("phuket") && p.id === "prj_phuket") ||
             (q.includes("villa") && p.id === "prj_phuket");
    });

    const projects = matchedProjects.length ? matchedProjects : D.PROJECTS;

    // bedroom filter
    let bedFilter = null;
    if (/\b1\s?br|\bone bed|1 bedroom|1 ห้องนอน/.test(q)) bedFilter = "1BR";
    if (/\b2\s?br|\btwo bed|2 bedroom|2 ห้องนอน/.test(q)) bedFilter = "2BR";
    if (/\b3\s?br|\bthree bed|3 bedroom|3 ห้องนอน/.test(q)) bedFilter = "3BR";
    if (/\b4\s?br|\bfour bed|4 bedroom/.test(q)) bedFilter = "4BR";

    const wantsAvailable = /avail|ว่าง|in stock|left|remaining/.test(q);

    let units = D.UNITS.filter((u) => projects.some((p) => p.id === u.projectId));
    if (bedFilter) units = units.filter((u) => u.type.startsWith(bedFilter));
    if (wantsAvailable) units = units.filter((u) => u.status === "available");

    projects.forEach((p) => hits.push({ kind: "project", ref: p }));
    units.slice(0, 8).forEach((u) => hits.push({ kind: "unit", ref: u }));

    return { projects, units, hits, bedFilter };
  }

  function contextText(r) {
    const D = window.DEMO;
    const lines = [];
    r.projects.forEach((p) => {
      lines.push(
        `PROJECT: ${p.name} | ${p.location} | ${p.type} | completion: ${p.completion} | ` +
        `transport: ${p.bts} | avg ฿${p.pricePerSqm.toLocaleString()}/sqm | ` +
        `facilities: ${p.facilities.join(", ")}`
      );
    });
    r.units.slice(0, 12).forEach((u) => {
      const p = D.PROJECTS.find((x) => x.id === u.projectId);
      lines.push(
        `UNIT: ${u.unit} | ${p ? p.name : ""} | ${u.tower} | ${u.type} | ${u.sqm} sqm | ` +
        `floor ${u.floor} | ${u.view} view | ฿${u.price.toLocaleString()} | ${u.status}`
      );
    });
    return lines.join("\n");
  }

  /* ---------- SCRIPTED ANSWER BUILDER (facts are real) ---------- */

  function scriptedAnswer(question, r) {
    const q = String(question || "").toLowerCase();
    const D = window.DEMO;
    const money = (n) => "฿" + n.toLocaleString();

    if (!r.units.length && !r.projects.length) return D.AI_SCRIPTS.fallbackChat;

    // availability / how many left
    if (/avail|ว่าง|how many|left|remaining/.test(q)) {
      const avail = r.units.filter((u) => u.status === "available");
      if (!avail.length) return "There are no matching units currently available. I can add you to the waitlist or show you similar units in another tower.";
      const byProject = {};
      avail.forEach((u) => {
        const p = D.PROJECTS.find((x) => x.id === u.projectId);
        const key = p ? p.name : "Other";
        (byProject[key] = byProject[key] || []).push(u);
      });
      return Object.entries(byProject).map(([name, us]) =>
        `**${name}** — ${us.length} unit${us.length > 1 ? "s" : ""} available:\n` +
        us.map((u) => `• ${u.unit} (${u.tower}) — ${u.type}, ${u.sqm} sqm, ${u.view} view — ${money(u.price)}`).join("\n")
      ).join("\n\n");
    }

    // price questions
    if (/price|cost|ราคา|how much|budget|เท่าไหร่|start/.test(q)) {
      const list = r.units.length ? r.units : D.UNITS;
      // never quote a sold/reserved unit as the entry price
      const sellable = list.filter((u) => u.status === "available");
      const cheapest = [...(sellable.length ? sellable : list)].sort((a, b) => a.price - b.price)[0];
      const p = D.PROJECTS.find((x) => x.id === cheapest.projectId);
      const label = r.bedFilter ? `${r.bedFilter} units` : "units";
      return `At **${p.name}**, ${label} start from **${money(cheapest.price)}** ` +
             `(${cheapest.unit}, ${cheapest.sqm} sqm, ${cheapest.view} view, floor ${cheapest.floor}).\n\n` +
             `Average price is ฿${p.pricePerSqm.toLocaleString()}/sqm. ${p.bts}. Completion: ${p.completion}.\n\n` +
             `Would you like me to book a viewing or send the full price list?`;
    }

    // facilities
    if (/facilit|amenit|pool|gym|สิ่งอำนวย|สระ|parking|pet/.test(q)) {
      const p = r.projects[0];
      return `**${p.name}** includes: ${p.facilities.join(", ")}.\n\n${p.bts}. ` +
             `The project is ${p.type.toLowerCase()}, completing ${p.completion}.`;
    }

    // yield / investment
    if (/yield|roi|return|invest|rental|ผลตอบแทน/.test(q)) {
      return `For investment buyers we recommend **Phuket Bay Villas** (Kamala Beach) — villas from ` +
             `${money(25560000)} with a managed rental programme targeting **6–8% gross yield**. ` +
             `Foreign buyers typically use leasehold (30+30 years) or a Thai company structure.\n\n` +
             `Shall I connect you with David Chen, our investment specialist?`;
    }

    // location / transport
    if (/where|location|bts|mrt|ที่ไหน|near|transport/.test(q)) {
      return r.projects.map((p) => `**${p.name}** — ${p.location}. ${p.bts}.`).join("\n\n");
    }

    // default: project summary
    const p = r.projects[0];
    const avail = D.UNITS.filter((u) => u.projectId === p.id && u.status === "available");
    const min = avail.length ? Math.min(...avail.map((u) => u.price)) : p.pricePerSqm * 35;
    return `**${p.name}** — ${p.location}\n\n` +
           `${p.type}, completing ${p.completion}. ${p.bts}.\n` +
           `${avail.length} units currently available, from ${money(min)}.\n\n` +
           `Facilities: ${p.facilities.join(", ")}.`;
  }

  /* ---------- INTENT DETECTION (Section 5: escalation) ---------- */

  function detectIntent(text) {
    const t = String(text || "").toLowerCase();
    const D = window.DEMO;
    if (D.ESCALATION_WORDS.some((w) => t.includes(w))) {
      return { intent: "frustrated", escalate: true, reason: "Negative sentiment / complaint detected" };
    }
    if (D.HOT_LEAD_WORDS.some((w) => t.includes(w))) {
      return { intent: "hot_lead", escalate: true, reason: "High purchase intent detected" };
    }
    return { intent: "informational", escalate: false, reason: "" };
  }

  /* ---------- LIVE API CALL ---------- */

  async function callProvider(system, user) {
    const c = cfg();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), c.timeoutMs || 25000);

    try {
      /* Preferred path: our own serverless proxy. The OpenRouter key lives in
         Vercel's environment and never reaches the browser. */
      if (server === "ready") {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ system, user, maxTokens: 700 }),
          signal: controller.signal
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 501) server = "absent"; // key was removed
          throw new Error(json.error || `Proxy error ${res.status}`);
        }
        if (json.model) serverModel = json.model;
        if (!json.text) throw new Error("Empty response");
        return json.text;
      }

      /* Fallback path: a key pasted into config.js for local testing only.
         Calls OpenRouter directly from the browser — never use in production. */
      const key = localKey();
      if (!key) throw new Error("No AI backend available");

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: c.model || "openai/gpt-4o-mini",
          max_tokens: 700,
          messages: [{ role: "system", content: system }, { role: "user", content: user }]
        }),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content || "";
      if (!text) throw new Error("Empty response");
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- PUBLIC: answer a customer question (RAG) ---------- */

  async function ask(question) {
    const r = retrieve(question);
    const intent = detectIntent(question);
    const sources = r.hits.slice(0, 5).map((h) =>
      h.kind === "project" ? h.ref.name : `${h.ref.unit} (${h.ref.type})`
    );

    let text;
    let live = false;

    if (isLive()) {
      const system =
        `You are the sales assistant for ${window.DEMO_BRAND.company}, a Thai real estate developer. ` +
        `Answer ONLY using the CONTEXT below. Never invent prices, unit numbers or availability. ` +
        `If the answer is not in the context, say so and offer to connect a human agent. ` +
        `Be concise (max 120 words). Prices are Thai Baht. Reply in the same language as the question.`;
      const user = `CONTEXT:\n${contextText(r)}\n\nCUSTOMER QUESTION: ${question}`;
      try {
        text = await callProvider(system, user);
        live = true;
      } catch (e) {
        if (!cfg().fallbackToScripted) throw e;
        text = scriptedAnswer(question, r);
      }
    } else {
      await wait(450 + Math.random() * 400);
      text = scriptedAnswer(question, r);
    }

    return { text, sources, intent, live };
  }

  /* ---------- PUBLIC: generate ad copy ---------- */

  async function generateAdCopy(platform, projectId, tone) {
    const D = window.DEMO;
    const p = D.PROJECTS.find((x) => x.id === projectId) || D.PROJECTS[0];
    const avail = D.UNITS.filter((u) => u.projectId === p.id && u.status === "available");
    const min = avail.length ? Math.min(...avail.map((u) => u.price)) : 0;

    if (isLive()) {
      const system = `You are a performance marketing copywriter for Thai real estate. Return exactly 3 ad variants, one per line, no numbering, no preamble.`;
      const user =
        `Platform: ${platform}\nTone: ${tone}\nProject: ${p.name}, ${p.location}\n` +
        `Type: ${p.type}, completion ${p.completion}\nTransport: ${p.bts}\n` +
        `Facilities: ${p.facilities.join(", ")}\nStarting price: ฿${min.toLocaleString()}\n` +
        `Write 3 short ${platform} ad variants.`;
      try {
        const out = await callProvider(system, user);
        return { variants: out.split("\n").map((s) => s.replace(/^[-•\d.)\s]+/, "").trim()).filter(Boolean).slice(0, 3), live: true };
      } catch (e) {
        if (!cfg().fallbackToScripted) throw e;
      }
    }

    await wait(700);
    const key = platform.toLowerCase().includes("tiktok") ? "tiktok"
              : platform.toLowerCase().includes("insta") ? "instagram" : "facebook";
    return { variants: D.AI_SCRIPTS.adCopy[key], live: false };
  }

  /* ---------- PUBLIC: competitor analysis ---------- */

  async function analyseCompetitors() {
    const D = window.DEMO;
    if (isLive()) {
      const system = `You are a real estate market analyst. Give 4 short, specific, numbered strategic recommendations. Use the data given. Be direct.`;
      const rows = D.COMPETITORS.map((c) =>
        `${c.name} | ${c.project} | ฿${c.pricePerSqm.toLocaleString()}/sqm | promo: ${c.promo} | ${c.sold}% sold | channels: ${c.channels.join(", ")}`
      ).join("\n");
      const ours = D.PROJECTS.map((p) => `OURS: ${p.name} | ฿${p.pricePerSqm.toLocaleString()}/sqm | ${p.location}`).join("\n");
      try {
        const out = await callProvider(system, `COMPETITORS:\n${rows}\n\n${ours}\n\nGive strategic recommendations.`);
        return { insights: out.split(/\n(?=\d)/).map((s) => s.trim()).filter(Boolean), live: true };
      } catch (e) {
        if (!cfg().fallbackToScripted) throw e;
      }
    }
    await wait(900);
    return { insights: D.AI_SCRIPTS.competitorInsight, live: false };
  }

  /* ---------- PUBLIC: personalised pitch (2.2 hyper-personalisation) ---------- */

  async function personalisedPitch(lead) {
    const D = window.DEMO;
    const p = D.PROJECTS.find((x) => x.id === lead.projectId);
    const fits = D.UNITS.filter((u) =>
      u.projectId === lead.projectId &&
      u.status === "available" &&
      (lead.budget < 100000 || u.price <= lead.budget * 1.1)
    ).sort((a, b) => Math.abs(a.price - lead.budget) - Math.abs(b.price - lead.budget));

    if (isLive()) {
      const system = `You write short, warm, personalised property pitches for real estate leads. Max 90 words. Same language as the lead's preferred language.`;
      const user =
        `Lead: ${lead.name} | language ${lead.language} | interest ${lead.inquiry} | ` +
        `budget ฿${lead.budget.toLocaleString()} | came from ${D.CHANNELS[lead.channel].label}\n` +
        `Project: ${p ? p.name : "n/a"}\n` +
        `Best matching units:\n` + fits.slice(0, 3).map((u) => `${u.unit} ${u.type} ${u.sqm}sqm ฿${u.price.toLocaleString()} ${u.view} view`).join("\n");
      try {
        return { text: await callProvider(system, user), units: fits.slice(0, 3), live: true };
      } catch (e) {
        if (!cfg().fallbackToScripted) throw e;
      }
    }

    await wait(650);
    const best = fits[0];
    const txt = best
      ? `${lead.name} came in via ${D.CHANNELS[lead.channel].label} looking to ${lead.inquiry.toLowerCase()} ` +
        `with a budget around ฿${lead.budget.toLocaleString()}. Best match is **${best.unit}** at ${p.name} — ` +
        `${best.type}, ${best.sqm} sqm, ${best.view} view, ฿${best.price.toLocaleString()}. ` +
        `Lead with the ${p.bts.toLowerCase()} and the ${p.facilities[0].toLowerCase()}. ` +
        `Preferred language: ${lead.language}.`
      : `${lead.name} has a budget of ฿${lead.budget.toLocaleString()}, which is below current available inventory at ${p ? p.name : "this project"}. ` +
        `Recommend offering Riverside Residences (ready to move, from ฿6.04M) or adding to the waitlist for the next release.`;
    return { text: txt, units: fits.slice(0, 3), live: false };
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function status() {
    if (server === "ready") {
      return { live: true, label: `Live AI · OpenRouter${serverModel ? " · " + serverModel : ""}` };
    }
    if (localKey()) return { live: true, label: "Live AI · OpenRouter (local key)" };
    return { live: false, label: "Simulated AI" };
  }

  return { ask, generateAdCopy, analyseCompetitors, personalisedPitch, detectIntent, retrieve, status, isLive, probe };
})();

window.AI = AI;
