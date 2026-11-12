import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, ADMIN_UID } from "./firebase-config.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const count = o => Object.keys(o || {}).length;
const fmtTime = sec => { sec = Math.max(0, Math.round(sec || 0)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? `${h}h ${m}m` : `${m}m`; };
const ago = ts => { if (!ts) return "never"; const s = (Date.now() - ts) / 1000; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago"; if (s < 86400) return Math.floor(s / 3600) + "h ago"; return Math.floor(s / 86400) + "d ago"; };
const dayKey = d => d.toLocaleDateString("en-CA");
const norm = n => (n || "").toLowerCase().replace(/[^\p{L}]/gu, "");
const safeId = s => /^[A-Za-z0-9_-]{1,64}$/.test(s || "");
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600); }

/* topic names from every subject with content */
let NOTES = [], NOTE = {};
const SUBJ = window.SUBJECTS || [];
const SUBJ_NAME = Object.fromEntries(SUBJ.map(x => [x.id, x.short || x.name]));
async function loadAllNotes() {
  window.SUBJECT_DATA = window.SUBJECT_DATA || {};
  await Promise.all(SUBJ.filter(x => x.file && !window.SUBJECT_DATA[x.id]).map(x => new Promise(r => { const el = document.createElement("script"); el.src = x.file + (x.v ? "?v=" + x.v : ""); el.onload = el.onerror = r; document.head.appendChild(el); })));
  NOTES = SUBJ.flatMap(x => (window.SUBJECT_DATA[x.id]?.notes || []).map(n => ({ ...n, subj: x.id, title: n.title + (SUBJ.filter(y => y.file).length > 1 ? ` · ${x.short || x.name}` : "") })));
  NOTE = Object.fromEntries(NOTES.map(n => [n.id, n]));
}

// separate named app: the admin login never replaces a student's anonymous login on the same phone
const app = initializeApp(firebaseConfig, "admin");
const auth = getAuth(app), db = getDatabase(app);
setPersistence(auth, browserSessionPersistence).catch(() => { }); // admin session ends when the browser tab closes
const R = p => ref(db, p);
const D = { names: {}, lb: {}, users: {}, attempts: {}, presence: {}, announce: {}, doubts: {} };
let subs = [], sortKey = "xp", sortDir = -1, q = "", filt = "all", section = "overview";
loadAllNotes().then(() => { if (isAdmin()) schedule(); });
const isAdmin = () => auth.currentUser && auth.currentUser.uid === ADMIN_UID;

/* ---------- sign-in with throttling ---------- */
const LOCK_KEY = "br_adm_lock";
const lockState = () => { try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { n: 0, until: 0 }; } catch { return { n: 0, until: 0 }; } };
const saveLock = s => { try { localStorage.setItem(LOCK_KEY, JSON.stringify(s)); } catch { } };
function loginView(msg = "") {
  document.body.classList.remove("adm-in");
  $("#admTop").innerHTML = ""; $("#admNav").innerHTML = "";
  $("#adm").innerHTML = `<div class="login modal-card"><div class="lock-ic">🔒</div><h2>Admin sign-in</h2><p class="muted">Only the site owner can see class analytics. Your session ends when you close this tab or after 20 minutes idle.</p>
  <label class="label" for="em">Email</label><input class="field" id="em" type="email" autocomplete="username" spellcheck="false">
  <label class="label" for="pw">Password</label><input class="field" id="pw" type="password" autocomplete="current-password">
  <div class="err" id="lerr">${esc(msg)}</div><button class="btn primary block" id="lgo">Sign in</button></div>`;
  const go = async () => {
    const L = lockState();
    if (Date.now() < L.until) { $("#lerr").textContent = `Too many attempts. Try again in ${Math.ceil((L.until - Date.now()) / 1000)} s.`; return; }
    $("#lgo").disabled = true; $("#lerr").textContent = "";
    try { await signInWithEmailAndPassword(auth, $("#em").value.trim(), $("#pw").value); saveLock({ n: 0, until: 0 }); }
    catch (e) {
      const n = L.n + 1, wait = n >= 5 ? Math.min(15 * 60, 30 * 2 ** (n - 5)) * 1000 : 0; saveLock({ n, until: Date.now() + wait });
      $("#lerr").textContent = e.code === "auth/too-many-requests" ? "Firebase blocked sign-in for a while after many attempts. Try later." : e.code === "auth/operation-not-allowed" ? "Turn on Email/Password sign-in in Firebase Authentication." : (n >= 5 ? `Wrong details. Locked for ${wait / 1000} s.` : "Wrong email or password.");
      $("#lgo").disabled = false; $("#pw").value = "";
    }
  };
  $("#lgo").onclick = go; $("#pw").onkeydown = e => e.key === "Enter" && go();
}
/* idle auto sign-out */
let idleT; const IDLE = 20 * 60000;
const bumpIdle = () => { clearTimeout(idleT); if (isAdmin()) idleT = setTimeout(() => { signOut(auth); toast("Signed out after 20 minutes idle"); }, IDLE); };
["pointerdown", "keydown", "scroll"].forEach(ev => addEventListener(ev, bumpIdle, { passive: true }));

