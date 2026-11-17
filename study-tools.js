import { catalog } from "./catalog.js";
import { escapeHTML as e } from "./student.js";
import { showToast } from "./motion.js";

function dayKey(ms) {
  const d = new Date(ms);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function readLocal(uid) {
  try {
    return JSON.parse(localStorage.getItem("br_focus_" + uid) || "{}");
  } catch {
    return {};
  }
}

function writeLocal(uid, data) {
  try {
    localStorage.setItem("br_focus_" + uid, JSON.stringify(data));
  } catch {
    /* Storage optional */
  }
}

export function computeStudyStats(record, uid) {
  const all = window.SUBJECT_DATA || {};
  let totalLessons = 0,
    doneLessons = 0,
    masteredQs = 0,
    attemptedQs = 0;
  const activeDays = new Set();

  for (const c of catalog) {
    const notes = all[c.id]?.notes || [];
    totalLessons += notes.length;
    const comp = record.completed?.[c.id] || {};
    for (const n of notes) {
      if (comp[n.id]) {
        doneLessons++;
        if (typeof comp[n.id] === "number") activeDays.add(dayKey(comp[n.id]));
      }
    }
    const prac = record.practice?.[c.id] || {};
    for (const val of Object.values(prac)) {
      attemptedQs++;
      if (val === true) masteredQs++;
    }
  }

  const local = readLocal(uid);
  for (const d of local.days || []) activeDays.add(d);

  // Consecutive streak up to today (or yesterday if today not yet logged).
  let streak = 0;
  const now = new Date();
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!activeDays.has(dayKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (activeDays.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const pct = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;
  return {
    totalLessons,
    doneLessons,
    masteredQs,
    attemptedQs,
    pct,
    streak,
    focusSessions: Number(local.sessions || 0),
    focusMinutes: Number(local.minutes || 0),
  };
}

export function studyTools(root, uid, record) {
  const all = window.SUBJECT_DATA || {};
  const stats = computeStudyStats(record, uid);

  const section = document.createElement("section");
  section.className = "study-strip";
  section.setAttribute("aria-label", "Study tools and focus");
  section.innerHTML =
    '<div class="study-tool-card mastery-card">' +
    '<div class="tool-head"><small>Readiness &amp; streak</small><span class="streak-pill">' +
    stats.streak +
    " day" +
    (stats.streak === 1 ? "" : "s") +
    " streak</span></div>" +
    '<div class="mastery-metrics">' +
    "<div><strong>" +
    stats.doneLessons +
    " / " +
    stats.totalLessons +
    "</strong><span>Lessons reviewed (" +
    stats.pct +
    "%)</span></div>" +
    "<div><strong>" +
    stats.masteredQs +
    "</strong><span>Self-test Qs mastered</span></div>" +
    "<div><strong id='focus-count'>" +
    stats.focusSessions +
    "</strong><span>Focus sessions (" +
    stats.focusMinutes +
    "m)</span></div>" +
    "</div>" +
    '<div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:' +
    stats.pct +
    '%"></div></div>' +
    '<p class="muted goal-line">' +
    (record.details?.goal
      ? "Goal: " + e(record.details.goal) + ' · <a href="#profile">Edit</a>'
      : 'No study goal set yet · <a href="#profile">Set a semester goal</a>') +
    "</p>" +
    "</div>" +
    '<div class="study-tool-card focus-card">' +
    '<div class="tool-head"><small>Pomodoro focus timer</small><span id="focus-mode-label">Deep focus</span></div>' +
    '<div class="focus-clock" id="focus-clock">25:00</div>' +
    '<div class="focus-modes" role="group" aria-label="Timer length">' +
    '<button type="button" class="chip active" data-mins="25" data-label="Deep focus">25m</button>' +
    '<button type="button" class="chip" data-mins="15" data-label="Quick sprint">15m</button>' +
    '<button type="button" class="chip" data-mins="5" data-label="Short break">5m break</button>' +
    "</div>" +
    '<div class="focus-actions">' +
    '<button type="button" class="primary" id="focus-toggle">Start focus</button>' +
    '<button type="button" id="focus-reset">Reset</button>' +
    "</div>" +
    "</div>" +
    '<div class="study-tool-card search-card">' +
    '<div class="tool-head"><small>Quick concept search</small><span>Across all subjects</span></div>' +
    '<label class="sr-label" for="concept-search">Search lessons or concepts</label>' +
    '<input id="concept-search" type="search" placeholder="Search notes (e.g. Porter, matrix, loop, churn)…">' +
    '<div id="concept-results" class="concept-results"></div>' +
    "</div>";

  const heading = root.querySelector(".subjects-heading");
  if (heading) heading.before(section);
  else root.append(section);

  // Build lesson index for instant concept search.
  const index = [];
  for (const c of catalog) {
    for (const n of all[c.id]?.notes || []) {
      index.push({
        cid: c.id,
        cname: c.name,
        id: n.id,
        title: n.title,
        hay: (c.name + " " + n.title + " " + (n.sum || "")).toLowerCase(),
      });
    }
  }
  const searchInput = section.querySelector("#concept-search");
  const resultsBox = section.querySelector("#concept-results");
  searchInput.oninput = () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      resultsBox.innerHTML = "";
      return;
    }
    const matches = index.filter((item) => item.hay.includes(q)).slice(0, 5);
    resultsBox.innerHTML = matches.length
      ? matches
          .map(
            (m) =>
              '<a class="concept-hit" href="#' +
              m.cid +
              "/lesson/" +
              m.id +
              '"><strong>' +
              e(m.title) +
              "</strong><span>" +
              e(m.cname) +
              "</span></a>",
          )
          .join("")
      : '<p class="muted">No matching lesson notes found.</p>';
  };

  // Pomodoro timer state persisted per-tab in window.__brTimer so route switches keep ticking.
  const state = (window.__brTimer ??= {
    mins: 25,
    label: "Deep focus",
    remaining: 25 * 60,
    running: false,
    endAt: 0,
  });

  const clockEl = section.querySelector("#focus-clock");
  const modeLabelEl = section.querySelector("#focus-mode-label");
  const toggleBtn = section.querySelector("#focus-toggle");
  const resetBtn = section.querySelector("#focus-reset");
  const modeBtns = section.querySelectorAll(".focus-modes .chip");
  const focusCountEl = section.querySelector("#focus-count");
  let interval = null;

  function fmt(sec) {
    const s = Math.max(0, Math.ceil(sec));
    return (
      String(Math.floor(s / 60)).padStart(2, "0") +
      ":" +
      String(s % 60).padStart(2, "0")
    );
  }

  function syncModeChips() {
    modeBtns.forEach((b) =>
      b.classList.toggle("active", Number(b.dataset.mins) === state.mins),
    );
    modeLabelEl.textContent = state.label;
  }

  function completeSession() {
    state.running = false;
    state.remaining = state.mins * 60;
    clearInterval(interval);
    if (state.mins >= 15) {
      const local = readLocal(uid);
      local.sessions = Number(local.sessions || 0) + 1;
      local.minutes = Number(local.minutes || 0) + state.mins;
      const days = new Set(local.days || []);
      days.add(dayKey(Date.now()));
      local.days = [...days].slice(-60);
      writeLocal(uid, local);
      focusCountEl.textContent = String(local.sessions);
    }
    showToast(state.label + " complete! Take a quick stretch.");
    renderClock();
  }

  function renderClock() {
    if (state.running) {
      const left = Math.max(0, (state.endAt - Date.now()) / 1000);
      state.remaining = left;
      if (left <= 0) {
        completeSession();
        return;
      }
    }
    clockEl.textContent = fmt(state.remaining);
    toggleBtn.textContent = state.running ? "Pause timer" : "Start focus";
    syncModeChips();
  }

  function startTicking() {
    clearInterval(interval);
    if (state.running) interval = setInterval(renderClock, 500);
  }

  modeBtns.forEach((b) => {
    b.onclick = () => {
      state.running = false;
      clearInterval(interval);
      state.mins = Number(b.dataset.mins);
      state.label = b.dataset.label;
      state.remaining = state.mins * 60;
      renderClock();
    };
  });

  toggleBtn.onclick = () => {
    if (state.running) {
      state.remaining = Math.max(0, (state.endAt - Date.now()) / 1000);
      state.running = false;
      clearInterval(interval);
    } else {
      if (state.remaining <= 0) state.remaining = state.mins * 60;
      state.endAt = Date.now() + state.remaining * 1000;
      state.running = true;
      startTicking();
    }
    renderClock();
  };

  resetBtn.onclick = () => {
    state.running = false;
    clearInterval(interval);
    state.remaining = state.mins * 60;
    renderClock();
  };

  renderClock();
  if (state.running) startTicking();

  return () => clearInterval(interval);
}
