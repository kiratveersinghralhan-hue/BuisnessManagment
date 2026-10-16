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

/* ================= content ================= */
const NOTES = window.NOTES, UNITS = window.UNITS;
const NOTE = Object.fromEntries(NOTES.map(n => [n.id, n]));
const toQ = (r, prefix = "") => ({ id: hash(prefix + r[1]), t: r[0], q: r[1], c: r[2], w: r[3], e: r[4] });
const BANK = window.QBANK_RAW.map(r => toQ(r));
const CASESETS = window.CASESETS.map(cs => ({ ...cs, qs: cs.qs.map(r => toQ([cs.topics[0], ...r], cs.id)) }));
const CASES = window.CASES;
const unitOf = t => NOTE[t]?.unit;
const prepOpts = q => { const opts = shuffle([q.c, ...q.w]); return { ...q, opts, ans: opts.indexOf(q.c) }; };

/* ================= state ================= */
const KEY = "cr_state_v1";
const blank = () => ({ name: "", createdAt: Date.now(), studySec: 0, notesRead: {}, mcqA: 0, mcqC: 0, topics: {}, correct: {}, wrong: {}, mockBest: 0, mockCount: 0, mockXp: 0, casesDone: {}, days: {} });
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
  { id: "N", e: "📚", n: "Full syllabus", d: "Finish all 25 topic notes", t: s => count(s.notesRead) >= NOTES.length },
  { id: "s", e: "⚡", n: "Sharpshooter", d: "100 different questions right", t: s => count(s.correct) >= 100 },
  { id: "m", e: "⏱️", n: "Exam ready", d: "Complete a full mock test", t: s => s.mockCount >= 1 },
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
        if (removedSnap && removedSnap.exists() && !nameSnap.exists()) { S = blank(); save(); }
        const remote = userSnap.val();
        if (remote) {
          // merge: remote is the source of truth, keep any larger local counters
          const merged = Object.assign(blank(), remote);
          for (const k of ["notesRead", "topics", "correct", "wrong", "casesDone", "days"]) merged[k] = Object.assign({}, S[k], remote[k] || {});
          for (const k of ["studySec", "mcqA", "mcqC", "mockBest", "mockCount", "mockXp"]) merged[k] = Math.max(remote[k] || 0, S[k] || 0);
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
  $("#avatarTop").textContent = S.name ? initials(S.name) : "?";
}
let cur = "home", cleanup = null;
function route(soft) {
  const [r, p] = (location.hash || "#home").slice(1).split("/");
  if (soft && (r !== cur)) return;
  if (soft && r === "home") { const h = $("#rankStat"); if (h) h.textContent = myRank(); return; }
  if (cleanup) { cleanup(); cleanup = null; }
  cur = r || "home";
  $$("[data-r]").forEach(a => a.classList.toggle("on", a.dataset.r === cur || (cur === "q" && a.dataset.r === "practice")));
  const v = $("#view");
  const views = { home: vHome, notes: vNotes, note: vNote, practice: vPractice, q: vQuiz, mock: vMock, cases: vCases, case: vCase, ranks: vRanks, me: vMe, guide: vGuide };
  (views[cur] || vHome)(v, p ? decodeURIComponent(p) : undefined);
  if (!soft) { scrollTo(0, 0); }
}
addEventListener("hashchange", () => route());