onAuthStateChanged(auth, user => {
  subs.forEach(u => u()); subs = [];
  if (!user) return loginView();
  if (user.uid !== ADMIN_UID) { signOut(auth); return loginView("This account isn't the admin account."); }
  document.body.classList.add("adm-in"); bumpIdle();
  $("#admTop").innerHTML = `<span class="live"><i></i>Live</span><button class="btn small" id="csv">Export CSV</button><button class="btn small dark" id="out">Sign out</button>`;
  $("#out").onclick = () => signOut(auth); $("#csv").onclick = exportCSV;
  $("#adm").innerHTML = `<div class="adm-loading"><div class="spinner"></div><p class="muted">Loading class data…</p></div>`;
  for (const k of Object.keys(D)) subs.push(onValue(R(k), s => { D[k] = s.val() || {}; if (k === "presence" && ["anText", "anTitle", "srch"].includes(document.activeElement?.id)) return; schedule(); }, e => { $("#adm").innerHTML = `<div class="empty">Couldn't read <b>${esc(k)}</b>: ${esc(e.message)}.<br>Check that the database rules from database.rules.json are published.</div>`; }));
});
let rt; const schedule = () => { clearTimeout(rt); rt = setTimeout(() => { render(); autoMerge(); }, 150); };

/* students who registered the same name twice are combined into their oldest profile */
let merging = false;
async function autoMerge() {
  if (merging) return;
  const groups = {}; Object.entries(D.names).forEach(([id, n]) => (groups[norm(n)] = groups[norm(n)] || []).push(id));
  const dup = Object.values(groups).find(g => g.length > 1); if (!dup) return;
  merging = true;
  try { const keep = dup.slice().sort((a, b) => (D.users[a]?.createdAt || Infinity) - (D.users[b]?.createdAt || Infinity))[0]; for (const id of dup) if (id !== keep) await merge(id, keep); toast(`Combined duplicate profiles of ${D.names[keep] || "a student"}`); }
  catch (e) { console.warn("auto-merge failed", e); } finally { merging = false; }
}

/* ---------- data shaping ---------- */
const live = id => { const p = D.presence[id]; return p && p.on && Date.now() - (p.ts || 0) < 6 * 60000; };
function students() {
  const ids = new Set([...Object.keys(D.names), ...Object.keys(D.users)]);
  const dupKey = {}; Object.entries(D.names).forEach(([id, n]) => (dupKey[norm(n)] = dupKey[norm(n)] || []).push(id));
  return [...ids].filter(safeId).map(id => {
    const u = D.users[id] || {}, l = D.lb[id] || {}, at = D.attempts[id] || {};
    const lastSeen = Math.max(u.lastSeen || 0, D.presence[id]?.ts || 0, l.ts || 0);
    return { id, name: D.names[id] || "(no name yet)", named: !!D.names[id], u, l, live: live(id), page: D.presence[id]?.page || "", lastSeen, study: u.studySec || 0, notes: count(u.notesRead), ans: u.mcqA || 0, acc: u.mcqA ? Math.round((u.mcqC || 0) / u.mcqA * 100) : 0, mocks: u.mockCount || count(at), best: u.mockBest || 0, xp: l.xp || 0, cases: count(u.casesDone), wins: l.wins || u.wins || 0, joined: u.createdAt || 0, dup: D.names[id] && dupKey[norm(D.names[id])].length > 1 };
  });
}

