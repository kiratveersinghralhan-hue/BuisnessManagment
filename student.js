import { timedPractice } from "./timed-practice.js";
import { loadSupplementalCourses } from "./supplemental-courses.js";
import { resources } from "./resources.js";
import { bankFor, splitQuestion } from "./quiz-bank.js";
import { catalog } from "./catalog.js";
import { showToast } from "./motion.js";
import { mountAudioReader, attachDictation } from "./audio-reader.js";
import { videosFor, videoCard, bindVideoCards, bookmarks, notes, references } from "./library.js";

export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export const href = (label, route, primary = false) =>
  '<a class="action ' +
  (primary ? "primary" : "") +
  '" href="#' +
  route +
  '">' +
  escapeHTML(label) +
  "</a>";

const e = escapeHTML;

export function renderQuestionBody(raw, headingTag = "h2") {
  const { prompt, code } = splitQuestion(raw);
  return (
    "<" +
    headingTag +
    ">" +
    e(prompt) +
    "</" +
    headingTag +
    ">" +
    (code ? '<pre class="qcode"><code>' + e(code) + "</code></pre>" : "")
  );
}

export function loadCourses() {
  function load(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Course files could not load. Refresh to retry."));
      document.head.append(script);
    });
  }
  return Promise.all(
    catalog
      .filter((c) => c.outline.length)
      .map((c) => load("./subject-" + c.id + ".js")),
  ).then(() => load("./ai-update.js")).then(loadSupplementalCourses);
}

