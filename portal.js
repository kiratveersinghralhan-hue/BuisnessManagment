import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  onValue,
  getDatabase,
  ref,
  get,
  update,
  set,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, ADMIN_UID } from "./firebase-config.js";
import {
  loadCourses,
  studentPage,
  announcements,
  escapeHTML as e,
} from "./student.js";
import { community, earnXP, face } from "./community.js";
import { courseEditor } from "./course-editor.js";
import { owner, messages } from "./owner.js";
import { factsCard } from "./study-facts.js";
import { studyTools } from "./study-tools.js";
import { catalog } from "./catalog.js";

const app = initializeApp(firebaseConfig),
  auth = getAuth(app),
  db = getDatabase(app);

const admin = document.body.dataset.area === "admin",
  $ = (id) => document.getElementById(id);

let session = 0,
  active = null,
  record = {},
  news = {},
  courseLoad,
  headerStops = [];

const allowed = (email) => /^[^@\s]+@chitkara\.edu\.in$/i.test(email);

function authMessage(text) {
  $("authmsg").textContent = text;
}

function email() {
  const value = $("email").value.trim().toLowerCase();
  if (!$("email").reportValidity()) throw Error("Enter your email address.");
  if (!admin && !allowed(value))
    throw Error("Use your @chitkara.edu.in email address.");
  return value;
}

function friendly(err) {
  return (
    {
      "auth/invalid-credential": "Check your Boardroom email and password.",
      "auth/email-already-in-use":
        "This address already has a Boardroom account. Sign in or reset your password.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
      "auth/weak-password": "Choose a longer Boardroom password.",
      "auth/network-request-failed": "Connection failed. Please try again.",
    }[err.code] || err.message
  );
}

// Earlier releases stored personal study activity in shared browser storage.
try {
  const keys = [
    "cr_state_v1",
    "cr_subject",
    "cr_subject_chosen",
    "cr_mock_v1",
    "cr_case_ans",
    "cr_written",
    "cr_wstate",
    "cr_ann_hidden",
    "cr_battles_done",
    "cr_intro",
  ];
  for (const course of ["pbm", "prog", "alac", "aiml", "dviz", "drm", "arts"]) {
    for (const prefix of [
      "cr_mock_v1_",
      "cr_mock_last_",
      "cr_paper_",
      "cr_paper_last_",
    ])
      keys.push(prefix + course);
  }
  for (const key of keys) localStorage.removeItem(key);
} catch {
  /* Storage is optional in private browsing. */
}

const persistence = setPersistence(auth, browserSessionPersistence);

