/* ============================================================
   DEMO DATA — sample real estate data for the client demo.
   All names/numbers are fictional.
   ============================================================ */

const CHANNELS = {
  line:      { label: "LINE OA",    icon: "L",  color: "#06C755" },
  whatsapp:  { label: "WhatsApp",   icon: "W",  color: "#25D366" },
  telegram:  { label: "Telegram",   icon: "T",  color: "#2AABEE" },
  facebook:  { label: "Facebook",   icon: "f",  color: "#1877F2" },
  instagram: { label: "Instagram",  icon: "IG", color: "#E1306C" },
  tiktok:    { label: "TikTok",     icon: "TT", color: "#111111" },
  web1:      { label: "Website A",  icon: "W1", color: "#6366F1" },
  web2:      { label: "Website B",  icon: "W2", color: "#8B5CF6" },
  google:    { label: "Google/GMB", icon: "G",  color: "#EA4335" },
  phone:     { label: "Phone",      icon: "☎",  color: "#F59E0B" }
};

const STAGES = [
  { id: "new",         label: "New Lead" },
  { id: "contacted",   label: "Contacted" },
  { id: "viewing",     label: "Viewing Booked" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won",         label: "Closed Won" },
  { id: "lost",        label: "Closed Lost" }
];

const INQUIRY_TYPES = ["Buy", "Rent", "Investment", "After-sales"];
const LANGUAGES = ["Thai", "English", "Chinese"];

/* ---------------- Projects & Units (the RAG knowledge base) -------------- */

const PROJECTS = [
  {
    id: "prj_sukhumvit",
    name: "Sukhumvit Grand Residence",
    location: "Sukhumvit 24, Bangkok",
    type: "High-rise Condominium",
    completion: "Q4 2026",
    towers: ["Tower A", "Tower B"],
    facilities: ["Rooftop infinity pool", "Sky gym", "Co-working lounge", "EV charging", "24h security"],
    bts: "250m from BTS Phrom Phong",
    pricePerSqm: 195000,
    brochure: "Sukhumvit_Grand_Brochure_EN.pdf"
  },
  {
    id: "prj_riverside",
    name: "Riverside Residences",
    location: "Charoen Nakhon, Bangkok",
    type: "Riverfront Condominium",
    completion: "Ready to move",
    towers: ["North Wing", "South Wing"],
    facilities: ["River-view pool", "Private pier", "Kids club", "Sky bar", "Pet friendly"],
    bts: "400m from BTS Krung Thon Buri",
    pricePerSqm: 168000,
    brochure: "Riverside_Residences_Brochure.pdf"
  },
  {
    id: "prj_phuket",
    name: "Phuket Bay Villas",
    location: "Kamala Beach, Phuket",
    type: "Private Pool Villas",
    completion: "Q2 2027",
    towers: ["Hillside", "Beachfront"],
    facilities: ["Private pool per villa", "Beach club access", "Rental program", "Concierge"],
    bts: "20 min from Phuket Airport",
    pricePerSqm: 142000,
    brochure: "Phuket_Bay_Villas_Deck.pdf"
  }
];

const UNITS = [
  // Sukhumvit Grand
  { id: "u01", projectId: "prj_sukhumvit", tower: "Tower A", unit: "A-1205", type: "1BR", sqm: 35,  floor: 12, price: 6825000,  view: "City",  status: "available" },
  { id: "u02", projectId: "prj_sukhumvit", tower: "Tower A", unit: "A-1802", type: "2BR", sqm: 62,  floor: 18, price: 12090000, view: "City",  status: "available" },
  { id: "u03", projectId: "prj_sukhumvit", tower: "Tower A", unit: "A-2501", type: "2BR", sqm: 68,  floor: 25, price: 13600000, view: "Park",  status: "reserved"  },
  { id: "u04", projectId: "prj_sukhumvit", tower: "Tower B", unit: "B-0903", type: "1BR", sqm: 32,  floor: 9,  price: 6240000,  view: "Pool",  status: "available" },
  { id: "u05", projectId: "prj_sukhumvit", tower: "Tower B", unit: "B-3001", type: "3BR", sqm: 105, floor: 30, price: 22050000, view: "Panoramic", status: "available" },
  { id: "u06", projectId: "prj_sukhumvit", tower: "Tower B", unit: "B-1104", type: "2BR", sqm: 60,  floor: 11, price: 11700000, view: "City",  status: "sold"      },
  // Riverside
  { id: "u07", projectId: "prj_riverside", tower: "North Wing", unit: "N-0705", type: "1BR", sqm: 38, floor: 7,  price: 6384000,  view: "River", status: "available" },
  { id: "u08", projectId: "prj_riverside", tower: "North Wing", unit: "N-1502", type: "2BR", sqm: 71, floor: 15, price: 11928000, view: "River", status: "available" },
  { id: "u09", projectId: "prj_riverside", tower: "South Wing", unit: "S-2201", type: "3BR", sqm: 118,floor: 22, price: 19824000, view: "River", status: "reserved"  },
  { id: "u10", projectId: "prj_riverside", tower: "South Wing", unit: "S-0803", type: "1BR", sqm: 36, floor: 8,  price: 6048000,  view: "City",  status: "sold"      },
  // Phuket
  { id: "u11", projectId: "prj_phuket", tower: "Hillside",   unit: "H-04", type: "3BR Villa", sqm: 240, floor: 0, price: 34080000, view: "Sea",   status: "available" },
  { id: "u12", projectId: "prj_phuket", tower: "Hillside",   unit: "H-07", type: "2BR Villa", sqm: 180, floor: 0, price: 25560000, view: "Garden",status: "available" },
  { id: "u13", projectId: "prj_phuket", tower: "Beachfront", unit: "BF-02",type: "4BR Villa", sqm: 320, floor: 0, price: 45440000, view: "Beachfront", status: "reserved" }
];

/* ---------------- Team ---------------- */

const AGENTS = [
  { id: "ag_01", name: "Somchai Ratanakul", role: "agent",     dept: "Sales",   languages: ["Thai", "English"],   specialties: ["Buy", "Investment"],  online: true,  availability: "free", avatar: "SR", target: 12, closed: 9  },
  { id: "ag_02", name: "Nattaya Phongsri",  role: "agent",     dept: "Sales",   languages: ["Thai", "Chinese"],   specialties: ["Buy", "Rent"],        online: true,  availability: "busy", avatar: "NP", target: 12, closed: 11 },
  { id: "ag_03", name: "Kanya Srisawat",    role: "agent",     dept: "Support", languages: ["Thai", "English"],   specialties: ["After-sales"],        online: true,  availability: "free", avatar: "KS", target: 8,  closed: 6  },
  { id: "ag_04", name: "David Chen",        role: "agent",     dept: "Sales",   languages: ["English", "Chinese"],specialties: ["Investment", "Buy"],  online: true,  availability: "free", avatar: "DC", target: 12, closed: 14 },
  { id: "ag_05", name: "Ploy Wattana",      role: "agent",     dept: "Sales",   languages: ["Thai"],              specialties: ["Rent"],               online: false, availability: "offline", avatar: "PW", target: 10, closed: 4 },
  { id: "mg_01", name: "Anan Vichit",       role: "manager",   dept: "Sales",   languages: ["Thai", "English"],   specialties: [],                     online: true,  availability: "free", avatar: "AV", target: 0,  closed: 0  },
  { id: "ex_01", name: "Suchart Meesap",    role: "executive", dept: "Board",   languages: ["Thai", "English"],   specialties: [],                     online: true,  availability: "free", avatar: "SM", target: 0,  closed: 0  }
];

/* ---------------- Leads ---------------- */

const LEADS = [
  { id: "ld_01", name: "Pim Charoensuk",   phone: "+66 81 234 5678", email: "pim.c@example.co.th",  channel: "line",      language: "Thai",    inquiry: "Buy",        budget: 12000000, projectId: "prj_sukhumvit", stage: "negotiation", agentId: "ag_01", score: 92, consent: true,  createdAt: "2026-07-11", lastAt: "2026-07-25 09:14", unread: 2 },
  { id: "ld_02", name: "Michael Brennan",  phone: "+66 92 887 1120", email: "m.brennan@example.com",channel: "whatsapp",  language: "English", inquiry: "Investment", budget: 25000000, projectId: "prj_phuket",    stage: "viewing",     agentId: "ag_04", score: 88, consent: true,  createdAt: "2026-07-14", lastAt: "2026-07-25 08:40", unread: 1 },
  { id: "ld_03", name: "Li Wei",           phone: "+86 138 0013 8000",email: "liwei@example.cn",    channel: "web1",      language: "Chinese", inquiry: "Buy",        budget: 14000000, projectId: "prj_sukhumvit", stage: "contacted",   agentId: "ag_02", score: 76, consent: true,  createdAt: "2026-07-18", lastAt: "2026-07-24 17:22", unread: 0 },
  { id: "ld_04", name: "Nutthapong Sang",  phone: "+66 86 555 0192", email: "nutt@example.co.th",   channel: "facebook",  language: "Thai",    inquiry: "Rent",       budget: 45000,    projectId: "prj_riverside", stage: "new",         agentId: null,    score: 41, consent: true,  createdAt: "2026-07-25", lastAt: "2026-07-25 10:02", unread: 3 },
  { id: "ld_05", name: "Sarah Kim",        phone: "+82 10 4455 6677",email: "sarah.kim@example.kr", channel: "instagram", language: "English", inquiry: "Buy",        budget: 8000000,  projectId: "prj_riverside", stage: "contacted",   agentId: "ag_04", score: 64, consent: true,  createdAt: "2026-07-21", lastAt: "2026-07-25 07:55", unread: 0 },
  { id: "ld_06", name: "Areeya Thongchai", phone: "+66 89 111 2233", email: "areeya.t@example.co.th",channel: "tiktok",   language: "Thai",    inquiry: "Buy",        budget: 7000000,  projectId: "prj_sukhumvit", stage: "new",         agentId: null,    score: 58, consent: false, createdAt: "2026-07-25", lastAt: "2026-07-25 10:31", unread: 1 },
  { id: "ld_07", name: "Hans Müller",      phone: "+49 151 2233 4455",email: "h.mueller@example.de",channel: "google",    language: "English", inquiry: "Investment", budget: 35000000, projectId: "prj_phuket",    stage: "viewing",     agentId: "ag_04", score: 84, consent: true,  createdAt: "2026-07-16", lastAt: "2026-07-24 14:10", unread: 0 },
  { id: "ld_08", name: "Siriwan Pattana",  phone: "+66 84 777 8899", email: "siriwan@example.co.th",channel: "telegram",  language: "Thai",    inquiry: "After-sales",budget: 0,        projectId: "prj_riverside", stage: "contacted",   agentId: "ag_03", score: 30, consent: true,  createdAt: "2026-07-20", lastAt: "2026-07-25 09:48", unread: 1 },
  { id: "ld_09", name: "Chen Yu Ting",     phone: "+886 912 345 678",email: "chenyt@example.tw",    channel: "line",      language: "Chinese", inquiry: "Buy",        budget: 20000000, projectId: "prj_sukhumvit", stage: "won",         agentId: "ag_02", score: 95, consent: true,  createdAt: "2026-06-28", lastAt: "2026-07-22 11:30", unread: 0 },
  { id: "ld_10", name: "James Okafor",     phone: "+66 95 321 4567", email: "j.okafor@example.com", channel: "web2",      language: "English", inquiry: "Rent",       budget: 60000,    projectId: "prj_sukhumvit", stage: "lost",        agentId: "ag_01", score: 22, consent: true,  createdAt: "2026-07-05", lastAt: "2026-07-19 16:05", unread: 0 },
  { id: "ld_11", name: "Wanida Kulap",     phone: "+66 82 909 1234", email: "wanida.k@example.co.th",channel: "whatsapp", language: "Thai",    inquiry: "Buy",        budget: 11000000, projectId: "prj_riverside", stage: "negotiation", agentId: "ag_01", score: 81, consent: true,  createdAt: "2026-07-09", lastAt: "2026-07-25 08:12", unread: 0 },
  { id: "ld_12", name: "Yuki Tanaka",      phone: "+81 90 1122 3344",email: "y.tanaka@example.jp",  channel: "web1",      language: "English", inquiry: "Investment", budget: 30000000, projectId: "prj_phuket",    stage: "new",         agentId: null,    score: 79, consent: true,  createdAt: "2026-07-25", lastAt: "2026-07-25 10:45", unread: 2 }
];

/* ---------------- Conversations (omnichannel threads) ---------------- */

const CONVERSATIONS = {
  ld_01: [
    { from: "customer", channel: "line", text: "สวัสดีค่ะ สนใจห้อง 2 ห้องนอน ที่ Sukhumvit Grand ค่ะ", at: "2026-07-11 14:02" },
    { from: "ai",       channel: "line", text: "สวัสดีค่ะคุณพิม 🙏 Sukhumvit Grand มีห้อง 2BR ขนาด 62–68 ตร.ม. เริ่มต้น 12.09 ล้านบาท ห่างจาก BTS พร้อมพงษ์ 250 เมตรค่ะ ต้องการให้เจ้าหน้าที่ติดต่อกลับไหมคะ?", at: "2026-07-11 14:02" },
    { from: "customer", channel: "line", text: "ขอดูห้องจริงได้ไหมคะ", at: "2026-07-11 14:09" },
    { from: "agent",    channel: "line", text: "ได้เลยครับคุณพิม ผมสมชายดูแลเคสนี้ครับ สะดวกวันเสาร์ 10 โมงไหมครับ?", at: "2026-07-11 14:15" },
    { from: "customer", channel: "line", text: "สะดวกค่ะ", at: "2026-07-11 14:20" },
    { from: "agent",    channel: "phone", text: "📞 Call — 8m 42s — Site visit confirmed, discussed A-1802 vs A-2501", at: "2026-07-18 10:05" },
    { from: "customer", channel: "line", text: "ถ้าจองวันนี้ มีส่วนลดพิเศษไหมคะ", at: "2026-07-25 09:14" }
  ],
  ld_02: [
    { from: "customer", channel: "whatsapp", text: "Hi, saw your Phuket villas on Instagram. What's the rental yield?", at: "2026-07-14 09:30" },
    { from: "ai",       channel: "whatsapp", text: "Hello Michael! Phuket Bay Villas at Kamala Beach offers a managed rental programme with projected 6–8% gross yield. Villas start at ฿25.56M for 2BR (180 sqm). Completion Q2 2027. Would you like the investment deck?", at: "2026-07-14 09:30" },
    { from: "customer", channel: "whatsapp", text: "Yes please. Also can foreigners own these?", at: "2026-07-14 09:41" },
    { from: "ai",       channel: "whatsapp", text: "Villas are offered on leasehold (30+30 years) or via Thai company structure. Our legal team can walk you through both — connecting you to David Chen, our investment specialist.", at: "2026-07-14 09:41" },
    { from: "agent",    channel: "whatsapp", text: "Hi Michael, David here. I've sent the deck. Free for a call Thursday?", at: "2026-07-14 10:15" },
    { from: "customer", channel: "whatsapp", text: "Booked the site visit for the 28th. Looking forward.", at: "2026-07-25 08:40" }
  ],
  ld_04: [
    { from: "customer", channel: "facebook", text: "ห้องเช่า Riverside เดือนละเท่าไหร่ครับ", at: "2026-07-25 10:00" },
    { from: "ai",       channel: "facebook", text: "สวัสดีครับ Riverside Residences ห้อง 1BR (36–38 ตร.ม.) ค่าเช่าเริ่มต้น 32,000 บาท/เดือน วิวแม่น้ำครับ พร้อมเข้าอยู่ทันที", at: "2026-07-25 10:00" },
    { from: "customer", channel: "facebook", text: "มีที่จอดรถไหมครับ", at: "2026-07-25 10:01" },
    { from: "customer", channel: "facebook", text: "แล้วสัตว์เลี้ยงได้ไหม", at: "2026-07-25 10:02" }
  ],
  ld_06: [
    { from: "customer", channel: "tiktok", text: "เห็นคลิปใน TikTok สนใจค่ะ ราคาเริ่มต้นเท่าไหร่", at: "2026-07-25 10:31" }
  ],
  ld_12: [
    { from: "customer", channel: "web1", text: "Requesting price list for Phuket Bay Villas — investment purpose, budget ~฿30M", at: "2026-07-25 10:45" },
    { from: "customer", channel: "web1", text: "Also is there a guaranteed rental return?", at: "2026-07-25 10:46" }
  ],
  ld_08: [
    { from: "customer", channel: "telegram", text: "แอร์ห้องนอนไม่เย็นครับ แจ้งซ่อมยังไง", at: "2026-07-25 09:48" }
  ]
};

/* ---------------- Call history ---------------- */

const CALLS = [
  { id: "c1", leadId: "ld_01", agentId: "ag_01", direction: "outbound", duration: 522, at: "2026-07-18 10:05", disposition: "interested",   recording: true, notes: "Compared A-1802 and A-2501. Prefers park view." },
  { id: "c2", leadId: "ld_02", agentId: "ag_04", direction: "outbound", duration: 731, at: "2026-07-17 15:20", disposition: "interested",   recording: true, notes: "Discussed leasehold structure and yields." },
  { id: "c3", leadId: "ld_11", agentId: "ag_01", direction: "inbound",  duration: 245, at: "2026-07-24 11:02", disposition: "callback",     recording: true, notes: "Asked for 5% discount, escalated to manager." },
  { id: "c4", leadId: "ld_09", agentId: "ag_02", direction: "outbound", duration: 964, at: "2026-07-20 14:33", disposition: "connected",    recording: true, notes: "Contract signed, deposit received." },
  { id: "c5", leadId: "ld_10", agentId: "ag_01", direction: "outbound", duration: 61,  at: "2026-07-19 16:05", disposition: "not_interested",recording: false, notes: "Budget mismatch." },
  { id: "c6", leadId: "ld_07", agentId: "ag_04", direction: "outbound", duration: 410, at: "2026-07-23 09:15", disposition: "interested",   recording: true, notes: "Wants beachfront BF-02, checking financing." }
];

/* ---------------- Competitors (2.2) ---------------- */

const COMPETITORS = [
  { name: "Bangkok Skyline Co.",  project: "Asoke Vertex",       pricePerSqm: 205000, promo: "Free furniture pack + 2yr common fee", units: 420, sold: 61, trend: "up",   channels: ["Facebook", "TikTok", "Google"] },
  { name: "Metro Living Group",   project: "Thonglor One",       pricePerSqm: 218000, promo: "0% down payment for 12 months",         units: 310, sold: 74, trend: "up",   channels: ["Instagram", "Google"] },
  { name: "Chao Phraya Estates",  project: "River Pearl",        pricePerSqm: 159000, promo: "฿500k cash discount",                   units: 560, sold: 38, trend: "down", channels: ["Facebook", "LINE"] },
  { name: "Andaman Villas Ltd.",  project: "Kamala Heights",     pricePerSqm: 151000, promo: "7% guaranteed yield for 3 years",       units: 88,  sold: 52, trend: "up",   channels: ["Instagram", "Google", "TikTok"] },
  { name: "Urban Nest",           project: "Phrom Phong Loft",   pricePerSqm: 188000, promo: "Buy 1 get parking free",                units: 260, sold: 45, trend: "flat", channels: ["TikTok", "Facebook"] }
];

/* ---------------- Marketing campaigns (2.2 / 2.3) ---------------- */

const CAMPAIGNS = [
  { id: "cm1", name: "Sukhumvit Grand — Launch",   channel: "Facebook Ads",  budget: 400000, spend: 358400, impressions: 1840000, clicks: 27600, leads: 412, deals: 9,  status: "active" },
  { id: "cm2", name: "Phuket Villas — Investors",  channel: "Google Ads",    budget: 300000, spend: 261000, impressions: 640000,  clicks: 15800, leads: 188, deals: 6,  status: "active" },
  { id: "cm3", name: "Riverside — Rent Now",       channel: "TikTok Ads",    budget: 180000, spend: 176200, impressions: 3120000, clicks: 41000, leads: 520, deals: 4,  status: "active" },
  { id: "cm4", name: "Retargeting — Warm Leads",   channel: "Instagram Ads", budget: 120000, spend: 88900,  impressions: 410000,  clicks: 9200,  leads: 143, deals: 5,  status: "active" },
  { id: "cm5", name: "Songkran Promo (ended)",     channel: "Facebook Ads",  budget: 250000, spend: 250000, impressions: 980000,  clicks: 18400, leads: 231, deals: 3,  status: "ended" }
];

const AB_TESTS = [
  { campaign: "Sukhumvit Grand — Launch", variantA: "Own a 2BR by BTS Phrom Phong", variantB: "Wake up 250m from BTS. From ฿12.09M", ctrA: 1.2, ctrB: 1.9, winner: "B" },
  { campaign: "Phuket Villas — Investors", variantA: "Private pool villas in Phuket", variantB: "6–8% rental yield. Kamala Beach villas", ctrA: 2.1, ctrB: 3.4, winner: "B" }
];

const SEGMENTS = [
  { name: "High-intent Chinese buyers", size: 214, rule: "language = Chinese AND score > 70", channel: "LINE OA" },
  { name: "Phuket investors ฿20M+",     size: 96,  rule: "inquiry = Investment AND budget >= 20M", channel: "WhatsApp" },
  { name: "Rental seekers Bangkok",     size: 388, rule: "inquiry = Rent AND city = Bangkok", channel: "Facebook" },
  { name: "Cold leads 30+ days",        size: 512, rule: "lastContact > 30 days", channel: "Email" }
];

/* ---------------- B2B Brokers (2.4) ---------------- */

const BROKERS = [
  { id: "bk_01", name: "Prime Partners Realty", contact: "Wichai Somboon",  tier: "Platinum", rate: 4.0, ytdSales: 184000000, deals: 11, pending: 2860000, paid: 4500000, status: "active" },
  { id: "bk_02", name: "Asia Home Advisors",    contact: "Grace Lim",       tier: "Gold",     rate: 3.5, ytdSales: 96000000,  deals: 7,  pending: 1120000, paid: 2240000, status: "active" },
  { id: "bk_03", name: "Siam Property Network", contact: "Thanet Kaewsai",  tier: "Silver",   rate: 3.0, ytdSales: 42000000,  deals: 4,  pending: 630000,  paid: 630000,  status: "active" },
  { id: "bk_04", name: "Expat Homes Phuket",    contact: "Laura Bennett",   tier: "Gold",     rate: 3.5, ytdSales: 78000000,  deals: 3,  pending: 0,       paid: 2730000, status: "active" },
  { id: "bk_05", name: "Bangkok Key Agents",    contact: "Somsak Jaidee",   tier: "Bronze",   rate: 2.5, ytdSales: 15000000,  deals: 2,  pending: 375000,  paid: 0,       status: "review" }
];

const TIERS = [
  { tier: "Bronze",   min: 0,          rate: 2.5 },
  { tier: "Silver",   min: 30000000,   rate: 3.0 },
  { tier: "Gold",     min: 60000000,   rate: 3.5 },
  { tier: "Platinum", min: 150000000,  rate: 4.0 }
];

const COLLATERAL = [
  { name: "Sukhumvit Grand — Brochure (EN)",   project: "Sukhumvit Grand Residence", type: "Brochure",   size: "8.4 MB",  updated: "2026-07-20" },
  { name: "Sukhumvit Grand — Floor Plans",     project: "Sukhumvit Grand Residence", type: "Floor Plan", size: "12.1 MB", updated: "2026-07-18" },
  { name: "Sukhumvit Grand — Price List",      project: "Sukhumvit Grand Residence", type: "Price List", size: "240 KB",  updated: "2026-07-25" },
  { name: "Riverside — Brochure (TH/EN)",      project: "Riverside Residences",      type: "Brochure",   size: "6.8 MB",  updated: "2026-07-15" },
  { name: "Riverside — Renderings 4K",         project: "Riverside Residences",      type: "Rendering",  size: "142 MB",  updated: "2026-07-10" },
  { name: "Phuket Bay Villas — Investor Deck", project: "Phuket Bay Villas",         type: "Deck",       size: "18.2 MB", updated: "2026-07-22" },
  { name: "Phuket Bay Villas — Price List",    project: "Phuket Bay Villas",         type: "Price List", size: "310 KB",  updated: "2026-07-24" },
  { name: "Commission Policy 2026",            project: "All",                       type: "Policy",     size: "180 KB",  updated: "2026-01-05" }
];

/* ---------------- PDPA consent log (Section 3) ---------------- */

const CONSENT_LOG = [
  { leadId: "ld_01", name: "Pim Charoensuk",   basis: "Explicit opt-in (LINE)",       purpose: "Marketing + Sales", at: "2026-07-11 14:02", retention: "24 months" },
  { leadId: "ld_02", name: "Michael Brennan",  basis: "Explicit opt-in (WhatsApp)",   purpose: "Marketing + Sales", at: "2026-07-14 09:30", retention: "24 months" },
  { leadId: "ld_03", name: "Li Wei",           basis: "Web form checkbox",            purpose: "Sales only",        at: "2026-07-18 11:20", retention: "24 months" },
  { leadId: "ld_04", name: "Nutthapong Sang",  basis: "Messenger opt-in",             purpose: "Sales only",        at: "2026-07-25 10:00", retention: "12 months" },
  { leadId: "ld_06", name: "Areeya Thongchai", basis: "⚠ Not yet obtained",           purpose: "—",                 at: "—",                retention: "—" },
  { leadId: "ld_07", name: "Hans Müller",      basis: "Google Lead Form",             purpose: "Marketing + Sales", at: "2026-07-16 08:44", retention: "24 months" }
];

/* ---------------- Scripted AI answers (used when no API key) ---------------- */

const AI_SCRIPTS = {
  adCopy: {
    tiktok: [
      "POV: you wake up 250m from BTS Phrom Phong 🌆 Sukhumvit Grand — 2BR from ฿12.09M. Link in bio.",
      "3 things nobody tells you about buying a Bangkok condo 🧵 (#3 saved our client ฿800,000)",
      "Rooftop infinity pool on floor 32. Yes, it's real. Yes, you can own it. From ฿6.82M ✨"
    ],
    instagram: [
      "Sunrise over the Chao Phraya, from your living room. Riverside Residences — ready to move. 1BR from ฿6.04M.",
      "Where Bangkok slows down. Private pier, river-view pool, pet friendly. DM for the floor plans.",
      "62 sqm. 18th floor. City lights included. Sukhumvit Grand, from ฿12.09M."
    ],
    facebook: [
      "Own a 2-bedroom in the heart of Sukhumvit — 250m from BTS Phrom Phong, completing Q4 2026. Prices from ฿12,090,000. Book a private viewing this weekend.",
      "Now selling: Phuket Bay Villas, Kamala Beach. Private pool villas with a managed rental programme (projected 6–8% yield). Investor deck available on request.",
      "Ready to move in: Riverside Residences, Charoen Nakhon. River views, 400m from BTS Krung Thon Buri. 1BR from ฿6,048,000."
    ]
  },
  competitorInsight: [
    "**Pricing gap:** Sukhumvit Grand is priced at ฿195k/sqm versus Thonglor One at ฿218k/sqm — you are 10.6% cheaper in the same buyer bracket. This is under-communicated in current ad copy. Recommend leading with value-per-sqm in Facebook and Google creatives.",
    "**Threat:** Andaman Villas is running a 7% guaranteed yield offer and has sold 59% of inventory versus your 0% at Phuket Bay. A guaranteed-yield counter-offer (even 5% for 2 years) would neutralise their primary differentiator.",
    "**Channel gap:** Three of five competitors are active on TikTok, and Metro Living is not. Metro Living has the highest sell-through (74%) purely on Instagram + Google. Your TikTok spend has the highest lead volume (520) but the lowest close rate (0.8%) — recommend shifting ฿60k from TikTok to Google Ads retargeting.",
    "**Opportunity:** Chao Phraya Estates is trending down with only 38 of 560 units sold and is discounting ฿500k cash. They are likely to cut prices further. Riverside Residences should push its 'ready to move' advantage now, before the market resets river-front pricing."
  ],
  fallbackChat: "I can help with project layouts, pricing, unit availability and viewing bookings for Sukhumvit Grand Residence, Riverside Residences and Phuket Bay Villas. Could you tell me which project you're interested in, and your budget range?"
};

/* Frustration / escalation trigger words for the RAG demo */
const ESCALATION_WORDS = ["angry", "refund", "complaint", "lawyer", "terrible", "worst", "แย่", "ยกเลิก", "คืนเงิน", "manager", "supervisor"];
const HOT_LEAD_WORDS = ["book", "buy", "deposit", "contract", "reserve", "จอง", "ซื้อ", "viewing", "visit"];

window.DEMO = {
  CHANNELS, STAGES, INQUIRY_TYPES, LANGUAGES,
  PROJECTS, UNITS, AGENTS, LEADS, CONVERSATIONS, CALLS,
  COMPETITORS, CAMPAIGNS, AB_TESTS, SEGMENTS,
  BROKERS, TIERS, COLLATERAL, CONSENT_LOG,
  AI_SCRIPTS, ESCALATION_WORDS, HOT_LEAD_WORDS
};
