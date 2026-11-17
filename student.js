import { resources } from "./resources.js";
import { catalog } from "./catalog.js";
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
  ).then(() => load("./ai-update.js"));
}
export function announcements(data) {
  return Object.values(data || {})
    .sort((a, b) => Number(!!b.pin) - Number(!!a.pin) || b.ts - a.ts)
    .map(
      (a) =>
        "<article><small>" +
        e(new Date(a.ts).toLocaleDateString()) +
        " · " +
        e(catalog.find((c) => c.id === a.subj)?.name || "All subjects") +
        "</small><h3>" +
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
      done = record.completed?.[c.id] || {};
    return (
      '<article class="course"><small>' +
      c.code +
      "</small><h3>" +
      e(c.name) +
      "</h3><p>" +
      (d
        ? d.notes.filter((n) => done[n.id]).length +
          " of " +
          d.notes.length +
          " lessons reviewed"
        : "Coming soon") +
      "</p>" +
      href(d ? "Open subject" : "View syllabus", c.id) +
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
      '<small>BBA · Digital Science &amp; Business Management · Semester 1</small><h1>Study library</h1><div class="banner"><small>' +
      (last ? "Continue studying" : "Start a study session") +
      "</small><h3>" +
      e(next?.title || nextCourse.name) +
      "</h3>" +
      href(
        next ? "Open lesson" : "Practise recall",
        nextCourse.id + (next ? "/lesson/" + next.id : "/cards"),
        true,
      ) +
      '</div><h2>Your subjects</h2><div class="grid">' +
      catalog.map(card).join("") +
      "</div>" +
      (Object.keys(news).length
        ? '<h2>Announcements</h2><div class="stack">' +
          announcements(news) +
          "</div>"
        : "");
    return;
  }
  const d = all[c.id],
    base = href("Study library", "") + (view ? href(c.name, c.id) : "");
  root.innerHTML =
    "<nav>" +
    base +
    "</nav><small>" +
    c.code +
    "</small><h1>" +
    e(c.name) +
    '</h1><div id="subject"></div>';
  const panel = root.querySelector("#subject");
  const syllabus =
    '<section class="panel"><h3>CULMS syllabus and uploads</h3><small>Checked 17 November 2026</small>' +
    (c.outline.length
      ? "<ul>" +
        c.outline.map((v) => "<li>" + e(v) + "</li>").join("") +
        "</ul>"
      : "<p>Coming soon. The course handout and unit sections were empty at the last check.</p>") +
    '<a href="' +
    c.url +
    '" target="_blank" rel="noopener">Open course in CULMS ↗</a></section>';
  if (!d) {
    panel.innerHTML = syllabus;
    return;
  }
  const done = record.completed?.[c.id] || {};
  if (view === "resources") {
    panel.innerHTML = "<h2>Study resources</h2>" + resources(d);
    return;
  }
  if (view === "lesson") {
    const n = d.notes.find((n) => n.id === item);
    if (!n) {
      location.hash = c.id;
      return;
    }
    const i = d.notes.indexOf(n);
    panel.innerHTML =
      '<article class="reading"><small>' +
      e(n.lec) +
      "</small><h2>" +
      e(n.title) +
      "</h2>" +
      n.html +
      '<hr><p>Close your notes and explain the main idea in your own words.</p><button id="review" class="primary">' +
      (done[n.id] ? "Reviewed" : "Mark reviewed") +
      "</button>" +
      href("Recall cards", c.id + "/cards/" + n.id) +
      (d.notes[i + 1]
        ? href("Next lesson", c.id + "/lesson/" + d.notes[i + 1].id)
        : "") +
      "</article>";
    const btn = panel.querySelector("#review");
    btn.disabled = !!done[n.id];
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await save("completed/" + c.id + "/" + n.id, "timestamp");
        btn.textContent = "Reviewed";
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
          '<div class="banner"><h2>Recall session complete</h2>' +
          href("Return to subject", c.id) +
          "</div>";
        return;
      }
      const [, q, a] = cards[i];
      panel.innerHTML =
        '<article class="reading"><small>Recall card ' +
        (i + 1) +
        " / " +
        cards.length +
        "</small><h2>" +
        e(q) +
        '</h2><button id="reveal">Reveal answer</button><div id="answer" hidden><p>' +
        e(a) +
        '</p><button id="again">Review again this session</button><button id="next">Got it</button></div></article>';
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
  if (view === "practice") {
    const previous = record.practice?.[c.id] || {},
      order = shuffle(d.bank.map((_, i) => i))
        .sort((a, b) => rank(a) - rank(b))
        .slice(0, 5);
    let step = 0,
      score = 0;
    function rank(i) {
      return previous[i] === false ? 0 : previous[i] === undefined ? 1 : 2;
    }
    function show() {
      if (step === order.length) {
        panel.innerHTML =
          '<div class="banner"><h2>' +
          score +
          " of " +
          order.length +
          " correct</h2>" +
          href("Return to lessons", c.id) +
          "</div>";
        return;
      }
      const idx = order[step],
        [note, q, correct, others, why] = d.bank[idx],
        choices = shuffle([correct, ...others]);
      panel.innerHTML =
        '<article class="reading"><small>Practice · ' +
        (step + 1) +
        " of " +
        order.length +
        '</small><h2 style="white-space:pre-wrap">' +
        e(q) +
        "</h2>" +
        choices
          .map(
            (v, j) =>
              '<button class="choice" data-i="' + j + '">' + e(v) + "</button>",
          )
          .join("") +
        '<div id="feedback" role="status"></div></article>';
      panel.querySelectorAll(".choice").forEach(
        (b) =>
          (b.onclick = async () => {
            panel
              .querySelectorAll(".choice")
              .forEach((x) => (x.disabled = true));
            const ok = choices[+b.dataset.i] === correct;
            if (ok) score++;
            let saved = true;
            try {
              await save("practice/" + c.id + "/" + idx, ok);
            } catch {
              saved = false;
            }
            if (!panel.isConnected) return;
            panel.querySelector("#feedback").innerHTML =
              "<h3>" +
              (ok ? "Correct" : "Correct answer: " + e(correct)) +
              "</h3><p>" +
              e(why) +
              "</p>" +
              (!saved ? "<p>This answer could not be saved.</p>" : "") +
              '<button id="next" class="primary">' +
              (step + 1 === order.length ? "See result" : "Next question") +
              "</button>" +
              href("Review lesson", c.id + "/lesson/" + note);
            panel.querySelector("#next").onclick = () => {
              step++;
              show();
            };
          }),
      );
    }
    show();
    return;
  }
  panel.innerHTML =
    '<div class="banner"><strong>' +
    d.notes.filter((n) => done[n.id]).length +
    " / " +
    d.notes.length +
    " lessons reviewed</strong><p>Test what you remember, then revisit the explanation.</p>" +
    href("Five-question practice", c.id + "/practice", true) +
    href("Recall cards", c.id + "/cards") +
    href("Study resources", c.id + "/resources") +
    "</div>" +
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
                '<a class="lesson" href="#' +
                c.id +
                "/lesson/" +
                n.id +
                '">' +
                (done[n.id] ? "✓ " : "") +
                e(n.title) +
                "</a>",
            )
            .join("") +
          "</details>",
      )
      .join("");
}
