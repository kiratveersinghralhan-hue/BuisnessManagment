import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, increment, serverTimestamp, onDisconnect, runTransaction, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

/* ================= helpers ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "q" + (h >>> 0).toString(36); };
const today = () => new Date().toLocaleDateString("en-CA");
const fmtTime = sec => { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? `${h}h ${m}m` : `${m}m`; };
const clock = sec => { sec = Math.max(0, Math.floor(sec)); const m = Math.floor(sec / 60), s = sec % 60; return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; };
const initials = n => (n || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
  del(k) { try { localStorage.removeItem(k); } catch { } }
};
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600); }

/* ================= content (one subject loaded at a time) ================= */
const SUBJECTS = window.SUBJECTS || [], PROGRAM = window.PROGRAM || {};
let SUBJ = null, SD = null, NOTES = [], UNITS = [], NOTE = {}, BANK = [], CASESETS = [], CASES = [], SHORT = [], LONG = [], VIDEOS = [], GUIDE = "", EXAM = {};
const toQ = (r, prefix = "") => ({ id: hash(prefix + r[1]), t: r[0], q: r[1], c: r[2], w: r[3], e: r[4] });
const loadScript = src => new Promise((res, rej) => { const el = document.createElement("script"); el.src = src; el.onload = res; el.onerror = rej; document.head.appendChild(el); });
async function loadSubject(id) {
  const sub = SUBJECTS.find(x => x.id === id) || SUBJECTS[0];
  window.SUBJECT_DATA = window.SUBJECT_DATA || {};
  if (sub.file && !window.SUBJECT_DATA[sub.id]) await loadScript(sub.file + (sub.v ? "?v=" + sub.v : ""));
  SUBJ = sub; SD = window.SUBJECT_DATA[sub.id] || {};
  UNITS = SD.units || []; NOTES = SD.notes || []; NOTE = Object.fromEntries(NOTES.map(n => [n.id, n]));
  BANK = (SD.bank || []).map(r => toQ(r));
  CASESETS = (SD.casesets || []).map(cs => ({ ...cs, qs: cs.qs.map(r => toQ([cs.topics[0], ...r], cs.id)) }));
  CASES = SD.cases || []; GUIDE = SD.guide || "";
  SHORT = (SD.short || []).map(r => ({ id: hash("s" + r[1]), t: r[0], q: r[1], pts: r[2], marks: r[2].reduce((a, x) => a + x[1], 0) }));
  LONG = SD.long || [];
  VIDEOS = (SD.videos || []).map(x => ({ id: x[0], t: x[1], title: x[2] }));
  EXAM = Object.assign({ title: "End-term practice paper", minutes: 90, total: 70, mcq: 15, mcqCaseSets: 1, shortShow: 5, shortAttempt: 4, shortMarks: 5, longMarks: 30 }, SD.exam || {}, sub.paper || {});
  LS.set("cr_subject", sub.id);
  document.documentElement.style.setProperty("--subj", `linear-gradient(135deg,${(sub.grad || ["#8B5CF6", "#EC4899"]).join(",")})`);
  const chip = $("#subjChip"); if (chip) chip.innerHTML = `<span>${sub.icon || "📘"}</span><b>${esc(sub.short || sub.name)}</b><span class="caret">▾</span>`;
}
const unitOf = t => NOTE[t]?.unit;
const inBank = o => { const ids = new Set(BANK.map(q => q.id)); return Object.keys(o || {}).filter(k => ids.has(k)).length; };
const prepOpts = q => { const opts = shuffle([q.c, ...q.w]); return { ...q, opts, ans: opts.indexOf(q.c) }; };

/* ================= state ================= */
const KEY = "cr_state_v1";
const blank = () => ({ name: "", createdAt: Date.now(), studySec: 0, notesRead: {}, mcqA: 0, mcqC: 0, topics: {}, correct: {}, wrong: {}, mockBest: 0, mockCount: 0, mockXp: 0, casesDone: {}, days: {}, saved: {}, mynotes: {}, papers: 0, bonusXp: 0, battles: 0, wins: 0, dailies: 0, helped: 0, dailyDone: {}, cards: {} });
let S = Object.assign(blank(), LS.get(KEY, {}));
const save = () => LS.set(KEY, S);
// V6.2 progression: local-first; user-owned Firebase data mirrors it after sign-in.
function arenaDaily() {
  S.arena62 ||= {};
  const key = today();
  S.arena62[key] ||= { answers: 0, cases: {}, notes: {}, rewards: {} };
  // Keep history bounded on the device (today + last 44 days)
  const keys = Object.keys(S.arena62).sort();
  for (const old of keys.slice(0, Math.max(0, keys.length - 45))) delete S.arena62[old];
  return S.arena62[key];
}
const missions62 = [
  { id: "warm", icon: "⚡", title: "Daily warm-up", detail: "Answer 10 practice or case MCQs", goal: 10, reward: 20, progress: d => d.answers || 0 },
  { id: "case", icon: "🧠", title: "Case solver", detail: "Finish one Case Study Arena scenario", goal: 1, reward: 30, progress: d => Object.keys(d.cases || {}).length },
  { id: "note", icon: "📚", title: "Knowledge boost", detail: "Complete two topic notes", goal: 2, reward: 20, progress: d => Object.keys(d.notes || {}).length }
];
function arenaActivity(type, id) {
  const d = arenaDaily();
  if (type === "answer") d.answers++;
  if (type === "case") d.cases[SUBJ.id + ":" + id] = 1;
  if (type === "note") d.notes[SUBJ.id + ":" + id] = 1;
  let awarded = 0;
  for (const m of missions62) if (!d.rewards[m.id] && m.progress(d) >= m.goal) {
    d.rewards[m.id] = 1; awarded += m.reward;
  }
  if (awarded) { S.bonusXp = (S.bonusXp || 0) + awarded; toast(`Mission complete · +${awarded} XP`); }
  // The per-user mirror is private under existing Firebase user permissions.
  fbUpdate({ [`users/${uid}/arena62`]: S.arena62, ...(awarded ? { [`users/${uid}/bonusXp`]: S.bonusXp } : {}) });
  syncLB();
}

let uid = null, db = null, online = false, lbData = {}, namesData = {}, presenceData = {};

const count = o => Object.keys(o || {}).length;
const xpOf = s => Math.floor((s.studySec || 0) / 60) + 15 * count(s.notesRead) + 4 * count(s.correct) + (s.mockXp || 0) + 20 * count(s.casesDone) + (s.bonusXp || 0);
function streakOf(days) {
  let n = 0; const d = new Date();
  if (!((days || {})[d.toLocaleDateString("en-CA")] >= 60)) d.setDate(d.getDate() - 1);
  while ((days || {})[d.toLocaleDateString("en-CA")] >= 60) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const BADGES = [
  { id: "f", e: "🎯", n: "First hit", d: "Answer your first question correctly", t: s => count(s.correct) >= 1 },
  { id: "n", e: "📘", n: "Note taker", d: "Finish 10 topic notes", t: s => count(s.notesRead) >= 10 },
  { id: "N", e: "📚", n: "Full syllabus", d: "Finish every topic note in a subject", t: s => NOTES.length > 0 && NOTES.every(n => s.notesRead[n.id]) },
  { id: "s", e: "⚡", n: "Sharpshooter", d: "100 different questions right", t: s => count(s.correct) >= 100 },
  { id: "m", e: "⏱️", n: "Exam ready", d: "Complete a mock test or exam paper", t: s => s.mockCount >= 1 },
  { id: "p", e: "📝", n: "Paper writer", d: "Finish a full 70-mark exam paper", t: s => (s.papers || 0) >= 1 },
  { id: "M", e: "🏆", n: "Topper", d: "Score 80%+ in a mock", t: s => s.mockBest >= 80 },
  { id: "c", e: "🧠", n: "Case cracker", d: "Write answers for 3 cases", t: s => count(s.casesDone) >= 3 },
  { id: "h", e: "🔥", n: "Marathon", d: "Study 5 hours in total", t: s => s.studySec >= 18000 },
  { id: "k", e: "📅", n: "3-day streak", d: "Study 3 days in a row", t: s => streakOf(s.days) >= 3 },
  { id: "K", e: "💎", n: "7-day streak", d: "Study 7 days in a row", t: s => streakOf(s.days) >= 7 },
  { id: "b", e: "⚔️", n: "Gladiator", d: "Win your first quiz battle", t: s => (s.wins || 0) >= 1 },
  { id: "B", e: "👑", n: "Champion", d: "Win 10 quiz battles", t: s => (s.wins || 0) >= 10 },
  { id: "d", e: "📆", n: "Daily grinder", d: "Finish 5 daily challenges", t: s => (s.dailies || 0) >= 5 },
  { id: "q", e: "🤝", n: "Helper", d: "Answer 5 classmates' doubts", t: s => (s.helped || 0) >= 5 }
];
const badgesOf = s => BADGES.filter(b => b.t(s)).map(b => b.id).join("");

/* ================= firebase ================= */
const fbPath = p => ref(db, p);
function fbUpdate(obj) { if (!online || !uid) return; update(ref(db), obj).catch(e => console.warn("write failed", e)); }
let lbTimer = null;
function syncLB(now) {
  save(); renderTopbar();
  if (!online || !uid || !S.name) return;
  clearTimeout(lbTimer);
  lbTimer = setTimeout(() => {
    const acc = S.mcqA ? Math.round(S.mcqC / S.mcqA * 100) : 0;
    set(fbPath("lb/" + uid), { xp: xpOf(S), best: S.mockBest || 0, mocks: S.mockCount || 0, solved: count(S.correct), acc, sec: S.studySec || 0, notes: count(S.notesRead), streak: streakOf(S.days), badges: badgesOf(S), wins: S.wins || 0, ts: serverTimestamp() }).catch(e => console.warn(e));
  }, now ? 0 : 1200);
}

function setSync(state) { const d = $("#syncDot"); d.className = "sync " + state; d.title = state === "ok" ? "Synced with leaderboard" : state === "err" ? "Offline: progress saved on this phone" : "Connecting…"; }

async function initFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    db = getDatabase(app);
    onAuthStateChanged(auth, async user => {
      if (!user) return;
      uid = user.uid; online = true; setSync("ok");
      try {
        const [nameSnap, userSnap, removedSnap] = await Promise.all([get(fbPath("names/" + uid)), get(fbPath("users/" + uid)), get(fbPath("removed/" + uid)).catch(() => null)]);
        // the admin removed this profile (fake name or merged duplicate): start fresh and ask for a real name
        if (removedSnap && removedSnap.exists() && !nameSnap.exists()) {
          // merged into the same person's other profile: keep the name, start a fresh local copy (it groups with the other one)
          const why = (removedSnap.val() || {}).why || "", keep = why.startsWith("merged") ? S.name : "";
          S = blank(); S.name = keep; save();
        }
        const remote = userSnap.val();
        if (remote) {
          // merge: remote is the source of truth, keep any larger local counters
          const merged = Object.assign(blank(), remote);
          for (const k of ["notesRead", "topics", "correct", "wrong", "casesDone", "days", "saved", "mynotes", "dailyDone", "cards", "arena62", "arena62Completed"]) merged[k] = Object.assign({}, S[k], remote[k] || {});
          for (const k of ["studySec", "mcqA", "mcqC", "mockBest", "mockCount", "mockXp", "papers", "bonusXp", "battles", "wins", "dailies", "helped"]) merged[k] = Math.max(remote[k] || 0, S[k] || 0);
          merged.name = nameSnap.val() || S.name; S = merged;
        } else {
          S.name = nameSnap.val() || S.name;
          const { name, ...rest } = S;
          await set(fbPath("users/" + uid), { ...rest, createdAt: S.createdAt || Date.now(), device: navigator.userAgent.slice(0, 140) });
        }
        if (S.name && !nameSnap.exists()) await set(fbPath("names/" + uid), S.name).catch(() => { });
        save();
        startPresence();
        subscribePublic();
        syncLB(true);
        if (!S.name) askName(); else renderTopbar();
        if (!S.name) { } else if (!LS.get("cr_subject_chosen", false)) pickSubject(true);
        if (["home", "ranks", "me", "notes", "cases"].includes(cur)) route();
      } catch (e) { console.warn(e); setSync("err"); }
    });
    await signInAnonymously(auth).catch(e => {
      console.warn("Anonymous sign-in failed", e); setSync("err"); online = false;
      if (String(e.code).includes("operation-not-allowed") || String(e.code).includes("admin-restricted")) toast("Leaderboard offline: turn on Anonymous sign-in in Firebase");
    });
  } catch (e) { console.warn("Firebase init failed", e); setSync("err"); }
}

function startPresence() {
  const p = fbPath("presence/" + uid);
  const page = () => (location.hash || "#home").slice(1).split("/")[0];
  update(p, { on: true, ts: serverTimestamp(), page: page() }).catch(() => { });
  onDisconnect(p).update({ on: false, ts: serverTimestamp() });
  window.addEventListener("hashchange", () => update(p, { on: true, ts: serverTimestamp(), page: page() }).catch(() => { }));
  document.addEventListener("visibilitychange", () => update(p, { on: !document.hidden, ts: serverTimestamp() }).catch(() => { }));
}
function subscribePublic() {
  onValue(fbPath(".info/serverTimeOffset"), s => { window.__tOff = s.val() || 0; });
  onValue(fbPath("announce"), s => { announceData = s.val() || {}; const el = $("#annBox"); if (el) { el.innerHTML = announceHTML(); bindAnnounce(el); } });
  onValue(fbPath("lb"), s => { lbData = s.val() || {}; if (["ranks", "home"].includes(cur)) route(true); });
  onValue(fbPath("names"), s => { namesData = s.val() || {}; if (["ranks"].includes(cur)) route(true); });
  onValue(fbPath("presence"), s => { presenceData = s.val() || {}; const el = $("#liveCount"); if (el) el.textContent = liveCount(); });
}
const isLive = p => p && p.on && Date.now() - (p.ts || 0) < 6 * 60 * 1000;
const liveCount = () => { const n = Object.values(presenceData).filter(isLive).length; return n === 1 ? "1 person studying now" : `${n} people studying now`; };

/* ================= study-time tracking ================= */
let lastInteract = Date.now();
["pointerdown", "keydown", "scroll", "touchstart"].forEach(ev => addEventListener(ev, () => lastInteract = Date.now(), { passive: true }));
setInterval(() => {
  if (document.hidden || Date.now() - lastInteract > 150000 || !S.name) return;
  const d = today(), sec = (cur || "home").replace(/[^a-z]/g, "") || "home";
  S.studySec += 30; S.days[d] = (S.days[d] || 0) + 30;
  fbUpdate({ [`users/${uid}/studySec`]: increment(30), [`users/${uid}/days/${d}`]: increment(30), [`users/${uid}/sections/${sec}`]: increment(30), [`users/${uid}/lastSeen`]: serverTimestamp(), [`presence/${uid}/ts`]: serverTimestamp(), [`presence/${uid}/on`]: true });
  syncLB();
}, 30000);

/* ================= recording ================= */
function recordAnswer(q, ok, { unique = true } = {}) {
  const t = q.t; S.topics[t] = S.topics[t] || { a: 0, c: 0 };
  S.topics[t].a++; S.mcqA++; if (ok) { S.topics[t].c++; S.mcqC++; }
  const u = { [`users/${uid}/mcqA`]: increment(1), [`users/${uid}/topics/${t}/a`]: increment(1), [`users/${uid}/lastSeen`]: serverTimestamp() };
  if (ok) { u[`users/${uid}/mcqC`] = increment(1); u[`users/${uid}/topics/${t}/c`] = increment(1); }
  if (unique) {
    if (ok) { if (!S.correct[q.id]) { S.correct[q.id] = 1; u[`users/${uid}/correct/${q.id}`] = 1; } if (S.wrong[q.id]) { delete S.wrong[q.id]; u[`users/${uid}/wrong/${q.id}`] = null; } }
    else { S.wrong[q.id] = 1; u[`users/${uid}/wrong/${q.id}`] = 1; }
  }
  fbUpdate(u); arenaActivity("answer");
}
function markNote(id) {
  if (S.notesRead[id]) return;
  S.notesRead[id] = Date.now(); fbUpdate({ [`users/${uid}/notesRead/${id}`]: Date.now() }); arenaActivity("note", id); toast("+15 XP · topic finished");
}

/* ================= topbar / router ================= */
function renderTopbar() {
  $("#xpTop").textContent = xpOf(S).toLocaleString("en-IN");
  const hx = $("#homeXp"); if (hx) hx.textContent = xpOf(S).toLocaleString("en-IN");
  $("#avatarTop").textContent = S.name ? initials(S.name) : "?";
}
let cur = "home", cleanup = null;
function route(soft) {
  const [r, p] = (location.hash || "#home").slice(1).split("/");
  if (soft && (r !== cur)) return;
  if (soft && r === "home") { const h = $("#rankStat"); if (h) h.textContent = myRank(); return; }
  if (cleanup) { cleanup(); cleanup = null; }
  cur = r || "home";
  const group = { q: "practice", cases: "practice", case: "practice", written: "practice", battle: "practice", daily: "practice", cards: "practice", tools: "practice", arena: "practice", missions: "practice", coach: "practice", games: "practice", mock: "exam", paper: "exam", note: "notes", guide: "notes", videos: "notes", revise: "notes", doubts: "notes" };
  $$("[data-r]").forEach(a => a.classList.toggle("on", a.dataset.r === cur || group[cur] === a.dataset.r));
  const v = $("#view");
  const views = { home: vHome, notes: vNotes, note: vNote, practice: vPractice, q: vQuiz, mock: vMock, cases: vCases, case: vCase, written: vWritten, ranks: vRanks, me: vMe, guide: vGuide, exam: vExam, paper: vPaper, videos: vVideos, battle: vBattle, daily: vDaily, cards: vCards, revise: vRevise, doubts: vDoubts, tools: vTools, arena: vArena62, missions: vMissions62, coach: vCoach62, games: vGames7 };
  (views[cur] || vHome)(v, p ? decodeURIComponent(p) : undefined);
  if (!soft) { scrollTo({ top: 0, behavior: "instant" }); v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter"); showBars(); }
  document.body.classList.toggle("focus", cur === "q" || cur === "paper" || (cur === "battle" && !!p)); moveNavInd(); reveal(v);
}
/* sliding pill under the active bottom-nav tab */
function moveNavInd() {
  const ind = $("#navInd"), a = $("#bottomNav a.on"); if (!ind) return;
  if (!a) { ind.style.width = "0px"; return; }
  ind.style.width = a.offsetWidth + "px"; ind.style.transform = `translateX(${a.offsetLeft}px)`;
}
addEventListener("resize", moveNavInd);
/* scroll reveal */
const RV_SEL = ".stat,.action,.unit-card,.topic,.panel,.lb-row,.badge,.pod,.structure > div,.guide-card,.unit-block h3,.note-body > h3,.note-body table,.note-body .tip,.casebox,.review-item,.pager";
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" }) : null;
function reveal(root) {
  if (!io || reduced) return;
  const els = $$(RV_SEL, root).filter(el => !el.classList.contains("rv"));
  let k = 0; els.forEach(el => { const r = el.getBoundingClientRect(); el.classList.add("rv"); if (r.top < innerHeight) el.style.setProperty("--d", Math.min(k++ * 0.05, 0.5) + "s"); io.observe(el); });
}
/* header + bottom bar hide while scrolling down, come back when scrolling up; progress line */
let lastY = 0, ticking = false;
function showBars() { $("#topBar").classList.remove("hide"); $("#bottomNav").classList.remove("hide"); }
addEventListener("scroll", () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    $("#scrollProg").style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    const down = y > lastY + 6, up = y < lastY - 6;
    if (!["mock", "q", "paper", "battle", "cards"].includes(cur)) { if (down && y > 120) { $("#topBar").classList.add("hide"); $("#bottomNav").classList.add("hide"); } else if (up || y < 60) showBars(); }
    if (Math.abs(y - lastY) > 6) lastY = y; ticking = false;
  });
}, { passive: true });
addEventListener("hashchange", () => route());

/* ================= views ================= */
/* the same name on two phones counts as one person on the board */
const normName = n => (n || "").toLowerCase().replace(/[^\p{L}]/gu, "");
function boardRows() {
  const g = {};
  for (const [id, r] of Object.entries(lbData)) {
    const n = namesData[id]; if (!n) continue;
    const x = g[normName(n)] || (g[normName(n)] = { ids: [], name: n, a: { xp: 0, best: 0, mocks: 0, solved: 0, sec: 0, notes: 0, streak: 0, badges: "", w: 0, aw: 0 } });
    x.ids.push(id); const a = x.a, w = (r.solved || 0) + 1;
    a.wins = (a.wins || 0) + (r.wins || 0); a.xp += r.xp || 0; a.best = Math.max(a.best, r.best || 0); a.mocks += r.mocks || 0; a.solved += r.solved || 0; a.sec += r.sec || 0;
    a.notes = Math.max(a.notes, r.notes || 0); a.streak = Math.max(a.streak, r.streak || 0); a.badges = [...new Set(a.badges + (r.badges || ""))].join(""); a.aw += (r.acc || 0) * w; a.w += w;
  }
  return Object.values(g).map(x => ({ ids: x.ids, id: x.ids[0], name: x.name, me: x.ids.includes(uid), live: x.ids.some(i => isLive(presenceData[i])), r: { ...x.a, acc: Math.round(x.a.aw / x.a.w) } }));
}
function myRank() {
  if (!uid || !lbData[uid]) return "–";
  const arr = boardRows().sort((a, b) => b.r.xp - a.r.xp);
  return "#" + (arr.findIndex(e => e.me) + 1);
}
function unitProgress(u) {
  const ts = NOTES.filter(n => n.unit === u.id);
  const read = ts.filter(n => S.notesRead[n.id]).length;
  let a = 0, c = 0; ts.forEach(n => { const t = S.topics[n.id]; if (t) { a += t.a; c += t.c; } });
  return { read, total: ts.length, acc: a ? Math.round(c / a * 100) : null };
}
function vHome(v) {
  const first = (S.name || "there").split(" ")[0];
  const next = NOTES.find(n => !S.notesRead[n.id]) || null;
  v.innerHTML = `
  <section class="hero">
    <canvas id="heroCanvas" aria-hidden="true"></canvas>
    <div class="greet">Hi ${esc(first)} 👋</div>
    <button class="subj-hero" id="heroSubj">${SUBJ.icon || "📘"} Sem ${SUBJ.sem} · ${esc(SUBJ.short || SUBJ.name)} · change <span class="caret">▾</span></button>
    <h1>${esc(SUBJ.tagline || "Crack the case, not just the syllabus.")}</h1>
    <p>${NOTES.length ? `${NOTES.length} topic notes, ${BANK.length} MCQs${SHORT.length + LONG.length ? `, ${SHORT.length + LONG.length} exam-style written questions and full ${EXAM.total}-mark papers` : ""}.` : "Notes, MCQs and exam papers for this subject are being added. Check back soon."}</p>
    <div class="row">${!BANK.length ? `<button class="btn primary" onclick="window.__pick()">Switch subject</button>` : isMcqExam() ? `<a class="btn primary" href="#mock">Take the ${EXAM.questions}-MCQ test</a><a class="btn ghost" href="#practice">Quick practice</a>` : `<a class="btn primary" href="#exam">Write an exam paper</a><a class="btn ghost" href="#practice">Quick practice</a>`}</div>
  </section>
  <div id="annBox">${announceHTML()}</div>
  ${examBanner()}
  ${SUBJECTS.filter(x => x.id !== SUBJ.id && x.exam?.date && daysTo(x.exam.date) >= 0).map(x => `<button class="other-exam" data-sw="${x.id}">${x.icon} ${esc(x.short)} exam in ${daysTo(x.exam.date)} days <span>Switch ›</span></button>`).join("")}
  <div class="stats">
    <div class="stat"><div class="v num" id="homeXp">${xpOf(S).toLocaleString("en-IN")}</div><div class="l">XP earned</div></div>
    <div class="stat"><div class="v num" id="rankStat">${myRank()}</div><div class="l">Class rank</div></div>
    <div class="stat"><div class="v num">${streakOf(S.days)}🔥</div><div class="l">Day streak</div></div>
    <div class="stat"><div class="v num">${S.mockBest ? S.mockBest + "%" : "–"}</div><div class="l">Best mock</div></div>
  </div>
  ${BANK.length ? `<div class="play-row"><a class="play daily" href="#daily"><span class="pi">📅</span><b>Daily challenge</b><span>${(S.dailyDone || {})[SUBJ.id + "_" + today()] ? "Done today ✓ · see ranking" : "5 questions · same for everyone"}</span></a><a class="play battle" href="#battle"><span class="pi">⚔️</span><b>Quiz battle</b><span>${S.wins || 0} wins · challenge a friend</span></a></div>` : ""}
  <div class="actions">
    ${!NOTES.length ? "" : next ? `<a class="action feature" href="#note/${next.id}"><span class="ic">📖</span><div><b>Continue: ${esc(next.title)}</b><br><span>${esc(next.lec)} · ${esc(UNITS.find(u => u.id === next.unit).name)}</span></div></a>`
      : `<a class="action feature" href="#mock"><span class="ic">🏁</span><div><b>All notes done. Time for a full mock.</b><br><span>90 minutes, case-based</span></div></a>`}
    <a class="action c3" href="#games"><span class="ic">🎮</span><b>Quiz Game World · NEW</b><span>5 game modes · avatars · party rooms</span></a>
    <a class="action c1" href="#arena"><span class="ic">🏢</span><b>Case Study Arena</b><span>Realistic scenarios · linked MCQs</span></a>
    <a class="action c5" href="#missions"><span class="ic">🏅</span><b>Daily missions</b><span>Three quests · earn bonus XP</span></a>
    <a class="action c2" href="#coach"><span class="ic">🎯</span><b>Revision coach</b><span>Your weak topics · focused practice</span></a>
    <a class="action c1" href="#q/quick"><span class="ic">⚡</span><b>Quick 10</b><span>Random scenario MCQs</span></a>
    <a class="action c2" href="#q/weak"><span class="ic">🎯</span><b>Fix mistakes</b><span>${inBank(S.wrong)} to retry</span></a>
    <a class="action c4" href="#written"><span class="ic">✍️</span><b>Written practice</b><span>Answer, then self-mark</span></a>
    <a class="action c5" href="#cards"><span class="ic">🃏</span><b>Flashcards</b><span>${(SD.cards || []).length} cards · spaced repetition</span></a>
    <a class="action c1" href="#revise"><span class="ic">⚡</span><b>Revision sheets</b><span>One page per unit</span></a>
    ${VIDEOS.length ? `<a class="action c3" href="#videos"><span class="ic">▶️</span><b>Videos</b><span>${VIDEOS.length} picked by your teacher</span></a>` : ""}
    <a class="action c2" href="#doubts"><span class="ic">💬</span><b>Doubts</b><span>Ask the class</span></a>
  </div>
  <div class="section-head"><h2>Your syllabus</h2><span class="live"><i></i><span id="liveCount">${liveCount()}</span></span></div>
  <div class="units ${UNITS.length > 3 ? "many" : ""}">${UNITS.map(u => { const p = unitProgress(u); return `<a class="unit-card ${u.id}" href="#notes" style="text-decoration:none;color:inherit"><div class="dim" style="font-size:13px">${u.name} · ${u.lectures}</div><div class="t">${u.title}</div><div class="bar"><i style="width:${p.read / p.total * 100}%"></i></div><div class="row" style="margin-top:8px;font-size:13px"><span class="muted">${p.read}/${p.total} topics read</span><span class="spacer"></span><span class="muted">${p.acc === null ? "No quiz yet" : p.acc + "% accuracy"}</span></div></a>`; }).join("")}</div>
  <p class="foot">Boardroom · a student-made study space for ${esc(PROGRAM.short || "BBA")} students, ${esc(PROGRAM.school || "")}</p>`;
  $("#heroSubj").onclick = () => pickSubject(); bindAnnounce(v);
  $$("[data-sw]", v).forEach(b => b.onclick = () => switchSubject(b.dataset.sw));
  if (!NOTES.length) { const u = $(".units", v); if (u) u.outerHTML = comingSoon("Notes, MCQs and papers"); }
  cleanup = heroScene($("#heroCanvas"));
}