/* ================= views ================= */
function myRank() {
  if (!uid || !lbData[uid]) return "–";
  const arr = Object.entries(lbData).sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0));
  return "#" + (arr.findIndex(e => e[0] === uid) + 1);
}
function unitProgress(u) {
  const ts = NOTES.filter(n => n.unit === u.id);
  const read = ts.filter(n => S.notesRead[n.id]).length;
  let a = 0, c = 0; ts.forEach(n => { const t = S.topics[n.id]; if (t) { a += t.a; c += t.c; } });
  return { read, total: ts.length, acc: a ? Math.round(c / a * 100) : null };
}
function vHome(v) {
  const first = (S.name || "there").split(" ")[0];
  const next = NOTES.find(n => !S.notesRead[n.id]);
  v.innerHTML = `
  <section class="hero">
    <canvas id="heroCanvas" aria-hidden="true"></canvas>
    <div class="greet">Hi ${esc(first)} 👋</div>
    <h1>Crack the case, not just the syllabus.</h1>
    <p>Notes from all 23 lectures, ${BANK.length} scenario MCQs and 90-minute case-based mock tests, built for ma'am's exam style.</p>
    <div class="row"><a class="btn primary" href="#mock">Start a mock test</a><a class="btn ghost" href="#practice">Quick practice</a></div>
  </section>
  <div class="stats">
    <div class="stat"><div class="v num">${xpOf(S).toLocaleString("en-IN")}</div><div class="l">XP earned</div></div>
    <div class="stat"><div class="v num" id="rankStat">${myRank()}</div><div class="l">Class rank</div></div>
    <div class="stat"><div class="v num">${streakOf(S.days)}🔥</div><div class="l">Day streak</div></div>
    <div class="stat"><div class="v num">${S.mockBest ? S.mockBest + "%" : "–"}</div><div class="l">Best mock</div></div>
  </div>
  <div class="actions">
    ${next ? `<a class="action feature" href="#note/${next.id}"><span class="ic" style="margin:0;font-size:28px">📖</span><div><b>Continue: ${esc(next.title)}</b><br><span>${esc(next.lec)} · ${esc(UNITS.find(u => u.id === next.unit).name)}</span></div></a>`
      : `<a class="action feature" href="#mock"><span class="ic" style="margin:0;font-size:28px">🏁</span><div><b>All notes done. Time for a full mock.</b><br><span>90 minutes, case-based</span></div></a>`}
    <a class="action" href="#q/quick"><span class="ic">⚡</span><b>Quick 10</b><span>Random scenario MCQs</span></a>
    <a class="action" href="#q/weak"><span class="ic">🎯</span><b>Fix mistakes</b><span>${count(S.wrong)} to retry</span></a>
    <a class="action" href="#cases"><span class="ic">🧠</span><b>Case studies</b><span>Write, then compare</span></a>
    <a class="action" href="#guide"><span class="ic">🗝️</span><b>Answer method</b><span>How to crack cases</span></a>
  </div>
  <div class="section-head"><h2>Your syllabus</h2><span class="live"><i></i><span id="liveCount">${liveCount()}</span></span></div>
  <div class="units">${UNITS.map(u => { const p = unitProgress(u); return `<a class="unit-card" href="#notes" style="text-decoration:none;color:inherit"><div class="dim" style="font-size:13px">${u.name} · ${u.lectures}</div><div class="t">${u.title}</div><div class="bar"><i style="width:${p.read / p.total * 100}%"></i></div><div class="row" style="margin-top:8px;font-size:13px"><span class="muted">${p.read}/${p.total} topics read</span><span class="spacer"></span><span class="muted">${p.acc === null ? "No quiz yet" : p.acc + "% accuracy"}</span></div></a>`; }).join("")}</div>
  <p class="foot">Made for the CBS Principles of Business &amp; Management batch, 2026-27</p>`;
  cleanup = heroScene($("#heroCanvas"));
}

function vGuide(v) {
  v.innerHTML = `<article class="note"><div class="crumb"><a href="#notes">Notes</a> / Answer method</div><h2>How to answer case questions</h2><div class="note-body">${window.CASE_GUIDE}</div>
  <div class="note-foot"><a class="btn primary" href="#cases">Try a case study</a><a class="btn" href="#q/quick">Practise MCQs</a></div></article>`;
}

function vNotes(v) {
  v.innerHTML = `<h2>Notes</h2><p class="muted">Every topic from Lectures 1–23. Finish a topic to earn 15 XP.</p>
  <a class="guide-card" href="#guide"><span style="font-size:30px">🗝️</span><div><b>Read first: how to crack case questions</b><span class="muted">Read → identify → analyse → recommend</span></div></a>
  ${UNITS.map(u => `<section class="unit-block"><h3>${u.name}: ${u.title} <small>${u.lectures}</small></h3><div class="topic-list">
    ${NOTES.filter(n => n.unit === u.id).map(n => `<a class="topic ${S.notesRead[n.id] ? "done" : ""}" href="#note/${n.id}"><span class="lec">${n.lec}</span><span><span class="tt">${esc(n.title)}</span><span class="ts">${esc(n.sum)}</span></span><span class="chk">${S.notesRead[n.id] ? "✓" : ""}</span></a>`).join("")}
  </div></section>`).join("")}`;
}

