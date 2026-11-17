import { escapeHTML as e } from "./student.js";
function rubric(points) {
  return (
    "<ul>" +
    points
      .map(
        ([label, marks]) =>
          "<li>" + e(label) + " <small>(" + e(marks) + " marks)</small></li>",
      )
      .join("") +
    "</ul>"
  );
}
function reveal(answer) {
  return (
    "<details><summary>Compare your answer</summary>" + answer + "</details>"
  );
}
function question(prompt, answer) {
  return (
    '<div class="unit"><p>' + e(prompt) + "</p>" + reveal(answer) + "</div>"
  );
}
function section(title, content) {
  return content
    ? '<details class="panel"><summary>' +
        e(title) +
        "</summary>" +
        content +
        "</details>"
    : "";
}
export function resources(d) {
  const written = [...(d.short || []), ...(d.longq || [])]
    .map(([, prompt, points]) => question(prompt, rubric(points)))
    .join("");
  const cases = [...(d.cases || []), ...(d.casesets || []), ...(d.long || [])]
    .map((c) => {
      const entries = c.parts
        ? c.parts.map(([q, , points]) => question(q, rubric(points)))
        : c.qs.map(([q, a, others, why]) =>
            question(
              q,
              others ? "<p>" + e(a) + "</p><p>" + e(why) + "</p>" : a,
            ),
          );
      return section(c.title, "<p>" + e(c.text) + "</p>" + entries.join(""));
    })
    .join("");
  const videos = (d.videos || [])
    .filter(([id]) => /^[\w-]{11}$/.test(id))
    .map(
      ([id, , name]) =>
        '<li><a href="https://www.youtube.com/watch?v=' +
        id +
        '" target="_blank" rel="noopener">' +
        e(name) +
        "</a></li>",
    )
    .join("");
  return (
    '<div class="stack">' +
    section("Study guide", d.guide) +
    section("Written practice", written) +
    section("Case studies", cases) +
    section("Video library", videos ? "<ul>" + videos + "</ul>" : "") +
    "</div>"
  );
}
