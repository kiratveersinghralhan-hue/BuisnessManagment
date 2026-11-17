import { catalog } from "./catalog.js";
import { escapeHTML as e, announcements } from "./student.js";
const flatCount = (o) =>
  Object.values(o || {}).reduce((n, v) => n + Object.keys(v).length, 0);
export function management(root, students, news, publish) {
  const rows = Object.values(students).sort((a, b) => b.lastSeen - a.lastSeen);
  const details = (user) =>
    catalog
      .filter((c) => window.SUBJECT_DATA[c.id])
      .map((c) => {
        const d = window.SUBJECT_DATA[c.id],
          reviewed = d.notes.filter(
            (n) => user.completed?.[c.id]?.[n.id],
          ).length;
        const answers = Object.values(user.practice?.[c.id] || {});
        return (
          "<li>" +
          e(c.name) +
          " · " +
          reviewed +
          "/" +
          d.notes.length +
          " lessons · " +
          answers.filter(Boolean).length +
          "/" +
          answers.length +
          " latest answers correct</li>"
        );
      })
      .join("");
  root.innerHTML =
    '<small>Boardroom administration</small><h1>Academic overview</h1><div class="grid"><article><small>Student profiles</small><h2>' +
    rows.length +
    "</h2></article><article><small>Lessons marked reviewed</small><h2>" +
    rows.reduce((a, u) => a + flatCount(u.completed), 0) +
    "</h2></article><article><small>Courses with study materials</small><h2>" +
    catalog.filter((c) => window.SUBJECT_DATA[c.id]).length +
    " / " +
    catalog.length +
    '</h2></article></div><h2>Student activity</h2><label>Find by email<input id="find" type="search"></label><div id="roster"></div><h2>Course coverage</h2><div class="scroll"><table><thead><tr><th>Subject</th><th>Lessons</th><th>Questions</th><th>Recall cards</th></tr></thead><tbody>' +
    catalog
      .map((c) => {
        const d = window.SUBJECT_DATA[c.id];
        return (
          "<tr><td>" +
          e(c.name) +
          "</td>" +
          (d
            ? "<td>" +
              d.notes.length +
              "</td><td>" +
              d.bank.length +
              "</td><td>" +
              d.cards.length +
              "</td>"
            : '<td colspan="3">Coming soon</td>') +
          "</tr>"
        );
      })
      .join("") +
    '</tbody></table></div><h2>Announcements</h2><form id="post"><label>Title<input name="title" maxlength="60" required></label><label>Message<textarea name="text" maxlength="1000" required></textarea></label><button class="primary">Post to student workspace</button></form><div class="stack" id="news"></div>';
  const find = root.querySelector("#find");
  function filter() {
    const list = rows.filter((u) =>
      String(u.email).toLowerCase().includes(find.value.trim().toLowerCase()),
    );
    root.querySelector("#roster").innerHTML =
      list
        .map(
          (u) =>
            '<details class="unit"><summary>' +
            e(u.email) +
            " · Last workspace visit " +
            e(new Date(u.lastSeen).toLocaleString()) +
            "</summary><ul>" +
            details(u) +
            "</ul></details>",
        )
        .join("") || "<p>No matching student profiles.</p>";
  }
  find.oninput = filter;
  filter();
  root.querySelector("#news").innerHTML = announcements(news);
  const form = root.querySelector("#post");
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const btn = form.querySelector("button");
    btn.disabled = true;
    try {
      const title = form.elements.title.value.trim(),
        text = form.elements.text.value.trim();
      if (!title || !text) throw Error("Enter a title and message.");
      await publish(title, text);
      form.reset();
    } catch (err) {
      document.querySelector("#status").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  };
}