function vNote(v, id) {
  const n = NOTE[id]; if (!n) return vNotes(v);
  const i = NOTES.indexOf(n), prev = NOTES[i - 1], next = NOTES[i + 1];
  const qn = BANK.filter(q => q.t === id).length;
  v.innerHTML = `<article class="note"><div class="crumb"><a href="#notes">Notes</a> / ${UNITS.find(u => u.id === n.unit).name} / ${n.lec}</div>
  <h2>${esc(n.title)}</h2><p class="muted">${esc(n.sum)}</p>
  <div class="note-body">${n.html}</div>
  <div class="note-foot">
    <button class="btn ${S.notesRead[id] ? "" : "primary"}" id="doneBtn">${S.notesRead[id] ? "✓ Finished" : "Mark as finished"}</button>
    <a class="btn" href="#q/t:${id}">Practise ${qn} questions</a>
  </div>
  <div class="pager">${prev ? `<a href="#note/${prev.id}"><small>Previous</small>${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a class="next" href="#note/${next.id}"><small>Next</small>${esc(next.title)}</a>` : ""}</div></article>`;
  $("#doneBtn").onclick = e => { markNote(id); e.target.textContent = "✓ Finished"; e.target.classList.remove("primary"); };
}

/* ---------- practice ---------- */
let pickTopics = new Set(), pickCount = 10, pickMode = "all";
function vPractice(v) {
  const draw = () => {
    const pool = poolFor();
    v.innerHTML = `<h2>Practice</h2><p class="muted">Scenario MCQs with instant explanations. Each new question you get right earns 4 XP.</p>
    <div class="actions" style="margin-bottom:18px">
      <a class="action" href="#q/quick"><span class="ic">⚡</span><b>Quick 10</b><span>Random mix</span></a>
      <a class="action" href="#q/weak"><span class="ic">🎯</span><b>Fix mistakes</b><span>${count(S.wrong)} waiting</span></a>
      <a class="action" href="#q/unseen"><span class="ic">✨</span><b>Unseen only</b><span>${BANK.length - count(S.correct) - count(S.wrong)} left</span></a>
      <a class="action" href="#mock"><span class="ic">⏱️</span><b>Full mock</b><span>90 minutes</span></a>
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
    <div class="qcard"><div class="qtopic">${esc(NOTE[q.t].title)}</div><div class="qtext">${esc(q.q)}</div>
    <div class="opts">${q.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>
    <div id="exp"></div></div>
    <div class="qnav"><a class="btn ghost" href="#practice">Quit</a><button class="btn primary hidden" id="nextQ">${i + 1 < list.length ? "Next question" : "See results"}</button></div></div>`;
    $$(".opt", v).forEach(b => b.onclick = () => {
      if (picked !== null) return; picked = +b.dataset.k; const ok = picked === q.ans; if (ok) score++;
      $$(".opt", v).forEach((x, k) => { x.disabled = true; if (k === q.ans) x.classList.add("right"); else if (k === picked) x.classList.add("wrong"); });
      $("#exp").innerHTML = `<div class="explain"><b class="${ok ? "ok" : "no"}">${ok ? "Correct." : "Not quite."}</b> ${esc(q.e)} <a href="#note/${q.t}">Revise topic</a></div>`;
      $("#nextQ").classList.remove("hidden"); $("#nextQ").focus();
      log.push({ q, ok }); recordAnswer(q, ok);
    });
    $("#nextQ").onclick = () => { i++; picked = null; i < list.length ? draw() : done(); };
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
const MOCK_KEY = "cr_mock_v1", MOCK_SEC = 90 * 60;
function buildPaper() {
  const per = { u1: 9, u2: 9, u3: 12 }, A = [];
  for (const [u, n] of Object.entries(per)) {
    // spread across topics: round-robin through shuffled topics
    const topics = shuffle(NOTES.filter(x => x.unit === u).map(x => x.id));
    const pools = Object.fromEntries(topics.map(t => [t, shuffle(BANK.filter(q => q.t === t))]));
    let k = 0; while (A.filter(q => unitOf(q.t) === u).length < n) { const t = topics[k++ % topics.length]; const q = pools[t].pop(); if (q) A.push(q); }
  }
  const sets = shuffle(CASESETS).slice(0, 2);
  const items = shuffle(A).map(q => ({ sec: "A", ...prepOpts(q) }));
  sets.forEach(s => s.qs.forEach(q => items.push({ sec: "B", set: s.id, ...prepOpts(q) })));
  const c = CASES[Math.floor(Math.random() * CASES.length)];
  return { items, sets: sets.map(s => s.id), written: c.id, startedAt: Date.now(), endsAt: Date.now() + MOCK_SEC * 1000, ans: {}, flags: {}, text: {}, i: 0 };
}
function vMock(v) {
  const m = LS.get(MOCK_KEY, null);
  if (m && !m.done) return runMock(v, m);
  const last = LS.get("cr_mock_last", null);
  v.innerHTML = `<div class="mock-intro"><h2>Mock test</h2><p class="muted">Exam conditions: 90 minutes, mostly scenario and case-based, like ma'am said. Every paper is freshly mixed from all three units.</p>
  <div class="structure">
    <div><span class="sec">A</span><span><b>30 scenario MCQs · 30 marks</b><span>Short business situations across all topics (Unit 1: 9, Unit 2: 9, Unit 3: 12)</span></span></div>
    <div><span class="sec">B</span><span><b>2 case studies × 5 questions · 10 marks</b><span>Read a full case, then answer linked questions</span></span></div>
    <div><span class="sec">C</span><span><b>1 descriptive case · self-check</b><span>Write your answer, then compare with the model answer. Not auto-scored</span></span></div>
  </div>
  <div class="panel"><b>Rules</b><ul style="margin:8px 0 0;padding-left:1.2em;color:var(--muted);font-size:15px"><li>The timer keeps running if you close the app; your answers are saved on this phone.</li><li>Jump between questions with the palette; flag ones to revisit.</li><li>The paper submits automatically at 00:00.</li><li>Your score counts towards the leaderboard (best mock %) and earns XP.</li></ul></div>
  <button class="btn primary block" id="startMock">Start the 90-minute mock</button>
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
    const inC = m.i === n;
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
    <div class="qnav"><button class="btn" id="prevQ" ${m.i === 0 ? "disabled" : ""}>Back</button>${inC ? "" : `<button class="btn ghost" id="flagQ">${m.flags[m.i] ? "Unflag" : "Flag"}</button>`}${inC ? `<button class="btn primary" id="submitQ">Submit paper</button>` : `<button class="btn primary" id="nextQ">${m.i + 1 === n ? "Go to Section C" : "Next"}</button>`}</div></div>`;
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
    <div class="row" style="margin-top:16px"><button class="btn" data-j="${n}">Section C</button><span class="spacer"></span><button class="btn primary" data-s>Submit paper</button></div></div>`;
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
    const total = m.items.length, pct = Math.round(score / total * 100), dur = Math.min(MOCK_SEC, Math.round((Date.now() - m.startedAt) / 1000));
    S.mockCount++; S.mockXp += pct; const newBest = pct > S.mockBest; S.mockBest = Math.max(S.mockBest, pct);
    const units = {}; m.items.forEach((it, k) => { const u = unitOf(it.t); units[u] = units[u] || { a: 0, c: 0 }; units[u].a++; if (m.ans[k] === it.ans) units[u].c++; });
    const res = { score, total, pct, dur, byT, units, review, written: m.written, text: m.text, ts: Date.now(), auto: !!auto };
    LS.set("cr_mock_last", res); LS.del(MOCK_KEY);
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
function vCases(v) {
  v.innerHTML = `<h2>Case studies</h2><p class="muted">Long-answer practice. Write your answer first, then open the model answer to compare. Finishing a case earns 20 XP.</p>
  <a class="guide-card" href="#guide"><span style="font-size:30px">🗝️</span><div><b>Answer method</b><span class="muted">Problem → framework → analysis → recommendations</span></div></a>
  <div class="topic-list">${CASES.map(c => `<a class="topic ${S.casesDone[c.id] ? "done" : ""}" href="#case/${c.id}"><span><span class="tt">${esc(c.title)}</span><span class="ts">${c.qs.length} questions · ${c.topics.map(t => esc(shortTitle(NOTE[t]))).join(", ")}</span></span><span class="chk">${S.casesDone[c.id] ? "✓" : ""}</span></a>`).join("")}</div>`;
}
function vCase(v, id) {
  const c = CASES.find(x => x.id === id); if (!c) return vCases(v);
  const store = LS.get("cr_case_ans", {}); store[id] = store[id] || {};
  v.innerHTML = `<article class="note"><div class="crumb"><a href="#cases">Case studies</a></div><h2>${esc(c.title)}</h2>
  <div class="casebox">${esc(c.text)}</div>
  ${c.qs.map((q, k) => `<div class="qcard" style="margin-bottom:14px"><div class="qtext" style="font-size:18px">${k + 1}. ${esc(q[0])}</div>
  <textarea data-k="${k}" placeholder="Write your answer here. It's saved on this phone.">${esc(store[id][k] || "")}</textarea>
  <button class="btn small" style="margin-top:10px" data-show="${k}">Show model answer</button><div class="model hidden" id="m${k}"><b>Model answer</b>${q[1]}</div></div>`).join("")}
  <div class="note-foot"><button class="btn ${S.casesDone[id] ? "" : "primary"}" id="caseDone">${S.casesDone[id] ? "✓ Case finished" : "Mark case as finished"}</button><a class="btn" href="#cases">All cases</a></div></article>`;
  $$("textarea", v).forEach(t => t.oninput = () => { store[id][t.dataset.k] = t.value; LS.set("cr_case_ans", store); });
  $$("[data-show]", v).forEach(b => b.onclick = () => { $("#m" + b.dataset.show).classList.toggle("hidden"); b.textContent = $("#m" + b.dataset.show).classList.contains("hidden") ? "Show model answer" : "Hide model answer"; });
  $("#caseDone").onclick = e => { if (S.casesDone[id]) return; S.casesDone[id] = 1; fbUpdate({ [`users/${uid}/casesDone/${id}`]: 1 }); syncLB(); toast("+20 XP · case finished"); e.target.textContent = "✓ Case finished"; e.target.classList.remove("primary"); };
}

/* ---------- leaderboard ---------- */
let lbTab = "xp";
function vRanks(v) {
  const tabs = { xp: ["XP", r => r.xp || 0, x => x.toLocaleString("en-IN"), "XP"], best: ["Best mock", r => r.best || 0, x => x + "%", "best mock"], sec: ["Study time", r => r.sec || 0, fmtTime, "studied"], solved: ["Solved", r => r.solved || 0, x => x, "solved"] };
  const [, key, fmt, unit] = tabs[lbTab];
  const rows = Object.entries(lbData).filter(([id]) => namesData[id]).map(([id, r]) => ({ id, name: namesData[id], r, v: key(r) })).sort((a, b) => b.v - a.v || (b.r.xp || 0) - (a.r.xp || 0));
  const badgeStr = s => [...(s || "")].map(c => BADGES.find(b => b.id === c)?.e || "").join("");
  const top = rows.slice(0, 3), order = [top[1], top[0], top[2]];
  v.innerHTML = `<h2>Leaderboard</h2><p class="muted">Everyone in the class, ranked live. Earn XP by studying, reading notes, solving questions and taking mocks.</p>
  <div class="chips">${Object.entries(tabs).map(([k, t]) => `<button class="chip ${k === lbTab ? "on" : ""}" data-tab="${k}">${t[0]}</button>`).join("")}</div>
  ${!online ? `<div class="empty" style="margin-top:16px">The leaderboard needs an internet connection. Your progress is saved on this phone and will sync when you're back online.</div>` :
      !rows.length ? `<div class="empty" style="margin-top:16px">No one on the board yet. Answer a few questions to claim the top spot.</div>` : `
  <div class="podium">${order.map((x, k) => x ? `<div class="pod p${[2, 1, 3][k]}"><div class="face">${esc(initials(x.name))}</div><div class="nm">${esc(x.name.split(" ")[0])}${x.id === uid ? " (you)" : ""}</div><div class="sc num">${fmt(x.v)}</div><div class="block">${[2, 1, 3][k]}</div></div>` : "<div></div>").join("")}</div>
  <div class="lb-list">${rows.map((x, k) => `<div class="lb-row ${x.id === uid ? "me" : ""}"><span class="rk">${k + 1}</span><span><span class="nm">${esc(x.name)}${x.id === uid ? " (you)" : ""}</span>${isLive(presenceData[x.id]) ? '<span class="on-dot" title="Studying now"></span>' : ""} <span class="badges">${badgeStr(x.r.badges)}</span><br><span class="sub">${x.r.streak ? x.r.streak + "-day streak · " : ""}${x.r.acc || 0}% accuracy · ${x.r.mocks || 0} mocks</span></span><span class="val num">${fmt(x.v)}<small>${unit}</small></span></div>`).join("")}</div>`}`;
  $$("[data-tab]", v).forEach(b => b.onclick = () => { lbTab = b.dataset.tab; vRanks(v); });
}

/* ---------- profile ---------- */
function vMe(v) {
  const topics = NOTES.map(n => ({ n, t: S.topics[n.id] })).filter(x => x.t && x.t.a).map(x => ({ ...x, acc: Math.round(x.t.c / x.t.a * 100) })).sort((a, b) => a.acc - b.acc);
  v.innerHTML = `<div class="row" style="gap:16px;margin-bottom:18px"><div class="avatar" style="width:64px;height:64px;font-size:24px">${esc(initials(S.name))}</div><div><h2 style="margin:0">${esc(S.name || "Guest")}</h2><div class="muted" style="font-size:14px">Joined ${new Date(S.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · rank ${myRank()}</div></div></div>
  <div class="stats" style="margin-top:0"><div class="stat"><div class="v num">${fmtTime(S.studySec)}</div><div class="l">Study time</div></div><div class="stat"><div class="v num">${count(S.notesRead)}/${NOTES.length}</div><div class="l">Topics read</div></div><div class="stat"><div class="v num">${S.mcqA ? Math.round(S.mcqC / S.mcqA * 100) : 0}%</div><div class="l">Accuracy (${S.mcqA} answered)</div></div><div class="stat"><div class="v num">${S.mockCount}</div><div class="l">Mocks taken</div></div></div>
  <div class="section-head"><h2>Badges</h2></div>
  <div class="badge-grid">${BADGES.map(b => `<div class="badge ${b.t(S) ? "got" : ""}"><div class="e">${b.e}</div><b>${b.n}</b><span>${b.d}</span></div>`).join("")}</div>
  <div class="section-head"><h2>Weakest topics first</h2></div>
  ${topics.length ? `<div class="panel"><div class="breakdown">${topics.map(x => `<div class="bd-row"><a href="#q/weakt:${x.n.id}" style="color:inherit">${esc(x.n.title)}</a><span class="num" style="text-align:right">${x.acc}%</span><div class="bar ${x.acc >= 80 ? "good" : ""}"><i style="width:${x.acc}%"></i></div></div>`).join("")}</div><p class="muted" style="font-size:13.5px;margin:12px 0 0">Tap a topic to practise it.</p></div>` : `<div class="empty">Answer some questions to see your strongest and weakest topics.</div>`}
  <p class="foot">Your name is permanent. If it's wrong, ask the site admin to fix it.</p>`;
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
  let confirmStep = false;
  const submit = async () => {
    const name = inp.value.trim().replace(/\s+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (name.length < 3 || !/^[\p{L} .'-]+$/u.test(name)) { err.textContent = "Enter your real name using letters only (at least 3 characters)."; return; }
    if (!confirmStep) { confirmStep = true; inp.value = name; inp.readOnly = true; err.textContent = ""; go.textContent = `Yes, save "${name}" permanently`; $("#nmT").textContent = "Is this correct?"; const back = document.createElement("button"); back.className = "btn ghost block"; back.style.marginTop = "8px"; back.textContent = "Edit name"; back.onclick = () => { confirmStep = false; inp.readOnly = false; go.textContent = "Continue"; $("#nmT").textContent = "What's your name?"; back.remove(); inp.focus(); }; go.after(back); return; }
    go.disabled = true; S.name = name; save();
    if (online && uid) { try { await set(fbPath("names/" + uid), name); } catch (e) { console.warn(e); } syncLB(true); }
    el.remove(); renderTopbar(); toast(`Welcome, ${name.split(" ")[0]}!`); route();
  };
  go.onclick = submit; inp.onkeydown = e => { if (e.key === "Enter") submit(); };
}

/* ================= 3D: intro + hero ================= */
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
function playIntro() {
  return new Promise(resolve => {
    let seen = false; try { seen = sessionStorage.getItem("cr_intro"); } catch { }
    if (seen || reduced || !window.THREE) return resolve();
    try { sessionStorage.setItem("cr_intro", "1"); } catch { }
    const wrap = $("#intro"); wrap.classList.remove("hidden");
    try {
    const T = THREE, canvas = $("#introCanvas");
    const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: false });
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(innerWidth, innerHeight); r.setClearColor(0x061513);
    const scene = new T.Scene(); scene.fog = new T.Fog(0x061513, 14, 34);
    const cam = new T.PerspectiveCamera(45, innerWidth / innerHeight, .1, 100);
    scene.add(new T.AmbientLight(0x88aaa0, .55));
    const key = new T.DirectionalLight(0xffe3a6, 1.25); key.position.set(6, 12, 8); scene.add(key);
    const rim = new T.PointLight(0x5adba6, 1.2, 40); rim.position.set(-8, 5, -6); scene.add(rim);
    // growth city: a grid of bars that rise like a chart
    const N = 9, gap = 1.25, bars = [], geo = new T.BoxGeometry(1, 1, 1);
    for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
      const d = Math.hypot(x - (N - 1) / 2, z - (N - 1) / 2), h = Math.max(.3, (5.2 - d) * (0.6 + Math.random() * .8) + (x + z) * .12);
      const brass = d < 1.6;
      const mat = new T.MeshStandardMaterial({ color: brass ? 0xe7b758 : new T.Color().setHSL(.46, .35, .16 + Math.random() * .12), metalness: brass ? .7 : .2, roughness: brass ? .3 : .6 });
      const m = new T.Mesh(geo, mat); m.position.set((x - (N - 1) / 2) * gap, 0, (z - (N - 1) / 2) * gap); m.scale.set(.9, .01, .9);
      m.userData = { h, delay: d * .09 + Math.random() * .15 }; scene.add(m); bars.push(m);
    }
    const grid = new T.GridHelper(30, 30, 0x24514b, 0x16332f); grid.position.y = -.01; scene.add(grid);
    // particles
    const pg = new T.BufferGeometry(), P = 400, pos = new Float32Array(P * 3);
    for (let i = 0; i < P; i++) { pos[i * 3] = (Math.random() - .5) * 30; pos[i * 3 + 1] = Math.random() * 14; pos[i * 3 + 2] = (Math.random() - .5) * 30; }
    pg.setAttribute("position", new T.BufferAttribute(pos, 3));
    const pts = new T.Points(pg, new T.PointsMaterial({ color: 0xf5d896, size: .06, transparent: true, opacity: .7 })); scene.add(pts);
    const t0 = performance.now(), DUR = 4200; let raf, ended = false;
    const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
    const end = () => { if (ended) return; ended = true; wrap.classList.add("out"); setTimeout(() => { cancelAnimationFrame(raf); r.dispose(); wrap.remove(); }, 750); resolve(); };
    const loop = now => {
      const t = (now - t0) / 1000;
      bars.forEach(b => { const k = ease((t - b.userData.delay) / 1.3); b.scale.y = .01 + b.userData.h * k; b.position.y = b.scale.y / 2; });
      const a = .6 + t * .32, rad = 15 - ease(t / 3) * 3;
      cam.position.set(Math.cos(a) * rad, 9 - ease(t / 3) * 2.5, Math.sin(a) * rad); cam.lookAt(0, 1.6, 0);
      pts.rotation.y = t * .05;
      r.render(scene, cam);
      if (t > 1.5) wrap.classList.add("show-title");
      if (now - t0 > DUR) return end();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    $("#skipIntro").onclick = end; wrap.onclick = e => { if (e.target.id !== "skipIntro" && performance.now() - t0 > 1200) end(); };
    addEventListener("resize", () => { if (ended) return; r.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });
    } catch (e) { console.warn("intro skipped", e); wrap.remove(); resolve(); }
  });
}
function heroScene(canvas) {
  if (!canvas || !window.THREE) return null;
  try { return heroSceneInner(canvas); } catch (e) { console.warn("hero 3D skipped", e); return null; }
}
function heroSceneInner(canvas) {
  const T = THREE, w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
  const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(w, h, false);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(40, w / h, .1, 50); cam.position.set(0, 0, 7.5);
  scene.add(new T.AmbientLight(0x9fc0b8, .5));
  const l1 = new T.DirectionalLight(0xffe0a0, 1.3); l1.position.set(3, 4, 5); scene.add(l1);
  const l2 = new T.PointLight(0x5adba6, 1.4, 20); l2.position.set(-4, -2, 3); scene.add(l2);
  const group = new T.Group(); scene.add(group);
  // a faceted "case" gem: solid core + brass wire cage + orbiting rings of data points
  const core = new T.Mesh(new T.IcosahedronGeometry(1.35, 0), new T.MeshStandardMaterial({ color: 0x1b4a43, metalness: .55, roughness: .28, flatShading: true }));
  const cage = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(1.9, 1)), new T.LineBasicMaterial({ color: 0xe7b758, transparent: true, opacity: .85 }));
  group.add(core, cage);
  const ring = new T.Group(); const dotG = new T.SphereGeometry(.06, 10, 10), dotM = new T.MeshBasicMaterial({ color: 0xf5d896 });
  for (let i = 0; i < 36; i++) { const d = new T.Mesh(dotG, dotM); const a = i / 36 * Math.PI * 2; d.position.set(Math.cos(a) * 2.6, Math.sin(a * 3) * .18, Math.sin(a) * 2.6); ring.add(d); }
  ring.rotation.x = .45; group.add(ring);
  let mx = 0, my = 0, raf;
  const mv = e => { const p = e.touches ? e.touches[0] : e; mx = (p.clientX / innerWidth - .5); my = (p.clientY / innerHeight - .5); };
  addEventListener("pointermove", mv, { passive: true });
  const t0 = performance.now();
  const loop = now => {
    const t = (now - t0) / 1000;
    core.rotation.set(t * .25, t * .35, 0); cage.rotation.set(-t * .12, t * .18, t * .05); ring.rotation.y = t * .4;
    group.rotation.x += ((my * .5) - group.rotation.x) * .05; group.rotation.y += ((mx * .8) - group.rotation.y) * .05;
    group.position.y = Math.sin(t * 1.1) * .12;
    r.render(scene, cam); if (!reduced) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); removeEventListener("pointermove", mv); r.dispose(); };
}

/* ================= boot ================= */
(async function boot() {
  renderTopbar(); setSync("");
  route();
  await playIntro().catch(() => { });
  initFirebase();
  // if Firebase never connects, still ask for the name locally
  setTimeout(() => { if (!S.name && !$(".modal")) askName(); }, online ? 0 : 6000);
})();
