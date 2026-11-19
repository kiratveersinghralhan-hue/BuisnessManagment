import {
  ref,
  get,
  set,
  update,
  onValue,
  query,
  orderByValue,
  limitToLast,
  increment,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { escapeHTML as e, href, renderQuestionBody } from "./student.js";
import { catalog } from "./catalog.js";
import { battleQuestions } from "./quiz-bank.js";
import { showToast } from "./motion.js";

const safePhoto = (s) =>
  typeof s === "string" &&
  s.length <= 32768 &&
  /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(s);

export const face = (p) =>
  safePhoto(p?.photo)
    ? '<img class="avatar" src="' + p.photo + '" alt="">'
    : '<span class="avatar monogram" aria-hidden="true">' +
      e((p?.name || "S")[0].toUpperCase()) +
      "</span>";

function tierFor(xp) {
  if (xp >= 500) return "Dean’s Fellow";
  if (xp >= 250) return "Strategist";
  if (xp >= 100) return "Analyst";
  if (xp > 0) return "Scholar";
  return "Newcomer";
}

async function thumbnail(file) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  )
    throw Error("Select a JPEG, PNG or WebP image under 8 MB.");
  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 112;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 112, 112);
    const size = Math.min(image.width, image.height);
    ctx.drawImage(
      image,
      (image.width - size) / 2,
      (image.height - size) / 2,
      size,
      size,
      0,
      0,
      112,
      112,
    );
    const result = canvas.toDataURL("image/jpeg", 0.74);
    if (!safePhoto(result)) throw Error("Try a smaller photo.");
    return result;
  } finally {
    image.close();
  }
}

export async function earnXP(db, uid, course, question) {
  const receipt = "credits/" + uid + "/" + course + "/" + question;
  if (
    (await get(ref(db, receipt))).exists() ||
    !(await get(ref(db, "profiles/" + uid + "/name"))).exists()
  )
    return false;
  try {
    await update(ref(db), {
      [receipt]: true,
      ["claim/" + uid]: { course, question: String(question) },
      ["xp/" + uid]: increment(10),
    });
    window.dispatchEvent(new CustomEvent("boardroom:xp"));
    return true;
  } catch (err) {
    if (!(await get(ref(db, receipt))).exists()) throw err;
    return false;
  }
}

async function syncPendingXP(db, uid, record) {
  const existing = (await get(ref(db, "credits/" + uid))).val() || {};
  let awarded = 0;
  for (const [course, answers] of Object.entries(record.practice || {})) {
    for (const [q, ok] of Object.entries(answers || {})) {
      if (ok === true && !existing?.[course]?.[q]) {
        try {
          if (await earnXP(db, uid, course, q)) awarded++;
        } catch {
          /* Stop early if rules reject further claims. */
          return awarded;
        }
      }
    }
  }
  return awarded;
}

