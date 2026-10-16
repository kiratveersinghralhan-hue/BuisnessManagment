import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, increment, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
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
const blank = () => ({ name: "", createdAt: Date.now(), studySec: 0, notesRead: {}, mcqA: 0, mcqC: 0, topics: {}, correct: {}, wrong: {}, mockBest: 0, mockCount: 0, mockXp: 0, casesDone: {}, days: {}, saved: {}, mynotes: {}, papers: 0 });
let S = Object.assign(blank(), LS.get(KEY, {}));
const save = () => LS.set(KEY, S);
let uid = null, db = null, online = false, lbData = {}, namesData = {}, presenceData = {};

const count = o => Object.keys(o || {}).length;
const xpOf = s => Math.floor((s.studySec || 0) / 60) + 15 * count(s.notesRead) + 4 * count(s.correct) + (s.mockXp || 0) + 20 * count(s.casesDone);
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
  { id: "K", e: "💎", n: "7-day streak", d: "Study 7 days in a row", t: s => streakOf(s.days) >= 7 }
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
    set(fbPath("lb/" + uid), { xp: xpOf(S), best: S.mockBest || 0, mocks: S.mockCount || 0, solved: count(S.correct), acc, sec: S.studySec || 0, notes: count(S.notesRead), streak: streakOf(S.days), badges: badgesOf(S), ts: serverTimestamp() }).catch(e => console.warn(e));
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
          for (const k of ["notesRead", "topics", "correct", "wrong", "casesDone", "days", "saved", "mynotes"]) merged[k] = Object.assign({}, S[k], remote[k] || {});
          for (const k of ["studySec", "mcqA", "mcqC", "mockBest", "mockCount", "mockXp", "papers"]) merged[k] = Math.max(remote[k] || 0, S[k] || 0);
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
  fbUpdate(u); syncLB();
}
function markNote(id) {
  if (S.notesRead[id]) return;
  S.notesRead[id] = Date.now(); fbUpdate({ [`users/${uid}/notesRead/${id}`]: Date.now() }); syncLB(); toast("+15 XP · topic finished");
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
  const group = { q: "practice", cases: "practice", case: "practice", written: "practice", mock: "exam", paper: "exam", note: "notes", guide: "notes", videos: "notes" };
  $$("[data-r]").forEach(a => a.classList.toggle("on", a.dataset.r === cur || group[cur] === a.dataset.r));
  const v = $("#view");
  const views = { home: vHome, notes: vNotes, note: vNote, practice: vPractice, q: vQuiz, mock: vMock, cases: vCases, case: vCase, written: vWritten, ranks: vRanks, me: vMe, guide: vGuide, exam: vExam, paper: vPaper, videos: vVideos };
  (views[cur] || vHome)(v, p ? decodeURIComponent(p) : undefined);
  if (!soft) { scrollTo({ top: 0, behavior: "instant" }); v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter"); showBars(); }
  document.body.classList.toggle("focus", cur === "q" || cur === "paper"); moveNavInd(); reveal(v);
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
    if (!["mock", "q", "paper"].includes(cur)) { if (down && y > 120) { $("#topBar").classList.add("hide"); $("#bottomNav").classList.add("hide"); } else if (up || y < 60) showBars(); }
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
    a.xp += r.xp || 0; a.best = Math.max(a.best, r.best || 0); a.mocks += r.mocks || 0; a.solved += r.solved || 0; a.sec += r.sec || 0;
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
  ${examBanner()}
  ${SUBJECTS.filter(x => x.id !== SUBJ.id && x.exam?.date && daysTo(x.exam.date) >= 0).map(x => `<button class="other-exam" data-sw="${x.id}">${x.icon} ${esc(x.short)} exam in ${daysTo(x.exam.date)} days <span>Switch ›</span></button>`).join("")}
  <div class="stats">
    <div class="stat"><div class="v num" id="homeXp">${xpOf(S).toLocaleString("en-IN")}</div><div class="l">XP earned</div></div>
    <div class="stat"><div class="v num" id="rankStat">${myRank()}</div><div class="l">Class rank</div></div>
    <div class="stat"><div class="v num">${streakOf(S.days)}🔥</div><div class="l">Day streak</div></div>
    <div class="stat"><div class="v num">${S.mockBest ? S.mockBest + "%" : "–"}</div><div class="l">Best mock</div></div>
  </div>
  <div class="actions">
    ${!NOTES.length ? "" : next ? `<a class="action feature" href="#note/${next.id}"><span class="ic">📖</span><div><b>Continue: ${esc(next.title)}</b><br><span>${esc(next.lec)} · ${esc(UNITS.find(u => u.id === next.unit).name)}</span></div></a>`
      : `<a class="action feature" href="#mock"><span class="ic">🏁</span><div><b>All notes done. Time for a full mock.</b><br><span>90 minutes, case-based</span></div></a>`}
    <a class="action c1" href="#q/quick"><span class="ic">⚡</span><b>Quick 10</b><span>Random scenario MCQs</span></a>
    <a class="action c2" href="#q/weak"><span class="ic">🎯</span><b>Fix mistakes</b><span>${inBank(S.wrong)} to retry</span></a>
    <a class="action c4" href="#written"><span class="ic">✍️</span><b>Written practice</b><span>Answer, then self-mark</span></a>
    <a class="action c5" href="#videos"><span class="ic">▶️</span><b>Videos</b><span>${VIDEOS.length} picked by your teacher</span></a>
  </div>
  <div class="section-head"><h2>Your syllabus</h2><span class="live"><i></i><span id="liveCount">${liveCount()}</span></span></div>
  <div class="units ${UNITS.length > 3 ? "many" : ""}">${UNITS.map(u => { const p = unitProgress(u); return `<a class="unit-card ${u.id}" href="#notes" style="text-decoration:none;color:inherit"><div class="dim" style="font-size:13px">${u.name} · ${u.lectures}</div><div class="t">${u.title}</div><div class="bar"><i style="width:${p.read / p.total * 100}%"></i></div><div class="row" style="margin-top:8px;font-size:13px"><span class="muted">${p.read}/${p.total} topics read</span><span class="spacer"></span><span class="muted">${p.acc === null ? "No quiz yet" : p.acc + "% accuracy"}</span></div></a>`; }).join("")}</div>
  <p class="foot">Boardroom · a student-made study space for ${esc(PROGRAM.short || "BBA")} students, ${esc(PROGRAM.school || "")}</p>`;
  $("#heroSubj").onclick = () => pickSubject();
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
  v.innerHTML = `<h2>Notes</h2><p class="muted">${esc(SUBJ.name)} · every topic from the lectures so far. Finish a topic to earn 15 XP.</p>
  <div class="row" style="margin-bottom:14px"><a class="btn small" href="#videos">▶️ Videos</a><button class="btn small" id="printAll">🖨️ Save all notes as PDF</button></div>
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
    v.innerHTML = `<h2>Practice</h2><p class="muted">Scenario MCQs with instant explanations. Each new question you get right earns 4 XP.</p>
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
    <div class="qcard"><div class="row" style="align-items:flex-start"><div class="qtopic" style="flex:1">${esc(NOTE[q.t].title)}</div><button class="star ${S.saved[q.id] ? "on" : ""}" id="starQ" aria-label="Save question">${S.saved[q.id] ? "★" : "☆"}</button></div><div class="qtext">${esc(q.q)}</div>
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
    <div class="panel"><h3>Review</h3>${log.map(({ q, ok }) => `<div class="review-item"><div class="q">${esc(q.q)}</div><div class="a ${ok ? "ok" : "no"}">${ok ? "✓" : "✗"} ${esc(q.c)}</div><div class="a muted">${esc(q.e)}</div></div>`).join("")}</div></div>`;
    $("#again").onclick = e => { if (location.hash === "#q/quick") { e.preventDefault(); route(); } };
  };
  draw();
}