async function run(action) {
  const buttons = $("login").querySelectorAll("button");
  buttons.forEach((b) => (b.disabled = true));
  authMessage("");
  try {
    await persistence;
    await action();
  } catch (err) {
    authMessage(friendly(err));
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}

$("login").onsubmit = (ev) => {
  ev.preventDefault();
  run(() => signInWithEmailAndPassword(auth, email(), $("pass").value));
};

if (!admin)
  $("register").onclick = () =>
    run(async () => {
      const address = email();
      if ($("pass").value.length < 8)
        throw Error("Choose a Boardroom password of at least 8 characters.");
      const { user } = await createUserWithEmailAndPassword(
        auth,
        address,
        $("pass").value,
      );
      await sendEmailVerification(user);
      authMessage(
        "Verification email sent. Open the link, then select “I verified my email”.",
      );
    });

$("reset").onclick = () =>
  run(async () => {
    await sendPasswordResetEmail(auth, email());
    authMessage(
      "If an account exists, check your inbox for a password reset link.",
    );
  });

$("exit").onclick = () => signOut(auth);

function updateHeaderUser(profileData, user) {
  const pill = $("header-user");
  if (!pill || !user) return;
  const label = profileData?.name || user.email?.split("@")[0] || "Profile";
  pill.hidden = false;
  pill.innerHTML =
    face({ name: label, photo: profileData?.photo }) +
    "<span>" +
    e(label) +
    "</span>";
}

function updateHeaderXP(value) {
  const xpEl = $("header-xp");
  if (!xpEl) return;
  xpEl.hidden = false;
  xpEl.textContent = Number(value || 0) + " XP";
}

let cleanup = () => {};

function navLink(text, route) {
  const current = location.hash.slice(1).split("/")[0];
  return (
    '<a href="#' +
    route +
    '" ' +
    (current === route ? 'aria-current="page"' : "") +
    ">" +
    text +
    "</a>"
  );
}

function render() {
  cleanup();
  cleanup = () => {};
  if (!active) return;
  $("status").textContent = "";
  const route = location.hash.slice(1),
    area = route.split("/")[0];
  const nav = admin
    ? [
        ["Overview", ""],
        ["Students", "students"],
        ["Announcements", "announcements"],
        ["Battle rooms", "rooms"],
        ["Courses", "courses"],
      ]
    : [
        ["Library", ""],
        ["Battles", "battle"],
        ["Leaderboard", "leaderboard"],
        ["Inbox", "inbox"],
        ["Profile", "profile"],
      ];

  $("main-nav").hidden = false;
  $("main-nav").innerHTML = nav.map(([t, r]) => navLink(t, r)).join("");

  if (admin) {
    cleanup =
      route === "courses"
        ? courseEditor(document.querySelector("#desk"), db)
        : owner($("desk"), db, route);
    return;
  }

  const c = catalog.find((c) => c.id === area);
  const lesson = window.SUBJECT_DATA[area]?.notes?.find(
    (n) => n.id === route.split("/")[2],
  );
  const label = c
    ? c.name +
      " · " +
      (lesson?.title || route.split("/")[1] || "Subject overview")
    : nav.find(([, r]) => r === area)?.[0] || "Library";

  set(ref(db, "students/" + active.uid + "/activity"), {
    label: label.slice(0, 160),
    ts: serverTimestamp(),
  }).catch(() => {});

  if (["profile", "battle", "leaderboard"].includes(area)) {
    cleanup = community($("desk"), db, active, record, route);
    return;
  }

  if (area === "inbox") {
    $("desk").innerHTML =
      '<div class="page-head"><small class="eyebrow">Direct messages from owner</small><h1>Private inbox</h1></div><section id="mail"></section>';
    cleanup = onValue(
      ref(db, "inbox/" + active.uid),
      (snap) => {
        $("mail").innerHTML = messages(snap.val());
      },
      (err) => {
        $("status").textContent = err.message;
      },
    );
    return;
  }

  studentPage($("desk"), record, news, async (path, value) => {
    try {
      await set(
        ref(db, "students/" + active.uid + "/" + path),
        value === "timestamp" ? serverTimestamp() : value,
      );
      const [type, course, key] = path.split("/");
      if (type === "practice" && value === true)
        try {
          await earnXP(db, active.uid, course, key);
        } catch {
          $("status").textContent =
            "Answer saved. XP could not sync; retry this question later.";
        }
      record[type] ??= {};
      record[type][course] ??= {};
      record[type][course][key] = value === "timestamp" ? Date.now() : value;
    } catch (err) {
      $("status").textContent =
        "Progress could not be saved. Check your connection and retry.";
      throw err;
    }
  });

  if (!area) {
    const stopTools = studyTools($("desk"), active.uid, record);
    const stopFacts = factsCard($("desk"));
    const notice = document.createElement("div");
    $("desk").querySelector(".grid").after(notice);
    const stopMail = onValue(
      ref(db, "inbox/" + active.uid),
      (snap) => {
        const count = Object.keys(snap.val() || {}).length;
        notice.innerHTML = count
          ? '<p class="banner"><a href="#inbox">Open private inbox</a> · ' +
            count +
            " message" +
            (count === 1 ? "" : "s") +
            " from the Boardroom owner</p>"
          : "";
      },
      (err) => {
        $("status").textContent = err.message;
      },
    );
    const stopNews = onValue(
      ref(db, "announce"),
      (snap) => {
        const values = snap.val() || {};
        const box = $("home-announcements");
        if (box)
          box.innerHTML = Object.keys(values).length
            ? "<h2>Announcements</h2>" + announcements(values)
            : "";
      },
      (err) => {
        $("status").textContent = err.message;
      },
    );
    cleanup = () => {
      stopTools();
      stopFacts();
      stopMail();
      stopNews();
    };
  } else if (c && !route.includes("/")) {
    const slot = document.createElement("aside");
    slot.hidden = true;
    slot.className = "banner";
    $("subject").prepend(slot);
    cleanup = onValue(
      ref(db, "courseUpdates/" + c.id),
      (snap) => {
        slot.hidden = !snap.exists();
        slot.replaceChildren();
        if (snap.exists()) {
          const heading = document.createElement("strong"),
            text = document.createElement("p");
          heading.textContent = "Course update";
          text.textContent = snap.val().text;
          slot.append(heading, text);
        }
      },
      (err) => {
        $("status").textContent = err.message;
      },
    );
  }
}

window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
});