function vGuide(v) {
  v.innerHTML = `<article class="note"><div class="crumb"><a href="#notes">Notes</a> / Answer method</div><h2>How to answer case questions</h2><div class="note-body">${GUIDE}</div>
  <div class="note-foot"><a class="btn primary" href="#cases">Try a case study</a><a class="btn" href="#q/quick">Practise MCQs</a></div></article>`;
}

function comingSoon(what) {
  return `<div class="soon"><div class="soon-ic">${SUBJ.icon || "📘"}</div><h3>${esc(what)} for ${esc(SUBJ.name)} are coming soon</h3><p class="muted">Content is added as the lectures and material come in. Meanwhile you can switch to another subject.</p><button class="btn primary" onclick="window.__pick()">Switch subject</button></div>`;
}
function examBanner(sub = SUBJ) {
  if (!sub.exam?.date) return "";
  const n = daysTo(sub.exam.date); if (n < 0) return "";
  const dt = new Date(sub.exam.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return `<div class="countdown" style="--g:linear-gradient(120deg,${(sub.grad || []).join(",")})"><div class="cd-n num">${n}<small>${n === 1 ? "day" : "days"}</small></div><div><b>${esc(sub.short || sub.name)} exam ${n === 0 ? "is today" : "in " + n + " day" + (n === 1 ? "" : "s")}</b><span>${dt} · ${esc(sub.exam.session || "")}</span><span>Pattern: ${esc(sub.exam.pattern || "to be announced")}</span></div></div>`;
}
function vNotes(v) {
  if (!NOTES.length) { v.innerHTML = `<h2>Notes</h2>` + comingSoon("Notes"); return; }
  setTimeout(() => { if (SD.starter) { const el = document.createElement("div"); el.className = "tip"; el.innerHTML = "<b>Starter set.</b> These notes and questions cover standard Programming Fundamentals topics. They'll be matched to your teacher's slides soon."; v.querySelector("h2").after(el); } });
  v.innerHTML = `<h2>Notes</h2><p class="muted">${esc(SUBJ.name)} · every topic from the lectures so far. Finish a topic to earn 15 XP.</p>
  <div class="row" style="margin-bottom:14px"><a class="btn small" href="#revise">⚡ Revision sheets</a><a class="btn small" href="#cards">🃏 Flashcards</a>${VIDEOS.length ? `<a class="btn small" href="#videos">▶️ Videos</a>` : ""}<a class="btn small" href="#doubts">💬 Doubts</a><button class="btn small" id="printAll">🖨️ Save all notes as PDF</button></div>
  <a class="guide-card" href="#guide"><span style="font-size:30px">🗝️</span><div><b>Read first: how to crack case questions</b><span class="muted">Read → identify → analyse → recommend</span></div></a>
  ${UNITS.map(u => `<section class="unit-block ${u.id}"><h3><span class="pill">${u.name}</span>${u.title} <small>${u.lectures}</small></h3><div class="topic-list">
    ${NOTES.filter(n => n.unit === u.id).map(n => `<a class="topic ${S.notesRead[n.id] ? "done" : ""}" href="#note/${n.id}"><span class="lec">${n.lec}</span><span><span class="tt">${esc(n.title)}</span><span class="ts">${esc(n.sum)}</span></span><span class="chk">${S.notesRead[n.id] ? "✓" : ""}</span></a>`).join("")}
  </div></section>`).join("")}`;
  $("#printAll").onclick = () => printHTML(`<h1>${esc(SUBJ.name)}: notes</h1>` + NOTES.map(n => `<section class="pnote"><h2>${esc(n.lec)} · ${esc(n.title)}</h2>${n.html}</section>`).join(""));
}

function vNote(v, id) {
  const n = NOTE[id]; if (!n) return vNotes(v);
  const i = NOTES.indexOf(n), prev = NOTES[i - 1], next = NOTES[i + 1];
  const qn = BANK.filter(q => q.t === id).length;
  v.innerHTML = `<article class="note ${n.unit}"><div class="crumb"><a href="#notes">Notes</a> / ${UNITS.find(u => u.id === n.unit).name} / ${n.lec}</div>
  <h2>${esc(n.title)}</h2><p class="muted">${esc(n.sum)}</p>
  <div class="note-body">${n.html}</div>
  ${noteVideos(id)}
  <div class="panel mynotes"><h3>📝 My notes</h3><p class="muted" style="font-size:13.5px;margin-top:-6px">Private to you. Saved automatically and synced to your profile.</p><textarea id="myNote" placeholder="Write your own points, mnemonics or doubts for this topic…">${esc(S.mynotes[id] || "")}</textarea></div>
  <div class="note-foot">
    <button class="btn ${S.notesRead[id] ? "" : "primary"}" id="doneBtn">${S.notesRead[id] ? "✓ Finished" : "Mark as finished"}</button>
    <a class="btn" href="#q/t:${id}">Practise ${qn} questions</a>
    ${SHORT.some(x => x.t === id) ? `<a class="btn" href="#written/t:${id}">Written questions</a>` : ""}
    <button class="btn ghost" id="printNote">🖨️ Save as PDF</button>
  </div>
  <div class="pager">${prev ? `<a href="#note/${prev.id}"><small>Previous</small>${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a class="next" href="#note/${next.id}"><small>Next</small>${esc(next.title)}</a>` : ""}</div></article>`;
  $("#doneBtn").onclick = e => { markNote(id); e.target.textContent = "✓ Finished"; e.target.classList.remove("primary"); };
  $("#printNote").onclick = () => printHTML(`<h1>${esc(n.title)}</h1><p><i>${esc(SUBJ.name)} · ${esc(n.lec)}</i></p>${n.html}${S.mynotes[id] ? `<h3>My notes</h3><p style="white-space:pre-wrap">${esc(S.mynotes[id])}</p>` : ""}`);
  let mt; $("#myNote").oninput = e => { S.mynotes[id] = e.target.value; save(); clearTimeout(mt); mt = setTimeout(() => fbUpdate({ [`users/${uid}/mynotes/${id}`]: e.target.value || null }), 1200); };
  bindVideos(v);
}

/* ---------- practice ---------- */
let pickTopics = new Set(), pickCount = 10, pickMode = "all";
function vPractice(v) {
  if (!BANK.length) { v.innerHTML = `<h2>Practice</h2>` + comingSoon("Practice questions"); return; }
  const draw = () => {
    const pool = poolFor();
    v.innerHTML = `<h2>Practice</h2><p class="muted">Each new question you get right earns 4 XP.</p><div class="arena62-links"><a class="btn" href="#arena">🏢 Case Study Arena</a><a class="btn" href="#missions">🏅 Missions</a><a class="btn" href="#coach">🎯 Revision coach</a></div>
    <div class="play-row"><a class="play daily" href="#daily"><span class="pi">📅</span><b>Daily challenge</b><span>5 questions · ranked</span></a><a class="play battle" href="#battle"><span class="pi">⚔️</span><b>Quiz battle</b><span>Live 1v1 · ${S.wins || 0} wins</span></a></div>
    <div class="actions" style="margin-bottom:12px"><a class="action c5" href="#cards"><span class="ic">🃏</span><b>Flashcards</b><span>${(SD.cards || []).length} cards</span></a>${SD.tools ? `<a class="action c4" href="#tools"><span class="ic">🧮</span><b>Calculators</b><span>EOQ, ratios, with working</span></a>` : ""}<a class="action c1" href="#revise"><span class="ic">⚡</span><b>Revision</b><span>One-page sheets</span></a><a class="action c2" href="#doubts"><span class="ic">💬</span><b>Doubts</b><span>Ask the class</span></a></div>
    <div class="actions" style="margin-bottom:18px">
      <a class="action c1" href="#q/quick"><span class="ic">⚡</span><b>Quick 10</b><span>Random mix</span></a>
      <a class="action c2" href="#q/weak"><span class="ic">🎯</span><b>Fix mistakes</b><span>${inBank(S.wrong)} waiting</span></a>
      <a class="action c4" href="#q/unseen"><span class="ic">✨</span><b>Unseen only</b><span>${BANK.length - inBank(S.correct) - inBank(S.wrong)} left</span></a>
      <a class="action c3" href="#q/saved"><span class="ic">⭐</span><b>Saved</b><span>${inBank(S.saved)} bookmarked</span></a>
      <a class="action c5" href="#written"><span class="ic">✍️</span><b>Written answers</b><span>${SHORT.length} short · ${LONG.length} cases</span></a>
      <a class="action c1" href="#exam"><span class="ic">📝</span><b>Exam paper</b><span>${EXAM.total} marks · ${EXAM.minutes} min</span></a>
    </div>
    <div class="panel"><h3>Build your own set</h3>
      <div class="label">Topics (leave empty for all)</div>
      ${UNITS.map(u => `<div class="dim" style="font-size:12.5px;margin:10px 0 6px">${u.name}</div><div class="chips">${NOTES.filter(n => n.unit === u.id).map(n => `<button class="chip ${pickTopics.has(n.id) ? "on" : ""}" data-t="${n.id}">${esc(shortTitle(n))}</button>`).join("")}</div>`).join("")}
      <div class="label">Questions</div><div class="chips">${[10, 20, 30, 0].map(c => `<button class="chip ${pickCount === c ? "on" : ""}" data-c="${c}">${c || "All"}</button>`).join("")}</div>
      <div class="label">Which questions</div><div class="chips">${[["all", "Everything"], ["unseen", "Not attempted"], ["wrong", "Got wrong before"]].map(([k, l]) => `<button class="chip ${pickMode === k ? "on" : ""}" data-m="${k}">${l}</button>`).join("")}</div>
      <div style="margin-top:18px"><button class="btn primary block" id="goPrac" ${pool.length ? "" : "disabled"}>Start ${pickCount ? Math.min(pickCount, pool.length) : pool.length} questions</button></div>
    </div>`;
    $$("[data-t]", v).forEach(b => b.onclick = () => { pickTopics.has(b.dataset.t) ? pickTopics.delete(b.dataset.t) : pickTopics.add(b.dataset.t); draw(); });
    $$("[data-c]", v).forEach(b => b.onclick = () => { pickCount = +b.dataset.c; draw(); });
    $$("[data-m]", v).forEach(b => b.onclick = () => { pickMode = b.dataset.m; draw(); });
    $("#goPrac").onclick = () => { location.hash = "#q/custom"; };
  };
  draw();
}
const shortTitle = n => n.title.split(/[,&(]| and /)[0].replace(/\s+$/, "").slice(0, 34);
function poolFor() {
  let p = BANK.filter(q => !pickTopics.size || pickTopics.has(q.t));
  if (pickMode === "unseen") p = p.filter(q => !S.correct[q.id] && !S.wrong[q.id]);
  if (pickMode === "wrong") p = p.filter(q => S.wrong[q.id]);
  return p;
}
function vQuiz(v, mode = "quick") {
  let list;
  if (mode === "quick") list = shuffle(BANK).slice(0, 10);
  else if (mode === "weak") list = shuffle(BANK.filter(q => S.wrong[q.id])).slice(0, 20);
  else if (mode === "saved") list = shuffle(BANK.filter(q => S.saved[q.id]));
  else if (mode === "unseen") list = shuffle(BANK.filter(q => !S.correct[q.id] && !S.wrong[q.id])).slice(0, 15);
  else if (mode.startsWith("t:")) list = shuffle(BANK.filter(q => q.t === mode.slice(2)));
  else if (mode.startsWith("weakt:")) list = shuffle(BANK.filter(q => q.t === mode.slice(6))).slice(0, 12);
  else { const p = shuffle(poolFor()); list = pickCount ? p.slice(0, pickCount) : p; }
  if (!list.length) { v.innerHTML = `<div class="empty"><h3>Nothing here yet</h3><p>${mode === "weak" ? "You have no wrong answers to retry. Nice." : "No questions match."}</p><a class="btn primary" href="#q/quick">Do a Quick 10</a></div>`; return; }
  list = list.map(prepOpts);
  let i = 0, score = 0, picked = null; const log = [];
  const draw = () => {
    const q = list[i];
    v.innerHTML = `<div class="qwrap"><div class="qhead"><span class="num">${i + 1}/${list.length}</span><div class="bar"><i style="width:${i / list.length * 100}%"></i></div><span class="num">✓ ${score}</span></div>
    <div class="qcard"><div class="row" style="align-items:flex-start"><div class="qtopic" style="flex:1">${esc(NOTE[q.t].title)}</div><button class="star ${S.saved[q.id] ? "on" : ""}" id="starQ" aria-label="Save question">${S.saved[q.id] ? "★" : "☆"}</button></div><div class="qtext">${qf(q.q)}</div>
    <div class="opts">${q.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>
    <div id="exp"></div></div>
    <div class="qnav"><a class="btn ghost" href="#practice">Quit</a><button class="btn primary hidden" id="nextQ">${i + 1 < list.length ? "Next question" : "See results"}</button></div></div>`;
    $$(".opt", v).forEach(b => b.onclick = () => {
      if (picked !== null) return; picked = +b.dataset.k; const ok = picked === q.ans; if (ok) score++;
      $$(".opt", v).forEach((x, k) => { x.disabled = true; if (k === q.ans) x.classList.add("right"); else if (k === picked) x.classList.add("wrong"); });
      $("#exp").innerHTML = `<div class="explain"><b class="${ok ? "ok" : "no"}">${ok ? "Correct." : "Not quite."}</b> ${esc(q.e)} <a href="#note/${q.t}">Revise topic</a></div>`;
      $("#nextQ").classList.remove("hidden"); $("#nextQ").focus({ preventScroll: true }); setTimeout(() => $(".qnav", v)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" }), 120);
      log.push({ q, ok }); recordAnswer(q, ok);
    });
    $("#nextQ").onclick = () => { i++; picked = null; i < list.length ? draw() : done(); };
    $("#starQ").onclick = e => toggleSave(q.id, e.currentTarget);
  };
  const done = () => {
    const pct = Math.round(score / list.length * 100);
    const byT = {}; log.forEach(({ q, ok }) => { byT[q.t] = byT[q.t] || { a: 0, c: 0 }; byT[q.t].a++; if (ok) byT[q.t].c++; });
    v.innerHTML = `<div class="qwrap"><div class="qcard" style="text-align:center"><div class="muted">You scored</div><div class="result-big num">${score}<small>/${list.length}</small></div><p class="muted" style="margin-top:8px">${pct >= 80 ? "Excellent. You're exam-ready on these." : pct >= 50 ? "Good base. Review the misses below." : "Revise the notes for these topics, then retry."}</p>
    <div class="row" style="justify-content:center"><a class="btn primary" href="#q/quick" id="again">Another Quick 10</a><a class="btn" href="#q/weak">Retry mistakes</a></div></div>
    <div class="panel" style="margin-top:14px"><h3>By topic</h3><div class="breakdown">${Object.entries(byT).map(([t, x]) => `<div class="bd-row"><span>${esc(NOTE[t].title)}</span><span class="num" style="text-align:right">${x.c}/${x.a}</span><div class="bar ${x.c === x.a ? "good" : ""}"><i style="width:${x.c / x.a * 100}%"></i></div></div>`).join("")}</div></div>
    <div class="panel"><h3>Review</h3>${log.map(({ q, ok }) => `<div class="review-item"><div class="q">${qf(q.q)}</div><div class="a ${ok ? "ok" : "no"}">${ok ? "✓" : "✗"} ${esc(q.c)}</div><div class="a muted">${esc(q.e)}</div></div>`).join("")}</div></div>`;
    $("#again").onclick = e => { if (location.hash === "#q/quick") { e.preventDefault(); route(); } };
  };
  draw();
}


/* ============== V6.2 · The Exam Intelligence Update ============== */
let arena62Run = null;
function vArena62(v) {
  if (!CASESETS.length) {
    v.innerHTML = `<h2>Case Study Arena</h2><div class="empty"><h3>Case challenges are coming to this subject.</h3><p>Choose Business Management for verified course-material scenario questions.</p><a class="btn primary" href="#practice">Practice MCQs</a></div>`;
    return;
  }
  const completed = S.arena62Completed || {};
  v.innerHTML = `<div class="arena62-heading"><span class="pill">V6.2 · EXAM INTELLIGENCE</span><h2>🏢 Case Study Arena</h2><p class="muted">Read a real-world situation, apply course concepts and solve linked questions. Explanations appear after each answer.</p></div>
  <div class="arena62-cards">${CASESETS.map(c => `<article class="panel arena62-card"><div class="arena62-kicker">${c.qs.length} linked questions · ${c.topics.length} topics</div><h3>${esc(c.title)}</h3><p class="muted">${esc(c.text).slice(0,200)}${c.text.length>200?'…':''}</p><div class="row"><button class="btn primary" data-case62="${esc(c.id)}">${completed[SUBJ.id+':'+c.id]?'Practice again':'Enter arena'} →</button><span class="muted">${completed[SUBJ.id+':'+c.id]?'✓ Completed before':'Scenario challenge'}</span></div></article>`).join("")}</div>`;
  $$('[data-case62]',v).forEach(b => b.onclick = () => {
    const c = CASESETS.find(x=>x.id === b.dataset.case62); if(!c) return;
    arena62Run = { subject: SUBJ.id, id: c.id, index: 0, correct: 0, answers: [], questions: c.qs.map(prepOpts) };
    runArena62(v);
  });
}
function runArena62(v) {
  const s = arena62Run, c = CASESETS.find(x=>x.id === s?.id);
  if (!s || !c || s.subject !== SUBJ.id) return vArena62(v);
  if (s.index >= s.questions.length) {
    const pct = Math.round(100*s.correct/s.questions.length);
    S.arena62Completed ||= {};
    S.arena62Completed[SUBJ.id+':'+c.id] = Math.max(S.arena62Completed[SUBJ.id+':'+c.id] || 0, pct);
    fbUpdate({ [`users/${uid}/arena62Completed/${SUBJ.id+':'+c.id}`]: S.arena62Completed[SUBJ.id+':'+c.id] });
    arenaActivity('case',c.id);
    v.innerHTML = `<div class="panel arena62-finish"><span class="arena62-medal">${pct>=80?'🏆':pct>=50?'🌟':'📖'}</span><h2>Scenario complete</h2><div class="result-big num">${s.correct}<small>/${s.questions.length}</small></div><p>${esc(c.title)} · ${pct}% correct</p><div class="row arena62-actions"><a class="btn primary" href="#arena">Other scenarios</a><a class="btn" href="#coach">Revise weak topics</a></div></div><div class="panel"><h3>Review your decisions</h3>${s.answers.map((a,i)=>`<div class="review-item"><span class="muted">Question ${i+1}</span><div class="q">${qf(s.questions[i].q)}</div><div class="a ${a.ok?'ok':'no'}">${a.ok?'✓ Correct':'✗ Incorrect'} · ${esc(a.selected)}</div><div class="a ok">Answer: ${esc(s.questions[i].c)}</div><p class="muted">${esc(s.questions[i].e)}</p></div>`).join('')}</div>`;
    arena62Run=null;
    return;
  }
  const q=s.questions[s.index], selected=s.answers[s.index];
  v.innerHTML=`<div class="arena62-heading"><a class="btn small" href="#arena">← Scenarios</a><span class="pill">${s.index+1} / ${s.questions.length}</span><h2>${esc(c.title)}</h2></div><article class="casebox arena62-scenario"><h3>Business situation</h3><p>${esc(c.text)}</p></article><div class="qwrap"><div class="qhead"><span>Question ${s.index+1}</span><div class="bar"><i style="width:${s.index/s.questions.length*100}%"></i></div><span>✓ ${s.correct}</span></div><div class="qcard"><div class="qtopic">${esc(NOTE[q.t]?.title||'Management decision')}</div><div class="qtext">${qf(q.q)}</div><div class="opts">${q.opts.map((o,i)=>`<button class="opt" data-option62="${i}"><span class="k">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div><div id="arena62Explain"></div><div class="qnav"><button class="btn primary hidden" id="arena62Next">${s.index+1===s.questions.length?'View case results':'Next decision →'}</button></div></div></div>`;
  $$('[data-option62]',v).forEach(btn=>btn.onclick=()=>{
    if(s.answers[s.index])return;
    const picked=+btn.dataset.option62,ok=picked===q.ans;
    s.answers[s.index]={ok,selected:q.opts[picked]};if(ok)s.correct++;
    recordAnswer(q,ok);
    $$('[data-option62]',v).forEach(b=>{const k=+b.dataset.option62;b.disabled=true;if(k===q.ans)b.classList.add('right');else if(k===picked)b.classList.add('wrong');});
    $('#arena62Explain').innerHTML=`<div class="explain"><b class="${ok?'ok':'no'}">${ok?'Correct decision.':'Not quite.'}</b> ${esc(q.e)} <a href="#note/${esc(q.t)}">Revise topic</a></div>`;
    $('#arena62Next').classList.remove('hidden');
  });
  $('#arena62Next').onclick=()=>{if(!s.answers[s.index])return;s.index++;runArena62(v);};
}
function vMissions62(v) {
  const d=arenaDaily();
  const done=missions62.filter(m=>d.rewards[m.id]).length;
  v.innerHTML=`<div class="arena62-heading"><span class="pill">DAILY QUESTS</span><h2>🏅 Missions & rewards</h2><p class="muted">Complete your three missions each day to earn bonus XP. Progress resets on your device's local calendar day; earned XP stays.</p></div><div class="panel"><h3>Today's progress · ${done}/${missions62.length}</h3><div class="bar"><i style="width:${done/missions62.length*100}%"></i></div></div><div class="arena62-cards">${missions62.map(m=>{const value=Math.min(m.goal,m.progress(d)),earned=!!d.rewards[m.id];return `<article class="panel arena62-card"><div class="arena62-mission-icon">${m.icon}</div><div class="row" style="justify-content:space-between"><h3>${m.title}</h3><span class="pill">${earned?'✓ Earned':`+${m.reward} XP`}</span></div><p class="muted">${m.detail}</p><div class="bar"><i style="width:${value/m.goal*100}%"></i></div><span class="muted">${value}/${m.goal} completed</span></article>`}).join('')}</div><div class="panel"><h3>Achievement collection</h3><div class="arena62-badges">${BADGES.map(b=>`<div class="arena62-badge ${b.t(S)?'earned':'locked'}" title="${esc(b.d)}"><span>${b.t(S)?b.e:'🔒'}</span><b>${esc(b.n)}</b><small>${esc(b.d)}</small></div>`).join('')}</div></div><div class="row"><a class="btn primary" href="#q/quick">Practice questions</a><a class="btn" href="#arena">Case Study Arena</a><a class="btn" href="#notes">Read notes</a></div>`;
}
function vCoach62(v) {
  const ranked=NOTES.map(n=>{
    const t=S.topics[n.id]||{a:0,c:0};const a=t.a||0,acc=a?t.c/a:0;
    // Bayesian smoothing avoids labelling single-question mistakes as certain weakness.
    const smoothed=(t.c+2)/(a+4);
    const priority=a?Math.max(0,1-smoothed)+(S.wrong&&BANK.some(q=>q.t===n.id&&S.wrong[q.id])?.12:0):0;
    return {n,a,acc:Math.round(acc*100),priority,wrong:BANK.filter(q=>q.t===n.id&&S.wrong[q.id]).length};
  }).filter(x=>x.a>0).sort((a,b)=>b.priority-a.priority||b.wrong-a.wrong);
  const unseen=NOTES.filter(n=>!(S.topics[n.id]?.a));
  v.innerHTML=`<div class="arena62-heading"><span class="pill">PERSONALIZED REVISION</span><h2>🎯 Weak-topic coach</h2><p class="muted">Based on your actual topic-level answer history, not a paid AI service. Small samples are uncertain, so practise again before drawing conclusions.</p></div>${ranked.length?`<div class="panel"><h3>Recommended next</h3><p class="muted">Start with topics where your recent practice shows mistakes or limited confidence.</p>${ranked.slice(0,12).map((r,i)=>`<div class="arena62-topic"><div class="arena62-topic-name"><b>${i+1}. ${esc(r.n.title)}</b><span class="pill">${r.acc}% · ${r.a} attempts</span></div><div class="bar"><i style="width:${r.acc}%"></i></div><div class="row"><span class="muted">${r.wrong} unresolved question${r.wrong===1?'':'s'} · ${r.a<5?'low sample':'recorded practice'}</span><a class="btn small" href="#q/weakt:${encodeURIComponent(r.n.id)}">Targeted quiz →</a><a class="btn small ghost" href="#note/${encodeURIComponent(r.n.id)}">Notes</a></div></div>`).join('')}</div>`:`<div class="empty"><h3>Your revision picture starts with practice</h3><p>Answer MCQs first to unlock topic recommendations.</p><a class="btn primary" href="#q/quick">Start Quick 10</a></div>`}${unseen.length?`<div class="panel"><h3>Topics not tested yet (${unseen.length})</h3><div class="arena62-unseen">${unseen.slice(0,12).map(n=>`<a href="#q/weakt:${encodeURIComponent(n.id)}">${esc(n.title)} ↗</a>`).join('')}</div></div>`:''}<div class="panel"><h3>How this works</h3><p class="muted">Recommendations use your answered-question count, correct answers and unresolved mistakes. Mock and case questions contribute when recorded by the quiz engine. Results are a study guide—not a prediction of exam marks.</p></div>`;
}

/* ---------- mock test ---------- */
const MOCK_SEC = 90 * 60; let MOCK_KEY = "cr_mock_v1";
/* split n questions across units in proportion to how many topics each unit has */
function perUnit(n) {
  const w = UNITS.map(u => { const k = NOTES.filter(x => x.unit === u.id && BANK.some(q => q.t === x.id)).length; return k && u.w ? u.w : k; }), tot = w.reduce((a, b) => a + b, 0) || 1;
  const out = {}; let left = n;
  UNITS.forEach((u, i) => { out[u.id] = Math.floor(n * w[i] / tot); left -= out[u.id]; });
  UNITS.map((u, i) => [u.id, n * w[i] / tot - Math.floor(n * w[i] / tot)]).sort((a, b) => b[1] - a[1]).forEach(([id]) => { if (left > 0) { out[id]++; left--; } });
  return out;
}
function pickMCQs(n) {
  const A = [];
  for (const [u, k] of Object.entries(perUnit(n))) {
    const topics = shuffle(NOTES.filter(x => x.unit === u).map(x => x.id)).filter(t => BANK.some(q => q.t === t));
    const pools = Object.fromEntries(topics.map(t => [t, shuffle(BANK.filter(q => q.t === t))]));
    let i = 0, got = 0, guard = 0; while (got < k && guard++ < 999 && topics.length) { const q = pools[topics[i++ % topics.length]].pop(); if (q) { A.push(q); got++; } }
  }
  return shuffle(A);
}
function qf(t) { t = String(t ?? ""); const i = t.indexOf("\n"); return i < 0 ? esc(t) : `${esc(t.slice(0, i))}<pre class="qcode">${esc(t.slice(i + 1))}</pre>`; }
const isMcqExam = () => EXAM.type === "mcq";
const mockSize = () => isMcqExam() ? Math.min(EXAM.questions || 100, BANK.length) : Math.min(30, BANK.length);
const mockMin = () => isMcqExam() ? (EXAM.minutes || 120) : 90;
function buildPaper() {
  const A = pickMCQs(mockSize());
  const sets = isMcqExam() ? [] : shuffle(CASESETS).slice(0, 2);
  const items = shuffle(A).map(q => ({ sec: "A", ...prepOpts(q) }));
  sets.forEach(s => s.qs.forEach(q => items.push({ sec: "B", set: s.id, ...prepOpts(q) })));
  const c = isMcqExam() ? {} : (CASES[Math.floor(Math.random() * CASES.length)] || {});
  return { items, sets: sets.map(s => s.id), written: c.id, startedAt: Date.now(), endsAt: Date.now() + mockMin() * 60000, ans: {}, flags: {}, text: {}, i: 0 };
}
function vMock(v) {
  MOCK_KEY = "cr_mock_v1_" + SUBJ.id;
  if (!BANK.length) { v.innerHTML = comingSoon("MCQ mock tests"); return; }
  const m = LS.get(MOCK_KEY, null);
  if (m && !m.done) return runMock(v, m);
  const last = LS.get("cr_mock_last_" + SUBJ.id, null);
  v.innerHTML = `<div class="mock-intro"><div class="crumb"><a href="#exam">Exam</a> / MCQ mock</div><h2>${isMcqExam() ? esc(EXAM.title || "MCQ test") : "MCQ mock test"}</h2><p class="muted">${mockMin()} minutes · ${mockSize()} MCQs, freshly mixed from every unit of ${esc(SUBJ.short || SUBJ.name)}${isMcqExam() ? ", in the same format as your computer-based exam" : ""}.</p>
  <div class="structure">${isMcqExam() ? `<div><span class="sec">A</span><span><b>${mockSize()} MCQs · 1 mark each</b><span>${mockSize() < (EXAM.questions || 100) ? `Only ${mockSize()} questions are in the bank so far; this becomes ${EXAM.questions} as content is added` : "Spread across all units"}</span></span></div></div><div class="hidden">` : ""}
    <div><span class="sec">A</span><span><b>30 scenario MCQs · 30 marks</b><span>Short business situations, spread across ${UNITS.map(u => `${u.name}: ${perUnit(30)[u.id]}`).join(", ")}</span></span></div>
    <div><span class="sec">B</span><span><b>2 case studies × 5 questions · 10 marks</b><span>Read a full case, then answer linked questions</span></span></div>
    <div><span class="sec">C</span><span><b>1 descriptive case · self-check</b><span>Write your answer, then compare with the model answer. Not auto-scored</span></span></div>
  </div>
  <div class="panel"><b>Rules</b><ul style="margin:8px 0 0;padding-left:1.2em;color:var(--muted);font-size:15px"><li>The timer keeps running if you close the app; your answers are saved on this phone.</li><li>Jump between questions with the palette; flag ones to revisit.</li><li>The paper submits automatically at 00:00.</li><li>Your score counts towards the leaderboard (best mock %) and earns XP.</li></ul></div>
  <button class="btn primary block" id="startMock">Start the ${mockMin()}-minute ${isMcqExam() ? "test" : "mock"}</button>
  ${last ? `<p class="muted" style="margin-top:14px">Last attempt: <b>${last.score}/${last.total}</b> (${last.pct}%) · <a href="#" id="revLast">Review it</a></p>` : ""}</div>`;
  $("#startMock").onclick = () => { const p = buildPaper(); LS.set(MOCK_KEY, p); runMock(v, p); };
  const rl = $("#revLast"); if (rl) rl.onclick = e => { e.preventDefault(); showMockResult(v, last); };
}
function runMock(v, m) {
  const persist = () => LS.set(MOCK_KEY, m);
  let tick;
  const setOf = id => CASESETS.find(s => s.id === id);
  const draw = () => {
    const it = m.items[m.i], n = m.items.length;
    const hasC = !!CASES.find(x => x.id === m.written);
    const inC = m.i === n && hasC;
    const answered = Object.keys(m.ans).length;
    let body;
    if (inC) {
      const c = CASES.find(x => x.id === m.written);
      body = `<div class="sec-tag">Section C · Descriptive case (self-check)</div><div class="casebox"><h4>${esc(c.title)}</h4>${esc(c.text)}</div>
      ${c.qs.map((q, k) => `<div class="qcard" style="margin-bottom:12px"><div class="qtext" style="font-size:17px">${k + 1}. ${esc(q[0])}</div><textarea data-w="${k}" placeholder="Write your answer like you would in the exam…">${esc(m.text[k] || "")}</textarea></div>`).join("")}
      <p class="muted" style="font-size:14px">Model answers appear after you submit.</p>`;
    } else {
      const s = it.set ? setOf(it.set) : null;
      body = `<div class="sec-tag">Section ${it.sec} · Question ${m.i + 1} of ${n}</div>
      ${s ? (m.items[m.i - 1]?.set === it.set
        ? `<div class="casebox"><details><summary>Case: ${esc(s.title)} (tap to reread)</summary><div style="margin-top:8px">${esc(s.text)}</div></details></div>`
        : `<div class="casebox"><h4>Case: ${esc(s.title)}</h4>${esc(s.text)}</div>`) : ""}
      <div class="qcard"><div class="qtext">${qf(it.q)}</div><div class="opts">${it.opts.map((o, k) => `<button class="opt ${m.ans[m.i] === k ? "sel" : ""}" data-k="${k}"><span class="k">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div></div>`;
    }
    v.innerHTML = `<div class="qwrap"><div class="mock-bar"><span class="timer num" id="timer">--:--</span><span class="muted num" style="font-size:14px">${answered}/${n} answered</span><span class="spacer"></span><button class="btn small" id="palBtn">All questions</button></div>
    ${body}
    <div class="qnav"><button class="btn" id="prevQ" ${m.i === 0 ? "disabled" : ""}>Back</button>${inC ? "" : `<button class="btn ghost" id="flagQ">${m.flags[m.i] ? "Unflag" : "Flag"}</button>`}${inC ? `<button class="btn primary" id="submitQ">Submit paper</button>` : (m.i + 1 === n && !hasC ? `<button class="btn primary" id="submitQ">Submit test</button>` : `<button class="btn primary" id="nextQ">${m.i + 1 === n ? "Go to Section C" : "Next"}</button>`)}</div></div>`;
    $$(".opt", v).forEach(b => b.onclick = () => { m.ans[m.i] = +b.dataset.k; persist(); $$(".opt", v).forEach(x => x.classList.toggle("sel", x === b)); $(".mock-bar .muted", v).textContent = `${Object.keys(m.ans).length}/${n} answered`; });
    $$("textarea[data-w]", v).forEach(t => t.oninput = () => { m.text[t.dataset.w] = t.value; persist(); });
    $("#prevQ").onclick = () => { m.i--; persist(); draw(); scrollTo(0, 0); };
    const nx = $("#nextQ"); if (nx) nx.onclick = () => { m.i++; persist(); draw(); scrollTo(0, 0); };
    const fl = $("#flagQ"); if (fl) fl.onclick = () => { m.flags[m.i] ? delete m.flags[m.i] : m.flags[m.i] = 1; persist(); draw(); };
    const sb = $("#submitQ"); if (sb) sb.onclick = () => confirmSubmit();
    $("#palBtn").onclick = palette;
    updTimer();
  };
  const palette = () => {
    const n = m.items.length, el = document.createElement("div"); el.className = "sheet";
    const btn = k => `<button class="${m.ans[k] !== undefined ? "ans" : ""} ${m.flags[k] ? "flag" : ""} ${k === m.i ? "cur" : ""}" data-j="${k}">${k + 1}</button>`;
    el.innerHTML = `<div><div class="row"><h3 style="margin:0">Jump to a question</h3><span class="spacer"></span><button class="btn small" data-x>Close</button></div>
    <p class="muted" style="font-size:13.5px;margin:6px 0 0">Brass = answered · blue underline = flagged</p>
    <div class="palette"><div class="gap">Section A · scenario MCQs</div>${m.items.map((it, k) => it.sec === "A" ? btn(k) : "").join("")}<div class="gap">Section B · case studies</div>${m.items.map((it, k) => it.sec === "B" ? btn(k) : "").join("")}</div>
    <div class="row" style="margin-top:16px">${CASES.find(x => x.id === m.written) ? `<button class="btn" data-j="${n}">Section C</button>` : ""}<span class="spacer"></span><button class="btn primary" data-s>Submit paper</button></div></div>`;
    document.body.appendChild(el);
    el.onclick = e => { const t = e.target.closest("button"); if (e.target === el || (t && t.hasAttribute("data-x"))) el.remove(); else if (t && t.dataset.j !== undefined) { m.i = +t.dataset.j; persist(); el.remove(); draw(); scrollTo(0, 0); } else if (t && t.hasAttribute("data-s")) { el.remove(); confirmSubmit(); } };
  };
  const confirmSubmit = () => {
    const left = m.items.length - Object.keys(m.ans).length;
    if (left > 0 && !confirm(`${left} question${left > 1 ? "s" : ""} unanswered. Submit anyway?`)) return;
    if (left === 0 && !confirm("Submit your paper now?")) return;
    finish();
  };
  const updTimer = () => { const t = $("#timer"); if (!t) return; const rem = (m.endsAt - Date.now()) / 1000; t.textContent = clock(rem); t.classList.toggle("warn", rem < 300); if (rem <= 0) finish(true); };
  const finish = auto => {
    clearInterval(tick); if (m.done) return; m.done = true;
    let score = 0; const byT = {}, review = [];
    m.items.forEach((it, k) => { const ok = m.ans[k] === it.ans; if (ok) score++; byT[it.t] = byT[it.t] || { a: 0, c: 0 }; byT[it.t].a++; if (ok) byT[it.t].c++; review.push({ q: it.q, c: it.c, e: it.e, t: it.t, sec: it.sec, set: it.set, yours: m.ans[k] === undefined ? null : it.opts[m.ans[k]], ok }); recordAnswer(it, ok, { unique: it.sec === "A" }); });
    const total = m.items.length, pct = Math.round(score / total * 100), dur = Math.min(Math.round((m.endsAt - m.startedAt) / 1000), Math.round((Date.now() - m.startedAt) / 1000));
    S.mockCount++; S.mockXp += pct; const newBest = pct > S.mockBest; S.mockBest = Math.max(S.mockBest, pct);
    const units = {}; m.items.forEach((it, k) => { const u = unitOf(it.t); units[u] = units[u] || { a: 0, c: 0 }; units[u].a++; if (m.ans[k] === it.ans) units[u].c++; });
    const res = { score, total, pct, dur, byT, units, review, written: m.written, text: m.text, ts: Date.now(), auto: !!auto };
    LS.set("cr_mock_last_" + SUBJ.id, res); LS.del(MOCK_KEY);
    if (online && uid) {
      const aid = Date.now().toString(36);
      fbUpdate({ [`attempts/${uid}/${aid}`]: { type: "mock", score, total, pct, dur, ts: serverTimestamp(), units, sets: m.sets.join(","), wrote: Object.values(m.text).join("").length }, [`users/${uid}/mockCount`]: increment(1), [`users/${uid}/mockXp`]: increment(pct), [`users/${uid}/mockBest`]: S.mockBest });
    }
    syncLB(true);
    toast(newBest ? `New best: ${pct}%!` : `Submitted · +${pct} XP`);
    showMockResult(v, res); scrollTo(0, 0);
  };
  tick = setInterval(updTimer, 1000);
  cleanup = () => clearInterval(tick);
  draw();
}
function showMockResult(v, r) {
  const c = CASES.find(x => x.id === r.written);
  const weak = Object.entries(r.byT).filter(([, x]) => x.c / x.a < .6).sort((a, b) => a[1].c / a[1].a - b[1].c / b[1].a || b[1].a - a[1].a).slice(0, 6).map(([t]) => t);
  v.innerHTML = `<div class="qwrap"><div class="qcard" style="text-align:center"><div class="muted">Mock test score${r.auto ? " · auto-submitted" : ""}</div><div class="result-big num">${r.score}<small>/${r.total}</small></div>
  <p style="margin:8px 0 4px;font-weight:700">${r.pct}% · ${fmtTime(r.dur)} used</p><p class="muted">${r.pct >= 80 ? "Topper territory. Keep it up." : r.pct >= 60 ? "Solid. Fix the weak topics below and you'll cross 80%." : "Focus on the weak topics below, then take another mock."}</p>
  <div class="row" style="justify-content:center"><a class="btn primary" href="#ranks">See leaderboard</a><button class="btn" id="newMock">New mock</button></div></div>
  <div class="panel" style="margin-top:14px"><h3>By unit</h3><div class="breakdown">${UNITS.map(u => { const x = r.units[u.id]; return x ? `<div class="bd-row"><span>${u.name}: ${u.title}</span><span class="num" style="text-align:right">${x.c}/${x.a}</span><div class="bar"><i style="width:${x.c / x.a * 100}%"></i></div></div>` : ""; }).join("")}</div>
  ${weak.length ? `<div class="label">Revise these topics</div><div class="chips">${weak.map(t => `<a class="chip" href="#note/${t}" style="text-decoration:none">${esc(shortTitle(NOTE[t]))}</a>`).join("")}</div>` : ""}</div>
  ${c ? `<div class="panel"><h3>Section C: ${esc(c.title)}</h3>${c.qs.map((q, k) => `<div class="review-item"><div class="q">${esc(q[0])}</div><div class="label">Your answer</div><div class="a" style="white-space:pre-wrap">${esc(r.text?.[k] || "(not written)")}</div><div class="model"><b>Model answer</b>${q[1]}</div></div>`).join("")}</div>` : ""}
  <div class="panel"><h3>Review all answers</h3>${r.review.map((x, k) => `<div class="review-item"><div class="dim" style="font-size:12.5px">Q${k + 1} · Section ${x.sec} · ${esc(NOTE[x.t]?.title || "")}</div><div class="q">${qf(x.q)}</div>${x.ok ? `<div class="a ok">✓ ${esc(x.c)}</div>` : `<div class="a no">✗ ${x.yours ? esc(x.yours) : "Not answered"}</div><div class="a ok">Correct: ${esc(x.c)}</div>`}<div class="a muted">${esc(x.e)}</div></div>`).join("")}</div></div>`;
  $("#newMock").onclick = () => { const p = buildPaper(); LS.set(MOCK_KEY, p); runMock(v, p); scrollTo(0, 0); };
}

/* ---------- descriptive cases ---------- */
function vCases(v) { location.replace("#written/solved"); }
function vCasesOld(v) {
  v.innerHTML = `<h2>Case studies</h2><p class="muted">Long-answer practice. Write your answer first, then open the model answer to compare. Finishing a case earns 20 XP.</p>
  <a class="guide-card" href="#guide"><span style="font-size:30px">🗝️</span><div><b>Answer method</b><span class="muted">Problem → framework → analysis → recommendations</span></div></a>
  <div class="topic-list">${CASES.map(c => `<a class="topic ${S.casesDone[c.id] ? "done" : ""}" href="#case/${c.id}"><span><span class="tt">${esc(c.title)}</span><span class="ts">${c.qs.length} questions · ${c.topics.map(t => esc(shortTitle(NOTE[t]))).join(", ")}</span></span><span class="chk">${S.casesDone[c.id] ? "✓" : ""}</span></a>`).join("")}</div>`;
}
function vCase(v, id) {
  const c = CASES.find(x => x.id === id); if (!c) return vCases(v);
  const store = LS.get("cr_case_ans", {}); store[id] = store[id] || {};
  v.innerHTML = `<article class="note"><div class="crumb"><a href="#written/solved">Written practice</a> / Solved case</div><h2>${esc(c.title)}</h2>
  <div class="casebox">${esc(c.text)}</div>
  ${c.qs.map((q, k) => `<div class="qcard" style="margin-bottom:14px"><div class="qtext" style="font-size:18px">${k + 1}. ${esc(q[0])}</div>
  <textarea data-k="${k}" placeholder="Write your answer here. It's saved on this phone.">${esc(store[id][k] || "")}</textarea>
  <button class="btn small" style="margin-top:10px" data-show="${k}">Show model answer</button><div class="model hidden" id="m${k}"><b>Model answer</b>${q[1]}</div></div>`).join("")}
  <div class="note-foot"><button class="btn ${S.casesDone[id] ? "" : "primary"}" id="caseDone">${S.casesDone[id] ? "✓ Case finished" : "Mark case as finished"}</button><a class="btn" href="#written/solved">All cases</a></div></article>`;
  $$("textarea", v).forEach(t => t.oninput = () => { store[id][t.dataset.k] = t.value; LS.set("cr_case_ans", store); });
  $$("[data-show]", v).forEach(b => b.onclick = () => { $("#m" + b.dataset.show).classList.toggle("hidden"); b.textContent = $("#m" + b.dataset.show).classList.contains("hidden") ? "Show model answer" : "Hide model answer"; });
  $("#caseDone").onclick = e => { if (S.casesDone[id]) return; S.casesDone[id] = 1; fbUpdate({ [`users/${uid}/casesDone/${id}`]: 1 }); syncLB(); toast("+20 XP · case finished"); e.target.textContent = "✓ Case finished"; e.target.classList.remove("primary"); };
}

/* ---------- leaderboard ---------- */
let lbTab = "xp";
function vRanks(v) {
  const tabs = { xp: ["XP", r => r.xp || 0, x => x.toLocaleString("en-IN"), "XP"], best: ["Best mock", r => r.best || 0, x => x + "%", "best mock"], sec: ["Study time", r => r.sec || 0, fmtTime, "studied"], solved: ["Solved", r => r.solved || 0, x => x, "solved"], wins: ["Battle wins", r => r.wins || 0, x => x, "wins"] };
  const [, key, fmt, unit] = tabs[lbTab];
  const rows = boardRows().map(x => ({ ...x, v: key(x.r) })).sort((a, b) => b.v - a.v || b.r.xp - a.r.xp);
  const badgeStr = s => [...(s || "")].map(c => BADGES.find(b => b.id === c)?.e || "").join("");
  const top = rows.slice(0, 3), order = [top[1], top[0], top[2]];
  v.innerHTML = `<h2>Leaderboard</h2><p class="muted">Everyone in the class, ranked live. Earn XP by studying, reading notes, solving questions and taking mocks.</p>
  <div class="chips">${Object.entries(tabs).map(([k, t]) => `<button class="chip ${k === lbTab ? "on" : ""}" data-tab="${k}">${t[0]}</button>`).join("")}</div>
  ${!online ? `<div class="empty" style="margin-top:16px">The leaderboard needs an internet connection. Your progress is saved on this phone and will sync when you're back online.</div>` :
      !rows.length ? `<div class="empty" style="margin-top:16px">No one on the board yet. Answer a few questions to claim the top spot.</div>` : `
  <div class="podium">${order.map((x, k) => x ? `<div class="pod p${[2, 1, 3][k]}"><div class="face">${esc(initials(x.name))}</div><div class="nm">${esc(x.name.split(" ")[0])}${x.me ? " (you)" : ""}</div><div class="sc num">${fmt(x.v)}</div><div class="block">${[2, 1, 3][k]}</div></div>` : "<div></div>").join("")}</div>
  <div class="lb-list">${rows.map((x, k) => `<div class="lb-row ${x.me ? "me" : ""}"><span class="rk">${k + 1}</span><span><span class="nm">${esc(x.name)}${x.me ? " (you)" : ""}</span>${x.live ? '<span class="on-dot" title="Studying now"></span>' : ""} <span class="badges">${badgeStr(x.r.badges)}</span><br><span class="sub">${x.r.streak ? x.r.streak + "-day streak · " : ""}${x.r.acc || 0}% accuracy · ${x.r.mocks || 0} mocks</span></span><span class="val num">${fmt(x.v)}<small>${unit}</small></span></div>`).join("")}</div>`}`;
  $$("[data-tab]", v).forEach(b => b.onclick = () => { lbTab = b.dataset.tab; vRanks(v); });
}

/* ---------- profile ---------- */
function vMe(v) {
  const topics = NOTES.map(n => ({ n, t: S.topics[n.id] })).filter(x => x.t && x.t.a).map(x => ({ ...x, acc: Math.round(x.t.c / x.t.a * 100) })).sort((a, b) => a.acc - b.acc);
  v.innerHTML = `<div class="row" style="gap:16px;margin-bottom:18px"><div class="avatar" style="width:64px;height:64px;font-size:24px">${esc(initials(S.name))}</div><div><h2 style="margin:0">${esc(S.name || "Guest")}</h2><div class="muted" style="font-size:14px">Joined ${new Date(S.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · rank ${myRank()}</div></div></div>
  <div class="stats" style="margin-top:0"><div class="stat"><div class="v num">${fmtTime(S.studySec)}</div><div class="l">Study time</div></div><div class="stat"><div class="v num">${NOTES.filter(n => S.notesRead[n.id]).length}/${NOTES.length}</div><div class="l">Topics read (${esc(SUBJ.short || "")})</div></div><div class="stat"><div class="v num">${S.mcqA ? Math.round(S.mcqC / S.mcqA * 100) : 0}%</div><div class="l">Accuracy (${S.mcqA} answered)</div></div><div class="stat"><div class="v num">${S.mockCount}</div><div class="l">Mocks taken</div></div></div>
  <div class="section-head"><h2>Badges</h2></div>
  <div class="badge-grid">${BADGES.map(b => `<div class="badge ${b.t(S) ? "got" : ""}"><div class="e">${b.e}</div><b>${b.n}</b><span>${b.d}</span></div>`).join("")}</div>
  <div class="section-head"><h2>Weakest topics first</h2></div>
  ${topics.length ? `<div class="panel"><div class="breakdown">${topics.map(x => `<div class="bd-row"><a href="#q/weakt:${x.n.id}" style="color:inherit">${esc(x.n.title)}</a><span class="num" style="text-align:right">${x.acc}%</span><div class="bar ${x.acc >= 80 ? "good" : ""}"><i style="width:${x.acc}%"></i></div></div>`).join("")}</div><p class="muted" style="font-size:13.5px;margin:12px 0 0">Tap a topic to practise it.</p></div>` : `<div class="empty">Answer some questions to see your strongest and weakest topics.</div>`}
  <div class="section-head"><h2>Your subjects</h2></div>
  <div class="panel">${SUBJECTS.map(x => `<div class="row" style="padding:8px 0"><span style="font-size:22px">${x.icon || "📘"}</span><span><b>${esc(x.name)}</b><br><span class="muted" style="font-size:13px">Year ${x.year} · Sem ${x.sem}</span></span><span class="spacer"></span>${x.id === SUBJ.id ? '<span class="chip on" style="cursor:default">Studying</span>' : `<button class="btn small" data-sw="${x.id}">Switch</button>`}</div>`).join("")}</div>
  <div class="section-head"><h2>Keep your work</h2></div>
  <div class="panel"><p class="muted" style="margin-top:0">Your progress is saved to your profile. You can also download your personal notes and written answers to keep forever.</p><div class="row"><button class="btn" id="dlNotes">⬇️ Download my notes</button><button class="btn ghost" id="pdfNotes">🖨️ My notes as PDF</button></div></div>
  <p class="foot">Your name is permanent. If it's wrong, ask the site admin to fix it.<br><a href="admin.html" style="color:var(--dim)">Admin sign-in</a></p>`;
  $$("[data-sw]", v).forEach(b => b.onclick = () => switchSubject(b.dataset.sw));
  const mine = () => { const all = window.SUBJECT_DATA || {}; const title = t => { for (const k in all) { const n = (all[k].notes || []).find(x => x.id === t); if (n) return n.title; } return t; }; return Object.entries(S.mynotes || {}).filter(([, x]) => x && x.trim()).map(([t, x]) => ({ t: title(t), x })); };
  $("#dlNotes").onclick = () => { const w = LS.get("cr_written", {}); const txt = `Boardroom: notes of ${S.name}\n${new Date().toLocaleString("en-IN")}\n\n` + mine().map(m => `## ${m.t}\n${m.x}\n`).join("\n") + `\n\n# Written answers\n` + Object.entries(w).map(([k, x]) => `## ${k}\n${typeof x === "string" ? x : Object.values(x).join("\n")}\n`).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" })); a.download = "boardroom-my-notes.txt"; a.click(); };
  $("#pdfNotes").onclick = () => { const m = mine(); printHTML(`<h1>My notes: ${esc(S.name)}</h1>` + (m.length ? m.map(x => `<h2>${esc(x.t)}</h2><p style="white-space:pre-wrap">${esc(x.x)}</p>`).join("") : "<p>No personal notes yet. Add them at the bottom of any topic.</p>")); };
}

/* ================= subjects ================= */
async function switchSubject(id) {
  LS.set("cr_subject_chosen", true);
  if (SUBJ && id === SUBJ.id) return;
  try { await loadSubject(id); } catch (e) { toast("Couldn't load that subject. Check your connection."); return; }
  pickTopics = new Set();
  toast(`Now studying ${SUBJ.short || SUBJ.name}`);
  if (location.hash === "#home" || !location.hash) route(); else location.hash = "#home";
}
const daysTo = d => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null;
const examLine = x => { if (!x.exam?.date) return ""; const n = daysTo(x.exam.date), dt = new Date(x.exam.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); return n < 0 ? `Exam was on ${dt}` : n === 0 ? `Exam today` : `Exam ${dt} · in ${n} day${n === 1 ? "" : "s"}`; };
const hasContent = x => !!x.file;
/* 3D swipe carousel for choosing a subject */
function pickSubject(first) {
  if ($(".modal")) return;
  const list = SUBJECTS, N = list.length, ang = 360 / N;
  let idx = Math.max(0, list.findIndex(x => SUBJ && x.id === SUBJ.id)), drag = 0;
  const el = document.createElement("div"); el.className = "modal subj-modal";
  el.innerHTML = `<div class="subj-wrap" role="dialog" aria-modal="true" aria-label="Choose a subject">
    <div class="subj-top"><div class="dim" style="font-size:13px;font-weight:700">${esc(PROGRAM.short || "")} · Year 1 · Semester 1</div>
    <h2>${first ? "Which subject do you want to start with?" : "Switch subject"}</h2><p class="muted">Swipe to browse, tap the front card to choose. You can change it any time from the menu.</p></div>
    <div class="car-stage" id="carStage"><div class="car-ring" id="carRing">${list.map((x, i) => `<div class="car-card" data-i="${i}" style="--g:linear-gradient(155deg,${(x.grad || ["#8B5CF6", "#EC4899"]).join(",")})"><span class="cc-ic">${x.icon || "📘"}</span><span class="cc-code">${esc(x.code || "")}</span><b>${esc(x.name)}</b><span class="cc-meta">${hasContent(x) ? "Notes · MCQs · Exam papers" : "Content coming soon"}</span>${x.exam?.date ? `<span class="cc-exam">⏰ ${examLine(x)}</span>` : ""}</div>`).join("")}</div></div>
    <div class="car-nav"><button class="car-arrow" id="carPrev" aria-label="Previous">‹</button><div class="car-dots">${list.map((x, i) => `<i data-d="${i}"></i>`).join("")}</div><button class="car-arrow" id="carNext" aria-label="Next">›</button></div>
    <button class="btn primary block" id="carGo"></button>${first ? "" : `<button class="btn ghost block" style="margin-top:8px" data-x>Close</button>`}</div>`;
  document.body.appendChild(el);
  const ring = $("#carRing", el), stage = $("#carStage", el), cards = $$(".car-card", el);
  const W = () => Math.min(230, stage.clientWidth * .62), R = () => Math.round((W() / 2) / Math.tan(Math.PI / N)) + 24;
  const layout = (animate = true) => {
    const r = R(); ring.style.transition = animate ? "transform .65s cubic-bezier(.22,1,.36,1)" : "none";
    cards.forEach((c, i) => { c.style.width = W() + "px"; c.style.marginLeft = -W() / 2 + "px"; c.style.transform = `rotateY(${i * ang}deg) translateZ(${r}px)`; const d = Math.min(Math.abs(i - idx), N - Math.abs(i - idx)); c.classList.toggle("front", d === 0); c.style.opacity = d === 0 ? 1 : d === 1 ? .55 : .2; });
    ring.style.transform = `translateZ(${-r}px) rotateY(${-idx * ang + drag}deg)`;
    $$(".car-dots i", el).forEach((d, i) => d.classList.toggle("on", i === idx));
    const x = list[idx]; $("#carGo", el).innerHTML = `Start ${esc(x.short || x.name)}`;
  };
  const go = d => { idx = (idx + d + N) % N; drag = 0; layout(); };
  let sx = null, moved = false;
  stage.onpointerdown = e => { sx = e.clientX; moved = false; stage.setPointerCapture(e.pointerId); };
  stage.onpointermove = e => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 6) moved = true; drag = dx * .35; layout(false); };
  stage.onpointerup = e => {
    if (sx === null) return; const steps = Math.round(-drag / ang) || (Math.abs(drag) > 8 ? (drag < 0 ? 1 : -1) : 0); sx = null;
    if (!moved) { const c = document.elementFromPoint(e.clientX, e.clientY)?.closest(".car-card"); drag = 0; if (c) { const i = +c.dataset.i; if (i === idx) return choose(); idx = i; } layout(); return; }
    drag = 0; go(steps);
  };
  stage.onpointercancel = () => { sx = null; drag = 0; layout(); };
  $("#carPrev", el).onclick = () => go(-1); $("#carNext", el).onclick = () => go(1);
  el.onkeydown = e => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); if (e.key === "Enter") choose(); };
  const choose = async () => { const x = list[idx]; el.classList.add("leaving"); setTimeout(() => el.remove(), 250); if (SUBJ && x.id === SUBJ.id) { LS.set("cr_subject_chosen", true); toast(`Studying ${SUBJ.short || SUBJ.name}`); } else await switchSubject(x.id); };
  $("#carGo", el).onclick = choose;
  el.onclick = e => { if (e.target.closest("[data-x]") || (e.target === el && !first)) el.remove(); };
  addEventListener("resize", () => layout(false));
  layout(false); requestAnimationFrame(() => el.classList.add("in"));
}
/* ================= saving, printing ================= */
function toggleSave(id, btn) {
  if (S.saved[id]) delete S.saved[id]; else S.saved[id] = 1;
  fbUpdate({ [`users/${uid}/saved/${id}`]: S.saved[id] ? 1 : null }); save();
  if (btn) { btn.classList.toggle("on", !!S.saved[id]); btn.textContent = S.saved[id] ? "★" : "☆"; }
  toast(S.saved[id] ? "Saved to your list" : "Removed from saved");
}
function printHTML(html) {
  let pa = $("#printArea"); if (!pa) { pa = document.createElement("div"); pa.id = "printArea"; document.body.appendChild(pa); }
  pa.innerHTML = `<div class="p-head">Boardroom · ${esc(SUBJ?.name || "")} · ${esc(PROGRAM.short || "")}</div>` + html;
  document.body.classList.add("printing");
  setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove("printing"), 400); }, 60);
}

/* ================= videos ================= */
const ytThumb = id => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const videoCard = x => `<button class="vcard" data-yt="${x.id}"><span class="vthumb" style="background-image:url('${ytThumb(x.id)}')"><span class="play">▶</span></span><span class="vt">${esc(x.title)}</span><span class="vs">${x.t && NOTE[x.t] ? esc(shortTitle(NOTE[x.t])) : "Upcoming topic"}</span></button>`;
function noteVideos(id) { const vs = VIDEOS.filter(x => x.t === id); return vs.length ? `<div class="panel"><h3>▶️ Watch: picked by your teacher</h3><div class="vgrid">${vs.map(videoCard).join("")}</div></div>` : ""; }
function bindVideos(root) { $$("[data-yt]", root).forEach(b => b.onclick = () => playVideo(b.dataset.yt)); }
function playVideo(id) {
  const el = document.createElement("div"); el.className = "sheet video-sheet";
  el.innerHTML = `<div><div class="row" style="margin-bottom:10px"><b>Video</b><span class="spacer"></span><a class="btn small ghost" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Open in YouTube</a><button class="btn small" data-x>Close</button></div>
  <div class="vframe"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="YouTube video"></iframe></div></div>`;
  document.body.appendChild(el);
  el.onclick = e => { if (e.target === el || e.target.closest("[data-x]")) el.remove(); };
  fbUpdate({ [`users/${uid}/videos/${id.replace(/[.#$\[\]]/g, "_")}`]: Date.now() });
}
function vVideos(v) {
  const groups = UNITS.map(u => ({ u, vs: VIDEOS.filter(x => x.t && unitOf(x.t) === u.id) })).filter(g => g.vs.length);
  const extra = VIDEOS.filter(x => !x.t || !NOTE[x.t]);
  v.innerHTML = `<div class="crumb"><a href="#notes">Notes</a> / Videos</div><h2>Videos</h2><p class="muted">Reference videos from your teacher's course handout for ${esc(SUBJ.name)}. Tap to watch here.</p>
  ${VIDEOS.length ? groups.map(g => `<section class="unit-block ${g.u.id}"><h3><span class="pill">${g.u.name}</span>${esc(g.u.title)}</h3><div class="vgrid">${g.vs.map(videoCard).join("")}</div></section>`).join("") + (extra.length ? `<section class="unit-block"><h3>Coming up in the syllabus</h3><div class="vgrid">${extra.map(videoCard).join("")}</div></section>` : "") : `<div class="empty">No videos for this subject yet.</div>`}`;
  bindVideos(v);
}

/* ================= written answers: marking schemes ================= */
const WKEY = "cr_written";
const wGet = k => (LS.get(WKEY, {})[k] || "");
const wSet = (k, val) => { const all = LS.get(WKEY, {}); all[k] = val; LS.set(WKEY, all); };
const words = t => (t.trim().match(/\S+/g) || []).length;
function suggest(pts, txt) {
  const t = (txt || "").toLowerCase();
  return pts.map(p => !!t.trim() && String(p[2] || "").split("|").some(k => { k = k.trim(); if (!k) return false; try { return new RegExp(k, "i").test(t); } catch { return t.includes(k.toLowerCase()); } }));
}
function rubricHTML(key, pts, ticks, sugg) {
  return `<div class="rubric"><div class="rb-head"><span>Marking scheme: tick each point your answer covers</span><b class="num" data-rtot="${key}">${pts.reduce((a, p, i) => a + (ticks[i] ? p[1] : 0), 0)}/${pts.reduce((a, p) => a + p[1], 0)}</b></div>
  ${pts.map((p, i) => `<label class="rb ${ticks[i] ? "on" : ""}"><input type="checkbox" data-rk="${key}" data-ri="${i}" ${ticks[i] ? "checked" : ""}><span>${esc(p[0])}${sugg[i] ? ' <em class="sug">found in your answer</em>' : ""}</span><b>${p[1]}</b></label>`).join("")}</div>`;
}
const modelHTML = pts => `<div class="model"><b>Model answer points</b><ul>${pts.map(p => `<li>${esc(p[0])} <span class="dim">(${p[1]})</span></li>`).join("")}</ul></div>`;
function bindRubric(root, store, onChange) {
  $$("[data-rk]", root).forEach(cb => cb.onchange = () => {
    const k = cb.dataset.rk; store[k] = store[k] || []; store[k][+cb.dataset.ri] = cb.checked; cb.closest(".rb").classList.toggle("on", cb.checked);
    onChange && onChange(k);
  });
}
const marksOf = (pts, ticks) => pts.reduce((a, p, i) => a + ((ticks || [])[i] ? p[1] : 0), 0);

let wTab = "short";
function vWritten(v, p) {
  if (p && p.startsWith("s:")) return vShortQ(v, p.slice(2));
  if (p && p.startsWith("l:")) return vLongQ(v, p.slice(2));
  if (p === "long" || p === "solved" || p === "short") wTab = p;
  const topic = p && p.startsWith("t:") ? p.slice(2) : null; if (topic) wTab = "short";
  const tabs = [["short", `Short answers (${SHORT.length})`], ["long", `Case studies (${LONG.length})`], ["solved", `Solved cases (${CASES.length})`]];
  let body = "";
  if (wTab === "short") {
    const list = SHORT.filter(x => !topic || x.t === topic);
    body = UNITS.map(u => { const qs = list.filter(x => unitOf(x.t) === u.id); return qs.length ? `<section class="unit-block ${u.id}"><h3><span class="pill">${u.name}</span>${esc(u.title)}</h3><div class="topic-list">${qs.map(x => { const done = S.casesDone[x.id]; return `<a class="topic ${done ? "done" : ""}" href="#written/s:${x.id}"><span class="lec">${x.marks}m</span><span><span class="tt">${esc(x.q.replace(/\s*\(\d+ marks\)\s*$/, ""))}</span><span class="ts">${esc(NOTE[x.t]?.title || "")}</span></span><span class="chk">${done ? "✓" : ""}</span></a>`; }).join("")}</div></section>` : ""; }).join("") || `<div class="empty">No short-answer questions for this subject yet.</div>`;
  } else if (wTab === "long") {
    body = `<div class="topic-list">${LONG.map(c => { const k = SUBJ.id + "_" + c.id, done = S.casesDone[k]; return `<a class="topic ${done ? "done" : ""}" href="#written/l:${c.id}"><span class="lec">${c.parts.reduce((a, x) => a + x[1], 0)}m</span><span><span class="tt">${esc(c.title)}</span><span class="ts">${c.parts.length} parts · ${c.topics.map(t => esc(shortTitle(NOTE[t] || { title: t }))).join(", ")}</span></span><span class="chk">${done ? "✓" : ""}</span></a>`; }).join("")}</div>` || `<div class="empty">No case studies yet.</div>`;
  } else {
    body = `<div class="topic-list">${CASES.map(c => `<a class="topic ${S.casesDone[c.id] ? "done" : ""}" href="#case/${c.id}"><span><span class="tt">${esc(c.title)}</span><span class="ts">${c.qs.length} questions with model answers</span></span><span class="chk">${S.casesDone[c.id] ? "✓" : ""}</span></a>`).join("")}</div>`;
  }
  v.innerHTML = `<h2>Written practice</h2><p class="muted">Exam-style questions. Write your answer, then mark yourself against the marking scheme. Each finished question earns 20 XP.</p>
  <a class="guide-card" href="#guide"><span style="font-size:30px">🗝️</span><div><b>How to write case answers</b><span class="muted">Problem → framework → analysis → recommendations</span></div></a>
  <div class="chips" style="margin-bottom:18px">${tabs.map(([k, l]) => `<a class="chip ${wTab === k ? "on" : ""}" href="#written/${k}" style="text-decoration:none">${l}</a>`).join("")}${topic ? `<a class="chip on" href="#written/short" style="text-decoration:none">✕ ${esc(shortTitle(NOTE[topic]))}</a>` : ""}</div>${body}`;
}
function answerAndMark(v, { key, crumb, title, caseText, parts, doneKey, xpLabel }) {
  // parts: [{q, marks, pts}]
  const state = LS.get("cr_wstate", {}); const st = state[key] || { marked: false, ticks: {} };
  const draw = () => {
    v.innerHTML = `<article class="note"><div class="crumb">${crumb}</div><h2>${esc(title)}</h2>
    ${caseText ? `<div class="casebox">${esc(caseText)}</div>` : ""}
    ${parts.map((p, i) => { const k = `${key}_${i}`, txt = wGet(k), tk = st.ticks[i] || suggest(p.pts, txt);
      return `<div class="qcard wq" style="margin-bottom:14px"><div class="row" style="align-items:flex-start"><div class="qtext" style="font-size:18px;flex:1">${parts.length > 1 ? `(${String.fromCharCode(97 + i)}) ` : ""}${esc(p.q)}</div><span class="mk">${p.marks} marks</span></div>
      <textarea data-w="${k}" placeholder="Write your answer like you would in the exam…" ${st.marked ? "readonly" : ""}>${esc(txt)}</textarea><div class="wc dim" data-wc="${k}">${words(txt)} words</div>
      ${st.marked ? rubricHTML(String(i), p.pts, tk, suggest(p.pts, txt)) + modelHTML(p.pts) : ""}</div>`; }).join("")}
    <div class="note-foot">${st.marked ? `<div class="score-pill">Your mark: <b class="num" id="wTotal">${parts.reduce((a, p, i) => a + marksOf(p.pts, st.ticks[i] || suggest(p.pts, wGet(`${key}_${i}`))), 0)}</b> / ${parts.reduce((a, p) => a + p.marks, 0)}</div><button class="btn primary" id="wSave">${S.casesDone[doneKey] ? "✓ Saved" : "Save my mark"}</button><button class="btn ghost" id="wRedo">Write again</button>` : `<button class="btn primary" id="wMark">Submit and see marking scheme</button>`}</div></article>`;
    $$("textarea[data-w]", v).forEach(t => t.oninput = () => { wSet(t.dataset.w, t.value); $(`[data-wc="${t.dataset.w}"]`).textContent = words(t.value) + " words"; });
    const mk = $("#wMark"); if (mk) mk.onclick = () => { if (!parts.some((p, i) => wGet(`${key}_${i}`).trim())) return toast("Write an answer first"); st.marked = true; parts.forEach((p, i) => st.ticks[i] = suggest(p.pts, wGet(`${key}_${i}`))); state[key] = st; LS.set("cr_wstate", state); draw(); };
    const rd = $("#wRedo"); if (rd) rd.onclick = () => { st.marked = false; st.ticks = {}; state[key] = st; LS.set("cr_wstate", state); draw(); };
    const sv = $("#wSave"); if (sv) sv.onclick = () => { if (!S.casesDone[doneKey]) { S.casesDone[doneKey] = 1; fbUpdate({ [`users/${uid}/casesDone/${doneKey}`]: 1 }); syncLB(); toast(`+20 XP · ${xpLabel}`); } sv.textContent = "✓ Saved"; };
    bindRubric(v, st.ticks, () => { state[key] = st; LS.set("cr_wstate", state); const t = $("#wTotal"); if (t) t.textContent = parts.reduce((a, p, i) => a + marksOf(p.pts, st.ticks[i]), 0); $$("[data-rtot]", v).forEach(el => { const i = +el.dataset.rtot; el.textContent = `${marksOf(parts[i].pts, st.ticks[i])}/${parts[i].marks}`; }); });
  };
  draw();
}
function vShortQ(v, id) {
  const x = SHORT.find(s => s.id === id); if (!x) return vWritten(v);
  answerAndMark(v, { key: "s" + id, crumb: `<a href="#written/short">Written practice</a> / ${esc(NOTE[x.t]?.title || "")}`, title: "Short answer", parts: [{ q: x.q, marks: x.marks, pts: x.pts }], doneKey: x.id, xpLabel: "answer marked" });
}
function vLongQ(v, id) {
  const c = LONG.find(s => s.id === id); if (!c) return vWritten(v, "long");
  answerAndMark(v, { key: SUBJ.id + "_" + c.id, crumb: `<a href="#written/long">Written practice</a> / Case study`, title: c.title, caseText: c.text, parts: c.parts.map(p => ({ q: p[0], marks: p[1], pts: p[2] })), doneKey: SUBJ.id + "_" + c.id, xpLabel: "case marked" });
}

/* ================= exam paper (70 marks) ================= */
const paperKey = () => "cr_paper_" + SUBJ.id;
function buildExam() {
  const mcq = pickMCQs(EXAM.mcq).map(q => ({ ...prepOpts(q), sec: "A" }));
  shuffle(CASESETS).slice(0, EXAM.mcqCaseSets).forEach(cs => cs.qs.forEach(q => mcq.push({ ...prepOpts(q), sec: "A", set: cs.id })));
  const byUnit = UNITS.map(u => shuffle(SHORT.filter(x => unitOf(x.t) === u.id))).filter(p => p.length);
  const B = [], used = new Set(); let i = 0, guard = 0;
  while (B.length < Math.min(EXAM.shortShow, SHORT.length) && guard++ < 500) { const pool = byUnit[i++ % byUnit.length]; const q = pool.find(x => !used.has(x.t) && !B.includes(x)) || pool.find(x => !B.includes(x)); if (q) { B.push(q); used.add(q.t); } }
  const C = LONG.length ? LONG[Math.floor(Math.random() * LONG.length)].id : null;
  return { mcq, B: B.map(x => x.id), C, ans: {}, startedAt: Date.now(), endsAt: Date.now() + EXAM.minutes * 60000, phase: "write", ticks: {} };
}
const examTotals = () => ({ A: EXAM.mcq + EXAM.mcqCaseSets * 5, B: EXAM.shortAttempt * EXAM.shortMarks, C: EXAM.longMarks });
function vExam(v) {
  if (!BANK.length) { v.innerHTML = `<h2>Exam</h2>${examBanner()}` + comingSoon("Exam practice"); return; }
  if (isMcqExam()) {
    v.innerHTML = `<h2>Exam</h2>${examBanner()}<div class="exam-card"><div class="row"><span class="badge-big">💻</span><div><h3 style="margin:0">${esc(EXAM.title || "MCQ test")}</h3><span class="muted">${EXAM.questions} MCQs · ${EXAM.minutes} minutes · just like the computer-based exam</span></div></div>
    <p class="muted" style="font-size:14px;margin:14px 0">Every test is freshly mixed from all units. Practise until you can finish ${EXAM.questions} questions comfortably inside ${EXAM.minutes} minutes.</p>
    <a class="btn primary block" href="#mock">Start the MCQ test</a></div>
    <div class="actions" style="margin-top:14px"><a class="action c1" href="#q/quick"><span class="ic">⚡</span><b>Quick 10</b><span>Warm up</span></a><a class="action c2" href="#q/weak"><span class="ic">🎯</span><b>Fix mistakes</b><span>${inBank(S.wrong)} to retry</span></a></div>`;
    return;
  }
  const m = LS.get(paperKey(), null), last = LS.get("cr_paper_last_" + SUBJ.id, null), T = examTotals();
  const canPaper = SHORT.length && LONG.length;
  v.innerHTML = `<h2>Exam</h2>${examBanner()}<p class="muted">${esc(SUBJ.name)} · practise under real exam conditions.</p>
  <div class="exam-card">
    <div class="row"><span class="badge-big">📝</span><div><h3 style="margin:0">${esc(EXAM.title)}</h3><span class="muted">${EXAM.total} marks · ${EXAM.minutes} minutes · fresh paper every time</span></div></div>
    <div class="structure" style="margin:16px 0">
      <div><span class="sec">A</span><span><b>Section A · ${T.A} marks</b><span>${EXAM.mcq} scenario MCQs${EXAM.mcqCaseSets ? ` + ${EXAM.mcqCaseSets} short case with 5 MCQs` : ""} (1 mark each, auto-marked)</span></span></div>
      <div><span class="sec">B</span><span><b>Section B · ${T.B} marks</b><span>Answer any ${EXAM.shortAttempt} of ${EXAM.shortShow} scenario questions (${EXAM.shortMarks} marks each, written)</span></span></div>
      <div><span class="sec">C</span><span><b>Section C · ${T.C} marks</b><span>One compulsory case study with parts (written)</span></span></div>
    </div>
    <p class="muted" style="font-size:13.5px">After you submit, Section A is marked automatically. For B and C you get the official-style marking scheme. The site pre-ticks points it finds in your answer; you confirm honestly.${EXAM.note ? " " + esc(EXAM.note) : ""}</p>
    ${!canPaper ? `<div class="empty">Written questions for this subject are coming soon.</div>` : m && m.phase !== "done" ? `<a class="btn primary block" href="#paper">Continue your paper (${m.phase === "write" ? clock((m.endsAt - Date.now()) / 1000) + " left" : "marking"})</a><button class="btn ghost block" style="margin-top:8px" id="discard">Discard and start new</button>` : `<button class="btn primary block" id="startPaper">Start the ${EXAM.minutes}-minute paper</button>`}
    ${canPaper ? `<div class="row" style="margin-top:10px"><button class="btn small" id="printPaper">🖨️ Print a paper</button><button class="btn small ghost" id="printKey">🖨️ Paper + answer key</button></div>` : ""}
    ${last ? `<p class="muted" style="margin:14px 0 0">Last paper: <b>${last.score}/${last.total}</b> (${last.pct}%) · A ${last.a} · B ${last.b} · C ${last.c}</p>` : ""}
  </div>
  <div class="actions" style="margin-top:14px">
    <a class="action c2" href="#mock"><span class="ic">⏱️</span><b>MCQ mock</b><span>40 MCQs · 90 min</span></a>
    <a class="action c4" href="#written/short"><span class="ic">✍️</span><b>Short answers</b><span>${SHORT.length} questions</span></a>
    <a class="action c5" href="#written/long"><span class="ic">🧠</span><b>Case studies</b><span>${LONG.length} × ${EXAM.longMarks} marks</span></a>
    <a class="action c3" href="#guide"><span class="ic">🗝️</span><b>Answer method</b><span>Structure that scores</span></a>
  </div>`;
  const sp = $("#startPaper"); if (sp) sp.onclick = () => { LS.set(paperKey(), buildExam()); location.hash = "#paper"; };
  const dc = $("#discard"); if (dc) dc.onclick = () => { if (confirm("Discard your current paper?")) { LS.del(paperKey()); vExam(v); } };
  const pp = $("#printPaper"); if (pp) pp.onclick = () => printHTML(paperPrint(buildExam(), false));
  const pk = $("#printKey"); if (pk) pk.onclick = () => printHTML(paperPrint(buildExam(), true));
}
function paperPrint(m, key) {
  const T = examTotals(), sets = {}; let n = 0;
  const A = m.mcq.map(it => { let pre = ""; if (it.set && !sets[it.set]) { sets[it.set] = 1; const cs = CASESETS.find(c => c.id === it.set); pre = `<div class="p-case"><b>Read the case and answer the questions that follow:</b> ${esc(cs.title)}<br>${esc(cs.text)}</div>`; } n++; return `${pre}<div class="p-q"><b>${n}.</b> ${qf(it.q)}<ol type="a">${it.opts.map(o => `<li>${esc(o)}</li>`).join("")}</ol>${key ? `<div class="p-key">Answer: (${"abcd"[it.ans]}) ${esc(it.c)}</div>` : ""}</div>`; }).join("");
  const B = m.B.map((id, i) => { const x = SHORT.find(s => s.id === id); return `<div class="p-q"><b>${i + 1}.</b> ${esc(x.q)}${key ? `<div class="p-key"><b>Marking scheme:</b><ul>${x.pts.map(p => `<li>${esc(p[0])} (${p[1]})</li>`).join("")}</ul></div>` : ""}</div>`; }).join("");
  const c = LONG.find(l => l.id === m.C);
  const C = c ? `<div class="p-case"><b>${esc(c.title)}</b><br>${esc(c.text)}</div>${c.parts.map((p, i) => `<div class="p-q"><b>(${String.fromCharCode(97 + i)})</b> ${esc(p[0])} <i>[${p[1]} marks]</i>${key ? `<div class="p-key"><b>Marking scheme:</b><ul>${p[2].map(x => `<li>${esc(x[0])} (${x[1]})</li>`).join("")}</ul></div>` : ""}</div>`).join("")}` : "";
  return `<h1>${esc(EXAM.title)}</h1><p><b>${esc(SUBJ.name)}</b> · ${esc(PROGRAM.short || "")} · Max. marks: ${EXAM.total} · Time: ${EXAM.minutes} minutes</p>
  <p class="p-ins">Instructions: Attempt all questions in Section A. Attempt any ${EXAM.shortAttempt} questions from Section B. Section C is compulsory. Write in a structured manner, using relevant concepts and examples.</p>
  <h2>Section A (${T.A} × 1 = ${T.A} marks)</h2>${A}<h2>Section B (${EXAM.shortAttempt} × ${EXAM.shortMarks} = ${T.B} marks)</h2>${B}<h2>Section C (${T.C} marks)</h2>${C}${key ? "" : `<p class="p-ins" style="margin-top:30px">Practice paper generated by Boardroom (student-made, not an official university paper).</p>`}`;
}
function vPaper(v) {
  const m = LS.get(paperKey(), null);
  if (!m) { location.replace("#exam"); return; }
  const persist = () => LS.set(paperKey(), m), T = examTotals();
  const shortQs = m.B.map(id => SHORT.find(s => s.id === id)).filter(Boolean), long = LONG.find(l => l.id === m.C);
  const kB = i => `pB_${m.startedAt}_${i}`, kC = i => `pC_${m.startedAt}_${i}`;
  let tick;
  const scoreA = () => m.mcq.reduce((a, it, i) => a + (m.ans[i] === it.ans ? 1 : 0), 0);
  const bMarks = () => shortQs.map((x, i) => wGet(kB(i)).trim() ? marksOf(x.pts, m.ticks["B" + i]) : null);
  const scoreB = () => bMarks().filter(x => x !== null).sort((a, b) => b - a).slice(0, EXAM.shortAttempt).reduce((a, b) => a + b, 0);
  const scoreC = () => long ? long.parts.reduce((a, p, i) => a + marksOf(p[2], m.ticks["C" + i]), 0) : 0;
  const total = () => scoreA() + scoreB() + scoreC();

  const writeView = () => {
    const answeredB = shortQs.filter((x, i) => wGet(kB(i)).trim()).length; const sets = {}; let n = 0;
    v.innerHTML = `<div class="paper">
    <div class="mock-bar"><span class="timer num" id="timer">--:--</span><span class="chips" style="gap:6px"><a class="chip" href="#secA">A</a><a class="chip" href="#secB">B</a><a class="chip" href="#secC">C</a></span><span class="spacer"></span><button class="btn small primary" id="submitPaper">Submit</button></div>
    <header class="paper-head"><div class="dim" style="font-size:13px">${esc(PROGRAM.short || "")} · ${esc(SUBJ.name)}</div><h2 style="margin:4px 0">${esc(EXAM.title)}</h2><div class="row muted" style="font-size:14px"><span>Max. marks: <b>${EXAM.total}</b></span><span>Time: <b>${EXAM.minutes} min</b></span></div>
    <p class="p-ins">Attempt all of Section A. Attempt any <b>${EXAM.shortAttempt}</b> of Section B. Section C is compulsory. Use concepts, frameworks and examples from the case.</p></header>
    <section id="secA" class="psec"><h3>Section A <small>${T.A} marks · 1 mark each</small></h3>
    ${m.mcq.map((it, i) => { let pre = ""; if (it.set && !sets[it.set]) { sets[it.set] = 1; const cs = CASESETS.find(c => c.id === it.set); pre = `<div class="casebox"><h4>Case: ${esc(cs.title)}</h4>${esc(cs.text)}<p class="dim" style="margin:8px 0 0;font-size:13px">Answer the next ${cs.qs.length} questions based on this case.</p></div>`; } n++;
      return `${pre}<div class="pq"><div class="pq-t"><b>${n}.</b> ${qf(it.q)}</div><div class="opts">${it.opts.map((o, k) => `<button class="opt ${m.ans[i] === k ? "sel" : ""}" data-i="${i}" data-k="${k}"><span class="k">${"abcd"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div></div>`; }).join("")}</section>
    <section id="secB" class="psec"><h3>Section B <small>Answer any ${EXAM.shortAttempt} of ${shortQs.length} · ${EXAM.shortMarks} marks each</small></h3><p class="dim" id="bCount" style="font-size:13.5px">${answeredB} answered${answeredB > EXAM.shortAttempt ? `. Your best ${EXAM.shortAttempt} will count` : ""}</p>
    ${shortQs.map((x, i) => `<div class="pq"><div class="row" style="align-items:flex-start"><div class="pq-t" style="flex:1"><b>Q${i + 1}.</b> ${esc(x.q.replace(/\s*\(\d+ marks\)\s*$/, ""))}</div><span class="mk">${x.marks} marks</span></div><textarea data-w="${kB(i)}" placeholder="Your answer (aim for 120–200 words, in points)…">${esc(wGet(kB(i)))}</textarea><div class="wc dim" data-wc="${kB(i)}">${words(wGet(kB(i)))} words</div></div>`).join("")}</section>
    <section id="secC" class="psec"><h3>Section C <small>Compulsory · ${T.C} marks</small></h3>
    ${long ? `<div class="casebox"><h4>${esc(long.title)}</h4>${esc(long.text)}</div>${long.parts.map((p, i) => `<div class="pq"><div class="row" style="align-items:flex-start"><div class="pq-t" style="flex:1"><b>(${String.fromCharCode(97 + i)})</b> ${esc(p[0])}</div><span class="mk">${p[1]} marks</span></div><textarea data-w="${kC(i)}" class="tall" placeholder="Your answer…">${esc(wGet(kC(i)))}</textarea><div class="wc dim" data-wc="${kC(i)}">${words(wGet(kC(i)))} words</div></div>`).join("")}` : ""}</section>
    <button class="btn primary block" id="submitPaper2">Submit paper</button></div>`;
    $$(".opt[data-i]", v).forEach(b => b.onclick = () => { const i = +b.dataset.i; m.ans[i] = +b.dataset.k; persist(); $$(`.opt[data-i="${i}"]`, v).forEach(x => x.classList.toggle("sel", x === b)); });
    $$("textarea[data-w]", v).forEach(t => t.oninput = () => { wSet(t.dataset.w, t.value); $(`[data-wc="${t.dataset.w}"]`, v).textContent = words(t.value) + " words"; const a = shortQs.filter((x, i) => wGet(kB(i)).trim()).length; $("#bCount").textContent = `${a} answered${a > EXAM.shortAttempt ? `. Your best ${EXAM.shortAttempt} will count` : ""}`; });
    $$('a.chip[href^="#sec"]', v).forEach(a => a.onclick = e => { e.preventDefault(); $(a.getAttribute("href")).scrollIntoView({ behavior: "smooth", block: "start" }); });
    const sub = () => { const left = m.mcq.length - Object.keys(m.ans).length, b = shortQs.filter((x, i) => wGet(kB(i)).trim()).length; if (!confirm(`Submit your paper?${left ? `\n• ${left} MCQ${left > 1 ? "s" : ""} unanswered` : ""}${b < EXAM.shortAttempt ? `\n• Only ${b} of ${EXAM.shortAttempt} Section B answers written` : ""}`)) return; toMark(); };
    $("#submitPaper").onclick = sub; $("#submitPaper2").onclick = sub;
    clearInterval(tick); tick = setInterval(updTimer, 1000); updTimer();
  };
  const updTimer = () => { const t = $("#timer"); if (!t) return; const rem = (m.endsAt - Date.now()) / 1000; t.textContent = clock(rem); t.classList.toggle("warn", rem < 600); if (rem <= 0) { toast("Time's up. Paper submitted."); toMark(); } };
  const toMark = () => {
    clearInterval(tick); m.phase = "mark"; m.submittedAt = Date.now();
    shortQs.forEach((x, i) => m.ticks["B" + i] = suggest(x.pts, wGet(kB(i))));
    if (long) long.parts.forEach((p, i) => m.ticks["C" + i] = suggest(p[2], wGet(kC(i))));
    persist(); markView(); scrollTo(0, 0);
  };
  const markView = () => {
    const a = scoreA(), bm = bMarks();
    v.innerHTML = `<div class="paper">
    <div class="mock-bar"><span class="score-pill">Score <b class="num" id="liveTotal">${total()}</b>/${EXAM.total}</span><span class="spacer"></span><button class="btn small primary" id="finishMark">Finish marking</button></div>
    <h2>Mark your paper</h2><p class="muted">Section A is marked. For B and C, tick each point your answer actually covers. Points found in your answer are pre-ticked; untick anything you didn't really explain. Be honest: this is how the examiner reads it.</p>
    <section class="psec"><h3>Section A <small>${a}/${T.A}</small></h3><details><summary class="btn small">Review MCQs</summary>${m.mcq.map((it, i) => `<div class="review-item"><div class="q">${i + 1}. ${qf(it.q)}</div>${m.ans[i] === it.ans ? `<div class="a ok">✓ ${esc(it.c)}</div>` : `<div class="a no">✗ ${m.ans[i] === undefined ? "Not answered" : esc(it.opts[m.ans[i]])}</div><div class="a ok">Correct: ${esc(it.c)}</div>`}<div class="a muted">${esc(it.e)}</div></div>`).join("")}</details></section>
    <section class="psec"><h3>Section B <small id="bScore">${scoreB()}/${T.B} · best ${EXAM.shortAttempt} count</small></h3>
    ${shortQs.map((x, i) => { const txt = wGet(kB(i)); return `<div class="pq"><div class="pq-t"><b>Q${i + 1}.</b> ${esc(x.q)}</div>${txt.trim() ? `<div class="your">${esc(txt)}</div>${rubricHTML("B" + i, x.pts, m.ticks["B" + i] || [], suggest(x.pts, txt))}` : `<p class="dim">Not attempted</p>`}${modelHTML(x.pts)}</div>`; }).join("")}</section>
    ${long ? `<section class="psec"><h3>Section C <small id="cScore">${scoreC()}/${T.C}</small></h3><div class="casebox"><details><summary>Case: ${esc(long.title)} (tap to reread)</summary><div style="margin-top:8px">${esc(long.text)}</div></details></div>
    ${long.parts.map((p, i) => { const txt = wGet(kC(i)); return `<div class="pq"><div class="pq-t"><b>(${String.fromCharCode(97 + i)})</b> ${esc(p[0])} <span class="mk">${p[1]} marks</span></div>${txt.trim() ? `<div class="your">${esc(txt)}</div>${rubricHTML("C" + i, p[2], m.ticks["C" + i] || [], suggest(p[2], txt))}` : `<p class="dim">Not attempted</p>`}${modelHTML(p[2])}</div>`; }).join("")}</section>` : ""}
    <button class="btn primary block" id="finishMark2">Finish marking and save result</button></div>`;
    bindRubric(v, m.ticks, k => {
      persist(); $("#liveTotal").textContent = total(); $("#bScore").textContent = `${scoreB()}/${T.B} · best ${EXAM.shortAttempt} count`; const cs = $("#cScore"); if (cs) cs.textContent = `${scoreC()}/${T.C}`;
      const [sec, i] = [k[0], +k.slice(1)], pts = sec === "B" ? shortQs[i].pts : long.parts[i][2];
      const el = $(`[data-rtot="${k}"]`); if (el) el.textContent = `${marksOf(pts, m.ticks[k])}/${pts.reduce((x, p) => x + p[1], 0)}`;
    });
    $("#finishMark").onclick = $("#finishMark2").onclick = finish;
  };
  const finish = () => {
    const a = scoreA(), b = scoreB(), c = scoreC(), sc = Math.round((a + b + c) * 10) / 10, pct = Math.round(sc / EXAM.total * 100);
    const dur = Math.min(EXAM.minutes * 60, Math.round(((m.submittedAt || Date.now()) - m.startedAt) / 1000));
    m.mcq.forEach((it, i) => recordAnswer(it, m.ans[i] === it.ans, { unique: !it.set }));
    S.mockCount++; S.papers = (S.papers || 0) + 1; S.mockXp += pct; const newBest = pct > S.mockBest; S.mockBest = Math.max(S.mockBest, pct);
    const res = { score: sc, total: EXAM.total, pct, a, b, c, dur, ts: Date.now() };
    LS.set("cr_paper_last_" + SUBJ.id, res); m.phase = "done"; m.result = res; persist();
    fbUpdate({ [`attempts/${uid}/${Date.now().toString(36)}`]: { type: "exam", subj: SUBJ.id, score: sc, total: EXAM.total, pct, a, b, c, dur, ts: serverTimestamp() }, [`users/${uid}/mockCount`]: increment(1), [`users/${uid}/papers`]: increment(1), [`users/${uid}/mockXp`]: increment(pct), [`users/${uid}/mockBest`]: S.mockBest });
    syncLB(true); toast(newBest ? `New best: ${pct}%!` : `Saved · +${pct} XP`);
    doneView(); scrollTo(0, 0);
  };
  const doneView = () => {
    const r = m.result, T2 = examTotals(), band = r.pct >= 80 ? "Distinction level. Keep revising the weak parts." : r.pct >= 60 ? "First-division level. Push your written answers with more frameworks and case facts." : r.pct >= 40 ? "Pass level. Revise notes for weak topics and practise structured answers." : "Needs work. Start with notes and short answers, then retry.";
    v.innerHTML = `<div class="qwrap"><div class="qcard" style="text-align:center"><div class="muted">${esc(EXAM.title)}</div><div class="result-big num">${r.score}<small>/${r.total}</small></div><p style="margin:8px 0 4px;font-weight:700">${r.pct}% · ${fmtTime(r.dur)} used</p><p class="muted">${band}</p>
    <div class="row" style="justify-content:center"><button class="btn primary" id="newPaper">New paper</button><a class="btn" href="#ranks">Leaderboard</a></div></div>
    <div class="panel" style="margin-top:14px"><h3>By section</h3><div class="breakdown">${[["Section A · MCQs", r.a, T2.A], ["Section B · short answers", r.b, T2.B], ["Section C · case study", r.c, T2.C]].map(([l, x, t]) => `<div class="bd-row"><span>${l}</span><span class="num" style="text-align:right">${x}/${t}</span><div class="bar"><i style="width:${x / t * 100}%"></i></div></div>`).join("")}</div></div>
    <p class="muted" style="text-align:center"><a href="#" id="reviewPaper">Review your marked paper</a></p></div>`;
    $("#newPaper").onclick = () => { LS.set(paperKey(), buildExam()); vPaper(v); scrollTo(0, 0); };
    $("#reviewPaper").onclick = e => { e.preventDefault(); markView(); $$("[data-rk]", v).forEach(x => x.disabled = true); $("#finishMark").remove(); $("#finishMark2").remove(); };
  };
  cleanup = () => clearInterval(tick);
  if (m.phase === "write") { if (Date.now() >= m.endsAt) toMark(); else writeView(); } else if (m.phase === "mark") markView(); else doneView();
}

/* ================= seeded randomness (same questions for everyone) ================= */
function rngFrom(seed) { let a = typeof seed === "number" ? seed : [...String(seed)].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0), 2166136261); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const sshuffle = (arr, rnd) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function seededSet(seed, n) {
  const rnd = rngFrom(seed);
  return sshuffle(BANK, rnd).slice(0, n).map(q => { const opts = sshuffle([q.c, ...q.w], rnd); return { ...q, opts, ans: opts.indexOf(q.c) }; });
}
const bonus = (xp, fields = {}) => { S.bonusXp = (S.bonusXp || 0) + xp; const u = { [`users/${uid}/bonusXp`]: increment(xp) }; for (const [k, v] of Object.entries(fields)) { S[k] = (S[k] || 0) + v; u[`users/${uid}/${k}`] = increment(v); } fbUpdate(u); syncLB(); };
const shareLink = hash => new URL(location.pathname + hash, location.origin).href;
async function shareText(text, url) {
  if (navigator.share) { try { await navigator.share({ text, url }); return; } catch { } }
  location.href = "https://wa.me/?text=" + encodeURIComponent(text + " " + url);
}

/* ================= quiz battles ================= */
const BQ = 10, BQDUR = window.__BQDUR || 15000, BCOUNT = 4000;
const sNow = () => Date.now() + (window.__tOff || 0);
const BATTLE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const code5 = () => Array.from({ length: 5 }, () => BATTLE_ALPHABET[Math.floor(Math.random() * BATTLE_ALPHABET.length)]).join("");
const bScore = (ok, ms) => ok ? 100 + Math.round(50 * Math.max(0, BQDUR - ms) / BQDUR) : 0;
let battleUnsub = null;
function vBattle(v, p) {
  if (battleUnsub) { battleUnsub(); battleUnsub = null; }
  if (!BANK.length) { v.innerHTML = `<h2>Quiz battle</h2>` + comingSoon("Battles"); return; }
  if (p === "bot") return runBattle(v, { code: "BOT", bot: true, seed: Date.now(), subj: SUBJ.id });
  if (p) return joinBattle(v, p.toUpperCase());
  const W = S.wins || 0, P = S.battles || 0;
  v.innerHTML = `<div class="battle-hero"><div class="vs-art"><span>⚔️</span></div><h2>Quiz battle</h2><p class="muted">Play a quick 1v1 match or host a private room for up to 4 friends. Private rooms start only when the host is ready; everyone sees the same questions and countdown.</p>
  <div class="row" style="justify-content:center;gap:18px;margin:6px 0 4px"><span class="bstat"><b class="num">${P}</b>played</span><span class="bstat"><b class="num">${W}</b>won</span><span class="bstat"><b class="num">${P ? Math.round(W / P * 100) : 0}%</b>win rate</span></div></div>
  <div class="battle-actions">
    <button class="bcard b1" id="bQuick"><span class="bi">⚡</span><b>Quick match</b><span>Play anyone online right now</span></button>
    <button class="bcard b2" id="bCreate"><span class="bi">👥</span><b>Challenge a friend</b><span>Host a room for up to 4 players</span></button>
    <div class="bcard b3"><span class="bi">🔑</span><b>Join with a code</b><div class="row" style="margin-top:8px;flex-wrap:nowrap"><input class="field" id="bCode" maxlength="5" placeholder="ABCDE" style="margin:0;text-transform:uppercase;letter-spacing:.2em;font-size:18px"><button class="btn primary" id="bJoin">Join</button></div></div>
    <button class="bcard b4" id="bBot"><span class="bi">🤖</span><b>Practice vs bot</b><span>Works offline too</span></button>
  </div>
  ${!online ? `<p class="muted" style="text-align:center;font-size:13.5px">You're offline: only the bot is available right now.</p>` : ""}`;
  $("#bBot").onclick = () => { location.hash = "#battle/bot"; };
  $("#bCreate").onclick = () => createParty(v);
  $("#bQuick").onclick = () => quickMatch(v);
  $("#bJoin").onclick = () => { const c = $("#bCode").value.trim().toUpperCase(); if (c.length === 5) location.hash = "#battle/" + c; else toast("Enter the 5-letter code"); };
  $("#bCode").onkeydown = e => { if (e.key === "Enter") $("#bJoin").click(); };
}
async function createBattle(v, isPublic) {
  if (!online || !uid) return toast("You need to be online for live battles");
  const code = code5();
  try {
    await set(fbPath("battles/" + code), { subj: SUBJ.id, v: SUBJ.v || 1, seed: Math.floor(Math.random() * 1e9), host: uid, state: "waiting", created: serverTimestamp(), pub: !!isPublic, players: { [uid]: { name: S.name, score: 0 } } });
  } catch (e) {
    console.error("Could not create invitation", { code: e?.code, message: e?.message, error: e });
    const codeText = String(e?.code || "unknown");
    const details = /permission.denied/i.test(codeText) ? "Firebase blocked room creation. Publish the database.rules.json file in Firebase Realtime Database → Rules. GitHub uploads do not update Firebase rules." :
      /network|unavailable|disconnected/i.test(codeText) ? "Firebase could not be reached. Check your connection and retry." :
      /auth|credential|token/i.test(codeText) ? "Firebase login failed. Check that Anonymous authentication is enabled." :
      "Open browser Console for the underlying Firebase error.";
    v.innerHTML = `<div class="empty"><h3>Couldn't create a friend battle</h3><p>${esc(details)}</p><p class="muted" style="overflow-wrap:anywhere">Error: <code>${esc(codeText)}</code></p><button class="btn primary" id="battleTryAgain">Try again</button><a class="btn" href="#battle">Back to battles</a></div>`;
    $("#battleTryAgain").onclick = () => createBattle(v, isPublic);
    toast("Battle creation failed: " + codeText);
    return;
  }
  location.hash = "#battle/" + code;
  return code;
}
async function quickMatch(v) {
  if (!online || !uid) return toast("You need to be online for live battles");
  v.innerHTML = `<div class="battle-wait"><div class="spinner"></div><h3>Finding an opponent…</h3><p class="muted">Looking for someone studying ${esc(SUBJ.short)}.</p></div>`;
  let mine = null, found = null;
  const slot = fbPath("match/" + SUBJ.id);
  const newCode = code5();
  await runTransaction(slot, cur => {
    if (cur && cur.code && cur.uid !== uid && Date.now() - (cur.ts || 0) < 45000) { found = cur.code; return null; }
    found = null; return { code: newCode, uid, ts: Date.now() };
  }).catch(() => { });
  if (found) { location.hash = "#battle/" + found; return; }
  mine = newCode;
  await set(fbPath("battles/" + mine), { subj: SUBJ.id, v: SUBJ.v || 1, seed: Math.floor(Math.random() * 1e9), host: uid, state: "waiting", created: serverTimestamp(), pub: true, players: { [uid]: { name: S.name, score: 0 } } });
  location.hash = "#battle/" + mine;
}
async function joinBattle(v, code, tries = 0) {
  if (!online || !uid) {
    if (tries < 40 && navigator.onLine !== false) { v.innerHTML = `<div class="battle-wait"><div class="spinner"></div><h3>Connecting to the battle…</h3></div>`; setTimeout(() => { if (location.hash.toUpperCase() === ("#battle/" + code).toUpperCase()) joinBattle(v, code, tries + 1); }, 300); return; }
    v.innerHTML = `<div class="empty">Live battles need an internet connection. <a href="#battle/bot">Play the bot instead</a>.</div>`; return;
  }
  const snap = await get(fbPath("battles/" + code)); const b = snap.val();
  if (!b) { v.innerHTML = `<div class="empty"><h3>Battle ${esc(code)} not found</h3><p>Check the code, or start a new one.</p><a class="btn primary" href="#battle">Back to battles</a></div>`; return; }
  if (b.subj !== SUBJ.id) { const s2 = SUBJECTS.find(x => x.id === b.subj); if (s2) { toast(`This battle is in ${s2.short}. Switching…`); await loadSubject(b.subj); LS.set("cr_subject_chosen", true); } }
  if (b.mode === "party") return joinParty(v,code,b);
  if (b.host !== uid && b.guest !== uid) {
    if (b.guest || b.state !== "waiting") { v.innerHTML = `<div class="empty"><h3>This battle is already full or has started</h3><a class="btn primary" href="#battle">Start your own</a></div>`; return; }
    // Guest must claim its OWN child path. A multi-location update at battles/CODE
    // is rejected by Firebase rules because only the host can write that parent.
    // Transaction also stops two invitees from taking the same seat simultaneously.
    try {
      const claim = await runTransaction(fbPath("battles/" + code + "/guest"), current => current === null ? uid : undefined, { applyLocally: false });
      if (!claim.committed || claim.snapshot.val() !== uid) {
        v.innerHTML = `<div class="empty"><h3>Someone joined first</h3><p>This room is full. Ask your friend for another invitation.</p><a class="btn primary" href="#battle">Back to battles</a></div>`; return;
      }
      await set(fbPath(`battles/${code}/players/${uid}`), { name: S.name || "Player", score: 0 });
      await set(fbPath(`battles/${code}/startAt`), sNow() + BCOUNT);
      await set(fbPath(`battles/${code}/state`), "playing");
      if (b.pub) runTransaction(fbPath("match/" + b.subj), cur => (cur && cur.code === code ? null : cur)).catch(() => {});
    } catch (e) {
      console.error("Could not join invitation", e);
      v.innerHTML = `<div class="empty"><h3>Could not join this battle</h3><p>The connection or Firebase permissions prevented joining. Please try again.</p><button class="btn primary" id="bRetry">Retry joining</button><a class="btn" href="#battle">Back to battles</a></div>`;
      $("#bRetry").onclick = () => joinBattle(v, code);
      return;
    }
  }
  runBattle(v, { code });
}
function runBattle(v, opt) {
  const code = opt.code, isBot = !!opt.bot;
  let room = isBot ? { subj: SUBJ.id, seed: opt.seed, host: uid || "me", guest: "bot", state: "playing", startAt: sNow() + BCOUNT, players: { [uid || "me"]: { name: S.name || "You", score: 0 }, bot: { name: "Boardroom Bot 🤖", score: 0 } } } : null;
  const me = uid || "me"; let qs = null, myAns = {}, tick = null, awarded = false, botPlan = null, finished = false;
  const ensureQs = () => { if (!qs && room) qs = seededSet("battle:" + room.seed, Math.min(BQ, BANK.length)); };
  const opp = () => Object.keys(room.players || {}).find(k => k !== me);
  const answer = (i, k) => {
    if (myAns[i] !== undefined) return; const ms = sNow() - (room.startAt + i * BQDUR); if (ms < 0 || ms > BQDUR) return;
    const ok = k === qs[i].ans, pts = bScore(ok, ms); myAns[i] = { k, ms, ok, pts };
    const total = Object.values(myAns).reduce((a, x) => a + x.pts, 0);
    room.players[me].score = total; room.players[me].ans = { ...(room.players[me].ans || {}), [i]: { k, ms, ok } };
    if (!isBot) fbUpdate({ [`battles/${code}/players/${me}/ans/${i}`]: { k, ms, ok }, [`battles/${code}/players/${me}/score`]: total });
    recordAnswer(qs[i], ok); draw();
  };
  const draw = () => {
    if (!room) return;
    ensureQs();
    if (finished) return; const now = sNow(), o = opp(), P = room.players || {};
    if (room.state === "waiting") {
      const link = shareLink("#battle/" + code);
      v.innerHTML = `<div class="battle-wait"><div class="spinner"></div><h3>${room.pub ? "Waiting for an opponent…" : "Waiting for your friend"}</h3>
      ${room.pub ? `<p class="muted">If nobody joins in a minute, play the bot or share a code.</p>` : `<p class="muted">Share this code. The battle starts as soon as they join.</p>`}
      <div class="room-code num">${esc(code)}</div>
      <div class="row" style="justify-content:center"><button class="btn primary" id="bShare">Share on WhatsApp</button><button class="btn" id="bCopy">Copy link</button></div>
      <div class="row" style="justify-content:center;margin-top:12px"><a class="btn ghost small" href="#battle/bot">Play the bot instead</a><button class="btn ghost small" id="bCancel">Cancel</button></div></div>`;
      $("#bShare").onclick = () => shareText(`⚔️ ${S.name} challenged you to a ${SUBJ.short} quiz battle on Boardroom! Code: ${code}`, link);
      $("#bCopy").onclick = async () => { try { if (!navigator.clipboard?.writeText) throw Error("Clipboard unavailable"); await navigator.clipboard.writeText(link); toast("Invite link copied"); } catch { window.prompt("Copy this invitation link:", link); } };
      $("#bCancel").onclick = () => { if (!isBot && room.host === me) { set(fbPath("battles/" + code), null).catch(() => { }); runTransaction(fbPath("match/" + SUBJ.id), cur => (cur && cur.code === code ? null : cur)).catch(() => { }); } location.hash = "#battle"; };
      return;
    }
    const t = now - room.startAt, i = Math.floor(t / BQDUR), N = qs.length;
    const meP = P[me] || { name: "You", score: 0 }, oP = P[o] || { name: "Opponent", score: 0 };
    const scoreBar = `<div class="vs-bar"><div class="vs-p me"><span class="vs-av">${esc(initials(meP.name))}</span><span><b>You</b><span class="num">${meP.score || 0}</span></span></div><div class="vs-mid">VS</div><div class="vs-p op"><span><b>${esc((oP.name || "").split(" ")[0])}</b><span class="num">${oP.score || 0}</span></span><span class="vs-av">${esc(initials(oP.name))}</span></div></div>`;
    if (t < 0) { v.__bkey = null; v.innerHTML = `<div class="battle">${scoreBar}<div class="countdown-big num">${Math.ceil(-t / 1000)}</div><p class="muted" style="text-align:center">Get ready. ${N} questions, ${BQDUR / 1000}s each.</p></div>`; return; }
    if (i >= N) return finish();
    const q = qs[i], mine = myAns[i], left = Math.max(0, BQDUR - (t - i * BQDUR)), oAns = (oP.ans || {})[i];
    const key = [i, mine ? mine.k : "-", oAns ? 1 : 0, meP.score || 0, oP.score || 0].join(":");
    if (v.__bkey === key && $("#bTime", v)) { $("#bTime", v).style.width = (left / BQDUR * 100) + "%"; $("#bSec", v).textContent = Math.ceil(left / 1000) + "s"; return; }
    v.__bkey = key;
    v.innerHTML = `<div class="battle">${scoreBar}
    <div class="qhead"><span class="num">Q${i + 1}/${N}</span><div class="bar timebar"><i id="bTime" style="width:${left / BQDUR * 100}%"></i></div><span class="num" id="bSec">${Math.ceil(left / 1000)}s</span></div>
    <div class="qcard"><div class="qtopic">${esc(NOTE[q.t]?.title || "")}</div><div class="qtext">${qf(q.q)}</div>
    <div class="opts">${q.opts.map((x, k) => `<button class="opt ${mine ? (k === q.ans ? "right" : k === mine.k ? "wrong" : "") : ""}" data-k="${k}" ${mine ? "disabled" : ""}><span class="k">${"ABCD"[k]}</span><span>${esc(x)}</span></button>`).join("")}</div>
    <div class="bstatus">${mine ? (mine.ok ? `<b class="ok">+${mine.pts}</b> correct` : `<b class="no">0</b> wrong`) : "Tap your answer"} · ${oAns ? `${esc((oP.name || "Opponent").split(" ")[0])} has answered` : `${esc((oP.name || "Opponent").split(" ")[0])} is thinking…`}</div></div></div>`;
    $$(".opt", v).forEach(b => b.onclick = () => answer(i, +b.dataset.k));
  };
  const finish = () => {
    clearInterval(tick); finished = true; const o = opp(), P = room.players, my = P[me]?.score || 0, th = P[o]?.score || 0, win = my > th, tie = my === th;
    if (!awarded) { awarded = true; const done = LS.get("cr_battles_done", {}); if (!done[code + room.seed]) { done[code + room.seed] = 1; LS.set("cr_battles_done", done); bonus(win ? 40 : tie ? 20 : 10, { battles: 1, wins: win ? 1 : 0 }); } if (!isBot && room.host === me) fbUpdate({ [`battles/${code}/state`]: "done" }); }
    const rows = qs.map((q, i) => { const a = (P[me].ans || {})[i], b = (P[o]?.ans || {})[i]; return `<div class="review-item"><div class="q">${i + 1}. ${qf(q.q)}</div><div class="a ok">✓ ${esc(q.c)}</div><div class="a"><span class="${a?.ok ? "ok" : "no"}">You: ${a ? (a.ok ? "right" : "wrong") + ` (${(a.ms / 1000).toFixed(1)}s)` : "no answer"}</span> · <span class="${b?.ok ? "ok" : "no"}">${esc((P[o]?.name || "").split(" ")[0])}: ${b ? (b.ok ? "right" : "wrong") : "no answer"}</span></div></div>`; }).join("");
    v.innerHTML = `<div class="battle"><div class="qcard battle-result ${win ? "won" : tie ? "tie" : "lost"}"><div class="br-emoji">${win ? "🏆" : tie ? "🤝" : "💪"}</div><h2>${win ? "You won!" : tie ? "It's a tie" : "Good fight"}</h2>
    <div class="br-score num"><span>${my}</span><small>vs</small><span>${th}</span></div><p class="muted">${win ? "+40 XP" : tie ? "+20 XP" : "+10 XP. Review the misses and rematch"}</p>
    <div class="row" style="justify-content:center"><button class="btn primary" id="bAgain">${isBot ? "Play again" : "New battle"}</button>${!isBot ? `<button class="btn" id="bShareRes">Share result</button>` : ""}<a class="btn ghost" href="#battle">Battle home</a></div></div>
    <div class="panel" style="margin-top:14px"><h3>Answers</h3>${rows}</div></div>`;
    $("#bAgain").onclick = () => { if (isBot) { location.hash = "#battle"; setTimeout(() => location.hash = "#battle/bot", 30); } else createBattle(v, false); };
    const sr = $("#bShareRes"); if (sr) sr.onclick = () => shareText(`${win ? "🏆 I beat" : tie ? "🤝 I tied with" : "⚔️ I battled"} ${(P[o]?.name || "a friend").split(" ")[0]} ${my}–${th} in a ${SUBJ.short} quiz battle on Boardroom. Think you can beat me?`, shareLink("#battle"));
  };
  if (isBot) {
    ensureQs(); botPlan = qs.map(() => ({ ms: 2500 + Math.random() * 9000, ok: Math.random() < .62 }));
    tick = setInterval(() => {
      const t = sNow() - room.startAt, i = Math.floor(t / BQDUR);
      if (i >= 0 && i < qs.length) { const pl = botPlan[i], bp = room.players.bot; bp.ans = bp.ans || {}; if (!bp.ans[i] && t - i * BQDUR >= pl.ms) { const k = pl.ok ? qs[i].ans : (qs[i].ans + 1 + Math.floor(Math.random() * 3)) % 4; bp.ans[i] = { k, ms: pl.ms, ok: pl.ok }; bp.score = (bp.score || 0) + bScore(pl.ok, pl.ms); } }
      draw();
    }, 250);
  } else {
    battleUnsub = onValue(fbPath("battles/" + code), s => { const val = s.val(); if (!val) { if (room) { clearInterval(tick); v.innerHTML = `<div class="empty"><h3>This battle was cancelled</h3><a class="btn primary" href="#battle">Back to battles</a></div>`; } return; } room = val; room.players = room.players || {}; room.players[me] = room.players[me] || { name: S.name, score: 0 }; draw(); });
    tick = setInterval(() => { if (room && room.state !== "waiting") draw(); }, 250);
  }
  cleanup = () => { clearInterval(tick); if (battleUnsub) { battleUnsub(); battleUnsub = null; } };
  draw();
}

/* Private party battles: separate from legacy quick-match and offline bot. */
const PARTY_ROUND = 10000, PARTY_REVEAL = 3500;
const partySettings = r => ({ count: Number(r.count)||10, duration: [10000,15000,20000].includes(Number(r.duration))?Number(r.duration):10000, maxPlayers: Math.min(4,Math.max(2,Number(r.maxPlayers)||4)), scoring: r.scoring === 'classic' ? 'classic' : 'speed' });
const partyPoints = (a,q,d,mode) => !a || a.k!==q.ans ? 0 : mode === 'classic' ? 100 : 100+Math.round(100*Math.max(0,1-Math.min(d,Math.max(0,a.ms))/d));
const partyName = () => (S.name || "").trim().slice(0, 40);
async function createParty(v) {
  if (!online || !uid) return toast("Connect to Firebase to host a party");
  if (!partyName()) return partyAskName(v, () => createParty(v));
  v.innerHTML = `<div class="party-setup panel"><h2>Host a private battle</h2><p class="muted">Set your rules, invite friends and start when everyone is ready.</p><div class="party-settings-grid"><div><label for="partyCount">Questions</label><select class="field" id="partyCount">${[5,10,15,20,30].map(n=>`<option value="${n}" ${n===10?'selected':''}>${n} questions</option>`).join('')}</select></div><div><label for="partyMax">Players</label><select class="field" id="partyMax">${[2,3,4].map(n=>`<option value="${n}" ${n===4?'selected':''}>${n} players</option>`).join('')}</select></div><div><label for="partyDuration">Answer time</label><select class="field" id="partyDuration">${[10,15,20].map(n=>`<option value="${n}">${n} seconds</option>`).join('')}</select></div><div><label for="partyScoring">Scoring</label><select class="field" id="partyScoring"><option value="speed">Speed bonus</option><option value="classic">Classic (100/correct)</option></select></div></div><p class="muted">Answers reveal for 3.5 seconds after each round. The host alone starts the match.</p><button class="btn primary" id="partyMake">Create room</button><a class="btn ghost" href="#battle">Back</a></div>`;
  $("#partyMake",v).onclick = async () => {
    const n = Math.min(BANK.length, Number($("#partyCount",v).value));
    const btn = $("#partyMake",v); btn.disabled=true; btn.textContent="Creating…";
    const code = code5();
    try {
      await set(fbPath("battles/"+code), {mode:"party",subj:SUBJ.id,v:SUBJ.v||1,seed:Math.floor(Math.random()*1e9),host:uid,state:"waiting",created:serverTimestamp(),count:n,duration:Number($("#partyDuration",v).value)*1000,maxPlayers:Number($("#partyMax",v).value),scoring:$("#partyScoring",v).value,round:1,reveal:PARTY_REVEAL,pub:false,seats:{0:uid},players:{[uid]:{name:partyName(),score:0}}});
      location.hash="#battle/"+code;
    } catch(e) { console.error("Party creation failed",e); toast("Could not create room: "+(e.code||e.message)); btn.disabled=false;btn.textContent="Create room"; }
  };
}
function partyAskName(v, next) {
  v.innerHTML=`<div class="battle-wait panel"><h2>What's your player name?</h2><p class="muted">Your name will appear in the lobby and scoreboard.</p><input class="field" id="partyPlayerName" maxlength="40" placeholder="Your name" autocomplete="nickname"><button class="btn primary" id="partySaveName">Continue</button></div>`;
  $("#partySaveName",v).onclick=async()=>{
    const name=$("#partyPlayerName",v).value.trim().replace(/\s+/g," ");
    if(name.length<3||name.length>40) return toast("Enter a name (3–40 characters)");
    S.name=name;save();renderTopbar();
    if(online&&uid) {
      await set(fbPath("names/"+uid),name).catch(()=>{});
      fbUpdate({[`users/${uid}/name`]:name});
    }
    next();
  };
}
async function joinParty(v, code, first) {
  if (!partyName()) return partyAskName(v,()=>joinParty(v,code,first));
  if(first.host!==uid && !Object.values(first.seats||{}).includes(uid)) {
    if(first.state!=="waiting") return partyError(v,"This room has already started. Ask the host to invite you to the next match.");
    let claimed=false;
    for(let seat=1;seat<partySettings(first).maxPlayers;seat++) {
      const path=fbPath(`battles/${code}/seats/${seat}`);
      try {
        const res=await runTransaction(path,old=>old===null?uid:undefined,{applyLocally:false});
        if(res.committed && res.snapshot.val()===uid) {claimed=true;break;}
      }catch(e){console.warn("Seat claim failed",e); if(e.code==="PERMISSION_DENIED")return partyError(v,"Firebase rules blocked joining. Publish the included database.rules.json rules and try again.");}
    }
    if(!claimed)return partyError(v,"This battle room is full.");
  }
  try{await set(fbPath(`battles/${code}/players/${uid}/name`),partyName());}
  catch(e){return partyError(v,"Could not save your player name: "+(e.code||e.message));}
  partySession(v,code);
}
function partyError(v,message){v.innerHTML=`<div class="empty"><h3>Unable to join</h3><p>${esc(message)}</p><a class="btn primary" href="#battle">Back to battles</a></div>`;}
function partySession(v,code){
  let room=null,tick=null,lastKey='',closed=false,answerPending={},awardedRound=null;
  const me=uid;
  const seats=()=>Object.entries(room?.seats||{}).sort((a,b)=>Number(a[0])-Number(b[0])).map(([,id])=>id);
  const members=()=>seats().filter(id=>room?.players?.[id]);
  const setView=html=>{v.innerHTML=html;};
  const render=()=>{
    if(!room||closed)return;
    const ids=members(),P=room.players||{},host=room.host===me,settings=partySettings(room),round=Number(room.round)||1;
    if(room.state==='waiting'){
      const key='lobby:'+JSON.stringify(ids.map(id=>[id,P[id]?.name]))+JSON.stringify(settings)+round;
      if(key===lastKey)return;lastKey=key;
      const link=shareLink('#battle/'+code);
      setView(`<section class="party-lobby"><div class="party-heading"><span>🎮 BOARDROOM ARENA</span><h2>Room <strong>${esc(code)}</strong></h2><p>${host?'You are the host. Share the invite, then start when everyone has joined.':'Waiting for the host to start. You can minimize this screen safely.'}</p></div><div class="party-players">${Array.from({length:settings.maxPlayers},(_,i)=>{const id=room.seats?.[i],p=id&&P[id];return `<div class="party-seat ${p?'filled':''}"><span class="party-avatar">${p?esc(initials(p.name)):'+'}</span><div><b>${p?esc(p.name):'Open seat'}</b><small>${i===0?'👑 Host':p?(id===me?'You':'Joined'):'Invite a friend'}</small></div></div>`}).join('')}</div><p class="party-meta">${ids.length}/${settings.maxPlayers} players · ${settings.count} questions · ${settings.duration/1000}s per question · ${settings.scoring==='classic'?'Classic':'Speed'} scoring</p><div class="party-buttons"><button class="btn primary" id="partyShare">Share invite</button><button class="btn" id="partyCopy">Copy link</button>${host?`<button class="btn primary" id="partyStart" ${ids.length<2?'disabled':''}>Start match (${ids.length}/${settings.maxPlayers})</button>`:''}<a class="btn ghost" href="#battle">Leave lobby</a></div></section>`);
      $('#partyShare',v).onclick=()=>shareText(`🎮 Join ${partyName()}'s Boardroom battle! Room ${code} · ${settings.maxPlayers} players.`,link);
      $('#partyCopy',v).onclick=async()=>{try{await navigator.clipboard.writeText(link);toast('Battle link copied');}catch{window.prompt('Copy battle link',link);}};
      if(host)$('#partyStart',v).onclick=async()=>{
        if(members().length<2)return toast('At least two players required');
        const btn=$('#partyStart',v);btn.disabled=true;
        try{const result=await runTransaction(fbPath(`battles/${code}/state`),state=>state==='waiting'?'playing':undefined,{applyLocally:false});if(!result.committed)throw Error('Room was already started');await set(fbPath(`battles/${code}/startAt`),sNow()+3500);}
        catch(e){toast('Could not start: '+(e.code||e.message));btn.disabled=false;}
      };
      return;
    }
    if(room.state==='rematch'){
      const votes=room.rematchVotes||{},allReady=ids.every(id=>!!votes[id]);
      const key='rematch:'+JSON.stringify(ids.map(id=>[id,P[id]?.name,!!votes[id]]))+':'+round;
      if(key!==lastKey){lastKey=key;setView(`<section class="party-lobby"><div class="party-heading"><span>🔁 REMATCH LOBBY</span><h2>Same friends, new game</h2><p>Every player must tap Ready. Only the host can start the rematch.</p></div><div class="party-players">${ids.map(id=>`<div class="party-seat filled"><span class="party-avatar">${esc(initials(P[id]?.name||'P'))}</span><div><b>${esc(P[id]?.name||'Player')}</b><small>${votes[id]?'✅ Ready':'⌛ Waiting'}${id===room.host?' · Host':''}</small></div></div>`).join('')}</div><div class="party-buttons"><button class="btn primary" id="partyReady" ${votes[me]?'disabled':''}>${votes[me]?'You are ready':'Ready for rematch'}</button>${host?`<button class="btn primary" id="partyRestart" ${!allReady?'disabled':''}>Start rematch</button>`:''}<a class="btn ghost" href="#battle">Leave room</a></div></section>`);
        const ready=$('#partyReady',v);ready.onclick=async()=>{ready.disabled=true;try{await set(fbPath(`battles/${code}/rematchVotes/${me}`),true);}catch(e){toast('Could not ready up: '+(e.code||e.message));ready.disabled=false;}};
        if(host)$('#partyRestart',v).onclick=async()=>{if(!members().every(id=>room.rematchVotes?.[id]))return;const btn=$('#partyRestart',v);btn.disabled=true;try{await update(fbPath(`battles/${code}`),{seed:Math.floor(Math.random()*1e9),round:round+1,state:'playing',startAt:sNow()+4000,rematchVotes:null,players:Object.fromEntries(ids.map(id=>[id,{name:P[id]?.name||'Player',score:0}]))});}catch(e){toast('Rematch failed: '+(e.code||e.message));btn.disabled=false;}};
      }
      return;
    }
    const qs=seededSet('battle:'+room.seed,Math.min(settings.count,BANK.length));
    const step=settings.duration+PARTY_REVEAL;
    if(room.startAt == null || !Number.isFinite(Number(room.startAt)))return;
    const elapsed=sNow()-room.startAt,idx=Math.floor(Math.max(0,elapsed)/step),offset=elapsed-idx*step;
    const scoreOf=id=>qs.reduce((sum,q,i)=>{const a=P[id]?.ans?.[i];return sum+partyPoints(a,q,settings.duration,settings.scoring)},0);
    const scoreboard=`<div class="party-scoreboard">${ids.map(id=>`<div class="party-score ${id===me?'mine':''}"><span>${esc(P[id]?.name||'Player')}${id===room.host?' 👑':''}</span><b class="num">${scoreOf(id)}</b></div>`).join('')}</div>`;
    if(elapsed<0){const sec=Math.ceil(-elapsed/1000),key='count:'+round+':'+sec;if(key===lastKey)return;lastKey=key;setView(`<div class="party-arena">${scoreboard}<h2>Get ready!</h2><div class="countdown-big num">${sec}</div><p>All players get the same questions and timer</p></div>`);return;}
    if(idx>=qs.length){
      const ranking=ids.slice().sort((a,b)=>scoreOf(b)-scoreOf(a)),top=scoreOf(ranking[0]);const winners=ranking.filter(id=>scoreOf(id)===top),win=winners.includes(me),tie=winners.length>1;
      if(awardedRound!==round){awardedRound=round;const done=LS.get('cr_battles_done',{}),dk=code+':'+round+':'+room.seed;if(!done[dk]){done[dk]=1;LS.set('cr_battles_done',done);bonus(win?(tie?20:40):10,{battles:1,wins:win&&!tie?1:0});}}
      const key='complete:'+round+':'+JSON.stringify(ranking.map(id=>scoreOf(id)));if(key===lastKey)return;lastKey=key;
      const rankOf=id=>1+ranking.filter(other=>scoreOf(other)>scoreOf(id)).length;
      setView(`<div class="party-arena party-finish"><div class="party-trophy">🏆</div><h2>${tie?'It’s a tie!':win?'You won!':esc(P[winners[0]]?.name||'Player')+' wins!'}</h2><p>Match ${round} · Final standings</p><div class="party-podium">${ranking.map(id=>`<div class="party-podium-card rank-${Math.min(4,rankOf(id))} ${id===me?'mine':''}"><div class="party-medal">${['🥇','🥈','🥉','🎖️'][Math.min(3,rankOf(id)-1)]}</div><div class="party-avatar">${esc(initials(P[id]?.name||'P'))}</div><strong>${esc(P[id]?.name||'Player')}</strong><b>${scoreOf(id)} pts</b><small>${rankOf(id)===1?'Champion':'Rank #'+rankOf(id)}</small></div>`).join('')}</div><p class="muted">${settings.scoring==='classic'?'Every correct answer earns 100 points.':'Fast correct answers earn more points.'}</p><div class="party-buttons">${host?'<button class="btn primary" id="partyRematch">Offer rematch</button>':'<p class="muted">The host can offer a rematch.</p>'}<a class="btn ghost" href="#battle">Battle home</a></div></div>`);
      if(host)$('#partyRematch',v).onclick=async()=>{const btn=$('#partyRematch',v);btn.disabled=true;try{await update(fbPath(`battles/${code}`),{state:'rematch',rematchVotes:{}});}catch(e){toast('Cannot offer rematch: '+(e.code||e.message));btn.disabled=false;}};
      return;
    }
    const q=qs[idx],reveal=offset>=settings.duration,remaining=Math.max(0,(reveal?step:settings.duration)-offset),mine=P[me]?.ans?.[idx];
    const key=`q:${round}:${idx}:${reveal}:${mine?.k??'_'}:${ids.map(id=>P[id]?.ans?.[idx]?.k??'_').join(',')}`;
    if(key===lastKey){const el=$('#partySeconds',v);if(el)el.textContent=(remaining/1000).toFixed(1)+'s';const bar=$('#partyClock',v);if(bar)bar.style.width=(remaining/(reveal?PARTY_REVEAL:settings.duration)*100)+'%';return;}
    lastKey=key;
    setView(`<div class="party-arena">${scoreboard}<div class="qhead"><span>Question ${idx+1}/${qs.length}</span><div class="bar timebar"><i id="partyClock" style="width:${remaining/(reveal?PARTY_REVEAL:settings.duration)*100}%"></i></div><span id="partySeconds">${(remaining/1000).toFixed(1)}s</span></div><p class="party-phase">${reveal?'✅ Answers revealed':'⚡ Lock in your answer'}</p><div class="qcard"><div class="qtext">${qf(q.q)}</div><div class="opts">${q.opts.map((o,k)=>`<button class="opt ${reveal&&k===q.ans?'right':reveal&&mine?.k===k?'wrong':mine?.k===k?'party-picked':''}" data-choice="${k}" ${reveal||mine?'disabled':''}><span class="k">${'ABCD'[k]}</span><span>${esc(o)}</span></button>`).join('')}</div>${reveal?`<p class="party-correct">Correct answer: ${esc(q.c)}</p>`:''}</div><div class="party-choices">${ids.map(id=>{const a=P[id]?.ans?.[idx],p=P[id];return `<div><span>${esc(p.name)}${id===me?' (you)':''}</span><b>${reveal?(a?`${'ABCD'[a.k]} · +${partyPoints(a,q,settings.duration,settings.scoring)} pts`:'No answer'):(a?'✓ Locked in':'Thinking…')}</b></div>`}).join('')}</div></div>`);
    if(!reveal&&!mine)$$('[data-choice]',v).forEach(el=>el.onclick=async()=>{
      const k=Number(el.dataset.choice),ms=Math.max(0,sNow()-(room.startAt+idx*step)),answerKey=round+':'+idx;
      if(ms>=settings.duration||answerPending[answerKey])return;
      answerPending[answerKey]=true;
      try{const result=await runTransaction(fbPath(`battles/${code}/players/${me}/ans/${idx}`),old=>old===null?{k,ms}:undefined,{applyLocally:false});if(result.committed)recordAnswer(q,k===q.ans);}
      catch(e){delete answerPending[answerKey];toast('Answer not saved: '+(e.code||e.message));}
    });
  };
  battleUnsub=onValue(fbPath('battles/'+code),s=>{if(closed)return;room=s.val();if(!room){partyError(v,'This room was closed or deleted.');return;}render();},e=>partyError(v,'Firebase: '+(e.code||e.message)));
  tick=setInterval(render,120);
  cleanup=()=>{closed=true;clearInterval(tick);if(battleUnsub){battleUnsub();battleUnsub=null;}};
}

/* ================= daily challenge ================= */
const DAILY_N = 5;
function vDaily(v) {
  if (!BANK.length) { v.innerHTML = `<h2>Daily challenge</h2>` + comingSoon("The daily challenge"); return; }
  const d = today(), key = SUBJ.id + "_" + d, done = (S.dailyDone || {})[key];
  const qs = seededSet("daily:" + SUBJ.id + ":" + d, Math.min(DAILY_N, BANK.length));
  const board = async () => {
    const el = $("#dBoard"); if (!el) return;
    if (!online) { el.innerHTML = `<p class="muted">Today's ranking needs an internet connection.</p>`; return; }
    try { const s = await get(fbPath(`daily/${SUBJ.id}/${d}`)); const rows = Object.entries(s.val() || {}).map(([id, r]) => ({ id, ...r })).sort((a, b) => b.score - a.score || a.ms - b.ms);
      el.innerHTML = rows.length ? `<div class="lb-list">${rows.slice(0, 15).map((r, k) => `<div class="lb-row ${r.id === uid ? "me" : ""}"><span class="rk">${k + 1}</span><span class="nm">${esc(r.name || "")}${r.id === uid ? " (you)" : ""}</span><span class="val num">${r.score}/${DAILY_N}<small>${(r.ms / 1000).toFixed(1)}s</small></span></div>`).join("")}</div>` : `<p class="muted">Nobody has played today yet. Be first!</p>`;
    } catch { el.innerHTML = `<p class="muted">Couldn't load today's ranking.</p>`; }
  };
  if (done) {
    v.innerHTML = `<h2>Daily challenge</h2><div class="daily-done"><div class="br-emoji">${done.score === DAILY_N ? "🌟" : "✅"}</div><h3>You scored ${done.score}/${DAILY_N} today</h3><p class="muted">in ${(done.ms / 1000).toFixed(1)} seconds. A new challenge unlocks at midnight.</p>
    <div class="row" style="justify-content:center"><button class="btn primary" id="dShare">Challenge friends</button><a class="btn" href="#battle">Play a battle</a></div></div>
    <div class="section-head"><h2>Today's ranking</h2></div><div id="dBoard"><p class="muted">Loading…</p></div>`;
    $("#dShare").onclick = () => shareText(`📅 I got ${done.score}/${DAILY_N} in today's ${SUBJ.short} daily challenge on Boardroom in ${(done.ms / 1000).toFixed(0)}s. Beat that!`, shareLink("#daily"));
    board(); return;
  }
  v.innerHTML = `<h2>Daily challenge</h2><div class="daily-intro"><div class="br-emoji">📅</div><h3>${DAILY_N} questions · same for everyone today</h3><p class="muted">One attempt per day. Ranked by score, then speed. +10 XP for playing, +10 more for a perfect 5.</p><button class="btn primary" id="dGo">Start today's challenge</button></div>
  <div class="section-head"><h2>Today's ranking</h2></div><div id="dBoard"><p class="muted">Loading…</p></div>`;
  board();
  $("#dGo").onclick = () => {
    let i = 0, score = 0; const t0 = Date.now();
    const draw = () => {
      const q = qs[i];
      v.innerHTML = `<div class="qwrap"><div class="qhead"><span class="num">${i + 1}/${qs.length}</span><div class="bar"><i style="width:${i / qs.length * 100}%"></i></div><span class="num" id="dClock">0.0s</span></div>
      <div class="qcard"><div class="qtopic">${esc(NOTE[q.t]?.title || "")}</div><div class="qtext">${qf(q.q)}</div><div class="opts">${q.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div><div id="exp"></div></div></div>`;
      $$(".opt", v).forEach(b => b.onclick = () => {
        const k = +b.dataset.k, ok = k === q.ans; if (ok) score++;
        $$(".opt", v).forEach((x, j) => { x.disabled = true; if (j === q.ans) x.classList.add("right"); else if (j === k) x.classList.add("wrong"); });
        $("#exp").innerHTML = `<div class="explain"><b class="${ok ? "ok" : "no"}">${ok ? "Correct." : "Not quite."}</b> ${esc(q.e)}</div>`;
        recordAnswer(q, ok);
        setTimeout(() => { i++; if (i < qs.length) draw(); else end(); }, ok ? 900 : 2200);
      });
    };
    const clk = setInterval(() => { const c = $("#dClock"); if (c) c.textContent = ((Date.now() - t0) / 1000).toFixed(1) + "s"; }, 100);
    cleanup = () => clearInterval(clk);
    const end = () => {
      clearInterval(clk); const ms = Date.now() - t0;
      S.dailyDone = S.dailyDone || {}; S.dailyDone[key] = { score, ms };
      fbUpdate({ [`users/${uid}/dailyDone/${key}`]: { score, ms }, [`daily/${SUBJ.id}/${d}/${uid}`]: { score, ms, name: S.name, ts: serverTimestamp() } });
      bonus(10 + (score === qs.length ? 10 : 0), { dailies: 1 });
      toast(score === qs.length ? "Perfect! +20 XP" : `+10 XP · ${score}/${qs.length}`);
      vDaily(v);
    };
    draw();
  };
}

/* ================= flashcards (spaced repetition) ================= */
const BOX_DAYS = [0, 1, 2, 4, 8, 16, 32];
const dayNum = () => Math.floor((Date.now() + 5.5 * 3600000) / 86400000);
let cardTopic = "";
function vCards(v, p) {
  const all = (SD.cards || []).map(c => ({ id: hash("c" + c[1]), t: c[0], f: c[1], b: c[2] }));
  if (!all.length) { v.innerHTML = `<h2>Flashcards</h2>` + comingSoon("Flashcards"); return; }
  if (p && p.startsWith("t:")) cardTopic = p.slice(2); else if (p === "all") cardTopic = "";
  S.cards = S.cards || {};
  const pool = all.filter(c => !cardTopic || c.t === cardTopic), dn = dayNum();
  const due = pool.filter(c => S.cards[c.id] && S.cards[c.id].d <= dn), fresh = pool.filter(c => !S.cards[c.id]);
  const mastered = pool.filter(c => (S.cards[c.id]?.b || 0) >= 4).length;
  let queue = shuffle(due).concat(fresh.slice(0, 20));
  const topics = [...new Set(all.map(c => c.t))];
  const head = `<div class="row" style="align-items:baseline"><h2 style="margin:0">Flashcards</h2><span class="spacer"></span><span class="muted num" style="font-size:14px">${mastered}/${pool.length} mastered</span></div>
  <p class="muted">Tap to flip. Swipe right (or "Got it") if you knew it, left ("Again") if not. Cards you miss come back sooner.</p>
  <div class="chips" style="margin-bottom:14px"><select class="field" id="cTopic" style="margin:0;font-size:14px;padding:10px 12px"><option value="">All topics (${all.length} cards)</option>${topics.map(t => `<option value="${t}" ${t === cardTopic ? "selected" : ""}>${esc(NOTE[t]?.title || t)}</option>`).join("")}</select></div>`;
  const persist = c => { save(); clearTimeout(vCards._t); vCards._t = setTimeout(() => fbUpdate({ [`users/${uid}/cards/${c.id}`]: S.cards[c.id] }), 800); };
  const draw = () => {
    if (!queue.length) { v.innerHTML = head + `<div class="daily-done"><div class="br-emoji">🎉</div><h3>All caught up</h3><p class="muted">No cards due right now. ${mastered} mastered so far. Come back tomorrow for your next review.</p><div class="row" style="justify-content:center"><button class="btn primary" id="cMore">Study 20 more anyway</button><a class="btn" href="#revise">Revision sheets</a></div></div>`; bindTopic(); $("#cMore").onclick = () => { queue = shuffle(pool).slice(0, 20); draw(); }; return; }
    const c = queue[0];
    v.innerHTML = head + `<div class="fc-count muted num">${queue.length} left in this session</div>
    <div class="fc-stage"><div class="fc" id="fc" tabindex="0"><div class="fc-face fc-front"><span class="fc-tag">${esc(NOTE[c.t]?.title || "")}</span><b>${esc(c.f)}</b><span class="fc-hint">Tap to flip</span></div><div class="fc-face fc-back"><span class="fc-tag">${esc(NOTE[c.t]?.title || "")}</span><p>${esc(c.b)}</p></div></div></div>
    <div class="row fc-btns"><button class="btn" id="cAgain">↺ Again</button><button class="btn primary" id="cGood">Got it ✓</button></div>`;
    bindTopic();
    const fc = $("#fc"); fc.onclick = () => fc.classList.toggle("flip"); fc.onkeydown = e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); fc.classList.toggle("flip"); } };
    const rate = good => {
      const st = S.cards[c.id] || { b: 0, d: dn };
      if (good) { st.b = Math.min(6, st.b + 1); st.d = dn + BOX_DAYS[st.b]; queue.shift(); } else { st.b = 0; st.d = dn; queue.shift(); queue.splice(Math.min(3, queue.length), 0, c); }
      S.cards[c.id] = st; persist(c);
      fc.classList.add(good ? "out-r" : "out-l"); setTimeout(draw, 260);
    };
    $("#cGood").onclick = () => rate(true); $("#cAgain").onclick = () => rate(false);
    let sx = null; fc.onpointerdown = e => { sx = e.clientX; }; fc.onpointerup = e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 70) { fc.onclick = null; rate(dx > 0); } };
  };
  const bindTopic = () => { const s = $("#cTopic"); if (s) s.onchange = () => { location.hash = s.value ? "#cards/t:" + s.value : "#cards/all"; }; };
  draw();
}

/* ================= revision sheets ================= */
function vRevise(v) {
  const R = SD.revision || {};
  if (!Object.keys(R).length) { v.innerHTML = `<h2>Revision sheets</h2>` + comingSoon("Revision sheets"); return; }
  v.innerHTML = `<div class="crumb"><a href="#notes">Notes</a> / Revision</div><div class="row" style="align-items:baseline"><h2 style="margin:0">Last-minute revision</h2><span class="spacer"></span><button class="btn small" id="rPrint">🖨️ Save as PDF</button></div>
  <p class="muted">One page per unit: the definitions, frameworks and formulas to read the night before.</p>
  ${UNITS.filter(u => R[u.id]).map(u => `<section class="panel revise ${u.id}"><h3><span class="pill" style="font-size:12px;color:#fff;padding:4px 10px;border-radius:99px;background:var(--ug);font-family:var(--body)">${u.name}</span> ${esc(u.title)}</h3><div class="note-body">${R[u.id]}</div></section>`).join("")}`;
  $("#rPrint").onclick = () => printHTML(`<h1>${esc(SUBJ.name)}: revision</h1>` + UNITS.filter(u => R[u.id]).map(u => `<h2>${u.name}: ${esc(u.title)}</h2>${R[u.id]}`).join(""));
}

/* ================= doubt board ================= */
let doubtUnsub = null;
function vDoubts(v, p) {
  if (doubtUnsub) { doubtUnsub(); doubtUnsub = null; }
  if (!online) { v.innerHTML = `<h2>Doubts</h2><div class="empty">The doubt board needs an internet connection.</div>`; return; }
  if (p) return vDoubt(v, p);
  v.innerHTML = `<h2>Doubts</h2><p class="muted">Stuck on something in ${esc(SUBJ.short || SUBJ.name)}? Ask the class. Be kind and specific; the admin removes spam.</p>
  <div class="panel"><h3>Ask a doubt</h3><select class="field" id="dqTopic" style="font-size:15px"><option value="">General</option>${NOTES.map(n => `<option value="${n.id}">${esc(n.title)}</option>`).join("")}</select>
  <textarea id="dqText" maxlength="600" placeholder="e.g. What's the difference between divestment and liquidation?"></textarea><button class="btn primary" style="margin-top:10px" id="dqGo">Post doubt</button></div>
  <div id="dList"><p class="muted">Loading…</p></div>`;
  $("#dqGo").onclick = async () => {
    const text = $("#dqText").value.trim(); if (text.length < 8) return toast("Write a bit more detail");
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    try { await set(fbPath(`doubts/${SUBJ.id}/${id}`), { uid, name: S.name, text, topic: $("#dqTopic").value || null, ts: serverTimestamp(), n: 0 }); $("#dqText").value = ""; toast("Doubt posted"); } catch (e) { toast("Couldn't post. Check the database rules are updated."); }
  };
  doubtUnsub = onValue(query(fbPath(`doubts/${SUBJ.id}`), limitToLast(100)), s => {
    const rows = Object.entries(s.val() || {}).map(([id, d]) => ({ id, ...d })).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const el = $("#dList"); if (!el) return;
    el.innerHTML = rows.length ? `<div class="topic-list one">${rows.map(d => `<a class="topic doubt ${d.solved ? "done" : ""}" href="#doubts/${d.id}"><span><span class="tt">${esc(d.text.length > 140 ? d.text.slice(0, 140) + "…" : d.text)}</span><span class="ts">${esc(d.name || "")} · ${d.topic && NOTE[d.topic] ? esc(shortTitle(NOTE[d.topic])) + " · " : ""}${timeAgo(d.ts)} · ${d.n || 0} answer${d.n === 1 ? "" : "s"}</span></span><span class="chk">${d.solved ? "✓" : d.n || ""}</span></a>`).join("")}</div>` : `<div class="empty">No doubts yet. Ask the first one.</div>`;
  });
  cleanup = () => { if (doubtUnsub) { doubtUnsub(); doubtUnsub = null; } };
}
const timeAgo = ts => { if (!ts) return "just now"; const s = (Date.now() - ts) / 1000; return s < 60 ? "just now" : s < 3600 ? Math.floor(s / 60) + "m ago" : s < 86400 ? Math.floor(s / 3600) + "h ago" : Math.floor(s / 86400) + "d ago"; };
function vDoubt(v, id) {
  const path = `doubts/${SUBJ.id}/${id}`, apath = `doubtAns/${SUBJ.id}/${id}`;
  let d = null, ans = [];
  const draw = () => {
    if (!d) { v.innerHTML = `<div class="empty">This doubt was removed. <a href="#doubts">Back to doubts</a></div>`; return; }
    const mine = d.uid === uid;
    v.innerHTML = `<div class="crumb"><a href="#doubts">Doubts</a></div><div class="qcard"><div class="qtopic">${d.topic && NOTE[d.topic] ? esc(NOTE[d.topic].title) : "General"}</div><div class="qtext" style="font-size:18px">${esc(d.text)}</div><div class="muted" style="font-size:13px">Asked by ${esc(d.name || "")} · ${timeAgo(d.ts)}${mine ? ` · <a href="#" id="dDel">delete</a>` : ""}</div>${d.topic && NOTE[d.topic] ? `<a class="btn small" style="margin-top:10px" href="#note/${d.topic}">Open the notes for this topic</a>` : ""}</div>
    <div class="section-head"><h3 style="margin:0">${ans.length} answer${ans.length === 1 ? "" : "s"}</h3></div>
    ${ans.map(a => `<div class="answer ${d.solved === a.id ? "best" : ""}"><div class="row"><b>${esc(a.name || "")}</b><span class="dim" style="font-size:12.5px">${timeAgo(a.ts)}</span><span class="spacer"></span>${d.solved === a.id ? `<span class="chip on" style="cursor:default">✓ Helped</span>` : mine ? `<button class="btn small ghost" data-best="${a.id}">Mark as helpful</button>` : ""}</div><p style="white-space:pre-wrap;margin:6px 0 0">${esc(a.text)}</p></div>`).join("") || `<p class="muted">No answers yet.</p>`}
    <div class="panel" style="margin-top:14px"><h3>Your answer</h3><textarea id="aText" maxlength="1200" placeholder="Explain it the way you'd explain it to a friend…"></textarea><button class="btn primary" style="margin-top:10px" id="aGo">Post answer</button></div>`;
    $("#aGo").onclick = async () => {
      const text = $("#aText").value.trim(); if (text.length < 5) return toast("Write an answer first");
      const aid = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      try { await set(fbPath(`${apath}/${aid}`), { uid, name: S.name, text, ts: serverTimestamp() }); runTransaction(fbPath(path + "/n"), n => (n || 0) + 1).catch(() => { }); bonus(5, { helped: 1 }); toast("Answer posted · +5 XP"); } catch { toast("Couldn't post. Check the database rules are updated."); }
    };
    $$("[data-best]", v).forEach(b => b.onclick = () => update(fbPath(path), { solved: b.dataset.best }).catch(() => toast("Couldn't update")));
    const del = $("#dDel"); if (del) del.onclick = e => { e.preventDefault(); if (confirm("Delete your doubt?")) { update(fbPath(""), { [path]: null, [apath]: null }).then(() => location.hash = "#doubts").catch(() => toast("Couldn't delete")); } };
  };
  const u1 = onValue(fbPath(path), s => { d = s.val(); draw(); });
  const u2 = onValue(fbPath(apath), s => { ans = Object.entries(s.val() || {}).map(([k, a]) => ({ id: k, ...a })).sort((a, b) => (a.ts || 0) - (b.ts || 0)); draw(); });
  doubtUnsub = () => { u1(); u2(); };
  cleanup = () => { if (doubtUnsub) { doubtUnsub(); doubtUnsub = null; } };
}

/* ================= announcements ================= */
let announceData = {};
function announceHTML() {
  const hidden = LS.get("cr_ann_hidden", {});
  const list = Object.entries(announceData).map(([id, a]) => ({ id, ...a })).filter(a => !hidden[a.id] && (!a.subj || a.subj === "all" || a.subj === SUBJ.id) && Date.now() - (a.ts || 0) < 30 * 86400000).sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (b.ts || 0) - (a.ts || 0)).slice(0, 3);
  return list.map(a => `<div class="announce"><span class="an-ic">📢</span><div><b>${a.pin ? "📌 " : ""}${esc(a.title || "Announcement")}</b><p>${esc(a.text)}</p><span class="dim" style="font-size:12px">${timeAgo(a.ts)}${a.subj && a.subj !== "all" ? " · " + esc(SUBJECTS.find(x => x.id === a.subj)?.short || "") : ""}</span></div><button class="an-x" data-anx="${a.id}" aria-label="Dismiss">✕</button></div>`).join("");
}
function bindAnnounce(root) { $$("[data-anx]", root).forEach(b => b.onclick = () => { const h = LS.get("cr_ann_hidden", {}); h[b.dataset.anx] = 1; LS.set("cr_ann_hidden", h); b.closest(".announce").remove(); }); }

/* ================= calculators (with exam-style working) ================= */
const n2 = x => (Math.round(x * 100) / 100).toLocaleString("en-IN");
const CALCS = [
  { id: "eoq", t: "EOQ (Economic Order Quantity)", i: [["D", "Annual demand (units)", 10000], ["S", "Ordering cost per order (₹)", 200], ["H", "Holding cost per unit per year (₹)", 4]], f: v => { const r = Math.sqrt(2 * v.D * v.S / v.H); return { steps: [`EOQ = √(2DS ÷ H)`, `= √(2 × ${n2(v.D)} × ${n2(v.S)} ÷ ${n2(v.H)})`, `= √${n2(2 * v.D * v.S / v.H)}`], ans: `${n2(r)} units`, note: `Order about ${Math.round(r)} units each time; this balances ordering and holding costs. Orders per year ≈ ${n2(v.D / r)}.` }; } },
  { id: "rol", t: "Reorder level", i: [["U", "Usage per day", 20], ["L", "Lead time (days)", 5]], f: v => ({ steps: [`Reorder level = Usage × Lead time`, `= ${n2(v.U)} × ${n2(v.L)}`], ans: n2(v.U * v.L), note: `Place a new order when stock falls to ${n2(v.U * v.L)}.` }) },
  { id: "wc", t: "Working capital, current & quick ratio", i: [["CA", "Current assets (₹)", 1200000], ["CL", "Current liabilities (₹)", 400000], ["ST", "Stock (₹)", 700000], ["PP", "Prepaid expenses (₹)", 100000]], f: v => { const cr = v.CA / v.CL, lq = v.CA - v.ST - v.PP, qr = lq / v.CL; return { steps: [`Working capital = CA − CL = ${n2(v.CA)} − ${n2(v.CL)} = ₹${n2(v.CA - v.CL)}`, `Current ratio = CA ÷ CL = ${n2(v.CA)} ÷ ${n2(v.CL)} = ${n2(cr)} : 1`, `Liquid assets = CA − (Stock + Prepaid) = ${n2(v.CA)} − ${n2(v.ST + v.PP)} = ${n2(lq)}`, `Quick ratio = Liquid assets ÷ CL = ${n2(lq)} ÷ ${n2(v.CL)} = ${n2(qr)} : 1`], ans: `CR ${n2(cr)}:1 · QR ${n2(qr)}:1`, note: `Current ratio is ${cr >= 2 ? "at or above" : "below"} the 2:1 norm; quick ratio is ${qr >= 1 ? "at or above" : "below"} the 1:1 norm.${cr >= 2 && qr < 1 ? " The gap suggests too much money is tied up in stock." : ""}` }; } },
  { id: "de", t: "Debt-equity ratio", i: [["D", "Long-term debt (₹)", 1800000], ["E", "Shareholders' funds (₹)", 1200000]], f: v => { const r = v.D / v.E; return { steps: [`Debt-equity = Long-term debt ÷ Shareholders' funds`, `= ${n2(v.D)} ÷ ${n2(v.E)}`], ans: `${n2(r)} : 1`, note: r <= 2 ? "Within the 2:1 safe limit." : "Above 2:1: high financial risk from fixed interest." }; } },
  { id: "gp", t: "Gross / net profit ratio", i: [["S", "Net sales (₹)", 2500000], ["GP", "Gross profit (₹)", 500000], ["NP", "Net profit after tax (₹)", 200000]], f: v => ({ steps: [`GP ratio = GP ÷ Net sales × 100 = ${n2(v.GP)} ÷ ${n2(v.S)} × 100 = ${n2(v.GP / v.S * 100)}%`, `NP ratio = NP ÷ Net sales × 100 = ${n2(v.NP)} ÷ ${n2(v.S)} × 100 = ${n2(v.NP / v.S * 100)}%`], ans: `GP ${n2(v.GP / v.S * 100)}% · NP ${n2(v.NP / v.S * 100)}%`, note: "The gap between GP and NP shows how much indirect (operating) expenses take." }) },
  { id: "roce", t: "Return on capital employed (ROCE)", i: [["EBIT", "Profit before interest & tax (₹)", 600000], ["FA", "Net fixed assets (₹)", 3000000], ["CA", "Current assets (₹)", 1200000], ["CL", "Current liabilities (₹)", 400000]], f: v => { const ce = v.FA + v.CA - v.CL; return { steps: [`Capital employed = Fixed assets + CA − CL = ${n2(v.FA)} + ${n2(v.CA)} − ${n2(v.CL)} = ${n2(ce)}`, `ROCE = EBIT ÷ Capital employed × 100 = ${n2(v.EBIT)} ÷ ${n2(ce)} × 100`], ans: `${n2(v.EBIT / ce * 100)}%`, note: "Higher ROCE means capital is used more profitably; compare with the cost of borrowing." }; } },
  { id: "itr", t: "Inventory turnover", i: [["C", "Cost of goods sold (₹)", 2000000], ["O", "Opening stock (₹)", 300000], ["X", "Closing stock (₹)", 500000]], f: v => { const avg = (v.O + v.X) / 2, r = v.C / avg; return { steps: [`Average stock = (Opening + Closing) ÷ 2 = (${n2(v.O)} + ${n2(v.X)}) ÷ 2 = ${n2(avg)}`, `Inventory turnover = COGS ÷ Average stock = ${n2(v.C)} ÷ ${n2(avg)}`], ans: `${n2(r)} times`, note: `Stock is sold about ${n2(r)} times a year (every ${n2(365 / r)} days). Higher is better.` }; } },
  { id: "trend", t: "Trend % (horizontal analysis)", i: [["A", "Earlier year value", 4000000], ["B", "Later year value", 5000000]], f: v => ({ steps: [`% change = (Later − Earlier) ÷ Earlier × 100`, `= (${n2(v.B)} − ${n2(v.A)}) ÷ ${n2(v.A)} × 100`], ans: `${n2((v.B - v.A) / v.A * 100)}%`, note: v.B >= v.A ? "An increase." : "A decrease." }) },
  { id: "prod", t: "Labour productivity", i: [["O1", "Output before", 1000], ["L1", "Workers before", 10], ["O2", "Output after", 2000], ["L2", "Workers after", 4]], f: v => { const a = v.O1 / v.L1, b = v.O2 / v.L2; return { steps: [`Before = ${n2(v.O1)} ÷ ${n2(v.L1)} = ${n2(a)} per worker`, `After = ${n2(v.O2)} ÷ ${n2(v.L2)} = ${n2(b)} per worker`, `Change = ${n2(b)} ÷ ${n2(a)} = ${n2(b / a)} times`], ans: `${n2(b / a)}× productivity`, note: "Also consider accuracy, employee impact, cost and customer experience, not just output." }; } },
  { id: "aeq", t: "Accounting equation", i: [["A", "Total assets (₹)", 1000000], ["L", "Liabilities (₹)", 400000]], f: v => ({ steps: [`Assets = Liabilities + Capital`, `Capital = Assets − Liabilities = ${n2(v.A)} − ${n2(v.L)}`], ans: `₹${n2(v.A - v.L)}`, note: "Owner's capital is what remains after outsiders' claims." }) }
];
function vTools(v, p) {
  if (!SD.tools) { v.innerHTML = `<h2>Calculators</h2><div class="empty">No calculators for this subject.</div>`; return; }
  const c = CALCS.find(x => x.id === p);
  if (!c) { v.innerHTML = `<div class="crumb"><a href="#practice">Practice</a> / Calculators</div><h2>Finance & operations calculators</h2><p class="muted">Each one shows the full working, formula then substitution then answer, the way to write it in the exam.</p><div class="topic-list">${CALCS.map(x => `<a class="topic" href="#tools/${x.id}"><span class="lec">🧮</span><span><span class="tt">${esc(x.t)}</span><span class="ts">${x.i.map(i => i[1].replace(/ \(.*\)/, "")).join(" · ")}</span></span></a>`).join("")}</div>`; return; }
  v.innerHTML = `<div class="crumb"><a href="#tools">Calculators</a></div><h2>${esc(c.t)}</h2><div class="panel">${c.i.map(([k, l, d]) => `<label class="label" style="display:block">${esc(l)}</label><input class="field" type="number" inputmode="decimal" data-ci="${k}" value="${d}">`).join("")}<button class="btn primary block" id="cGo">Calculate</button></div><div id="cOut"></div>`;
  const run = () => { const vals = {}; let bad = false; $$("[data-ci]", v).forEach(i => { vals[i.dataset.ci] = parseFloat(i.value); if (!isFinite(vals[i.dataset.ci])) bad = true; }); if (bad) return toast("Fill in every value"); const r = c.f(vals); $("#cOut").innerHTML = `<div class="panel working"><h3>Working</h3><ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol><div class="formula">${esc(r.ans)}</div><p class="muted" style="margin:0">${esc(r.note)}</p></div>`; };
  $("#cGo").onclick = run; run();
}

/* ================= name popup ================= */
function askName() {
  if ($(".modal")) return;
  const el = document.createElement("div"); el.className = "modal";
  el.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="nmT"><div style="font-size:34px">👋</div><h2 id="nmT">What's your name?</h2>
  <p class="muted">It appears on the class leaderboard so friends can see who's topping.</p>
  <label for="nmIn" class="label" style="display:block">Full name</label><input class="field" id="nmIn" maxlength="40" autocomplete="name" placeholder="e.g. Kiratveer Singh">
  <div class="warnbox"><span>⚠️</span><span><b>Use your real name.</b> It's permanent and can't be changed later. Fake or joke names will be removed by the admin.</span></div>
  <div class="err" id="nmErr"></div><button class="btn primary block" id="nmGo">Continue</button></div>`;
  document.body.appendChild(el);
  const inp = $("#nmIn"), err = $("#nmErr"), go = $("#nmGo"); setTimeout(() => inp.focus(), 50);
  let confirmStep = false, sameAs = null;
  const submit = async () => {
    let name = inp.value.trim().replace(/\s+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (name.length < 3 || !/^[\p{L} .'-]+$/u.test(name)) { err.textContent = "Enter your real name using letters only (at least 3 characters)."; return; }
    if (sameAs) name = sameAs;
    else if (!confirmStep) {
      let all = namesData; if (online) { try { all = (await get(fbPath("names"))).val() || {}; } catch { } }
      const hit = Object.entries(all).find(([id, n]) => id !== uid && normName(n) === normName(name));
      if (hit) return askSame(hit[1]);
    }
    if (!confirmStep) { confirmStep = true; inp.value = name; inp.readOnly = true; err.textContent = ""; go.textContent = `Yes, save "${name}" permanently`; $("#nmT").textContent = "Is this correct?"; const back = document.createElement("button"); back.className = "btn ghost block"; back.style.marginTop = "8px"; back.textContent = "Edit name"; back.onclick = () => { confirmStep = false; sameAs = null; inp.readOnly = false; go.textContent = "Continue"; $("#nmT").textContent = "What's your name?"; back.remove(); inp.focus(); }; go.after(back); return; }
    if (!confirmStep && !sameAs) return;
    go.disabled = true; S.name = name; save();
    if (online && uid) { try { await set(fbPath("names/" + uid), name); } catch (e) { console.warn(e); } syncLB(true); }
    el.remove(); renderTopbar(); toast(`Welcome, ${name.split(" ")[0]}!`); route();
    if (!LS.get("cr_subject_chosen", false)) setTimeout(() => pickSubject(true), 500);
  };
  // someone with this name already exists: same person on another phone, or a different person?
  const askSame = existing => {
    const box = document.createElement("div"); box.id = "sameBox";
    box.innerHTML = `<div class="warnbox" style="background:rgba(56,189,248,.1);border-color:rgba(56,189,248,.45)"><span>👥</span><span><b>${esc(existing)}</b> is already on the leaderboard. Is that you on another phone or browser?</span></div>
    <button class="btn primary block" id="sameYes">Yes, that's me. Combine my progress</button><button class="btn ghost block" style="margin-top:8px" id="sameNo">No, I'm a different person</button>`;
    go.classList.add("hidden"); go.after(box); inp.readOnly = true; err.textContent = "";
    $("#sameYes").onclick = () => { sameAs = existing; inp.value = existing; box.remove(); go.classList.remove("hidden"); submit(); };
    $("#sameNo").onclick = () => { box.remove(); go.classList.remove("hidden"); inp.readOnly = false; inp.focus(); err.textContent = "Add your surname or an initial (e.g. \"Rohit Verma K\") so you're not mixed up with them."; };
  };
  go.onclick = submit; inp.onkeydown = e => { if (e.key === "Enter") submit(); };
}

/* ================= 3D: intro + hero ================= */
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PAL = [0x8B5CF6, 0xEC4899, 0xFB923C, 0xFBBF24, 0x2DD4BF, 0x38BDF8];
function coinMats(T) {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  const gr = g.createRadialGradient(54, 50, 6, 64, 64, 64); gr.addColorStop(0, "#FFF3B0"); gr.addColorStop(.6, "#FBBF24"); gr.addColorStop(1, "#B45309");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(120,53,15,.55)"; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#92400E"; g.font = "bold 64px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("₹", 64, 68);
  const face = new T.MeshStandardMaterial({ map: new T.CanvasTexture(c), metalness: .6, roughness: .3 });
  const side = new T.MeshStandardMaterial({ color: 0xD97706, metalness: .85, roughness: .25 });
  return [side, face, face];
}
function windowTex(T) {
  const c = document.createElement("canvas"); c.width = 64; c.height = 128; const g = c.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, 64, 128);
  const lit = ["#FDE68A", "#FBCFE8", "#A5F3FC", "#DDD6FE"];
  for (let y = 6; y < 124; y += 10) for (let x = 6; x < 60; x += 12) if (Math.random() < .55) { g.fillStyle = lit[Math.random() * 4 | 0]; g.globalAlpha = .5 + Math.random() * .5; g.fillRect(x, y, 7, 5); }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
function playIntro() {
  return new Promise(resolve => {
    let seen = false; try { seen = sessionStorage.getItem("cr_intro"); } catch { }
    if (seen || reduced || !window.THREE) return resolve();
    try { sessionStorage.setItem("cr_intro", "1"); } catch { }
    const wrap = $("#intro"); wrap.classList.remove("hidden");
    try {
      const T = THREE, canvas = $("#introCanvas");
      const r = new T.WebGLRenderer({ canvas, antialias: true });
      r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(innerWidth, innerHeight); r.setClearColor(0x0D0B22);
      const scene = new T.Scene(); scene.fog = new T.Fog(0x0D0B22, 16, 42);
      const cam = new T.PerspectiveCamera(innerWidth < 600 ? 62 : 48, innerWidth / innerHeight, .1, 100);
      scene.add(new T.AmbientLight(0x8b85c9, .7));
      const sun = new T.DirectionalLight(0xffffff, .7); sun.position.set(5, 12, 10); scene.add(sun);
      [[0x8B5CF6, -10, 6, -4], [0xEC4899, 10, 5, -2], [0x2DD4BF, 0, 4, 6]].forEach(([c, x, y, z]) => { const l = new T.PointLight(c, 2.2, 30); l.position.set(x, y, z); scene.add(l); });
      // skyline: buildings rise like a bar chart
      const tex = windowTex(T), box = new T.BoxGeometry(1, 1, 1), bars = [];
      const tints = [0x2E1065, 0x3B0764, 0x1E3A8A, 0x134E4A, 0x4C0519, 0x1E1B4B];
      for (let row = 0; row < 3; row++) for (let i = 0; i < 15; i++) {
        const x = (i - 7) * 1.55 + (row % 2) * .7, z = -3 - row * 2.6 + Math.random() * .6;
        const h = (1.4 + Math.random() * 3.2) * (1 + row * .45) * (1.15 - Math.abs(i - 7) / 14);
        const w = .9 + Math.random() * .5, t = tex.clone(); t.needsUpdate = true; t.repeat.set(1, Math.max(1, h / 2.5));
        const m = new T.Mesh(box, new T.MeshStandardMaterial({ color: tints[(i + row) % tints.length], map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .85, metalness: .4, roughness: .45 }));
        m.position.set(x, 0, z); m.scale.set(w, .01, w); m.userData = { h, delay: .15 + Math.abs(i - 7) * .05 + row * .12 + Math.random() * .1 }; scene.add(m); bars.push(m);
      }
      const grid = new T.GridHelper(60, 60, 0x6D28D9, 0x2A1F5C); scene.add(grid);
      const floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({ color: 0x0D0B22, metalness: .8, roughness: .35, transparent: true, opacity: .85 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -.01; scene.add(floor);
      // growth line chart with arrow head
      const pts = []; for (let i = 0; i <= 9; i++) { const x = -9 + i * 2; pts.push(new T.Vector3(x, .8 + i * .62 + (i % 2 ? -.55 : .35) * (i < 9 ? 1 : 0), 1.2)); }
      const curve = new T.CatmullRomCurve3(pts), SEG = 220, RAD = 10;
      const tube = new T.TubeGeometry(curve, SEG, .1, RAD, false);
      const cols = [], stops = [new T.Color(0x8B5CF6), new T.Color(0xEC4899), new T.Color(0xFB923C), new T.Color(0xFBBF24)];
      const pos = tube.attributes.position;
      for (let k = 0; k < pos.count; k++) { const u = Math.floor(k / (RAD + 1)) / SEG, f = u * 3, a = Math.min(2, Math.floor(f)); const c = stops[a].clone().lerp(stops[a + 1], f - a); cols.push(c.r, c.g, c.b); }
      tube.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
      const line = new T.Mesh(tube, new T.MeshBasicMaterial({ vertexColors: true })); scene.add(line);
      const total = tube.index.count; tube.setDrawRange(0, 0);
      const head = new T.Mesh(new T.ConeGeometry(.32, .8, 20), new T.MeshBasicMaterial({ color: 0xFDE68A })); scene.add(head);
      const glow = new T.PointLight(0xFDE68A, 3, 8); scene.add(glow);
      // gold ₹ coins raining down
      const cm = coinMats(T), cg = new T.CylinderGeometry(.42, .42, .08, 40), coins = [];
      for (let i = 0; i < 18; i++) { const c = new T.Mesh(cg, cm); c.position.set((Math.random() - .5) * 18, 14 + Math.random() * 8, -1 + Math.random() * 5); c.userData = { v: 0, d: 1.4 + Math.random() * 1.6, s: 2 + Math.random() * 4, land: .05 + Math.random() * .1 }; c.rotation.set(Math.random() * 3, 0, Math.random() * 3); scene.add(c); coins.push(c); }
      // digital science: a glowing data network floating above the business skyline
      const net = new T.Group(), nodes = [], NG = new T.SphereGeometry(.09, 10, 10);
      for (let i = 0; i < 34; i++) { const p = new T.Vector3((Math.random() - .5) * 20, 8.5 + Math.random() * 4.5, -6 + (Math.random() - .5) * 8); nodes.push(p); const mm = new T.Mesh(NG, new T.MeshBasicMaterial({ color: [0x38BDF8, 0x2DD4BF, 0xA78BFA][i % 3], transparent: true, opacity: 0 })); mm.position.copy(p); net.add(mm); }
      const lp = []; nodes.forEach((p, i) => nodes.forEach((q, j) => { if (j > i && p.distanceTo(q) < 4.2) lp.push(p.x, p.y, p.z, q.x, q.y, q.z); }));
      const lg = new T.BufferGeometry(); lg.setAttribute("position", new T.Float32BufferAttribute(lp, 3));
      const links = new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0 })); net.add(links); scene.add(net);
      // sparkles
      const sg = new T.BufferGeometry(), S = 300, sp = new Float32Array(S * 3);
      for (let i = 0; i < S; i++) { sp[i * 3] = (Math.random() - .5) * 40; sp[i * 3 + 1] = Math.random() * 20; sp[i * 3 + 2] = (Math.random() - .5) * 30; }
      sg.setAttribute("position", new T.BufferAttribute(sp, 3));
      const stars = new T.Points(sg, new T.PointsMaterial({ color: 0xF9A8D4, size: .07, transparent: true, opacity: .8 })); scene.add(stars);

      const t0 = performance.now(), DUR = 5600; let raf, ended = false, prev = t0;
      const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
      const up = new T.Vector3(0, 1, 0);
      const end = () => { if (ended) return; ended = true; wrap.classList.add("out"); setTimeout(() => { cancelAnimationFrame(raf); r.dispose(); wrap.remove(); }, 850); resolve(); };
      const loop = now => {
        const t = (now - t0) / 1000, dt = Math.min(.05, (now - prev) / 1000); prev = now;
        bars.forEach(b => { const k = ease((t - b.userData.delay) / 1.2); b.scale.y = .01 + b.userData.h * k; b.position.y = b.scale.y / 2; });
        const lp = ease((t - .9) / 1.8);
        tube.setDrawRange(0, Math.floor(total * lp / 3) * 3);
        const tip = curve.getPointAt(Math.max(.001, lp)), tan = curve.getTangentAt(Math.max(.001, lp));
        head.position.copy(tip); head.quaternion.setFromUnitVectors(up, tan); head.visible = lp > .01; glow.position.copy(tip);
        coins.forEach(c => { const u = c.userData; if (t < u.d) return; if (c.position.y > u.land) { u.v += 18 * dt; c.position.y = Math.max(u.land, c.position.y - u.v * dt); c.rotation.x += u.s * dt; c.rotation.z += u.s * .6 * dt; } else { c.rotation.x += (Math.PI * Math.round(c.rotation.x / Math.PI) - c.rotation.x) * .2; c.rotation.z += (Math.PI * Math.round(c.rotation.z / Math.PI) - c.rotation.z) * .2; } });
        const k = ease(t / 3.6), a = Math.sin(t * .35) * .35;
        cam.position.set(Math.sin(a) * (17 - k * 3), 1.4 + k * 6.2, Math.cos(a) * (17 - k * 3)); cam.lookAt(0, 2.6 + k * .8, -2);
        stars.rotation.y = t * .03;
        const nf = ease((t - 1.6) / 1.4); links.material.opacity = nf * .45; net.children.forEach((c, i) => { if (c.material && c !== links) c.material.opacity = nf * (.6 + .4 * Math.sin(t * 3 + i)); }); net.position.y = Math.sin(t * .8) * .2;
        r.render(scene, cam);
        if (t > 3.0) wrap.classList.add("show-title");
        if (now - t0 > DUR) return end();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      $("#skipIntro").onclick = end; wrap.onclick = e => { if (e.target.id !== "skipIntro" && performance.now() - t0 > 1500) end(); };
      addEventListener("resize", () => { if (ended) return; r.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });
    } catch (e) { console.warn("intro skipped", e); wrap.remove(); resolve(); }
  });
}
function heroScene(canvas) {
  if (!canvas || !window.THREE) return null;
  try { return heroSceneInner(canvas); } catch (e) { console.warn("hero 3D skipped", e); return null; }
}
/* hero: a 3D donut chart with orbiting ₹ coins */
function heroSceneInner(canvas) {
  const T = THREE, w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
  const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(w, h, false);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(38, w / h, .1, 50); cam.position.set(0, 0, 9);
  scene.add(new T.AmbientLight(0xc4b5fd, .6));
  const l1 = new T.DirectionalLight(0xffffff, 1.1); l1.position.set(3, 5, 6); scene.add(l1);
  const l2 = new T.PointLight(0xEC4899, 2, 20); l2.position.set(-4, -2, 4); scene.add(l2);
  const l3 = new T.PointLight(0x38BDF8, 1.6, 20); l3.position.set(4, 3, 2); scene.add(l3);
  const group = new T.Group(); scene.add(group);
  const donut = new T.Group(); group.add(donut);
  const shares = [.3, .22, .18, .17, .13], segs = []; let start = 0;
  shares.forEach((s, i) => {
    const arc = s * Math.PI * 2 - .06;
    const m = new T.Mesh(new T.TorusGeometry(1.55, .5, 24, 80, arc), new T.MeshStandardMaterial({ color: PAL[i], metalness: .35, roughness: .3 }));
    m.rotation.z = start; const mid = start + arc / 2; m.userData = { dx: Math.cos(mid), dy: Math.sin(mid), ph: i * 1.1 };
    donut.add(m); segs.push(m); start += s * Math.PI * 2;
  });
  donut.rotation.x = -1.0;
  const cm = coinMats(T), coins = [];
  for (let i = 0; i < 3; i++) { const c = new T.Mesh(new T.CylinderGeometry(.34, .34, .07, 40), cm); c.userData = { a: i * 2.1 }; group.add(c); coins.push(c); }
  let mx = 0, my = 0, raf;
  const mv = e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; };
  addEventListener("pointermove", mv, { passive: true });
  const t0 = performance.now();
  const loop = now => {
    const t = (now - t0) / 1000;
    donut.rotation.z = t * .3;
    segs.forEach(s => { const k = Math.max(0, Math.sin(t * 1.2 - s.userData.ph)) * .22; s.position.set(s.userData.dx * k, s.userData.dy * k, 0); });
    coins.forEach(c => { const a = t * .7 + c.userData.a; c.position.set(Math.cos(a) * 2.7, Math.sin(a * 1.3) * .6 + .3, Math.sin(a) * 1.4); c.rotation.set(Math.PI / 2 + Math.sin(t + c.userData.a) * .4, 0, t * 2); });
    group.rotation.x += (my * .4 - group.rotation.x) * .05; group.rotation.y += (mx * .7 - group.rotation.y) * .05;
    group.position.y = Math.sin(t * 1.1) * .1;
    r.render(scene, cam); if (!reduced) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); removeEventListener("pointermove", mv); r.dispose(); };
}

/* ================= boot ================= */
const LOGO = id => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5CF6"/><stop offset=".55" stop-color="#EC4899"/><stop offset="1" stop-color="#FB923C"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#${id})"/><rect x="13" y="36" width="9" height="15" rx="3" fill="#fff" opacity=".65"/><rect x="27.5" y="27" width="9" height="24" rx="3" fill="#fff" opacity=".82"/><rect x="42" y="18" width="9" height="33" rx="3" fill="#fff"/><path d="M12 30 L26 20 L34 25 L50 11" fill="none" stroke="#FDE68A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 10 L51 10 L51 18" fill="none" stroke="#FDE68A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
window.__pick = () => pickSubject();
if ("serviceWorker" in navigator && location.protocol === "https:") addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
(async function boot() {
  $$("[data-logo]").forEach((el, i) => el.innerHTML = LOGO("lg" + i));
  try { await loadSubject(LS.get("cr_subject", SUBJECTS[0].id)); } catch (e) { console.warn(e); await loadSubject(SUBJECTS[0].id); }
  $("#subjChip").onclick = () => pickSubject();
  $("#introName").innerHTML = [..."Boardroom"].map((c, i) => `<span style="--i:${i}">${c}</span>`).join("");
  renderTopbar(); setSync("");
  route();
  await playIntro().catch(() => { });
  initFirebase();
  // if Firebase never connects, still ask for the name locally
  setTimeout(() => { if (!S.name && !$(".modal")) askName(); else if (S.name && !LS.get("cr_subject_chosen", false)) pickSubject(true); }, online ? 0 : 6000);
})();


/* ========== BOARDROOM V7: QUIZ GAME WORLD ========== */
const G7_MODES = [
 {id:'race',icon:'🏁',name:'Quiz Race',sub:'Outrun the course by answering correctly', color:'#64e4ff'},
 {id:'survival',icon:'💛',name:'Survival Quiz',sub:'Protect your hearts; last player standing wins',color:'#ffb866'},
 {id:'treasure',icon:'💎',name:'Treasure Hunt',sub:'Collect gems and discover bonus chests',color:'#d0a3ff'},
 {id:'boss',icon:'🐲',name:'Boss Battle',sub:'Cooperate to defeat the knowledge guardian',color:'#ff84b1'},
 {id:'story',icon:'🏙️',name:'Case Study Adventure',sub:'Make smart business decisions and build your empire',color:'#9cf1b9'}
];
const G7_SKINS=['#8c72ff','#49d2cf','#fb9a66','#ff74aa','#98cc73','#ffd66a'];
const G7_HAIR=['none','cap','spike','bun'];
const G7_PICK=(arr,n)=>arr[(Math.abs(n)||0)%arr.length];
function g7Avatar(color=0,hair=0,label='') {return `<div class="g7-person" style="--skin:${G7_SKINS[color]||G7_SKINS[0]}"><span class="g7-hair ${G7_HAIR[hair]||'none'}"></span><span class="g7-head"><i></i><i></i><b></b></span><span class="g7-torso"></span><span class="g7-arm left"></span><span class="g7-arm right"></span><span class="g7-leg left"></span><span class="g7-leg right"></span></div>${label?`<small>${esc(label)}</small>`:''}`;}
function g7Profile(){let a=LS.get('br_v7_avatar',null);return a&&Number.isInteger(a.color)&&Number.isInteger(a.hair)?a:{color:0,hair:0};}
function g7Qs(mode,seed,n){
 const rnd=rngFrom('g7:'+mode+':'+seed), all=(mode==='story'&&CASESETS.length)?CASESETS.flatMap(c=>c.qs):BANK;
 return sshuffle(all.length?all:BANK,rnd).slice(0,Math.min(n,all.length||BANK.length)).map(q=>{let opts=sshuffle([q.c,...q.w],rnd);return {...q,opts,ans:opts.indexOf(q.c)};});
}
function vGames7(v,p){
 if(p){const bits=p.split('-');if(bits[0]==='solo')return g7Solo(v,bits[1]);if(bits[0]==='room')return g7Room(v,bits[1]);}
 const a=g7Profile();
 v.innerHTML=`<div class="g7-wrap"><section class="g7-hero"><div class="g7-kicker">BOARDROOM · GAME WORLD / V7</div><div class="g7-hero-grid"><div><h1>Knowledge is<br><em>your superpower.</em></h1><p>Five mini-games. Real study questions. Unlock your own champion avatar and play solo or with up to four friends.</p><div class="g7-actions"><a class="btn primary" href="#games/solo-race">⚡ Quick play</a><a class="btn" href="#games">Explore modes ↓</a></div></div><div class="g7-hero-avatar">${g7Avatar(a.color,a.hair)}<span>YOUR RUNNER</span></div></div></section><section class="g7-custom panel"><div><h2>🎨 Customize your runner</h2><p class="muted">Lightweight 3D-style character · saved on this device</p></div><div class="g7-look"><label>Suit color <select id="g7Color" class="field">${G7_SKINS.map((c,i)=>`<option value="${i}" ${a.color===i?'selected':''}>${['Violet','Aqua','Sunset','Rose','Mint','Gold'][i]}</option>`).join('')}</select></label><label>Headwear <select id="g7Hair" class="field">${G7_HAIR.map((h,i)=>`<option value="${i}" ${a.hair===i?'selected':''}>${['Classic','Cap','Spikes','Bun'][i]}</option>`).join('')}</select></label><div id="g7Preview">${g7Avatar(a.color,a.hair)}</div></div></section><h2 class="g7-section-title">Choose your playground <span>5 MODES</span></h2><div class="g7-cards">${G7_MODES.map(m=>`<article class="g7-card" style="--accent:${m.color}"><div class="g7-icon">${m.icon}</div><h3>${m.name}</h3><p>${m.sub}</p><div class="g7-card-actions"><a class="btn primary small" href="#games/solo-${m.id}">Solo play</a><button class="btn ghost small" data-host="${m.id}">Play with friends</button></div></article>`).join('')}</div><p class="g7-footnote">Free-tier game mode. Competitive rewards are for fun and are not authoritative exam scores. Multiplayer needs your Firebase Realtime Database rules updated.</p></div>`;
 const change=()=>{const av={color:Number($('#g7Color',v).value),hair:Number($('#g7Hair',v).value)};LS.set('br_v7_avatar',av);$('#g7Preview',v).innerHTML=g7Avatar(av.color,av.hair);$('.g7-hero-avatar',v).innerHTML=g7Avatar(av.color,av.hair)+'<span>YOUR RUNNER</span>';};$('#g7Color',v).onchange=change;$('#g7Hair',v).onchange=change;
 $$('[data-host]',v).forEach(btn=>btn.onclick=()=>g7Setup(v,btn.dataset.host));
}
function g7Setup(v,mode){const m=G7_MODES.find(x=>x.id===mode);if(!m)return vGames7(v);v.innerHTML=`<div class="g7-wrap"><section class="panel g7-setup"><h2>${m.icon} ${m.name} · Create room</h2><p>Invite up to 3 friends. The host starts after everyone joins.</p><div class="g7-form"><label>Questions<select class="field" id="g7Count"><option>5</option><option selected>10</option><option>15</option></select></label><label>Players<select class="field" id="g7Max"><option>2</option><option>3</option><option selected>4</option></select></label><label>Time per question<select class="field" id="g7Time"><option>10</option><option selected>15</option><option>20</option></select></label></div><div class="g7-actions"><button class="btn primary" id="g7Create">Create party</button><a class="btn" href="#games">Back to modes</a></div></section></div>`;
 $('#g7Create',v).onclick=async()=>{if(!online||!uid)return toast('Internet and Firebase sign-in required for multiplayer');const btn=$('#g7Create',v);btn.disabled=true;const code=code5();try{await set(fbPath('gameRooms/'+code),{mode,host:uid,subj:SUBJ.id,seed:Math.floor(Math.random()*1e9),state:'waiting',created:serverTimestamp(),count:Number($('#g7Count',v).value),maxPlayers:Number($('#g7Max',v).value),duration:Number($('#g7Time',v).value)*1000,round:1,seats:{0:uid},players:{[uid]:{name:S.name||'Player',avatar:g7Profile()}}});location.hash='#games/room-'+code;}catch(e){toast('Room error: '+(e.code||e.message));btn.disabled=false;}};
}
function g7Score(mode,good,ms,duration,idx){if(!good)return 0;if(mode==='race')return 120+Math.round(80*(1-ms/duration));if(mode==='treasure')return 100+(idx%3===2?100:40);if(mode==='boss')return 120;if(mode==='story')return 100;return 100;}
function g7Tally(mode,qs,answers,dur){let score=0,hearts=3,correct=0;for(let i=0;i<qs.length;i++){const a=answers?.[i];if(!a)continue;const ok=a.k===qs[i].ans;correct+=Number(ok);if(!ok&&mode==='survival')hearts=Math.max(0,hearts-1);if(mode==='survival'&&hearts===0)continue;score+=g7Score(mode,ok,Math.min(dur,Math.max(0,a.ms||dur)),dur,i);}return {score,hearts,correct};}
function g7Scene(mode,players,qs,idx,duration){const max=Math.max(1,qs.length), boss=mode==='boss',mean=players.reduce((a,p)=>a+p.tally.correct,0);return `<div class="g7-world ${mode}"><div class="g7-sun"></div><div class="g7-cloud c1"></div><div class="g7-cloud c2"></div><div class="g7-track">${[0,1,2,3,4].map(i=>`<i style="--i:${i}"></i>`).join('')}<span class="g7-finish">FINISH</span></div>${boss?`<div class="g7-boss">🐲<strong>${Math.max(0,qs.length*players.length-mean)} HP</strong></div>`:''}<div class="g7-runners">${players.map((p,i)=>`<div class="g7-runner" style="--lane:${i};--progress:${Math.min(88,5+((mode==='race'?p.tally.score/200:mode==='treasure'?p.tally.score/140:mode==='survival'?p.tally.correct:mode==='story'?p.tally.correct:p.tally.correct)/max)*79)}%">${g7Avatar(p.avatar.color,p.avatar.hair)}<span>${esc(p.name)}</span></div>`).join('')}</div></div>`;}
function g7Play(v,ctx){
 let stopped=false,last='',timer=null,selectedLane=1,previousQuestion=-1,slideStart=null,submitting=false;const {mode,seed,count,duration,players,me,round}=ctx,qs=g7Qs(mode,seed,count);let selfAnswers=ctx.solo?{}:null;let info=null;
 const result=()=>{const roster=ctx.solo?[{id:'solo',name:S.name||'You',avatar:g7Profile(),ans:selfAnswers}]:Object.entries(info?.players||{}).map(([id,p])=>({id,name:p.name||'Player',avatar:p.avatar||{color:0,hair:0},ans:p.answers||{}}));return roster.map(p=>({...p,tally:g7Tally(mode,qs,p.ans,duration)}));};
 const render=()=>{if(stopped)return;const elapsed=Math.max(0,sNow()-ctx.startAt),span=duration+3500,idx=Math.floor(elapsed/span),phase=elapsed%span,active=Math.min(idx,qs.length-1),show=phase>=duration||idx>=qs.length;if(idx!==previousQuestion){previousQuestion=idx;selectedLane=1;}let roster=result(),own=roster.find(p=>p.id===me)||roster[0];const meta=G7_MODES.find(m=>m.id===mode),done=idx>=qs.length||(mode==='survival'&&own.tally.hearts<=0&&show);
 const key=[idx,show,done,selectedLane,JSON.stringify(own.ans?.[idx]),roster.map(x=>x.tally.score).join(',')].join(':');if(last===key){const el=$('#g7Clock',v);if(el)el.textContent=String(Math.ceil(Math.max(0,duration-phase)/1000));return;}last=key;
 if(done){let ranking=roster.slice().sort((a,b)=>b.tally.score-a.tally.score);const best=ranking[0]?.tally.score||0;const earned=Math.round((own.tally.correct*6)+(own.tally.score===best?20:0));const rewardKey=`br_v7_reward_${ctx.solo?'solo':ctx.code}_${round}_${seed}_${me}`;if(!LS.get(rewardKey,false)){LS.set(rewardKey,true);if(ctx.solo){bonus(earned); }else{bonus(earned,{battles:1,wins:own.tally.score===best?1:0});}}v.innerHTML=`<div class="g7-wrap g7-results"><div class="g7-trophy">${mode==='boss'?'🐲':'🏆'}</div><h1>${mode==='boss'?'Boss encounter complete!':own.tally.score===best?'Champion!':'Great game!'}</h1><p>${meta.name} · ${own.tally.correct}/${qs.length} correct · +${earned} XP</p><div class="g7-podium">${ranking.map((p,i)=>`<div class="g7-result"><span>${['🥇','🥈','🥉','🎖️'][Math.min(i,3)]}</span>${g7Avatar(p.avatar.color,p.avatar.hair)}<strong>${esc(p.name)}</strong><small>${p.tally.score} pts · ${p.tally.correct} correct</small></div>`).join('')}</div><div class="g7-actions"><a href="#games" class="btn primary">All game modes</a>${ctx.solo?`<a class="btn" href="#games/solo-${mode}">Play again</a>`:`<button class="btn" id="g7Again">Rematch (host)</button>`}</div></div>`;
 if(!ctx.solo){const b=$('#g7Again',v);if(b){b.disabled=ctx.host!==me;b.onclick=async()=>{b.disabled=true;try{await update(fbPath('gameRooms/'+ctx.code),{state:'waiting',round:round+1,seed:Math.floor(Math.random()*1e9),startAt:null,players:Object.fromEntries(Object.entries(info.players).map(([id,p])=>[id,{name:p.name,avatar:p.avatar||{color:0,hair:0}}]))});}catch(e){toast(e.code||e.message);b.disabled=false;}};}}
 return;}
 const q=qs[active];if(!q){v.innerHTML='<p>No questions available for this subject.</p>';return;}const mine=own.ans?.[active],locked=Boolean(mine)||show;
 v.innerHTML=`<div class="g7-wrap g7-match"><div class="g7-match-top"><a href="#games" class="btn ghost small">← Exit</a><strong>${meta.icon} ${meta.name}</strong><span>QUESTION ${active+1} / ${qs.length}</span></div><div class="g7-doorworld" id="g7Doorworld" tabindex="0" aria-label="Four answer lanes. Swipe left or right to move your runner, then enter the selected door."><div class="g7-door-sky"><span>🏁 QUESTION GATES</span><span>${mode==='boss'?'🐲':mode==='treasure'?'💎':mode==='story'?'🏙️':'🏆'}</span></div><div class="g7-door-lanes">${q.opts.map((opt,i)=>`<button type="button" class="g7-door ${selectedLane===i?'is-active':''} ${show?(i===q.ans?'is-correct':mine?.k===i?'is-wrong':''):''}" data-lane="${i}" ${locked?'disabled':''} aria-label="Door ${'ABCD'[i]}: ${esc(opt)}"><span class="g7-door-label">DOOR ${'ABCD'[i]}</span><span class="g7-door-frame"><span class="g7-door-icon">${show?(i===q.ans?'✓':mine?.k===i?'✕':''):'?'}</span></span><span class="g7-door-text">${esc(opt)}</span></button>`).join('')}</div><div class="g7-running-avatar" style="--current-lane:${selectedLane}">${g7Avatar(own.avatar.color,own.avatar.hair)}<span>${esc(own.name)}</span></div><div class="g7-runway"><i></i><i></i><i></i><i></i></div></div><div class="g7-hud"><span>⭐ ${own.tally.score} pts</span><span>${mode==='survival'?'❤️'.repeat(own.tally.hearts):mode==='treasure'?'💎 Gems':mode==='boss'?'🤝 Team attack':mode==='story'?'🏙️ Business choices':'🏁 Race to finish'}</span><span>⏳ <b id="g7Clock">${Math.ceil(Math.max(0,duration-phase)/1000)}</b>s</span></div><section class="g7-question panel"><div class="g7-kicker">${esc(q.t||SUBJ.short)}</div><h2>${esc(q.q)}</h2>${!locked?`<p class="g7-swipe-help">👈 Swipe left/right to change lanes · Tap a door to select · Press Enter Door to lock</p><div class="g7-drive"><button class="btn g7-steer" id="g7Left" aria-label="Move left">◀</button><button class="btn primary" id="g7Enter">ENTER DOOR ${'ABCD'[selectedLane]} ↗</button><button class="btn g7-steer" id="g7Right" aria-label="Move right">▶</button></div>`:''}${show?`<div class="g7-feedback"><b>${mine?.k===q.ans?'✅ Correct!':'💡 '+(mine?'Wrong door!':'Time up!')}</b><p>Correct door: ${'ABCD'[q.ans]} — ${esc(q.c)}</p><p>${esc(q.e||'Keep practicing this topic.')}</p><small>${roster.map(p=>`${esc(p.name)}: ${p.ans?.[active] ? 'Door '+ 'ABCD'[p.ans[active].k]+ (p.ans[active].k===q.ans?' ✓':' ✕'):'—'}`).join(' · ')}</small></div>`:mine?'<p class="g7-locked">🔒 Door entered! Waiting for everyone and the reveal…</p>':'<p class="g7-locked">Move your runner into the correct answer lane before the timer ends.</p>'}</section></div>`;
 const chooseLane=(lane)=>{if(locked||submitting)return;const next=Math.max(0,Math.min(3,lane));if(next!==selectedLane){selectedLane=next;last='';render();}};
 const submitLane=async(lane)=>{if(locked||submitting||sNow()>=ctx.startAt+(active*span)+duration)return;submitting=true;const answer={k:lane,ms:Math.min(duration,Math.max(0,sNow()-ctx.startAt-active*span))};if(ctx.solo){selfAnswers[active]=answer;recordAnswer(q,answer.k===q.ans);submitting=false;last='';render();return;}
 try{const r=await runTransaction(fbPath(`gameRooms/${ctx.code}/players/${me}/answers/${active}`),a=>a===null?answer:undefined,{applyLocally:false});if(r.committed)recordAnswer(q,answer.k===q.ans);}catch(e){toast('Answer failed: '+(e.code||e.message));}finally{submitting=false;last='';render();}};
 $$('[data-lane]',v).forEach(b=>b.onclick=()=>{const lane=Number(b.dataset.lane);if(selectedLane===lane)submitLane(lane);else chooseLane(lane);});
 const left=$('#g7Left',v),right=$('#g7Right',v),enter=$('#g7Enter',v);
 if(left)left.onclick=()=>chooseLane(selectedLane-1);if(right)right.onclick=()=>chooseLane(selectedLane+1);if(enter)enter.onclick=()=>submitLane(selectedLane);
 const field=$('#g7Doorworld',v);if(field&&!locked){field.ontouchstart=e=>{slideStart=e.touches[0]?.clientX??null;};field.ontouchend=e=>{if(slideStart===null)return;const dx=(e.changedTouches[0]?.clientX??slideStart)-slideStart;slideStart=null;if(Math.abs(dx)>28){e.preventDefault();chooseLane(selectedLane+(dx>0?-1:1));}};field.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();chooseLane(selectedLane+(e.key==='ArrowLeft'?-1:1));}if(e.key==='Enter'||e.key===' '){e.preventDefault();submitLane(selectedLane);}};}

 };
 if(ctx.solo){info={players:{solo:{name:S.name||'You',avatar:g7Profile(),answers:selfAnswers}}};}
 else {const off=onValue(fbPath('gameRooms/'+ctx.code),snap=>{const r=snap.val();if(!r||r.round!==round||r.state!=='playing'){stopped=true;clearInterval(timer);off();if(location.hash==='#games/room-'+ctx.code)g7Room(v,ctx.code);return;}info=r;last='';render();},e=>toast('Sync error: '+(e.code||e.message)));cleanup=()=>{stopped=true;clearInterval(timer);off();};}
 timer=setInterval(render,150);render();if(ctx.solo)cleanup=()=>{stopped=true;clearInterval(timer);};
}
function g7Solo(v,mode){if(!G7_MODES.some(m=>m.id===mode))return vGames7(v);if(!BANK.length&&!(mode==='story'&&CASESETS.length)){v.innerHTML='<div class="empty">Select a subject with questions first.</div>';return;}g7Play(v,{solo:true,mode,seed:Math.floor(Math.random()*1e9),count:mode==='story'?5:10,duration:15000,players:{},startAt:sNow()+2500,round:1,me:'solo'});}
async function g7Room(v,code){if(!/^[A-Z2-9]{5}$/.test(code||'')){v.innerHTML='<div class="empty">Invalid room code. <a href="#games">Go back</a></div>';return;}if(!online||!uid){v.innerHTML='<div class="empty">Firebase connection required for live games. <a href="#games">Try solo instead</a></div>';return;}
 let off=null,room=null,closed=false,last='',starting=false;v.innerHTML='<div class="g7-wrap panel">Connecting to the game room…</div>';
 const snap=await get(fbPath('gameRooms/'+code)).catch(()=>null);if(!snap?.exists()){v.innerHTML='<div class="empty">Room not found or unavailable. <a href="#games">All game modes</a></div>';return;}room=snap.val();if(room.subj!==SUBJ.id){await loadSubject(room.subj);}if(!room.players?.[uid]){
 if(room.state!=='waiting'){v.innerHTML='<div class="empty">This game has already started. <a href="#games">Back</a></div>';return;}
 let seat=-1;for(let i=1;i<Math.min(4,room.maxPlayers);i++){try{const r=await runTransaction(fbPath(`gameRooms/${code}/seats/${i}`),cur=>cur===null?uid:undefined,{applyLocally:false});if(r.committed){seat=i;break;}}catch(e){toast('Joining: '+(e.code||e.message));break;}}if(seat<0){v.innerHTML='<div class="empty">Room full or Firebase rules not yet published. <a href="#games">Back</a></div>';return;}
 try{await set(fbPath(`gameRooms/${code}/players/${uid}`),{name:S.name||'Player',avatar:g7Profile()});}catch(e){v.innerHTML=`<div class="empty">Couldn't join: ${esc(e.code||e.message)}</div>`;return;}
 }
 const draw=()=>{if(closed||!room)return;const ids=Object.values(room.seats||{}).filter(id=>room.players?.[id]);const host=room.host===uid;const key=JSON.stringify([room.state,room.round,ids,room.seed,room.startAt]);if(key===last)return;last=key;
 if(room.state==='playing'&&room.startAt){if(starting)return;starting=true;if(off)off();off=null;g7Play(v,{mode:room.mode,seed:room.seed,count:room.count,duration:room.duration,code,round:room.round,startAt:room.startAt,me:uid,host:room.host,solo:false});return;}
 const m=G7_MODES.find(x=>x.id===room.mode)||G7_MODES[0];v.innerHTML=`<div class="g7-wrap"><div class="g7-lobby panel"><div class="g7-kicker">PRIVATE GAME ROOM · ${esc(code)}</div><h1>${m.icon} ${m.name}</h1><p>Host starts after everyone joins. Backgrounding your browser will not start the match.</p><div class="g7-seats">${Array.from({length:room.maxPlayers},(_,i)=>{const id=room.seats?.[i],person=room.players?.[id];return `<div class="g7-seat">${person?g7Avatar(person.avatar?.color||0,person.avatar?.hair||0):'<div class="g7-seat-empty">+</div>'}<strong>${person?esc(person.name):'Open seat'}</strong><small>${i===0?'👑 HOST':id===uid?'YOU':person?'READY':'INVITE'}</small></div>`}).join('')}</div><div class="g7-meta">${ids.length}/${room.maxPlayers} players · ${room.count} questions · ${room.duration/1000}s each</div><div class="g7-actions"><button class="btn primary" id="g7Share">Share invitation</button><button class="btn" id="g7Copy">Copy link</button>${host?`<button class="btn primary" id="g7Start" ${ids.length<2?'disabled':''}>Start game</button>`:''}<a class="btn ghost" href="#games">Leave</a></div></div></div>`;
 const link=shareLink('#games/room-'+code);$('#g7Share',v).onclick=()=>shareText('🎮 Join my Boardroom game! Code '+code,link);$('#g7Copy',v).onclick=()=>navigator.clipboard?.writeText(link).then(()=>toast('Invite copied')).catch(()=>window.prompt('Copy link',link))||window.prompt('Copy link',link);
 if(host)$('#g7Start',v).onclick=async()=>{if(ids.length<2)return;const b=$('#g7Start',v);b.disabled=true;try{await update(fbPath('gameRooms/'+code),{state:'playing',startAt:sNow()+4000});}catch(e){toast('Cannot start: '+(e.code||e.message));b.disabled=false;}};
 };
 off=onValue(fbPath('gameRooms/'+code),snap=>{if(closed)return;room=snap.val();if(!room){v.innerHTML='<div class="empty">Room closed.</div>';return;}draw();},e=>{v.innerHTML=`<div class="empty">Firebase: ${esc(e.code||e.message)}</div>`;});cleanup=()=>{closed=true;if(off)off();};
}
