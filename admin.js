import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, ADMIN_UID, ADMIN_EMAIL } from "./firebase-config.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const count = o => Object.keys(o || {}).length;
const fmtTime = sec => { sec = Math.max(0, Math.round(sec || 0)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? `${h}h ${m}m` : `${m}m`; };
const ago = ts => { if (!ts) return "never"; const s = (Date.now() - ts) / 1000; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago"; if (s < 86400) return Math.floor(s / 3600) + "h ago"; return Math.floor(s / 86400) + "d ago"; };
const dayKey = d => d.toLocaleDateString("en-CA");
const norm = n => (n || "").toLowerCase().replace(/[^\p{L}]/gu, "");
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600); }
/* topic names from every subject that has content */
let NOTES = [], NOTE = {};
const SUBJ_NAME = Object.fromEntries((window.SUBJECTS || []).map(x => [x.id, x.short || x.name]));
async function loadAllNotes() {
  window.SUBJECT_DATA = window.SUBJECT_DATA || {};
  await Promise.all((window.SUBJECTS || []).filter(x => x.file && !window.SUBJECT_DATA[x.id]).map(x => new Promise(r => { const el = document.createElement("script"); el.src = x.file + (x.v ? "?v=" + x.v : ""); el.onload = el.onerror = r; document.head.appendChild(el); })));
  NOTES = (window.SUBJECTS || []).flatMap(x => (window.SUBJECT_DATA[x.id]?.notes || []).map(n => ({ ...n, title: n.title + ((window.SUBJECTS || []).filter(y => y.file).length > 1 ? ` (${x.short || x.name})` : "") })));
  NOTE = Object.fromEntries(NOTES.map(n => [n.id, n]));
}
loadAllNotes().then(() => { if (auth.currentUser && auth.currentUser.uid === ADMIN_UID) schedule(); });

// a separate named app so the admin login never replaces a student's anonymous login on this phone
const app = initializeApp(firebaseConfig, "admin");
const auth = getAuth(app), db = getDatabase(app);
const R = p => ref(db, p);
const D = { names: {}, lb: {}, users: {}, attempts: {}, presence: {} };
let subs = [], sortKey = "xp", sortDir = -1, q = "";