/* ---------- mock test ---------- */
const MOCK_SEC = 90 * 60; let MOCK_KEY = "cr_mock_v1";
/* split n questions across units in proportion to how many topics each unit has */
function perUnit(n) {
  const w = UNITS.map(u => NOTES.filter(x => x.unit === u.id && BANK.some(q => q.t === x.id)).length), tot = w.reduce((a, b) => a + b, 0) || 1;
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
      <div class="qcard"><div class="qtext">${esc(it.q)}</div><div class="opts">${it.opts.map((o, k) => `<button class="opt ${m.ans[m.i] === k ? "sel" : ""}" data-k="${k}"><span class="k">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div></div>`;
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
  <div class="panel"><h3>Review all answers</h3>${r.review.map((x, k) => `<div class="review-item"><div class="dim" style="font-size:12.5px">Q${k + 1} · Section ${x.sec} · ${esc(NOTE[x.t]?.title || "")}</div><div class="q">${esc(x.q)}</div>${x.ok ? `<div class="a ok">✓ ${esc(x.c)}</div>` : `<div class="a no">✗ ${x.yours ? esc(x.yours) : "Not answered"}</div><div class="a ok">Correct: ${esc(x.c)}</div>`}<div class="a muted">${esc(x.e)}</div></div>`).join("")}</div></div>`;
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
  const tabs = { xp: ["XP", r => r.xp || 0, x => x.toLocaleString("en-IN"), "XP"], best: ["Best mock", r => r.best || 0, x => x + "%", "best mock"], sec: ["Study time", r => r.sec || 0, fmtTime, "studied"], solved: ["Solved", r => r.solved || 0, x => x, "solved"] };
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
  const A = m.mcq.map(it => { let pre = ""; if (it.set && !sets[it.set]) { sets[it.set] = 1; const cs = CASESETS.find(c => c.id === it.set); pre = `<div class="p-case"><b>Read the case and answer the questions that follow:</b> ${esc(cs.title)}<br>${esc(cs.text)}</div>`; } n++; return `${pre}<div class="p-q"><b>${n}.</b> ${esc(it.q)}<ol type="a">${it.opts.map(o => `<li>${esc(o)}</li>`).join("")}</ol>${key ? `<div class="p-key">Answer: (${"abcd"[it.ans]}) ${esc(it.c)}</div>` : ""}</div>`; }).join("");
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
      return `${pre}<div class="pq"><div class="pq-t"><b>${n}.</b> ${esc(it.q)}</div><div class="opts">${it.opts.map((o, k) => `<button class="opt ${m.ans[i] === k ? "sel" : ""}" data-i="${i}" data-k="${k}"><span class="k">${"abcd"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div></div>`; }).join("")}</section>
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
    <section class="psec"><h3>Section A <small>${a}/${T.A}</small></h3><details><summary class="btn small">Review MCQs</summary>${m.mcq.map((it, i) => `<div class="review-item"><div class="q">${i + 1}. ${esc(it.q)}</div>${m.ans[i] === it.ans ? `<div class="a ok">✓ ${esc(it.c)}</div>` : `<div class="a no">✗ ${m.ans[i] === undefined ? "Not answered" : esc(it.opts[m.ans[i]])}</div><div class="a ok">Correct: ${esc(it.c)}</div>`}<div class="a muted">${esc(it.e)}</div></div>`).join("")}</details></section>
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