export function community(root, db, user, record, route) {
  let closed = false;
  const stops = [];
  const [page, roomCode] = route.split("/");
  const uid = user.uid;
  root.innerHTML = '<section id="community"></section>';
  const panel = root.querySelector("#community");
  const path = (p) => ref(db, p);

  function error(err) {
    if (!closed)
      document.getElementById("status").textContent =
        err.message || "Could not connect. Please try again.";
  }

  function watch(target, fn) {
    const stop = onValue(
      target,
      (s) => {
        if (!closed) fn(s.val());
      },
      error,
    );
    stops.push(stop);
    return stop;
  }

  const act = (el, fn) => {
    el.onclick = async () => {
      el.disabled = true;
      try {
        await fn();
      } catch (err) {
        error(err);
      } finally {
        el.disabled = false;
      }
    };
  };

  async function profile() {
    const [infoSnap, xpSnap] = await Promise.all([
      get(path("profiles/" + uid)),
      get(path("xp/" + uid)),
    ]);
    const info = infoSnap.val() || {};
    const currentXP = Number(xpSnap.val() || 0);
    if (closed) return;

    panel.innerHTML =
      '<div class="page-head"><small class="eyebrow">Student identity</small><h1>My profile</h1></div>' +
      '<div class="banner profile-summary"><div class="profile-summary-left">' +
      face(info) +
      "<div><strong>" +
      e(info.displayName || info.name || "Username not set yet") +
      "</strong><p class=\"muted\">" +
      e(user.email || "") +
      " · " +
      currentXP +
      " XP · " +
      tierFor(currentXP) +
      "</p></div></div>" +
      href("View leaderboard", "leaderboard") +
      "</div>" +
      '<form id="profile-form"><label>Leaderboard username<input name="name" required pattern="[A-Za-z0-9_]{3,20}" minlength="3" maxlength="20" value="' +
      e(info.name || "") +
      '"></label><small>3–20 letters, numbers or underscores. Other signed-in students see your username and optional photo. The owner can see your email, private details and latest Boardroom activity.</small><div class="photo-preview">' +
      face(info) +
      '</div><label>Display name (optional)<input name="displayName" maxlength="48" placeholder="How should classmates see your name?"></label><label>Profile picture<input name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label><button id="remove" type="button">Remove picture</button><h3>Private details</h3><label>Gender (optional)<select name="gender"><option value="">Prefer not to say</option><option>Woman</option><option>Man</option><option>Nonbinary</option><option>Self-described</option></select></label><label>Study goal (optional)<input name="goal" maxlength="120" placeholder="What are you working toward?"></label><button class="primary">Save profile</button><p role="status" id="profile-msg"></p></form>';

    const form = panel.querySelector("form"),
      fields = form.elements;
    fields.displayName.value = info.displayName || "";
    fields.gender.value = record.details?.gender || "";
    fields.goal.value = record.details?.goal || "";
    let photo = info.photo || null,
      selection = 0;

    const preview = () => {
      panel.querySelector(".photo-preview").innerHTML = face({
        name: fields.name.value,
        photo,
      });
    };

    fields.photo.onchange = async () => {
      const seq = ++selection;
      const file = fields.photo.files[0];
      if (!file) return;
      try {
        const next = await thumbnail(file);
        if (seq === selection) {
          photo = next;
          preview();
        }
      } catch (err) {
        error(err);
        fields.photo.value = "";
      }
    };

    panel.querySelector("#remove").onclick = () => {
      selection++;
      photo = null;
      fields.photo.value = "";
      preview();
    };

    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const btn = form.querySelector(".primary");
      btn.disabled = true;
      try {
        if (fields.photo.files[0])
          photo = await thumbnail(fields.photo.files[0]);
        const cleanName = fields.name.value.trim();
        const details = {
          gender: fields.gender.value,
          goal: fields.goal.value.trim(),
        };
        await update(ref(db), {
          ["profiles/" + uid]: {
            name: cleanName,
            displayName: fields.displayName.value.trim(),
            ...(photo ? { photo } : {}),
          },
          ["students/" + uid + "/details"]: details,
        });
        record.details = details;
        record._hasProfile = true;
        window.dispatchEvent(
          new CustomEvent("boardroom:profile", {
            detail: { name: cleanName, displayName: fields.displayName.value.trim(), photo },
          }),
        );
        const synced = await syncPendingXP(db, uid, record);
        panel.querySelector("#profile-msg").textContent = synced
          ? "Profile saved. Synced " + synced * 10 + " XP from earlier correct answers."
          : "Profile saved.";
        showToast("Profile saved");
      } catch (err) {
        error(err);
      } finally {
        btn.disabled = false;
      }
    };
  }

  function board() {
    panel.innerHTML =
      '<div class="page-head"><small class="eyebrow">Academic standing</small><h1>Live leaderboard</h1><p class="muted">Earn 10 XP the first time you correctly answer each self-test question. Add a username in My profile to appear here.</p></div>' +
      '<div id="my-rank" class="banner" hidden></div>' +
      '<ol class="ranks"></ol>';
    const list = panel.querySelector("ol"),
      myRank = panel.querySelector("#my-rank"),
      profiles = new Map(),
      subs = new Map();
    let pairs = [];

    function draw() {
      const named = pairs.filter(([id]) => profiles.get(id)?.name);
      const mineIdx = named.findIndex(([id]) => id === uid);
      if (mineIdx !== -1) {
        const [, myXp] = named[mineIdx];
        myRank.hidden = false;
        myRank.innerHTML =
          "<div><small>Your standing</small><strong>Rank #" +
          (mineIdx + 1) +
          " · " +
          tierFor(myXp) +
          "</strong></div><b>" +
          myXp +
          " XP</b>";
      } else {
        myRank.hidden = true;
      }

      list.innerHTML =
        named
          .map(([id, xp], i) => {
            const p = profiles.get(id);
            const medal = i === 0 ? " top-1" : i === 1 ? " top-2" : i === 2 ? " top-3" : "";
            const self = id === uid ? " is-self" : "";
            return (
              '<li class="rank-row' +
              medal +
              self +
              '"><strong>' +
              (i + 1) +
              "</strong>" +
              face(p) +
              '<div class="rank-info"><span>' +
              e(p.displayName || p.name) +
              (p.displayName ? " · @" + e(p.name) : "") +
              (id === uid ? " (you)" : "") +
              '</span><small>' +
              tierFor(xp) +
              "</small></div><b>" +
              xp +
              " XP</b></li>"
            );
          })
          .join("") || '<li class="rank-empty">No ranked students yet.</li>';
    }

    watch(query(path("xp"), orderByValue(), limitToLast(50)), (values) => {
      pairs = Object.entries(values || {}).sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      );
      const ids = new Set(pairs.map((p) => p[0]));
      for (const [id, unsub] of subs)
        if (!ids.has(id)) {
          unsub();
          subs.delete(id);
          profiles.delete(id);
        }
      for (const id of ids)
        if (!subs.has(id))
          subs.set(
            id,
            watch(path("profiles/" + id), (p) => {
              profiles.set(id, p);
              draw();
            }),
          );
      draw();
    });
  }

  const codePattern = /^[A-F0-9]{12}$/;
  const roomPath = (code) => "quizRooms/" + code;
  async function identity() {
    const p = (await get(path("profiles/" + uid))).val();
    if (!p?.name)
      throw Error("Save a username in My profile before joining a battle.");
    return p.name;
  }

  function lobby() {
    panel.innerHTML =
      '<div class="page-head"><small class="eyebrow">Peer challenge · 2–8 players</small><h1>Quiz battles</h1></div>' +
      '<div class="grid"><article class="panel"><h2>Host a battle</h2><p>Invite up to seven friends. Everyone gets the same five randomized questions and five minutes to finish.</p><label>Subject<select id="subject-choice">' +
      catalog
        .map((c) => '<option value="' + c.id + '">' + e(c.name) + "</option>")
        .join("") +
      '</select></label><button class="primary" id="create">Create room</button></article>' +
      '<article class="panel"><h2>Join friends</h2><p>Enter the 12-character battle code shared by your host.</p><label>Room code<input id="room-code" maxlength="12" placeholder="e.g. A1B2C3D4E5F6" autocapitalize="characters" spellcheck="false"></label><button id="join">Open room</button></article></div>';

    act(panel.querySelector("#create"), async () => {
      const name = await identity();
      const bytes = crypto.getRandomValues(new Uint8Array(6));
      const code = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
      await set(path(roomPath(code)), {
        host: uid,
        subject: panel.querySelector("select").value,
        created: { ".sv": "timestamp" },
        seats: { p0: { uid, name } },
      });
      location.hash = "battle/" + code;
    });

    act(panel.querySelector("#join"), () => {
      const code = panel.querySelector("input").value.trim().toUpperCase();
      if (!codePattern.test(code))
        throw Error("Enter a 12-character room code.");
      location.hash = "battle/" + code;
    });
  }

  function room(code) {
    if (!codePattern.test(code)) {
      lobby();
      return;
    }
    let latest,
      offset = 0,
      tick,
      countdownTick;
    const target = roomPath(code);
    watch(path(".info/serverTimeOffset"), (n) => {
      offset = n || 0;
    });

    function fmtLeft(ms) {
      const total = Math.max(0, Math.ceil(ms / 1000));
      const m = Math.floor(total / 60);
      const s = total % 60;
      return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }

    function draw(r) {
      clearTimeout(tick);
      clearInterval(countdownTick);
      if (!r) {
        panel.innerHTML =
          '<div class="panel"><h2>Room not found</h2><p class="muted">The lobby may have been cancelled or deleted.</p>' +
          href("Other rooms", "battle", true) +
          "</div>";
        return;
      }

      const now = Date.now() + offset,
        seats = Object.entries(r.seats || {}),
        own = seats.find(([, p]) => p.uid === uid)?.[0],
        questions = battleQuestions(r.subject, code),
        answers = r.answers || {},
        deadline = r.started ? r.started + 300000 : r.created + 3600000;
      const expired = now >= deadline,
        done = (seat) => Object.keys(answers[seat] || {}).length === 5,
        finished = expired || (r.started && seats.every(([s]) => done(s)));
      const title = catalog.find((c) => c.id === r.subject)?.name;

      panel.innerHTML =
        '<div class="battle-head"><div><small class="eyebrow">' +
        e(title) +
        "</small><h1>Quiz battle</h1></div>" +
        '<div class="battle-code-bar"><span>Room code <strong>' +
        code +
        "</strong> · " +
        seats.length +
        ' / 8 players</span><button type="button" id="copy-code">Copy code</button><button type="button" id="copy-link">Copy invite link</button></div></div>' +
        '<div id="play" class="panel"></div><h2>' +
        (finished ? "Results" : "Players") +
        '</h2><ol class="ranks"></ol>' +
        (finished ? '<section id="battle-review"></section>' : "");

      panel.querySelector("#copy-code").onclick = async () => {
        try {
          await navigator.clipboard.writeText(code);
          showToast("Room code copied: " + code);
        } catch {
          showToast("Room code: " + code);
        }
      };
      panel.querySelector("#copy-link").onclick = async () => {
        const invite = location.origin + location.pathname + "#battle/" + code;
        try {
          await navigator.clipboard.writeText(invite);
          showToast("Invite link copied");
        } catch {
          showToast("Share code: " + code);
        }
      };

      const play = panel.querySelector("#play");
      const standings = seats
        .map(([s, p]) => {
          const entries = Object.entries(answers[s] || {});
          return {
            seat: s,
            uid: p.uid,
            name: p.name,
            answered: entries.length,
            score: entries.filter(
              ([i, j]) => questions[+i]?.choices[j] === questions[+i]?.a,
            ).length,
          };
        })
        .sort((a, b) => b.score - a.score || b.answered - a.answered);

      panel.querySelector("ol").innerHTML = standings
        .map(
          (p, idx) =>
            '<li class="rank-row' +
            (p.uid === uid ? " is-self" : "") +
            '"><strong>' +
            (idx + 1) +
            '</strong><span class="avatar monogram" aria-hidden="true">' +
            e(p.name[0].toUpperCase()) +
            '</span><div class="rank-info"><span>' +
            e(p.name) +
            (p.uid === uid ? " (you)" : "") +
            "</span></div><b>" +
            (finished
              ? p.score + " / 5 correct"
              : p.answered + " / 5 answered") +
            "</b></li>",
        )
        .join("");

      if (!r.started && !expired) {
        if (!own) {
          if (seats.length === 8) play.textContent = "This room is full.";
          else {
            play.innerHTML =
              '<p>Join this lobby before the host starts the round.</p><button id="take" class="primary">Join this battle</button>';
            act(play.querySelector("#take"), async () => {
              const name = await identity();
              for (let i = 1; i < 8; i++) {
                if (latest.seats?.["p" + i]) continue;
                try {
                  await set(path(target + "/seats/p" + i), { uid, name });
                  return;
                } catch (err) {
                  const state = (await get(path(target))).val();
                  if (
                    Object.values(state?.seats || {}).some((p) => p.uid === uid)
                  )
                    return;
                  if (!state?.seats?.["p" + i] || state.started) throw err;
                }
              }
              throw Error("This room is full.");
            });
          }
        } else if (uid === r.host) {
          play.innerHTML =
            "<p>Share the room code with your friends. Start when everyone is here (minimum 2 players).</p><button class=\"primary\">Start battle</button>";
          const btn = play.querySelector("button");
          act(btn, () =>
            set(path(target + "/started"), { ".sv": "timestamp" }),
          );
          btn.disabled = seats.length < 2;
        } else
          play.innerHTML =
            '<p class="muted">You have a seat. Waiting for the host to start.</p>';
      } else if (finished) {
        const myRow = standings.find((p) => p.uid === uid);
        play.innerHTML =
          "<h3>" +
          (r.started ? "Battle complete" : "Lobby expired") +
          "</h3>" +
          (myRow
            ? "<p>Your final score: <strong>" +
              myRow.score +
              " / 5</strong> · Winner: <strong>" +
              e(standings[0]?.name || "—") +
              "</strong></p>"
            : "") +
          href("New battle", "battle", true);

        const reviewBox = panel.querySelector("#battle-review");
        if (reviewBox && r.started) {
          const myAns = own ? answers[own] || {} : {};
          reviewBox.innerHTML =
            "<h2>Answer breakdown</h2>" +
            questions
              .map((q, idx) => {
                const pickedIdx = myAns[idx];
                const picked =
                  pickedIdx !== undefined ? q.choices[pickedIdx] : null;
                const ok = picked === q.a;
                return (
                  '<article class="panel battle-q-review"><h4>Q' +
                  (idx + 1) +
                  "</h4>" +
                  renderQuestionBody(q.q, "p") +
                  (picked !== null
                    ? '<p class="review-pick ' +
                      (ok ? "is-ok" : "is-bad") +
                      '">Your answer: ' +
                      e(picked) +
                      (ok ? " ✓" : " ✕") +
                      "</p>"
                    : "") +
                  "<p><strong>Correct answer:</strong> " +
                  e(q.a) +
                  "</p>" +
                  (q.why ? '<p class="muted">' + e(q.why) + "</p>" : "") +
                  (q.note
                    ? href("Review lesson", r.subject + "/lesson/" + q.note)
                    : "") +
                  "</article>"
                );
              })
              .join("");
        }
      } else if (!own) {
        play.textContent = "This battle has already started.";
      } else if (done(own)) {
        play.innerHTML =
          '<div class="battle-timer-row"><span>Answers submitted. Waiting for remaining players…</span><strong id="battle-timer" class="timer-pill">' +
          fmtLeft(deadline - now) +
          "</strong></div>";
      } else {
        const index = questions.findIndex(
          (_, i) => answers[own]?.[i] === undefined,
        );
        const q = questions[index];
        const keys = ["A", "B", "C", "D"];
        play.innerHTML =
          '<div class="battle-timer-row"><small>Question ' +
          (index + 1) +
          " / 5 · Finish by " +
          e(
            new Date(deadline - offset).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          ) +
          '</small><strong id="battle-timer" class="timer-pill">' +
          fmtLeft(deadline - now) +
          "</strong></div>" +
          renderQuestionBody(q.q, "h3") +
          '<div class="choices-list">' +
          q.choices
            .map(
              (v, i) =>
                '<button class="choice" data-answer="' +
                i +
                '"><span class="opt-key" aria-hidden="true">' +
                keys[i] +
                "</span><span>" +
                e(v) +
                "</span></button>",
            )
            .join("") +
          "</div>";

        play.querySelectorAll(".choice").forEach((btn) =>
          act(btn, async () => {
            play.querySelectorAll(".choice").forEach((b) => (b.disabled = true));
            try {
              await set(
                path(target + "/answers/" + own + "/" + index),
                Number(btn.dataset.answer),
              );
            } catch (err) {
              draw(latest);
              throw err;
            }
          }),
        );
      }

      if (!r.started && own && !expired) {
        const leave = document.createElement("button");
        leave.textContent = uid === r.host ? "Cancel room" : "Leave room";
        play.append(leave);
        act(leave, async () => {
          if (uid === r.host && !confirm("Cancel this lobby for everyone?"))
            return;
          await set(
            path(uid === r.host ? target : target + "/seats/" + own),
            null,
          );
          location.hash = "battle";
        });
      }

      if (!finished) {
        const timerEl = panel.querySelector("#battle-timer");
        if (timerEl) {
          const updateClock = () => {
            const left = deadline - (Date.now() + offset);
            timerEl.textContent = fmtLeft(left);
            timerEl.classList.toggle("is-urgent", left <= 30000);
          };
          updateClock();
          countdownTick = setInterval(updateClock, 1000);
        }
        tick = setTimeout(
          () => {
            if (!closed) draw(latest);
          },
          Math.max(1, deadline - now + 50),
        );
      }
    }

    watch(path(target), (r) => {
      latest = r;
      draw(r);
    });
    stops.push(() => {
      clearTimeout(tick);
      clearInterval(countdownTick);
    });
  }

  if (page === "profile") profile().catch(error);
  else if (page === "leaderboard") board();
  else if (roomCode) room(roomCode);
  else lobby();

  return () => {
    closed = true;
    stops.forEach((stop) => stop());
  };
}