async function enterWorkspace(user) {
  const token = ++session;
  cleanup();
  cleanup = () => {};
  headerStops.forEach((s) => s());
  headerStops = [];
  $("main-nav").hidden = true;
  $("main-nav").replaceChildren();
  if ($("header-user")) $("header-user").hidden = true;
  if ($("header-xp")) $("header-xp").hidden = true;
  if ($("header-admin-badge")) $("header-admin-badge").hidden = true;

  active = null;
  news = {};
  record = {};

  $("desk").replaceChildren();
  $("desk").hidden = true;
  $("gate").hidden = false;
  $("exit").hidden = !user;
  $("status").textContent = "";
  if ($("verify")) $("verify").hidden = true;
  if (!user) return;

  if (
    admin
      ? user.uid !== ADMIN_UID
      : !allowed(user.email || "") ||
        !user.providerData.some((p) => p.providerId === "password")
  ) {
    authMessage("This account cannot access this workspace.");
    await signOut(auth);
    return;
  }

  if (!admin && !user.emailVerified) {
    $("verify").hidden = false;
    authMessage("Check your university inbox for the verification link.");
    $("resend").onclick = () =>
      run(async () => {
        await sendEmailVerification(user);
        authMessage("Verification email sent.");
      });
    $("recheck").onclick = () =>
      run(async () => {
        await user.reload();
        if (!user.emailVerified)
          throw Error(
            "Verification is still pending. Open the link in your university inbox.",
          );
        await enterWorkspace(user);
      });
    return;
  }

  try {
    authMessage("Loading your workspace…");
    await user.getIdToken(true);
    courseLoad ??= loadCourses().catch((err) => {
      courseLoad = null;
      throw err;
    });
    await courseLoad;
    if (token !== session) return;

    if (!admin) {
      await update(ref(db, "students/" + user.uid), {
        email: user.email,
        lastSeen: serverTimestamp(),
      });
      const [stuSnap, profSnap, xpSnap] = await Promise.all([
        get(ref(db, "students/" + user.uid)),
        get(ref(db, "profiles/" + user.uid)),
        get(ref(db, "xp/" + user.uid)),
      ]);
      record = stuSnap.val() || {};
      const prof = profSnap.val() || {};
      record._hasProfile = Boolean(prof.name);
      updateHeaderUser(prof, user);
      updateHeaderXP(xpSnap.val());

      headerStops.push(
        onValue(
          ref(db, "profiles/" + user.uid),
          (snap) => {
            const p = snap.val() || {};
            record._hasProfile = Boolean(p.name);
            updateHeaderUser(p, user);
          },
          () => {},
        ),
        onValue(
          ref(db, "xp/" + user.uid),
          (snap) => updateHeaderXP(snap.val()),
          () => {},
        ),
      );
    } else if ($("header-admin-badge")) {
      $("header-admin-badge").hidden = false;
    }

    if (token !== session) return;
    active = user;
    $("pass").value = "";
    authMessage("");
    $("gate").hidden = true;
    $("desk").hidden = false;
    render();
  } catch (err) {
    if (token === session)
      authMessage("Workspace could not load. " + friendly(err));
  }
}

onAuthStateChanged(auth, enterWorkspace);

if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .getRegistration("./")
    .then((r) => r?.update())
    .catch(() => {});