/* ---------- login ---------- */
function loginView(msg = "") {
  $("#admTop").innerHTML = "";
  $("#adm").innerHTML = `<div class="login modal-card"><h2>Admin sign-in</h2><p class="muted">Only the site owner can see class analytics.</p>
  <label class="label" for="em">Email</label><input class="field" id="em" type="email" value="${esc(ADMIN_EMAIL)}" autocomplete="username">
  <label class="label" for="pw">Password</label><input class="field" id="pw" type="password" autocomplete="current-password">
  <div class="err" id="lerr">${esc(msg)}</div><button class="btn primary block" id="lgo">Sign in</button></div>`;
  const go = async () => {
    $("#lgo").disabled = true; $("#lerr").textContent = "";
    try { await signInWithEmailAndPassword(auth, $("#em").value.trim(), $("#pw").value); }
    catch (e) { $("#lerr").textContent = e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" ? "Wrong email or password." : e.code === "auth/operation-not-allowed" ? "Turn on Email/Password sign-in in Firebase Authentication." : "Couldn't sign in: " + (e.code || e.message); $("#lgo").disabled = false; }
  };
  $("#lgo").onclick = go; $("#pw").onkeydown = e => e.key === "Enter" && go();
}
onAuthStateChanged(auth, user => {
  subs.forEach(u => u()); subs = [];
  if (!user) return loginView();
  if (user.uid !== ADMIN_UID) { signOut(auth); return loginView("This account isn't the admin account."); }
  $("#admTop").innerHTML = `<span class="live"><i></i>Live</span><button class="btn small" id="csv">Export CSV</button><button class="btn small ghost" id="out">Sign out</button>`;
  $("#out").onclick = () => signOut(auth);
  $("#csv").onclick = exportCSV;
  $("#adm").innerHTML = `<p class="muted">Loading class data…</p>`;
  for (const k of Object.keys(D)) subs.push(onValue(R(k), s => { D[k] = s.val() || {}; schedule(); }, e => { $("#adm").innerHTML = `<div class="empty">Couldn't read <b>${k}</b>: ${esc(e.message)}.<br>Check that the database rules from database.rules.json are published.</div>`; }));
});
let rt; const schedule = () => { clearTimeout(rt); rt = setTimeout(() => { render(); autoMerge(); }, 150); };
/* students who registered the same name on two phones are combined automatically into their oldest profile */
let merging = false;
async function autoMerge() {
  if (merging) return;
  const groups = {}; Object.entries(D.names).forEach(([id, n]) => (groups[norm(n)] = groups[norm(n)] || []).push(id));
  const dup = Object.values(groups).find(g => g.length > 1); if (!dup) return;
  merging = true;
  try {
    const keep = dup.slice().sort((a, b) => (D.users[a]?.createdAt || Infinity) - (D.users[b]?.createdAt || Infinity))[0];
    for (const id of dup) if (id !== keep) await merge(id, keep);
    toast(`Combined duplicate profiles of ${D.names[keep] || "a student"}`);
  } catch (e) { console.warn("auto-merge failed", e); }
  finally { merging = false; }
}

/* ---------- data shaping ---------- */
const live = id => { const p = D.presence[id]; return p && p.on && Date.now() - (p.ts || 0) < 6 * 60000; };
function students() {
  const ids = new Set([...Object.keys(D.names), ...Object.keys(D.users)]);
  const dupKey = {}; Object.entries(D.names).forEach(([id, n]) => { (dupKey[norm(n)] = dupKey[norm(n)] || []).push(id); });
  return [...ids].map(id => {
    const u = D.users[id] || {}, l = D.lb[id] || {}, at = D.attempts[id] || {};
    const lastSeen = Math.max(u.lastSeen || 0, D.presence[id]?.ts || 0, l.ts || 0);
    return { id, name: D.names[id] || "(no name yet)", u, l, live: live(id), lastSeen, study: u.studySec || 0, notes: count(u.notesRead), ans: u.mcqA || 0, acc: u.mcqA ? Math.round((u.mcqC || 0) / u.mcqA * 100) : 0, mocks: u.mockCount || count(at), best: u.mockBest || 0, xp: l.xp || 0, cases: count(u.casesDone), joined: u.createdAt || 0, dup: D.names[id] && dupKey[norm(D.names[id])].length > 1 };
  });
}

/* ---------- charts (single series, SVG, hover tooltips) ---------- */
const tipEl = () => $("#tipPop");
function barChart(data, { h = 170, fmt = v => v } = {}) {
  const W = 560, H = h, pl = 30, pb = 22, pt = 8, max = Math.max(1, ...data.map(d => d.v));
  const nice = Math.ceil(max / 4) * 4 || 4, bw = (W - pl) / data.length;
  const y = v => pt + (H - pt - pb) * (1 - v / nice);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  for (let i = 0; i <= 4; i++) { const v = nice / 4 * i; s += `<line class="gl" x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; }
  data.forEach((d, i) => {
    const x = pl + i * bw + 2, w = Math.max(2, bw - 4), top = y(d.v), bh = Math.max(0, H - pb - top);
    const r = Math.min(4, w / 2, bh);
    const path = bh > 0 ? `M${x},${H - pb} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${H - pb} Z` : "";
    s += `<g data-tip="${esc(d.tip)}"><rect class="hit" x="${pl + i * bw}" y="${pt}" width="${bw}" height="${H - pt}"/>${path ? `<path class="bar" d="${path}"/>` : ""}</g>`;
    if (data.length <= 14 || i % 2 === 0) s += `<text x="${x + w / 2}" y="${H - 6}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  return s + "</svg>";
}
function bindTips(root) {
  const t = tipEl();
  $$("[data-tip]", root).forEach(g => {
    g.onpointerenter = g.onpointermove = e => { t.textContent = g.dataset.tip; t.classList.add("show"); t.style.left = Math.min(innerWidth - t.offsetWidth - 8, e.clientX + 12) + "px"; t.style.top = (e.clientY - 38) + "px"; };
    g.onpointerleave = () => t.classList.remove("show");
  });
}

/* ---------- main render ---------- */
function render() {
  if (sheetId && !students().some(x => x.id === sheetId)) closeSheet();
  const hadFocus = document.activeElement?.id === "srch";
  const st = students(), named = st.filter(s => D.names[s.id]);
  const now = new Date(), todayK = dayKey(now);
  const days = [...Array(14)].map((_, i) => { const d = new Date(now); d.setDate(d.getDate() - 13 + i); return d; });
  const daily = days.map(d => { const k = dayKey(d); let users = 0, sec = 0; st.forEach(s => { const v = s.u.days?.[k] || 0; if (v > 0) { users++; sec += v; } }); return { d, k, users, sec }; });
  const week = new Set(); daily.slice(-7).forEach(x => st.forEach(s => { if ((s.u.days?.[x.k] || 0) > 0) week.add(s.id); }));
  const totalSec = st.reduce((a, s) => a + s.study, 0), totalAns = st.reduce((a, s) => a + s.ans, 0), totalC = st.reduce((a, s) => a + (s.u.mcqC || 0), 0);
  const allAtt = Object.entries(D.attempts).flatMap(([id, at]) => Object.values(at || {}).map(a => ({ ...a, id })));
  const avgMock = allAtt.length ? Math.round(allAtt.reduce((a, x) => a + (x.pct || 0), 0) / allAtt.length) : 0;
  // sections
  const secs = {}; st.forEach(s => Object.entries(s.u.sections || {}).forEach(([k, v]) => secs[k] = (secs[k] || 0) + v));
  const secName = { home: "Home", notes: "Notes list", note: "Reading notes", practice: "Practice setup", q: "Answering MCQs", mock: "Mock tests", cases: "Case list", case: "Writing cases", ranks: "Leaderboard", me: "Profile", guide: "Answer method" };
  const secArr = Object.entries(secs).sort((a, b) => b[1] - a[1]); const secMax = Math.max(1, ...secArr.map(x => x[1]));
  // topics
  const tp = {}; st.forEach(s => Object.entries(s.u.topics || {}).forEach(([t, x]) => { tp[t] = tp[t] || { a: 0, c: 0 }; tp[t].a += x.a || 0; tp[t].c += x.c || 0; }));
  const tpArr = Object.entries(tp).filter(([t, x]) => NOTE[t] && x.a >= 3).map(([t, x]) => ({ t, a: x.a, acc: Math.round(x.c / x.a * 100) })).sort((a, b) => a.acc - b.acc);
  // notes read count
  const nr = {}; st.forEach(s => Object.keys(s.u.notesRead || {}).forEach(t => nr[t] = (nr[t] || 0) + 1));

  // table
  let rows = st.filter(s => !q || s.name.toLowerCase().includes(q));
  rows.sort((a, b) => { const x = a[sortKey], y = b[sortKey]; return (typeof x === "string" ? x.localeCompare(y) : (x - y)) * sortDir; });
  const cols = [["name", "Student"], ["lastSeen", "Last active"], ["study", "Study time", 1], ["notes", "Notes", 1], ["ans", "Answered", 1], ["acc", "Accuracy", 1], ["mocks", "Mocks", 1], ["best", "Best mock", 1], ["cases", "Cases", 1], ["xp", "XP", 1]];
  const feed = allAtt.sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 12);

  $("#adm").innerHTML = `
  <h2>Class analytics</h2>
  <div class="kpis">
    <div class="kpi"><div class="v">${named.length}</div><div class="l">Students</div><div class="s">${st.length - named.length} without a name yet</div></div>
    <div class="kpi"><div class="v">${st.filter(s => s.live).length}</div><div class="l">Studying right now</div></div>
    <div class="kpi"><div class="v">${daily[13].users}</div><div class="l">Active today</div><div class="s">${week.size} this week</div></div>
    <div class="kpi"><div class="v">${fmtTime(totalSec)}</div><div class="l">Total study time</div><div class="s">${named.length ? fmtTime(totalSec / named.length) : "0m"} per student</div></div>
    <div class="kpi"><div class="v">${totalAns.toLocaleString("en-IN")}</div><div class="l">Questions answered</div><div class="s">${totalAns ? Math.round(totalC / totalAns * 100) : 0}% class accuracy</div></div>
    <div class="kpi"><div class="v">${allAtt.length}</div><div class="l">Mock tests taken</div><div class="s">${avgMock}% average score</div></div>
    <div class="kpi"><div class="v">${fmtTime(daily[13].sec)}</div><div class="l">Studied today</div></div>
    <div class="kpi"><div class="v">${st.reduce((a, s) => a + s.cases, 0)}</div><div class="l">Cases written</div></div>
  </div>
  <div class="grid2">
    <div class="panel"><h3>Students active per day</h3><p class="muted" style="font-size:13px;margin-top:-6px">Last 14 days · anyone who studied at least 30 seconds</p>${barChart(daily.map(x => ({ v: x.users, label: x.d.getDate(), tip: `${x.d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${x.users} student${x.users === 1 ? "" : "s"}` })))}</div>
    <div class="panel"><h3>Study minutes per day</h3><p class="muted" style="font-size:13px;margin-top:-6px">Last 14 days · whole class</p>${barChart(daily.map(x => ({ v: Math.round(x.sec / 60), label: x.d.getDate(), tip: `${x.d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${fmtTime(x.sec)}` })))}</div>
  </div>
  <div class="grid2">
    <div class="panel"><h3>Class weak topics</h3><p class="muted" style="font-size:13px;margin-top:-6px">Lowest accuracy first (topics with 3+ answers)</p>
      ${tpArr.length ? `<div class="hbars">${tpArr.slice(0, 12).map(x => `<div class="hb"><span>${esc(NOTE[x.t].title)}</span><span class="tr"><i class="${x.acc < 50 ? "low" : ""}" style="width:${x.acc}%"></i></span><span class="vv">${x.acc}% · ${x.a}</span></div>`).join("")}</div>` : `<div class="empty">No answers yet.</div>`}</div>
    <div class="panel"><h3>Where time goes</h3><p class="muted" style="font-size:13px;margin-top:-6px">Total time spent in each part of the site</p>
      ${secArr.length ? `<div class="hbars">${secArr.map(([k, v]) => `<div class="hb"><span>${esc(secName[k] || k)}</span><span class="tr"><i style="width:${v / secMax * 100}%"></i></span><span class="vv">${fmtTime(v)}</span></div>`).join("")}</div>` : `<div class="empty">No study time recorded yet.</div>`}
      <div class="label">Most-read notes</div>
      <div class="hbars">${Object.entries(nr).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, n]) => `<div class="hb"><span>${esc(NOTE[t]?.title || t)}</span><span class="tr"><i style="width:${n / Math.max(1, named.length) * 100}%"></i></span><span class="vv">${n} read</span></div>`).join("") || `<span class="muted">None yet</span>`}</div></div>
  </div>
  <div class="panel"><div class="toolbar"><h3 style="margin:0">Students</h3><span class="spacer"></span><input class="search" id="srch" placeholder="Search by name" value="${esc(q)}"></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(([k, l, r]) => `<th data-k="${k}" class="${r ? "r" : ""}">${l}${sortKey === k ? (sortDir < 0 ? " ↓" : " ↑") : ""}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(s => `<tr class="rowx" data-id="${s.id}"><td><span class="dot ${s.live ? "on" : ""}"></span>${esc(s.name)}${s.dup ? '<span class="dup">possible duplicate</span>' : ""}</td><td>${ago(s.lastSeen)}</td><td class="r">${fmtTime(s.study)}</td><td class="r">${s.notes}/${NOTES.length}</td><td class="r">${s.ans}</td><td class="r">${s.acc}%</td><td class="r">${s.mocks}</td><td class="r">${s.best ? s.best + "%" : "–"}</td><td class="r">${s.cases}</td><td class="r">${s.xp.toLocaleString("en-IN")}</td></tr>`).join("") || `<tr><td colspan="10" class="muted">No students yet. Share the site link with your class.</td></tr>`}</tbody></table></div>
    <p class="muted" style="font-size:13px;margin:10px 0 0">Tap a student to see details, rename, merge duplicates or remove a fake name.</p></div>
  <div class="panel"><h3>Recent mock tests</h3>${feed.length ? `<div class="feed">${feed.map(a => `<div><b>${esc(D.names[a.id] || "Unknown")}</b><span>${a.type === "exam" ? "📝 Paper" : "⏱️ Mock"}${a.subj ? " · " + esc(SUBJ_NAME[a.subj] || a.subj) : ""} · ${a.score}/${a.total} (${a.pct}%) in ${fmtTime(a.dur)}</span><span class="t">${ago(a.ts)}</span></div>`).join("")}</div>` : `<div class="empty">No mock tests yet.</div>`}</div>`;
  bindTips($("#adm"));
  const sr = $("#srch");
  if (hadFocus) { sr.focus(); sr.setSelectionRange(sr.value.length, sr.value.length); } sr.oninput = () => { q = sr.value.toLowerCase().trim(); const pos = sr.selectionStart; render(); const n = $("#srch"); n.focus(); n.setSelectionRange(pos, pos); };
  $$("th[data-k]").forEach(th => th.onclick = () => { if (sortKey === th.dataset.k) sortDir *= -1; else { sortKey = th.dataset.k; sortDir = th.dataset.k === "name" ? 1 : -1; } render(); });
  $$("tr.rowx").forEach(tr => tr.onclick = () => openSheet(tr.dataset.id));
}

/* ---------- student detail ---------- */
let sheetId = null;
function openSheet(id) { sheetId = id; const el = document.createElement("div"); el.className = "sheet"; el.innerHTML = "<div></div>"; document.body.appendChild(el); el.onclick = e => { if (e.target === el) closeSheet(); }; refreshSheet(); }
function closeSheet() { $(".sheet")?.remove(); sheetId = null; }
function refreshSheet() {
  const box = $(".sheet > div"); if (!box || !sheetId) return;
  const s = students().find(x => x.id === sheetId); if (!s) return closeSheet();
  const now = new Date(), days = [...Array(14)].map((_, i) => { const d = new Date(now); d.setDate(d.getDate() - 13 + i); return s.u.days?.[dayKey(d)] || 0; }), dm = Math.max(60, ...days);
  const tps = Object.entries(s.u.topics || {}).filter(([t]) => NOTE[t]).map(([t, x]) => ({ t, a: x.a, acc: Math.round((x.c || 0) / x.a * 100) })).sort((a, b) => a.acc - b.acc);
  const at = Object.values(D.attempts[s.id] || {}).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const others = students().filter(x => x.id !== s.id && D.names[x.id]).sort((a, b) => a.name.localeCompare(b.name));
  box.innerHTML = `<div class="row"><h3 style="margin:0">${esc(s.name)}</h3>${s.live ? '<span class="live"><i></i>online</span>' : ""}<span class="spacer"></span><button class="btn small" id="shX">Close</button></div>
  <div class="kv"><span>Joined</span><span>${s.joined ? new Date(s.joined).toLocaleString("en-IN") : "–"}</span><span>Last active</span><span>${ago(s.lastSeen)}</span><span>Study time</span><span>${fmtTime(s.study)}</span><span>Notes read</span><span>${s.notes}/${NOTES.length}</span><span>Questions</span><span>${s.ans} answered · ${s.acc}% correct · ${count(s.u.correct)} unique right</span><span>Mocks</span><span>${s.mocks} taken · best ${s.best}%</span><span>XP · streak</span><span>${s.xp} XP · ${s.l.streak || 0} days</span><span>Device</span><span style="font-size:12px;word-break:break-word">${esc(s.u.device || "–")}</span><span>ID</span><span style="font-size:12px;word-break:break-all">${s.id}</span></div>
  <div class="label">Study minutes, last 14 days</div><div class="mini">${days.map(v => `<i style="height:${v / dm * 100}%" title="${Math.round(v / 60)} min"></i>`).join("")}</div>
  ${tps.length ? `<div class="label">Topic accuracy (weakest first)</div><div class="hbars">${tps.map(x => `<div class="hb"><span>${esc(NOTE[x.t].title)}</span><span class="tr"><i class="${x.acc < 50 ? "low" : ""}" style="width:${x.acc}%"></i></span><span class="vv">${x.acc}% · ${x.a}</span></div>`).join("")}</div>` : ""}
  ${at.length ? `<div class="label">Mock tests &amp; papers</div><div class="feed">${at.map(a => `<div><span>${a.type === "exam" ? "📝" : "⏱️"} ${a.score}/${a.total} (${a.pct}%)${a.type === "exam" ? ` · A ${a.a} · B ${a.b} · C ${a.c}` : ""}</span><span class="muted">${fmtTime(a.dur)}</span><span class="t">${a.ts ? new Date(a.ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""}</span></div>`).join("")}</div>` : ""}
  <div class="label">Fix name</div><div class="row"><input class="field" id="rn" style="flex:1;margin:0" value="${esc(D.names[s.id] || "")}" maxlength="40"><button class="btn" id="rnGo">Save name</button></div>
  <div class="label">Merge duplicate into another student</div><p class="muted" style="font-size:13px;margin:0 0 8px">Adds this profile's study time, answers and mocks to the student you pick, then removes this profile.</p>
  <div class="row"><select class="field" id="mg" style="flex:1;margin:0"><option value="">Choose the student to keep…</option>${others.map(o => `<option value="${o.id}">${esc(o.name)} (${o.xp} XP)</option>`).join("")}</select><button class="btn" id="mgGo">Merge</button></div>
  <div class="label">Remove</div><button class="btn danger" id="delGo">Remove this student and all their data</button>
  <p class="muted" style="font-size:12.5px;margin-top:8px">A removed student is asked for a real name the next time they open the site.</p>`;
  $("#shX").onclick = closeSheet;
  $("#rnGo").onclick = async () => { const v = $("#rn").value.trim().replace(/\s+/g, " "); if (v.length < 3) return toast("Name needs at least 3 characters"); await set(R("names/" + s.id), v); toast("Name saved"); };
  $("#mgGo").onclick = async () => { const to = $("#mg").value; if (!to) return toast("Pick a student first"); if (!confirm(`Merge "${s.name}" into "${D.names[to]}"? This can't be undone.`)) return; await merge(s.id, to); closeSheet(); toast("Merged"); };
  $("#delGo").onclick = async () => { if (!confirm(`Remove "${s.name}" and all their progress? This can't be undone.`)) return; await removeStudent(s.id, "removed"); closeSheet(); toast("Student removed"); };
}

/* ---------- admin actions ---------- */
async function removeStudent(id, why) {
  await update(R(""), { [`names/${id}`]: null, [`lb/${id}`]: null, [`users/${id}`]: null, [`attempts/${id}`]: null, [`presence/${id}`]: null, [`removed/${id}`]: { why, ts: Date.now() } });
}
const xpOf = s => Math.floor((s.studySec || 0) / 60) + 15 * count(s.notesRead) + 4 * count(s.correct) + (s.mockXp || 0) + 20 * count(s.casesDone);
async function merge(from, to) {
  const [a, b] = await Promise.all([get(R("users/" + from)), get(R("users/" + to))]).then(x => x.map(s => s.val() || {}));
  const m = { ...b };
  for (const k of ["studySec", "mcqA", "mcqC", "mockCount", "mockXp"]) m[k] = (a[k] || 0) + (b[k] || 0);
  m.mockBest = Math.max(a.mockBest || 0, b.mockBest || 0);
  for (const k of ["notesRead", "correct", "casesDone"]) m[k] = { ...(a[k] || {}), ...(b[k] || {}) };
  m.wrong = { ...(a.wrong || {}), ...(b.wrong || {}) }; Object.keys(m.correct).forEach(k => delete m.wrong[k]);
  for (const k of ["days", "sections"]) { m[k] = { ...(b[k] || {}) }; Object.entries(a[k] || {}).forEach(([d, v]) => m[k][d] = (m[k][d] || 0) + v); }
  m.topics = { ...(b.topics || {}) }; Object.entries(a.topics || {}).forEach(([t, x]) => { const y = m.topics[t] || { a: 0, c: 0 }; m.topics[t] = { a: (y.a || 0) + (x.a || 0), c: (y.c || 0) + (x.c || 0) }; });
  m.createdAt = Math.min(a.createdAt || Infinity, b.createdAt || Infinity); if (!isFinite(m.createdAt)) delete m.createdAt;
  const lb = { ...(D.lb[to] || {}), xp: xpOf(m), best: m.mockBest, mocks: m.mockCount, solved: count(m.correct), acc: m.mcqA ? Math.round(m.mcqC / m.mcqA * 100) : 0, sec: m.studySec, notes: count(m.notesRead), ts: Date.now() };
  const upd = { [`users/${to}`]: m, [`lb/${to}`]: lb };
  Object.entries(D.attempts[from] || {}).forEach(([k, v]) => upd[`attempts/${to}/${k}`] = v);
  await update(R(""), upd);
  await removeStudent(from, "merged:" + to);
}

/* ---------- CSV ---------- */
function exportCSV() {
  const rows = [["Name", "Joined", "Last active", "Study minutes", "Notes read", "Questions answered", "Accuracy %", "Mocks", "Best mock %", "Cases", "XP"]];
  students().forEach(s => rows.push([s.name, s.joined ? new Date(s.joined).toISOString().slice(0, 10) : "", s.lastSeen ? new Date(s.lastSeen).toISOString() : "", Math.round(s.study / 60), s.notes, s.ans, s.acc, s.mocks, s.best, s.cases, s.xp]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `boardroom-students-${dayKey(new Date())}.csv`; a.click();
}
