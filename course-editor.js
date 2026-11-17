import {
  ref,
  onValue,
  set,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { catalog } from "./catalog.js";
import { escapeHTML as e } from "./student.js";
import { showToast } from "./motion.js";

export function courseEditor(root, db) {
  root.innerHTML =
    '<div class="page-head"><small class="eyebrow">Boardroom administration</small><h1>Course updates</h1></div>' +
    '<form><label>Subject<select>' +
    catalog
      .map((c) => '<option value="' + c.id + '">' + e(c.name) + "</option>")
      .join("") +
    '</select></label><label>Update for students<textarea maxlength="1800" required placeholder="Add exam notices, handout updates, or room instructions for this subject…"></textarea></label><p class="muted">Appears as a highlighted banner above the subject’s syllabus and study tools.</p><div class="lesson-actions"><button class="primary">Save course update</button><button type="button" id="remove-update">Delete update</button></div></form>';

  const form = root.querySelector("form"),
    select = form.querySelector("select"),
    input = form.querySelector("textarea"),
    del = form.querySelector("#remove-update");
  let data = {},
    dirty = false;

  function show() {
    input.value = data[select.value]?.text || "";
    del.disabled = !data[select.value];
    dirty = false;
  }

  select.onchange = show;
  input.oninput = () => (dirty = true);

  const stop = onValue(
    ref(db, "courseUpdates"),
    (snap) => {
      data = snap.val() || {};
      if (!dirty) show();
    },
    (err) => (document.querySelector("#status").textContent = err.message),
  );

  async function store(value) {
    try {
      await set(ref(db, "courseUpdates/" + select.value), value);
      show();
      const msg = value ? "Course update saved." : "Course update removed.";
      document.querySelector("#status").textContent = msg;
      showToast(msg);
    } catch (err) {
      document.querySelector("#status").textContent = err.message;
    }
  }

  form.onsubmit = (ev) => {
    ev.preventDefault();
    if (input.value.trim())
      store({ text: input.value.trim(), ts: serverTimestamp() });
  };
  del.onclick = () => {
    if (confirm("Delete the update for this subject?")) store(null);
  };

  return stop;
}
