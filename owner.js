import {
  ref,
  onValue,
  update,
  set,
  push,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { escapeHTML as e, href } from "./student.js";
import { face } from "./community.js";
import { catalog } from "./catalog.js";
import { bankFor } from "./quiz-bank.js";
import { showToast } from "./motion.js";

const date = (t) => (t ? new Date(t).toLocaleString() : "—");

export function owner(root, db, route) {
  let stops = [];
  const watch = (p, f) =>
    stops.push(
      onValue(
        ref(db, p),
        (s) => f(s.val() || {}),
        (err) => (document.querySelector("#status").textContent = err.message),
      ),
    );
  const heading = (t) =>
    '<div class="page-head"><small class="eyebrow">Boardroom administration</small><h1>' +
    t +
    "</h1></div>";
  const [view, id] = route.split("/");
  const msg = (t) => (document.querySelector("#status").textContent = t);

  if (view === "announcements") {
    root.innerHTML =
      heading("Announcements") +
      '<form id="post"><label>Title<input name="title" maxlength="60" required></label>' +
      '<div class="form-row"><label>Target subject<select name="subj"><option value="all">All subjects</option>' +
      catalog
        .map((c) => '<option value="' + c.id + '">' + e(c.name) + "</option>")
        .join("") +
      '</select></label><label class="check-label"><input type="checkbox" name="pin"> Pin announcement to top</label></div>' +
      '<label>Message<textarea name="text" maxlength="1000" required></textarea></label>' +
      '<div class="lesson-actions"><button class="primary">Publish announcement</button><button type="button" id="cancel" hidden>Cancel edit</button></div></form>' +
      '<section id="posts"></section>';
    const form = root.querySelector("form");
    let edit = null,
      items = {};

    function reset() {
      edit = null;
      form.reset();
      form.elements.subj.value = "all";
      form.elements.pin.checked = false;
      form.querySelector(".primary").textContent = "Publish announcement";
      form.querySelector("#cancel").hidden = true;
    }

    form.querySelector("#cancel").onclick = reset;
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const title = form.elements.title.value.trim(),
        text = form.elements.text.value.trim(),
        subj = form.elements.subj.value || "all",
        pin = Boolean(form.elements.pin.checked);
      if (!title || !text) return;
      const btn = form.querySelector(".primary");
      btn.disabled = true;
      try {
        const target = edit
          ? ref(db, "announce/" + edit)
          : push(ref(db, "announce"));
        await update(
          target,
          edit
            ? { title, text, subj, pin, edited: serverTimestamp() }
            : { title, text, subj, pin, ts: serverTimestamp() },
        );
        reset();
        msg("Announcement saved.");
        showToast("Announcement published");
      } catch (err) {
        msg(err.message);
      } finally {
        btn.disabled = false;
      }
    };

    watch("announce", (data) => {
      items = data;
      root.querySelector("#posts").innerHTML =
        Object.entries(data)
          .sort(
            (a, b) =>
              Number(!!b[1].pin) - Number(!!a[1].pin) || b[1].ts - a[1].ts,
          )
          .map(
            ([key, v]) =>
              '<article class="announce-card' +
              (v.pin ? " is-pinned" : "") +
              '"><div class="announce-meta"><small>' +
              e(date(v.ts)) +
              " · " +
              e(
                catalog.find((c) => c.id === v.subj)?.name || "All subjects",
              ) +
              "</small>" +
              (v.pin ? '<span class="pin-badge">Pinned</span>' : "") +
              "</div><h3>" +
              e(v.title || "Announcement") +
              "</h3><p>" +
              e(v.text) +
              '</p><div class="lesson-actions"><button data-edit="' +
              e(key) +
              '">Edit</button><button data-delete="' +
              e(key) +
              '">Delete</button></div></article>',
          )
          .join("") || '<p class="muted">No announcements yet.</p>';
    });

    root.querySelector("#posts").onclick = async (ev) => {
      const key = ev.target.dataset.edit || ev.target.dataset.delete;
      if (!items[key]) return;
      if (ev.target.dataset.edit) {
        edit = key;
        form.elements.title.value = items[key].title || "Announcement";
        form.elements.text.value = items[key].text;
        form.elements.subj.value = items[key].subj || "all";
        form.elements.pin.checked = Boolean(items[key].pin);
        form.querySelector(".primary").textContent = "Save changes";
        form.querySelector("#cancel").hidden = false;
        form.elements.title.focus();
      } else if (confirm("Delete this announcement for all students?"))
        try {
          await set(ref(db, "announce/" + key), null);
          if (edit === key) reset();
          msg("Announcement deleted.");
          showToast("Announcement deleted");
        } catch (err) {
          msg(err.message);
        }
    };
  } else if (view === "students" && id && /^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    root.innerHTML =
      href("All students", "students") +
      heading("Student record") +
      '<div id="info" class="panel"></div><div id="badge" class="panel"></div><div id="detail"></div><h2>Private messages</h2><form><label>Message to this student<textarea name="message" required maxlength="1500"></textarea></label><button class="primary">Send private message</button></form><div id="messages"></div>';

    watch("students/" + id, (u) => {
      root.querySelector("#info").innerHTML =
        "<h2>" +
        e(u.email || "No student profile") +
        "</h2><p><strong>Last workspace visit:</strong> " +
        e(date(u.lastSeen)) +
        "</p><p><strong>Latest activity:</strong> " +
        e(u.activity?.label || "No activity recorded") +
        " · " +
        e(date(u.activity?.ts)) +
        "</p><p><strong>Gender:</strong> " +
        e(u.details?.gender || "Unspecified") +
        "<br><strong>Study goal:</strong> " +
        e(u.details?.goal || "Unspecified") +
        "</p>";

      root.querySelector("#detail").innerHTML =
        "<h2>Study progress</h2>" +
        catalog
          .map((c) => {
            const ans = Object.entries(u.practice?.[c.id] || {}),
              notes = Object.keys(u.completed?.[c.id] || {});
            return (
              '<details class="unit"><summary>' +
              e(c.name) +
              " · " +
              notes.length +
              " reviewed · " +
              ans.filter((a) => a[1]).length +
              "/" +
              ans.length +
              " latest answers correct</summary>" +
              notes
                .map(
                  (key) =>
                    "<p>✓ " +
                    e(
                      window.SUBJECT_DATA[c.id]?.notes.find((n) => n.id === key)
                        ?.title || key,
                    ) +
                    "</p>",
                )
                .join("") +
              ans
                .map(
                  ([i, ok]) =>
                    "<p>" +
                    e(bankFor(c.id)?.[i]?.[1] || "Question") +
                    " · <strong>" +
                    (ok ? "Correct" : "Review") +
                    "</strong></p>",
                )
                .join("") +
              "</details>"
            );
          })
          .join("");
    });

    watch("profiles/" + id, (p) => {
      const spot = root.querySelector("#badge");
      spot.innerHTML =
        '<div class="profile-summary-left">' +
        face(p) +
        "<div><strong>Username:</strong> " +
        e(p.name || "Unspecified") +
        "</div></div>" +
        '<div class="lesson-actions" id="mod-actions"></div>';
      const actions = spot.querySelector("#mod-actions");
      if (p.name) {
        const rename = document.createElement("button");
        rename.textContent = "Edit username";
        rename.onclick = async () => {
          const input = prompt(
            "New username (3–20 letters, numbers or underscores)",
            p.name,
          );
          if (input === null) return;
          if (!/^[A-Za-z0-9_]{3,20}$/.test(input))
            return msg("Enter a valid username.");
          try {
            await set(ref(db, "profiles/" + id + "/name"), input);
            msg("Username updated.");
          } catch (err) {
            msg(err.message);
          }
        };
        actions.append(rename);
      }
      if (p.photo) {
        const delPhoto = document.createElement("button");
        delPhoto.textContent = "Remove profile picture";
        delPhoto.onclick = async () => {
          if (confirm("Remove this student’s profile picture?"))
            try {
              await set(ref(db, "profiles/" + id + "/photo"), null);
            } catch (err) {
              msg(err.message);
            }
        };
        actions.append(delPhoto);
      }
    });

    watch(
      "inbox/" + id,
      (data) => (root.querySelector("#messages").innerHTML = messages(data)),
    );

    const form = root.querySelector("form");
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const body = form.elements.message.value.trim();
      if (!body) return;
      const btn = form.querySelector("button");
      btn.disabled = true;
      try {
        await set(push(ref(db, "inbox/" + id)), {
          text: body,
          ts: serverTimestamp(),
        });
        form.reset();
        msg("Private message sent.");
        showToast("Private message sent");
      } catch (err) {
        msg(err.message);
      } finally {
        btn.disabled = false;
      }
    };
  } else if (view === "rooms") {
    root.innerHTML = heading("Battle rooms") + '<div id="rooms"></div>';
    watch("quizRooms", (rooms) => {
      const now = Date.now();
      root.querySelector("#rooms").innerHTML =
        Object.entries(rooms)
          .sort((a, b) => b[1].created - a[1].created)
          .map(([code, r]) => {
            const seatEntries = Object.entries(r.seats || {});
            const status = r.started
              ? now >= r.started + 300000
                ? "Completed"
                : "In progress"
              : now >= r.created + 3600000
                ? "Expired"
                : "Lobby open";
            return (
              '<details class="unit"><summary>' +
              e(code) +
              " · " +
              e(catalog.find((c) => c.id === r.subject)?.name) +
              " · " +
              seatEntries.length +
              '/8 <span class="status-pill">' +
              status +
              "</span></summary><p>Created " +
              e(date(r.created)) +
              " · Started " +
              e(date(r.started)) +
              "</p>" +
              seatEntries
                .map(
                  ([s, p]) =>
                    "<p>" +
                    e(p.name) +
                    " · " +
                    Object.keys(r.answers?.[s] || {}).length +
                    "/5 responses</p>",
                )
                .join("") +
              '<button data-room="' +
              e(code) +
              '">Delete room</button></details>'
            );
          })
          .join("") || '<p class="muted">No battle rooms yet.</p>';
    });
    root.querySelector("#rooms").onclick = async (ev) => {
      const code = ev.target.dataset.room;
      if (code && confirm("Delete this room and its battle results?"))
        try {
          await set(ref(db, "quizRooms/" + code), null);
          msg("Room deleted.");
        } catch (err) {
          msg(err.message);
        }
    };
  } else {
    const isDirectory = view === "students";
    root.innerHTML =
      heading(isDirectory ? "Student directory" : "Academic overview") +
      '<div id="kpis" class="kpi-grid"></div>' +
      (isDirectory
        ? ""
        : '<div class="banner"><div><strong>Owner quick actions</strong><p>Manage announcements, inspect individual student progress, or post course updates.</p></div><div class="lesson-actions">' +
          href("New announcement", "announcements", true) +
          href("Student directory", "students") +
          href("Course updates", "courses") +
          "</div></div>") +
      '<div class="directory-toolbar"><label>Find by email or username<input id="find" type="search" placeholder="Search @chitkara.edu.in or username…"></label>' +
      '<div class="filter-chips" role="group" aria-label="Filter students">' +
      '<button type="button" class="chip active" data-filter="all">All</button>' +
      '<button type="button" class="chip" data-filter="named">With username</button>' +
      '<button type="button" class="chip" data-filter="unnamed">Needs username</button>' +
      "</div></div>" +
      '<div id="directory"></div>' +
      (isDirectory
        ? ""
        : '<h2>Subject coverage</h2><div class="grid">' +
          catalog
            .map(
              (c) =>
                "<article class=\"panel\"><small>" +
                e(c.code) +
                "</small><h3>" +
                e(c.name) +
                "</h3><p>" +
                (window.SUBJECT_DATA[c.id]?.notes.length || 0) +
                " lessons · " +
                bankFor(c.id).length +
                " self-test questions</p></article>",
            )
            .join("") +
          "</div>");

    let students = {},
      profiles = {},
      xp = {},
      rooms = {},
      filter = "all";

    function countDone(u) {
      let n = 0;
      for (const map of Object.values(u.completed || {}))
        n += Object.keys(map || {}).length;
      return n;
    }

    function draw() {
      const term = root.querySelector("#find").value.trim().toLowerCase();
      const now = Date.now();
      const rows = Object.entries(students).sort(
        (a, b) =>
          (b[1].activity?.ts || b[1].lastSeen || 0) -
          (a[1].activity?.ts || a[1].lastSeen || 0),
      );
      const active24 = rows.filter(
        ([, u]) => now - (u.activity?.ts || u.lastSeen || 0) < 86400000,
      ).length;
      const totalXP = Object.values(xp).reduce((s, v) => s + Number(v || 0), 0);
      const roomCount = Object.keys(rooms).length;

      root.querySelector("#kpis").innerHTML =
        '<div class="kpi-card"><small>Student profiles</small><strong>' +
        rows.length +
        "</strong></div>" +
        '<div class="kpi-card"><small>Active last 24h</small><strong>' +
        active24 +
        "</strong></div>" +
        '<div class="kpi-card"><small>Total class XP</small><strong>' +
        totalXP +
        "</strong></div>" +
        '<div class="kpi-card"><small>Battle rooms</small><strong>' +
        roomCount +
        "</strong></div>";

      const filtered = rows
        .filter(([id, u]) => {
          if (filter === "named" && !profiles[id]?.name) return false;
          if (filter === "unnamed" && profiles[id]?.name) return false;
          return (
            (u.email || "") +
            " " +
            (profiles[id]?.name || "")
          )
            .toLowerCase()
            .includes(term);
        });

      const list = isDirectory ? filtered : filtered.slice(0, 12);

      root.querySelector("#directory").innerHTML =
        list
          .map(([id, u]) => {
            const p = profiles[id] || {};
            return (
              '<div class="unit student-row"><div class="student-row-main">' +
              face({ name: p.name || u.email, photo: p.photo }) +
              '<div><a href="#students/' +
              encodeURIComponent(id) +
              '">' +
              e(u.email) +
              "</a><p>" +
              e(p.name || "Username unset") +
              " · " +
              Number(xp[id] || 0) +
              " XP · " +
              countDone(u) +
              " lessons · " +
              e(u.activity?.label || "Workspace visit") +
              " · " +
              e(date(u.activity?.ts || u.lastSeen)) +
              "</p></div></div></div>"
            );
          })
          .join("") || '<p class="muted">No matching students.</p>';
    }

    root.querySelector("#find").oninput = draw;
    root.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.onclick = () => {
        filter = btn.dataset.filter;
        root
          .querySelectorAll("[data-filter]")
          .forEach((b) => b.classList.toggle("active", b === btn));
        draw();
      };
    });
    watch("students", (v) => {
      students = v;
      draw();
    });
    watch("profiles", (v) => {
      profiles = v;
      draw();
    });
    watch("xp", (v) => {
      xp = v;
      draw();
    });
    watch("quizRooms", (v) => {
      rooms = v;
      draw();
    });
  }

  return () => stops.forEach((s) => s());
}

export function messages(data) {
  return (
    Object.values(data || {})
      .sort((a, b) => b.ts - a.ts)
      .map(
        (m) =>
          '<article class="panel"><small>Boardroom owner · ' +
          e(date(m.ts)) +
          "</small><p>" +
          e(m.text) +
          "</p></article>",
      )
      .join("") || '<p class="muted">No private messages yet.</p>'
  );
}