export function announcements(data) {
  return Object.values(data || {})
    .sort((a, b) => Number(!!b.pin) - Number(!!a.pin) || b.ts - a.ts)
    .map(
      (a) =>
        '<article class="announce-card' +
        (a.pin ? " is-pinned" : "") +
        '"><div class="announce-meta"><small>' +
        e(new Date(a.ts).toLocaleDateString()) +
        " · " +
        e(catalog.find((c) => c.id === a.subj)?.name || "All subjects") +
        "</small>" +
        (a.pin ? '<span class="pin-badge">Pinned</span>' : "") +
        "</div><h3>" +
        e(a.title || "Announcement") +
        "</h3><p>" +
        e(a.text) +
        "</p></article>",
    )
    .join("");
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function studentPage(root, record, news, save) {
  const [courseId, view, item] = location.hash.slice(1).split("/");
  const c = catalog.find((c) => c.id === courseId),
    all = window.SUBJECT_DATA;

  function card(c) {
    const d = all[c.id],
      done = record.completed?.[c.id] || {},
      prac = record.practice?.[c.id] || {};
    const doneCount = d ? d.notes.filter((n) => done[n.id]).length : 0;
    const totalCount = d ? d.notes.length : 0;
    const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
    const mastered = Object.values(prac).filter((v) => v === true).length;
    const bankLen = bankFor(c.id).length;

    return (
      '<article class="course' +
      (d ? "" : " is-upcoming") +
      '"><div class="course-top"><small>' +
      e(c.code) +
      "</small>" +
      (d
        ? '<span class="status-pill">' + pct + "% read</span>"
        : '<span class="status-pill soon">Coming soon</span>') +
      "</div><h3>" +
      e(c.name) +
      "</h3><p>" +
      (d
        ? doneCount +
          " of " +
          totalCount +
          " lessons reviewed · " +
          mastered +
          "/" +
          bankLen +
          " MCQs"
        : "CULMS uploads pending · " + bankLen + " starter MCQs ready") +
      "</p>" +
      (d
        ? '<div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:' +
          pct +
          '%"></div></div>'
        : "") +
      href(d ? "Open subject" : "Open introductory practice", c.id) +
      "</article>"
    );
  }

  if (!c) {
    const active = catalog.filter((c) => all[c.id]);
    let last = null;
    for (const c of active) {
      for (const n of all[c.id].notes) {
        const ts = record.completed?.[c.id]?.[n.id];
        if (ts && (!last || ts > last.ts)) last = { ts, c };
      }
    }
    const nextCourse = last?.c || active[0],
      d = all[nextCourse.id],
      next = d.notes.find((n) => !record.completed?.[nextCourse.id]?.[n.id]);

    root.innerHTML =
      '<div class="page-head"><small class="eyebrow">BBA · Digital Science &amp; Business Management · Semester 1</small><h1>Study library</h1></div>' +
      '<div class="banner hero-banner"><div><small>' +
      (last ? "Continue studying · " + e(nextCourse.name) : "Start a study session · " + e(nextCourse.name)) +
      "</small><h3>" +
      e(next?.title || nextCourse.name) +
      "</h3><p class=\"muted\">" +
      e(next?.sum || "Review key ideas with recall cards and randomized practice.") +
      "</p></div>" +
      href(
        next ? "Open lesson" : "Practise recall",
        nextCourse.id + (next ? "/lesson/" + next.id : "/cards"),
        true,
      ) +
      "</div>" +
      '<h2 class="subjects-heading">Your subjects</h2><div class="grid">' +
      catalog.map(card).join("") +
      "</div>";

    return;
  }

  const d = all[c.id],
    base =
      '<a class="crumb" href="#">Study library</a>' +
      (view
        ? ' <span aria-hidden="true">›</span> <a class="crumb" href="#' +
          c.id +
          '">' +
          e(c.name) +
          "</a>"
        : "");
  root.innerHTML =
    '<nav class="breadcrumbs" aria-label="Breadcrumb">' +
    base +
    "</nav><small class=\"eyebrow\">" +
    e(c.code) +
    "</small><h1>" +
    e(c.name) +
    '</h1><div id="subject"></div>';

  const panel = root.querySelector("#subject");
  const syllabus =
    '<section class="panel syllabus-panel"><div class="row"><h3>CULMS syllabus and uploads</h3><small>Checked 19 November 2026</small></div>' +
    (c.outline.length
      ? "<ul>" +
        c.outline.map((v) => "<li>" + e(v) + "</li>").join("") +
        "</ul>"
      : "<p>The official unit outline has not been verified. The notes and practice below cover original subject fundamentals.</p>") +
    '<a class="action" href="' +
    c.url +
    '" target="_blank" rel="noopener">Open course in CULMS ↗</a></section>';

  const subjectVideos = videosFor(c.id);
  const subjectRefs = references[c.id] || [];
  const refsSection = subjectRefs.length
    ? '<section class="panel"><h3>Recommended references</h3><ul class="ref-list">' +
      subjectRefs
        .map(
          ([label, url]) =>
            '<li><a href="' + url + '" target="_blank" rel="noopener">' + e(label) + " ↗</a></li>",
        )
        .join("") +
      "</ul></section>"
    : "";
  const vidsSection = subjectVideos.length
    ? '<section class="panel"><div class="row"><h3>Reference videos</h3>' +
      href("All videos", "videos") +
      '</div><div class="video-grid compact">' +
      subjectVideos.slice(0, 6).map(videoCard).join("") +
      "</div></section>"
    : "";

  if (!d && !["practice", "mistakes"].includes(view)) {
    panel.innerHTML =
      syllabus +
      '<div class="panel"><h2>Introductory self-test</h2><p>Original subject fundamentals while CULMS materials are pending.</p>' +
      href("Start random self-test", c.id + "/practice", true) +
      href("Review mistakes", c.id + "/mistakes") +
      "</div>" +
      vidsSection +
      refsSection;
    bindVideoCards(panel);
    return;
  }

  const done = record.completed?.[c.id] || {};
  if (view === "timed") {
    const selected = shuffle(bankFor(c.id).map((row, index) => [index, row, shuffle([row[2], ...row[3]])])).slice(0, 10);
    timedPractice(panel, c.id, selected, save, e);
    return;
  }
  if (view === "resources") {
    panel.innerHTML = "<h2>Study resources</h2>" + resources(d);
    return;
  }

  if (view === "revision") {
    const rev = d.revision || {};
    panel.innerHTML =
      '<div class="lesson-tools"><button type="button" id="print-rev" class="chip">🖨 Print revision sheet</button></div>' +
      "<h2>Quick revision sheet</h2>" +
      (Object.keys(rev).length
        ? d.units
            .filter((u) => rev[u.id])
            .map(
              (u) =>
                '<article class="reading revision-unit"><small>' +
                e(u.name) +
                "</small><h3>" +
                e(u.title) +
                "</h3>" +
                rev[u.id] +
                "</article>",
            )
            .join("")
        : '<p class="muted">Revision sheet coming soon.</p>');
    panel.querySelector("#print-rev").onclick = () => window.print();
    return;
  }

  if (view === "lesson") {
    const n = d.notes.find((n) => n.id === item);
    if (!n) {
      location.hash = c.id;
      return;
    }
    const i = d.notes.indexOf(n);
    const prev = d.notes[i - 1],
      next = d.notes[i + 1];
    const words = (n.html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.round(words / 200));
    const related = videosFor(c.id, n.id);
    panel.innerHTML =
      '<article class="reading"><div class="lesson-meta"><small>' +
      e(n.lec) +
      "</small><span>Lesson " +
      (i + 1) +
      " of " +
      d.notes.length +
      " · " +
      mins +
      ' min read</span></div><div class="lesson-tools" role="toolbar" aria-label="Lesson tools"><button type="button" id="bm-toggle" class="chip">' +
      (bookmarks.has(c.id, n.id) ? "★ Bookmarked" : "☆ Bookmark") +
      '</button><button type="button" id="read-aloud" class="chip">🔊 Play lesson</button><button type="button" id="print-lesson" class="chip">🖨 Print / PDF</button></div><h2>' +
      e(n.title) +
      "</h2><section class=\"audio-card\" id=\"lesson-reader\" aria-label=\"Listen to this lesson\"></section>" +
      n.html +
      (related.length
        ? '<section class="related-videos"><h3>Watch: related videos</h3><div class="video-grid compact">' +
          related.map(videoCard).join("") +
          "</div></section>"
        : "") +
      '<hr><div class="lesson-takeaway"><p><strong>Active recall prompt:</strong> Close your notes and explain the main idea in your own words before marking reviewed.</p><div class="lesson-actions"><button id="review" class="primary">' +
      (done[n.id] ? "Reviewed" : "Mark reviewed") +
      "</button>" +
      href("Recall cards", c.id + "/cards/" + n.id) +
      href("Self-test", c.id + "/practice") +
      '</div></div><section class="my-notes"><label for="lesson-note">My private notes <small>(saved on this device)</small></label><textarea id="lesson-note" maxlength="4000" placeholder="Summarise this lesson in your own words, add examples or exam reminders…"></textarea><div class="personal-notes-actions"><button type="button" id="dictate-lesson" class="chip">🎙 Dictate my notes</button><span id="note-state" class="muted" role="status"></span></div></section><div class="lesson-pager">' +
      (prev
        ? '<a class="pager-link" href="#' +
          c.id +
          "/lesson/" +
          prev.id +
          '"><small>Previous</small><strong>← ' +
          e(prev.title) +
          "</strong></a>"
        : "<span></span>") +
      (next
        ? '<a class="pager-link pager-next" href="#' +
          c.id +
          "/lesson/" +
          next.id +
          '"><small>Next</small><strong>' +
          e(next.title) +
          " →</strong></a>"
        : "") +
      "</div></article>";
    const btn = panel.querySelector("#review");
    btn.disabled = !!done[n.id];
    bindVideoCards(panel);
    const bmBtn = panel.querySelector("#bm-toggle");
    bmBtn.onclick = () => {
      const on = bookmarks.toggle(c.id, n.id, n.title);
      bmBtn.textContent = on ? "★ Bookmarked" : "☆ Bookmark";
      showToast(on ? "Lesson bookmarked" : "Bookmark removed");
    };
    const noteBox = panel.querySelector("#lesson-note");
    const noteState = panel.querySelector("#note-state");
    const reader = mountAudioReader(panel.querySelector("#lesson-reader"), {
      title: "Listen to this lesson",
      description: "Play the full syllabus notes, your own notes, or highlighted text. Adjust voice and speed at any time.",
      sources: {
        lesson: {
          label: "Full lesson",
          getText: () => n.title + ". " + new DOMParser().parseFromString(n.html || "", "text/html").body.textContent,
        },
        private: { label: "My private notes", getText: () => noteBox.value },
        selected: { label: "Highlighted text", getText: () => window.getSelection()?.toString() || "" },
      },
      defaultSource: "lesson",
    });
    const readBtn = panel.querySelector("#read-aloud");
    readBtn.onclick = () => reader.start("lesson");
    if (!("speechSynthesis" in window)) readBtn.hidden = true;
    panel.querySelector("#print-lesson").onclick = () => window.print();
    attachDictation(panel.querySelector("#dictate-lesson"), noteBox, noteState);
    noteBox.value = notes.get(c.id, n.id);
    let noteTimer;
    noteBox.oninput = () => {
      clearTimeout(noteTimer);
      noteState.textContent = "Saving…";
      noteTimer = setTimeout(() => {
        notes.set(c.id, n.id, n.title, noteBox.value);
        noteState.textContent = "Saved";
      }, 500);
    };
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await save("completed/" + c.id + "/" + n.id, "timestamp");
        btn.textContent = "Reviewed";
        showToast("Lesson marked reviewed");
      } catch {
        btn.disabled = false;
      }
    };
    return;
  }

  if (view === "cards") {
    const subset = d.cards.filter((card) => card[0] === item),
      cards = shuffle(subset.length ? subset : d.cards);
    let i = 0;
    function show() {
      if (i === cards.length) {
        panel.innerHTML =
          '<div class="banner"><div><small>Complete</small><h2>Recall session complete</h2><p>You reviewed all ' +
          cards.length +
          " cards in this deck.</p></div>" +
          href("Return to subject", c.id, true) +
          "</div>";
        return;
      }
      const [, q, a] = cards[i];
      const pct = Math.round(((i + 1) / cards.length) * 100);
      panel.innerHTML =
        '<article class="reading flashcard"><div class="lesson-meta"><small>Recall card ' +
        (i + 1) +
        " / " +
        cards.length +
        '</small><div class="progress-track mini" aria-hidden="true"><div class="progress-fill" style="width:' +
        pct +
        '%"></div></div></div><h2>' +
        e(q) +
        '</h2><button id="reveal" class="primary">Reveal answer</button><div id="answer" hidden><div class="card-answer"><p>' +
        e(a) +
        '</p></div><button id="again">Review again this session</button><button id="next" class="primary">Got it</button></div></article>';
      panel.querySelector("#reveal").onclick = (ev) => {
        ev.target.hidden = true;
        panel.querySelector("#answer").hidden = false;
      };
      panel.querySelector("#again").onclick = () => {
        cards.push(cards[i++]);
        show();
      };
      panel.querySelector("#next").onclick = () => {
        i++;
        show();
      };
    }
    show();
    return;
  }

  if (view === "practice" || view === "mistakes") {
    const bank = bankFor(c.id);
    // Complexity-ranked practice buckets, not official university difficulty tags.
    // Quartiles give a stable 25/50/25 bell-shaped practice mix without rewriting
    // or adding any syllabus questions.
    const challengeScores = bank.map((row, index) => {
      const q = String(row[1] || "");
      const complexTerms = /calculate|derive|evaluate|predict|debug|output|interpret|compare|differentiat|integrat|complexity|algorithm|scenario|determin|matrix|apply|why|case|code|result|effect|strategy/i;
      return {index, score: q.length + (q.includes("\n") ? 85 : 0) + (complexTerms.test(q) ? 36 : 0) + (q.match(/[0-9]/g)||[]).length * 4};
    }).sort((a,b) => a.score-b.score || a.index-b.index);
    const challengeLevel = Array(bank.length).fill("medium");
    challengeScores.forEach((v,rank) => {
      challengeLevel[v.index] = rank < Math.round(bank.length*.25) ? "easy" : rank >= Math.round(bank.length*.75) ? "hard" : "medium";
    });
    const selectedLevel = view === "practice" && ["easy","medium","hard"].includes(item) ? item : "all";
    const levelMenu = view === "practice" ?
      '<div class="difficulty-picker" role="group" aria-label="Practice difficulty">' +
      [["all","Mixed / Bell curve","25 · 50 · 25"],["easy","Easy","Foundation"],["medium","Medium","Application"],["hard","Hard","Exam-style"]]
        .map(([id,label,sub]) => '<a class="' + (selectedLevel===id?'is-selected':'') + '" href="#' + c.id + '/practice' + (id==='all'?'':'/'+id) + '">' + e(label) + '<small>' + e(sub) + '</small></a>').join('') +
      '</div><p class="difficulty-note">25% easy · 50% medium · 25% hard is a suggested practice mix. Questions are grouped heuristically, not tagged or graded by the university.</p>' : '';
    const previous = record.practice?.[c.id] || {};
    const pool = bank
      .map((_, i) => i)
      .filter((i) => (view !== "mistakes" || previous[i] === false) && (selectedLevel === "all" || challengeLevel[i] === selectedLevel));

    let limit = view === "mistakes" ? pool.length : 5;
    let order = [];
    let step = 0,
      score = 0;

    function startSession(count) {
      limit = Math.min(count, pool.length || bank.length);
      if (view === "practice" && selectedLevel === "all" && limit >= 4) {
        const easy = shuffle(pool.filter(i=>challengeLevel[i]==="easy"));
        const medium = shuffle(pool.filter(i=>challengeLevel[i]==="medium"));
        const hard = shuffle(pool.filter(i=>challengeLevel[i]==="hard"));
        const baseEasy = Math.max(1,Math.round(limit*.25));
        const baseHard = Math.max(1,Math.round(limit*.25));
        const baseMedium = Math.max(1,limit-baseEasy-baseHard);
        const chosen=[...easy.slice(0,baseEasy),...medium.slice(0,baseMedium),...hard.slice(0,baseHard)];
        order = shuffle([...chosen, ...shuffle(pool.filter(i=>!chosen.includes(i))).slice(0,limit-chosen.length)]);
      } else order = shuffle(pool).slice(0, limit);
      step = 0;
      score = 0;
      show();
    }

    function show() {
      if (!order.length) {
        panel.innerHTML =
          '<div class="panel"><h3>No missed questions to review</h3><p class="muted">Every question you answered in this subject is currently marked correct.</p>' +
          href("Start a self-test", c.id + "/practice", true) +
          href("Return to subject", c.id) +
          "</div>";
        return;
      }

      if (step === order.length) {
        const pct = Math.round((score / order.length) * 100);
        panel.innerHTML =
          '<div class="banner score-banner"><div><small>Self-test complete · ' +
          pct +
          "%</small><h2>" +
          score +
          " of " +
          order.length +
          ' correct</h2></div><div class="lesson-actions"><button type="button" id="again-set" class="primary">Practise another ' +
          limit +
          "</button>" +
          href("Review mistakes", c.id + "/mistakes") +
          href("Return to lessons", c.id) +
          "</div></div>";
        panel.querySelector("#again-set").onclick = () => startSession(limit);
        return;
      }

      const idx = order[step],
        [note, q, correct, others, why] = bank[idx],
        choices = shuffle([correct, ...others]);
      const keys = ["A", "B", "C", "D"];
      const lengthBar =
        view === "practice" && pool.length > 5
          ? '<div class="quiz-toolbar"><span>Session length:</span>' +
            [5, 10, 15]
              .filter((n) => n <= pool.length || n === 5)
              .map(
                (n) =>
                  '<button type="button" class="chip' +
                  (limit === n ? " active" : "") +
                  '" data-len="' +
                  n +
                  '">' +
                  n +
                  " Qs</button>",
              )
              .join("") +
            "</div>"
          : "";

      panel.innerHTML =
        levelMenu + lengthBar +
        '<article class="reading quiz-card"><span class="difficulty-label">✦ ' + e(challengeLevel[idx][0].toUpperCase()+challengeLevel[idx].slice(1)) + ' · Practice question ' + (step+1) + '</span><div class="lesson-meta"><small>Practice · ' +
        (step + 1) +
        " of " +
        order.length +
        '</small><div class="progress-track mini" aria-hidden="true"><div class="progress-fill" style="width:' +
        Math.round(((step + 1) / order.length) * 100) +
        '%"></div></div></div>' +
        renderQuestionBody(q, "h2") +
        '<div class="choices-list">' +
        choices
          .map(
            (v, j) =>
              '<button class="choice" data-i="' +
              j +
              '"><span class="opt-key" aria-hidden="true">' +
              keys[j] +
              "</span><span>" +
              e(v) +
              "</span></button>",
          )
          .join("") +
        '</div><div id="feedback" role="status"></div></article>';

      panel.querySelectorAll("[data-len]").forEach((lenBtn) => {
        lenBtn.onclick = () => startSession(Number(lenBtn.dataset.len));
      });

      panel.querySelectorAll(".choice").forEach(
        (b) =>
          (b.onclick = async () => {
            const buttons = [...panel.querySelectorAll(".choice")];
            buttons.forEach((x) => {
              x.disabled = true;
              if (choices[+x.dataset.i] === correct) x.classList.add("is-correct");
            });
            const ok = choices[+b.dataset.i] === correct;
            if (!ok) b.classList.add("is-wrong");
            if (ok) score++;

            let saved = true;
            try {
              await save("practice/" + c.id + "/" + idx, ok);
            } catch {
              saved = false;
            }
            if (!panel.isConnected) return;
            panel.querySelector("#feedback").innerHTML =
              '<div class="feedback-box ' +
              (ok ? "is-ok" : "is-bad") +
              '"><h3>' +
              (ok ? "Correct" : "Correct answer: " + e(correct)) +
              "</h3><p>" +
              e(why) +
              "</p>" +
              (!saved ? "<p>This answer could not be saved.</p>" : "") +
              '<div class="lesson-actions"><button id="next" class="primary">' +
              (step + 1 === order.length ? "See result" : "Next question") +
              "</button>" +
              (note ? href("Review lesson", c.id + "/lesson/" + note) : "") +
              "</div></div>";
            panel.querySelector("#next").onclick = () => {
              step++;
              show();
            };
          }),
      );
    }

    startSession(limit);
    return;
  }

  const doneCount = d.notes.filter((n) => done[n.id]).length;
  const pct = d.notes.length ? Math.round((doneCount / d.notes.length) * 100) : 0;
  const prac = record.practice?.[c.id] || {};
  const wrongCount = Object.values(prac).filter((v) => v === false).length;

  panel.innerHTML =
    '<div class="banner subject-banner"><div><strong>' +
    doneCount +
    " / " +
    d.notes.length +
    " lessons reviewed (" +
    pct +
    '%)</strong><div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:' +
    pct +
    '%"></div></div><p>Test what you remember, then revisit the explanation.</p></div><div class="lesson-actions">' +
    href("Random self-test", c.id + "/practice", true) +
    href("Timed practice", c.id + "/timed") +
    href(
      "Review mistakes" + (wrongCount ? " (" + wrongCount + ")" : ""),
      c.id + "/mistakes",
    ) +
    href("Recall cards", c.id + "/cards") +
    (d.revision ? href("Revision sheet", c.id + "/revision") : "") +
    href("Study resources", c.id + "/resources") +
    "</div></div>" +
    syllabus +
    "<h2>Study notes</h2>" +
    d.units
      .map(
        (u) =>
          '<details class="unit" open><summary>' +
          e(u.name) +
          " · " +
          e(u.title) +
          "</summary>" +
          d.notes
            .filter((n) => n.unit === u.id)
            .map(
              (n) =>
                '<a class="lesson' +
                (done[n.id] ? " is-done" : "") +
                '" href="#' +
                c.id +
                "/lesson/" +
                n.id +
                '"><span class="lesson-check" aria-hidden="true">' +
                (done[n.id] ? "✓" : "○") +
                "</span><span>" +
                e(n.title) +
                "</span><small>" +
                e(n.lec) +
                "</small></a>",
            )
            .join("") +
          "</details>",
      )
      .join("") +
    vidsSection +
    refsSection;
  bindVideoCards(panel);
}