/* ---------- charts ---------- */
function barChart(data, { h = 170, fmt = v => v } = {}) {
  const W = 560, H = h, pl = 30, pb = 22, pt = 8, max = Math.max(1, ...data.map(d => d.v));
  const nice = Math.ceil(max / 4) * 4 || 4, bw = (W - pl) / data.length, y = v => pt + (H - pt - pb) * (1 - v / nice);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  for (let i = 0; i <= 4; i++) { const v = nice / 4 * i; s += `<line class="gl" x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; }
  data.forEach((d, i) => {
    const x = pl + i * bw + 3, w = Math.max(2, bw - 6), top = y(d.v), bh = Math.max(0, H - pb - top), r = Math.min(5, w / 2, bh);
    const path = bh > 0 ? `M${x},${H - pb} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${H - pb} Z` : "";
    s += `<g data-tip="${esc(d.tip)}"><rect class="hit" x="${pl + i * bw}" y="${pt}" width="${bw}" height="${H - pt}"/>${path ? `<path class="bar ${i === data.length - 1 ? "today" : ""}" d="${path}"/>` : ""}</g>`;
    if (data.length <= 14 || i % 2 === 0) s += `<text x="${x + w / 2}" y="${H - 6}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  return s + "</svg>";
}
function bindTips(root) {
  const t = $("#tipPop");
  $$("[data-tip]", root).forEach(g => {
    g.onpointerenter = g.onpointermove = e => { t.textContent = g.dataset.tip; t.classList.add("show"); t.style.left = Math.min(innerWidth - t.offsetWidth - 8, e.clientX + 12) + "px"; t.style.top = (e.clientY - 38) + "px"; };
    g.onpointerleave = () => t.classList.remove("show");
  });
}
const hbar = (label, pct, val, low) => `<div class="hb"><span>${esc(label)}</span><span class="tr"><i class="${low ? "low" : ""}" style="width:${Math.max(0, Math.min(100, pct))}%"></i></span><span class="vv">${esc(val)}</span></div>`;

/* ---------- navigation ---------- */
const SECTIONS = [["overview", "Overview", "◎"], ["students", "Students", "👥"], ["learning", "Learning", "📚"], ["exams", "Exams", "📝"], ["community", "Community", "💬"], ["security", "Security", "🛡️"]];
function nav() {
  $("#admNav").innerHTML = SECTIONS.map(([k, l, i]) => `<button class="adm-link ${section === k ? "on" : ""}" data-s="${k}"><span class="ai">${i}</span><span>${l}</span>${k === "community" && pendingDoubts() ? `<em>${pendingDoubts()}</em>` : ""}</button>`).join("");
  $$("[data-s]", $("#admNav")).forEach(b => b.onclick = () => { section = b.dataset.s; try { history.replaceState(null, "", "#" + section); } catch { } render(); scrollTo({ top: 0, behavior: "smooth" }); });
}
const allDoubts = () => Object.entries(D.doubts).flatMap(([sj, m]) => Object.entries(m || {}).map(([id, d]) => ({ sj, id, ...d }))).filter(d => typeof d.text === "string");
const pendingDoubts = () => allDoubts().filter(d => !d.solved && Date.now() - (d.ts || 0) < 7 * 86400000).length;

/* ---------- render ---------- */
function render() {
  if (!isAdmin()) return;
  if (location.hash && SECTIONS.some(s => "#" + s[0] === location.hash) && !render._init) { section = location.hash.slice(1); }
  render._init = true;
  if (sheetId && !students().some(x => x.id === sheetId)) closeSheet();
  nav();
  const ctx = shape();
  const V = { overview, students: studentsView, learning, exams, community, security }[section] || overview;
  const keep = { t: $("#anTitle")?.value || "", x: $("#anText")?.value || "", f: document.activeElement?.id, srch: document.activeElement?.id === "srch" };
  $("#adm").innerHTML = `<div class="adm-sec">${V(ctx)}</div>`;
  bindTips($("#adm"));
  if (section === "community") { if ($("#anTitle")) { $("#anTitle").value = keep.t; $("#anText").value = keep.x; if (keep.f === "anText" || keep.f === "anTitle") $("#" + keep.f).focus(); } bindCommunity(); }
  if (section === "students") bindStudents(keep.srch);
  $$("[data-open]").forEach(el => el.onclick = () => openSheet(el.dataset.open));
  $$("[data-goto]").forEach(el => el.onclick = () => { section = el.dataset.goto; render(); });
}
function shape() {
  const st = students(), named = st.filter(s => s.named), now = new Date();
  const days = [...Array(14)].map((_, i) => { const d = new Date(now); d.setDate(d.getDate() - 13 + i); return d; });
  const daily = days.map(d => { const k = dayKey(d); let users = 0, sec = 0; st.forEach(s => { const v = s.u.days?.[k] || 0; if (v > 0) { users++; sec += v; } }); return { d, k, users, sec }; });
  const week = new Set(); daily.slice(-7).forEach(x => st.forEach(s => { if ((s.u.days?.[x.k] || 0) > 0) week.add(s.id); }));
  const allAtt = Object.entries(D.attempts).flatMap(([id, at]) => Object.values(at || {}).map(a => ({ ...a, id }))).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return { st, named, daily, week, allAtt };
}
function overview({ st, named, daily, week, allAtt }) {
  const totalSec = st.reduce((a, s) => a + s.study, 0), totalAns = st.reduce((a, s) => a + s.ans, 0), totalC = st.reduce((a, s) => a + (s.u.mcqC || 0), 0);
  const avgMock = allAtt.length ? Math.round(allAtt.reduce((a, x) => a + (x.pct || 0), 0) / allAtt.length) : 0;
  const liveNow = st.filter(s => s.live), top = named.slice().sort((a, b) => b.xp - a.xp).slice(0, 5);
  const yest = daily[12].users, today = daily[13].users, delta = today - yest;
  return `<div class="adm-head"><div><span class="kicker">Overview</span><h2>Class at a glance</h2></div><span class="muted">${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span></div>
  <div class="kpis">
    <div class="kpi hero-kpi"><div class="l">Studying right now</div><div class="v">${liveNow.length}</div><div class="s">${liveNow.slice(0, 3).map(s => esc(s.name.split(" ")[0])).join(", ") || "Nobody online"}</div></div>
    <div class="kpi"><div class="l">Students</div><div class="v">${named.length}</div><div class="s">${st.length - named.length} without a name yet</div></div>
    <div class="kpi"><div class="l">Active today</div><div class="v">${today}</div><div class="s ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} vs yesterday · ${week.size} this week</div></div>
    <div class="kpi"><div class="l">Total study time</div><div class="v">${fmtTime(totalSec)}</div><div class="s">${named.length ? fmtTime(totalSec / named.length) : "0m"} per student</div></div>
    <div class="kpi"><div class="l">Questions answered</div><div class="v">${totalAns.toLocaleString("en-IN")}</div><div class="s">${totalAns ? Math.round(totalC / totalAns * 100) : 0}% class accuracy</div></div>
    <div class="kpi"><div class="l">Tests &amp; papers</div><div class="v">${allAtt.length}</div><div class="s">${avgMock}% average</div></div>
    <div class="kpi"><div class="l">Studied today</div><div class="v">${fmtTime(daily[13].sec)}</div></div>
    <div class="kpi"><div class="l">Open doubts</div><div class="v">${pendingDoubts()}</div><div class="s"><a href="#community" data-goto="community">Moderate →</a></div></div>
  </div>
  <div class="grid2">
    <div class="panel"><h3>Students active per day</h3><p class="cap">Last 14 days · anyone who studied 30 seconds or more</p>${barChart(daily.map(x => ({ v: x.users, label: x.d.getDate(), tip: `${x.d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${x.users} student${x.users === 1 ? "" : "s"}` })))}</div>
    <div class="panel"><h3>Study minutes per day</h3><p class="cap">Last 14 days · whole class</p>${barChart(daily.map(x => ({ v: Math.round(x.sec / 60), label: x.d.getDate(), tip: `${x.d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${fmtTime(x.sec)}` })))}</div>
  </div>
  <div class="grid2">
    <div class="panel"><h3>Top 5 by XP</h3>${top.length ? `<div class="rank-list">${top.map((s, i) => `<button class="rank-row" data-open="${s.id}"><span class="rk">${i + 1}</span><span class="nm">${esc(s.name)}${s.live ? '<span class="dot on"></span>' : ""}</span><span class="vv">${s.xp.toLocaleString("en-IN")} XP</span></button>`).join("")}</div>` : `<div class="empty">No students yet.</div>`}</div>
    <div class="panel"><h3>Online now</h3>${liveNow.length ? `<div class="rank-list">${liveNow.map(s => `<button class="rank-row" data-open="${s.id}"><span class="dot on"></span><span class="nm">${esc(s.name)}</span><span class="vv">${esc(s.page || "home")}</span></button>`).join("")}</div>` : `<div class="empty">Nobody is studying right now.</div>`}</div>
  </div>`;
}
function studentsView({ st }) {
  const week = 7 * 86400000, now = Date.now();
  const F = { all: s => true, live: s => s.live, today: s => (s.u.days?.[dayKey(new Date())] || 0) > 0, inactive: s => s.named && now - s.lastSeen > week, dup: s => s.dup, noname: s => !s.named };
  let rows = st.filter(F[filt] || F.all).filter(s => !q || s.name.toLowerCase().includes(q));
  rows.sort((a, b) => { const x = a[sortKey], y = b[sortKey]; return (typeof x === "string" ? x.localeCompare(y) : (x - y)) * sortDir; });
  const cols = [["name", "Student"], ["lastSeen", "Last active"], ["study", "Study", 1], ["notes", "Notes", 1], ["ans", "Answered", 1], ["acc", "Accuracy", 1], ["mocks", "Tests", 1], ["best", "Best", 1], ["wins", "Wins", 1], ["xp", "XP", 1]];
  const chips = [["all", "All", st.length], ["live", "Online", st.filter(F.live).length], ["today", "Active today", st.filter(F.today).length], ["inactive", "Inactive 7d+", st.filter(F.inactive).length], ["dup", "Duplicates", st.filter(F.dup).length], ["noname", "No name", st.filter(F.noname).length]];
  return `<div class="adm-head"><div><span class="kicker">Students</span><h2>Everyone on Boardroom</h2></div></div>
  <div class="panel"><div class="toolbar"><input class="search" id="srch" placeholder="Search by name" value="${esc(q)}" autocomplete="off"><div class="chips">${chips.map(([k, l, n]) => `<button class="chip ${filt === k ? "on" : ""}" data-f="${k}">${l} <b>${n}</b></button>`).join("")}</div></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(([k, l, r]) => `<th data-k="${k}" class="${r ? "r" : ""} ${sortKey === k ? "sorted" : ""}">${l}${sortKey === k ? (sortDir < 0 ? " ↓" : " ↑") : ""}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(s => `<tr class="rowx" data-open="${s.id}"><td><span class="dot ${s.live ? "on" : ""}"></span>${esc(s.name)}${s.dup ? '<span class="dup">duplicate?</span>' : ""}</td><td>${ago(s.lastSeen)}</td><td class="r">${fmtTime(s.study)}</td><td class="r">${s.notes}</td><td class="r">${s.ans}</td><td class="r">${s.acc}%</td><td class="r">${s.mocks}</td><td class="r">${s.best ? s.best + "%" : "–"}</td><td class="r">${s.wins}</td><td class="r"><b>${s.xp.toLocaleString("en-IN")}</b></td></tr>`).join("") || `<tr><td colspan="10" class="muted">No students match.</td></tr>`}</tbody></table></div>
    <p class="cap" style="margin:10px 0 0">Tap a student to see their progress, rename them, merge a duplicate or remove a fake name.</p></div>`;
}
function bindStudents(refocus) {
  const sr = $("#srch");
  if (refocus) { sr.focus(); sr.setSelectionRange(sr.value.length, sr.value.length); }
  sr.oninput = () => { q = sr.value.toLowerCase().trim(); render(); };
  $$("[data-f]").forEach(b => b.onclick = () => { filt = b.dataset.f; render(); });
  $$("th[data-k]").forEach(th => th.onclick = () => { if (sortKey === th.dataset.k) sortDir *= -1; else { sortKey = th.dataset.k; sortDir = th.dataset.k === "name" ? 1 : -1; } render(); });
}
function learning({ st, named }) {
  const secs = {}; st.forEach(s => Object.entries(s.u.sections || {}).forEach(([k, v]) => secs[k] = (secs[k] || 0) + v));
  const secName = { home: "Home", notes: "Notes list", note: "Reading notes", practice: "Practice", q: "Answering MCQs", mock: "Mock tests", exam: "Exam papers", paper: "Writing papers", written: "Written answers", ranks: "Leaderboard", me: "Profile", guide: "Answer method", battle: "Battles", daily: "Daily challenge", cards: "Flashcards", revise: "Revision", videos: "Videos", doubts: "Doubts", arena: "Case Arena" };
  const secArr = Object.entries(secs).sort((a, b) => b[1] - a[1]), secMax = Math.max(1, ...secArr.map(x => x[1]));
  const tp = {}; st.forEach(s => Object.entries(s.u.topics || {}).forEach(([t, x]) => { tp[t] = tp[t] || { a: 0, c: 0 }; tp[t].a += x.a || 0; tp[t].c += x.c || 0; }));
  const tpArr = Object.entries(tp).filter(([t, x]) => NOTE[t] && x.a >= 3).map(([t, x]) => ({ t, a: x.a, acc: Math.round(x.c / x.a * 100) })).sort((a, b) => a.acc - b.acc);
  const nr = {}; st.forEach(s => Object.keys(s.u.notesRead || {}).forEach(t => nr[t] = (nr[t] || 0) + 1));
  const bySubj = SUBJ.filter(x => x.file).map(x => { const ids = NOTES.filter(n => n.subj === x.id).map(n => n.id); let a = 0, c = 0; Object.entries(tp).forEach(([t, v]) => { if (ids.includes(t)) { a += v.a; c += v.c; } }); const reads = ids.reduce((s, t) => s + (nr[t] || 0), 0); return { x, a, acc: a ? Math.round(c / a * 100) : 0, reads }; });
  return `<div class="adm-head"><div><span class="kicker">Learning</span><h2>What the class is studying</h2></div></div>
  <div class="subj-grid">${bySubj.map(b => `<div class="panel subj-card"><span class="kicker">${esc(b.x.code)}</span><h3>${esc(b.x.short || b.x.name)}</h3><div class="kv2"><span>Answers</span><b>${b.a.toLocaleString("en-IN")}</b><span>Accuracy</span><b>${b.acc}%</b><span>Notes read</span><b>${b.reads}</b></div></div>`).join("")}</div>
  <div class="grid2">
    <div class="panel"><h3>Class weak topics</h3><p class="cap">Lowest accuracy first · topics with 3+ answers</p>${tpArr.length ? `<div class="hbars">${tpArr.slice(0, 14).map(x => hbar(NOTE[x.t].title, x.acc, `${x.acc}% · ${x.a}`, x.acc < 50)).join("")}</div>` : `<div class="empty">No answers yet.</div>`}</div>
    <div class="panel"><h3>Where time goes</h3><p class="cap">Total time in each part of the site</p>${secArr.length ? `<div class="hbars">${secArr.map(([k, v]) => hbar(secName[k] || k, v / secMax * 100, fmtTime(v))).join("")}</div>` : `<div class="empty">No study time recorded yet.</div>`}
      <div class="label">Most-read notes</div><div class="hbars">${Object.entries(nr).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, n]) => hbar(NOTE[t]?.title || t, n / Math.max(1, named.length) * 100, `${n} read`)).join("") || `<span class="muted">None yet</span>`}</div></div>
  </div>`;
}
function exams({ allAtt }) {
  const papers = allAtt.filter(a => a.type === "exam"), mocks = allAtt.filter(a => a.type !== "exam");
  const avg = l => l.length ? Math.round(l.reduce((a, x) => a + (x.pct || 0), 0) / l.length) : 0;
  const best = allAtt.slice().sort((a, b) => (b.pct || 0) - (a.pct || 0)).slice(0, 5);
  return `<div class="adm-head"><div><span class="kicker">Exams</span><h2>Tests and papers</h2></div></div>
  <div class="kpis kpis3"><div class="kpi"><div class="l">Full papers written</div><div class="v">${papers.length}</div><div class="s">${avg(papers)}% average</div></div><div class="kpi"><div class="l">MCQ mocks</div><div class="v">${mocks.length}</div><div class="s">${avg(mocks)}% average</div></div><div class="kpi"><div class="l">Top score</div><div class="v">${best[0] ? best[0].pct + "%" : "–"}</div><div class="s">${best[0] ? esc(D.names[best[0].id] || "") : ""}</div></div></div>
  <div class="panel"><h3>Latest attempts</h3>${allAtt.length ? `<div class="feed">${allAtt.slice(0, 40).map(a => `<button class="feed-row" data-open="${safeId(a.id) ? a.id : ""}"><b>${esc(D.names[a.id] || "Unknown")}</b><span>${a.type === "exam" ? "📝 Paper" : "⏱️ Mock"}${a.subj ? " · " + esc(SUBJ_NAME[a.subj] || a.subj) : ""} · ${Number(a.score) || 0}/${Number(a.total) || 0} <em class="pct ${a.pct >= 60 ? "hi" : a.pct < 40 ? "lo" : ""}">${Number(a.pct) || 0}%</em>${a.type === "exam" && a.a !== undefined ? ` <span class="dim">A ${a.a} · B ${a.b} · C ${a.c}${a.d !== undefined ? " · D " + a.d : ""}</span>` : ""}</span><span class="t">${ago(a.ts)}</span></button>`).join("")}</div>` : `<div class="empty">No tests yet.</div>`}</div>`;
}
function community() {
  const ds = allDoubts().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return `<div class="adm-head"><div><span class="kicker">Community</span><h2>Announcements and doubts</h2></div></div>
  <div class="grid2">
  <div class="panel"><h3>📢 New announcement</h3><p class="cap">Shows on everyone's home screen for 30 days.</p>
    <input class="field" id="anTitle" maxlength="60" placeholder="Title, e.g. Exam pattern update" style="font-size:15px">
    <textarea id="anText" maxlength="500" placeholder="Message for the class…" style="min-height:100px"></textarea>
    <div class="row" style="margin-top:8px"><select class="field" id="anSubj" style="flex:1;margin:0;font-size:14px"><option value="all">All subjects</option>${SUBJ.map(x => `<option value="${esc(x.id)}">${esc(x.short || x.name)}</option>`).join("")}</select><label class="row" style="gap:6px;font-size:14px"><input type="checkbox" id="anPin"> Pin</label><button class="btn primary" id="anGo">Post</button></div>
    <div class="label">Posted</div><div class="feed">${Object.entries(D.announce).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0)).map(([id, a]) => `<div class="feed-row"><span>${a.pin ? "📌 " : ""}<b>${esc(a.title || "")}</b> ${esc(a.text)} <span class="dim">· ${esc(a.subj === "all" ? "All" : SUBJ_NAME[a.subj] || a.subj)}</span></span><span class="t">${ago(a.ts)} <button class="btn small ghost" data-andel="${esc(id)}">Delete</button></span></div>`).join("") || `<span class="muted">No announcements yet.</span>`}</div></div>
  <div class="panel"><h3>💬 Doubt board</h3><p class="cap">Latest doubts from every subject. Delete spam or abuse.</p>
    <div class="feed">${ds.slice(0, 40).map(d => `<div class="feed-row"><span>${d.solved ? "✅" : "❔"} <b>${esc(d.name || "")}</b> · ${esc(SUBJ_NAME[d.sj] || d.sj)} · ${esc(String(d.text).slice(0, 140))}</span><span class="t">${ago(d.ts)} <button class="btn small ghost" data-ddel="${esc(d.sj)}/${esc(d.id)}">Delete</button></span></div>`).join("") || `<span class="muted">No doubts yet.</span>`}</div></div>
  </div>`;
}
function bindCommunity() {
  $("#anGo").onclick = async () => { const text = $("#anText").value.trim(); if (!text) return toast("Write a message"); const id = Date.now().toString(36); try { await set(R("announce/" + id), { title: $("#anTitle").value.trim().slice(0, 60) || "Announcement", text: text.slice(0, 500), subj: $("#anSubj").value, pin: $("#anPin").checked, ts: Date.now() }); $("#anTitle").value = ""; $("#anText").value = ""; toast("Announcement posted"); } catch (e) { toast("Couldn't post: " + e.message); } };
  $$("[data-andel]").forEach(b => b.onclick = () => { if (confirm("Delete this announcement?")) set(R("announce/" + b.dataset.andel), null); });
  $$("[data-ddel]").forEach(b => b.onclick = () => { const [sj, id] = b.dataset.ddel.split("/"); if (!safeId(sj) || !safeId(id)) return; if (confirm("Delete this doubt and its answers?")) update(R(""), { [`doubts/${sj}/${id}`]: null, [`doubtAns/${sj}/${id}`]: null }).then(() => toast("Deleted")); });
}
function security() {
  const u = auth.currentUser, meta = u?.metadata || {};
  const items = [
    ["Database rules published", "Copy database.rules.json into Firebase → Realtime Database → Rules → Publish after every update. The rules block anyone except you from reading private data, and validate everything students write.", "must"],
    ["Turn off public sign-ups", "Firebase → Authentication → Settings → User actions: untick “Enable create (sign-up)”. Students use anonymous login, so only your admin account ever needs email/password.", "must"],
    ["Restrict the API key", "Google Cloud Console → APIs & Services → Credentials → your Browser key → Application restrictions: HTTP referrers → add YOUR-USERNAME.github.io/*. Then the key only works on your site.", "must"],
    ["Email enumeration protection", "Firebase → Authentication → Settings → turn on Email enumeration protection, so nobody can test which emails have accounts.", "should"],
    ["Authorized domains", "Firebase → Authentication → Settings → Authorized domains: keep only YOUR-USERNAME.github.io and localhost.", "should"],
    ["Strong admin password", "Use a long unique password and turn on 2-step verification on your Google account.", "should"],
  ];
  return `<div class="adm-head"><div><span class="kicker">Security</span><h2>Keep the site locked down</h2></div></div>
  <div class="grid2"><div class="panel"><h3>This session</h3><div class="kv"><span>Signed in as</span><span>${esc(u?.email || "")}</span><span>Last sign-in</span><span>${meta.lastSignInTime ? esc(new Date(meta.lastSignInTime).toLocaleString("en-IN")) : "–"}</span><span>Session</span><span>Ends when this tab closes, or after 20 minutes idle</span><span>Login protection</span><span>Locks after 5 wrong passwords (30 s, doubling up to 15 min)</span></div>
  <button class="btn dark" id="out2">Sign out now</button></div>
  <div class="panel"><h3>What's protected</h3><ul class="sec-list"><li>Only your account can read student progress, attempts and the full user list.</li><li>Students can only write their own data; names can't be changed once set and can't contain code characters.</li><li>Leaderboard numbers are range-checked, so nobody can post a 9-million XP score.</li><li>Doubts, answers and announcements have size limits; only you can post announcements.</li><li>The site loads code only from Firebase, cdnjs and Google Fonts (Content-Security-Policy).</li></ul></div></div>
  <div class="panel"><h3>Checklist (one-time, in the Firebase console)</h3><div class="checklist">${items.map(([t, d, lvl]) => `<div class="ck ${lvl}"><span class="ck-ic">${lvl === "must" ? "!" : "✓"}</span><div><b>${t}</b><p>${d}</p></div></div>`).join("")}</div></div>`;
}

/* ---------- student detail sheet ---------- */
let sheetId = null;
function openSheet(id) { if (!safeId(id)) return; sheetId = id; $(".sheet")?.remove(); const el = document.createElement("div"); el.className = "sheet"; el.innerHTML = "<div></div>"; document.body.appendChild(el); el.onclick = e => { if (e.target === el) closeSheet(); }; refreshSheet(); }
function closeSheet() { $(".sheet")?.remove(); sheetId = null; }
function refreshSheet() {
  const box = $(".sheet > div"); if (!box || !sheetId) return;
  const s = students().find(x => x.id === sheetId); if (!s) return closeSheet();
  const now = new Date(), days = [...Array(14)].map((_, i) => { const d = new Date(now); d.setDate(d.getDate() - 13 + i); return s.u.days?.[dayKey(d)] || 0; }), dm = Math.max(60, ...days);
  const tps = Object.entries(s.u.topics || {}).filter(([t]) => NOTE[t]).map(([t, x]) => ({ t, a: x.a, acc: Math.round((x.c || 0) / x.a * 100) })).sort((a, b) => a.acc - b.acc);
  const at = Object.values(D.attempts[s.id] || {}).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const others = students().filter(x => x.id !== s.id && x.named).sort((a, b) => a.name.localeCompare(b.name));
  box.innerHTML = `<div class="row"><div class="sh-av">${esc((s.name.match(/\b\p{L}/gu) || ["?"]).slice(0, 2).join("").toUpperCase())}</div><div><h3 style="margin:0">${esc(s.name)}</h3><span class="muted" style="font-size:13px">${s.live ? '<span class="dot on"></span>online now' : "last active " + ago(s.lastSeen)}</span></div><span class="spacer"></span><button class="btn small" id="shX">Close</button></div>
  <div class="mini-kpis"><div><b>${s.xp.toLocaleString("en-IN")}</b><span>XP</span></div><div><b>${fmtTime(s.study)}</b><span>study</span></div><div><b>${s.acc}%</b><span>accuracy</span></div><div><b>${s.best ? s.best + "%" : "–"}</b><span>best test</span></div></div>
  <div class="kv"><span>Joined</span><span>${s.joined ? new Date(s.joined).toLocaleString("en-IN") : "–"}</span><span>Notes read</span><span>${s.notes}/${NOTES.length}</span><span>Questions</span><span>${s.ans} answered · ${count(s.u.correct)} unique right</span><span>Tests</span><span>${s.mocks} taken</span><span>Streak</span><span>${s.l.streak || 0} days</span><span>Device</span><span style="font-size:12px;word-break:break-word">${esc(s.u.device || "–")}</span></div>
  <div class="label">Study minutes, last 14 days</div><div class="mini">${days.map(v => `<i style="height:${v / dm * 100}%" title="${Math.round(v / 60)} min"></i>`).join("")}</div>
  ${tps.length ? `<div class="label">Topic accuracy (weakest first)</div><div class="hbars">${tps.slice(0, 10).map(x => hbar(NOTE[x.t].title, x.acc, `${x.acc}% · ${x.a}`, x.acc < 50)).join("")}</div>` : ""}
  ${at.length ? `<div class="label">Tests &amp; papers</div><div class="feed">${at.slice(0, 15).map(a => `<div class="feed-row"><span>${a.type === "exam" ? "📝" : "⏱️"} ${Number(a.score) || 0}/${Number(a.total) || 0} (${Number(a.pct) || 0}%)</span><span class="muted">${fmtTime(a.dur)}</span><span class="t">${a.ts ? new Date(a.ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""}</span></div>`).join("")}</div>` : ""}
  <details class="danger-zone"><summary>Manage this student</summary>
  <div class="label">Fix name</div><div class="row"><input class="field" id="rn" style="flex:1;margin:0" value="${esc(D.names[s.id] || "")}" maxlength="40"><button class="btn" id="rnGo">Save name</button></div>
  <div class="label">Merge duplicate into another student</div><p class="cap">Adds this profile's study time, answers and tests to the student you pick, then removes this profile.</p>
  <div class="row"><select class="field" id="mg" style="flex:1;margin:0"><option value="">Choose the student to keep…</option>${others.map(o => `<option value="${o.id}">${esc(o.name)} (${o.xp} XP)</option>`).join("")}</select><button class="btn" id="mgGo">Merge</button></div>
  <div class="label">Remove</div><button class="btn danger" id="delGo">Remove this student and all their data</button>
  <p class="cap" style="margin-top:8px">A removed student is asked for a real name the next time they open the site.</p></details>`;
  $("#shX").onclick = closeSheet;
  $("#rnGo").onclick = async () => { const v = $("#rn").value.trim().replace(/\s+/g, " "); if (v.length < 3 || /[<>{}]/.test(v)) return toast("Use 3–40 letters"); await set(R("names/" + s.id), v.slice(0, 40)); toast("Name saved"); };
  $("#mgGo").onclick = async () => { const to = $("#mg").value; if (!safeId(to)) return toast("Pick a student first"); if (!confirm(`Merge "${s.name}" into "${D.names[to]}"? This can't be undone.`)) return; await merge(s.id, to); closeSheet(); toast("Merged"); };
  $("#delGo").onclick = async () => { if (!confirm(`Remove "${s.name}" and all their progress? This can't be undone.`)) return; await removeStudent(s.id, "removed"); closeSheet(); toast("Student removed"); };
}

/* ---------- admin actions ---------- */
async function removeStudent(id, why) {
  if (!safeId(id)) return;
  await update(R(""), { [`names/${id}`]: null, [`lb/${id}`]: null, [`users/${id}`]: null, [`attempts/${id}`]: null, [`presence/${id}`]: null, [`removed/${id}`]: { why, ts: Date.now() } });
}
const xpOf = s => Math.floor((s.studySec || 0) / 60) + 15 * count(s.notesRead) + 4 * count(s.correct) + (s.mockXp || 0) + 20 * count(s.casesDone) + (s.bonusXp || 0);
async function merge(from, to) {
  if (!safeId(from) || !safeId(to)) return;
  const [a, b] = await Promise.all([get(R("users/" + from)), get(R("users/" + to))]).then(x => x.map(s => s.val() || {}));
  const m = { ...b };
  for (const k of ["studySec", "mcqA", "mcqC", "mockCount", "mockXp", "bonusXp", "papers"]) m[k] = (a[k] || 0) + (b[k] || 0);
  m.mockBest = Math.max(a.mockBest || 0, b.mockBest || 0);
  for (const k of ["notesRead", "correct", "casesDone", "saved", "mynotes", "cards"]) m[k] = { ...(a[k] || {}), ...(b[k] || {}) };
  m.wrong = { ...(a.wrong || {}), ...(b.wrong || {}) }; Object.keys(m.correct).forEach(k => delete m.wrong[k]);
  for (const k of ["days", "sections"]) { m[k] = { ...(b[k] || {}) }; Object.entries(a[k] || {}).forEach(([d, v]) => m[k][d] = (m[k][d] || 0) + v); }
  m.topics = { ...(b.topics || {}) }; Object.entries(a.topics || {}).forEach(([t, x]) => { const y = m.topics[t] || { a: 0, c: 0 }; m.topics[t] = { a: (y.a || 0) + (x.a || 0), c: (y.c || 0) + (x.c || 0) }; });
  m.createdAt = Math.min(a.createdAt || Infinity, b.createdAt || Infinity); if (!isFinite(m.createdAt)) delete m.createdAt;
  const lb = { ...(D.lb[to] || {}), xp: Math.min(199999, xpOf(m)), best: m.mockBest, mocks: m.mockCount, solved: count(m.correct), acc: m.mcqA ? Math.round(m.mcqC / m.mcqA * 100) : 0, sec: m.studySec, notes: count(m.notesRead), ts: Date.now() };
  const upd = { [`users/${to}`]: m, [`lb/${to}`]: lb };
  Object.entries(D.attempts[from] || {}).forEach(([k, v]) => upd[`attempts/${to}/${k}`] = v);
  await update(R(""), upd);
  await removeStudent(from, "merged:" + to);
}

/* ---------- CSV (formula-injection safe) ---------- */
function exportCSV() {
  const cell = v => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const rows = [["Name", "Joined", "Last active", "Study minutes", "Notes read", "Questions answered", "Accuracy %", "Tests", "Best %", "Cases", "Wins", "XP"]];
  students().forEach(s => rows.push([s.name, s.joined ? new Date(s.joined).toISOString().slice(0, 10) : "", s.lastSeen ? new Date(s.lastSeen).toISOString() : "", Math.round(s.study / 60), s.notes, s.ans, s.acc, s.mocks, s.best, s.cases, s.wins, s.xp]));
  const csv = rows.map(r => r.map(cell).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `boardroom-students-${dayKey(new Date())}.csv`; a.click();
}
addEventListener("hashchange", () => { const h = location.hash.slice(1); if (SECTIONS.some(s => s[0] === h) && h !== section) { section = h; render(); } });
