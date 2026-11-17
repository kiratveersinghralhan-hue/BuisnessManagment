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
  getDatabase,
  ref,
  get,
  update,
  set,
  push,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, ADMIN_UID } from "./firebase-config.js";
import { loadCourses, studentPage } from "./student.js";
import { management } from "./management.js";
const app = initializeApp(firebaseConfig),
  auth = getAuth(app),
  db = getDatabase(app);
const admin = document.body.dataset.area === "admin",
  $ = (id) => document.getElementById(id);
let session = 0,
  active = null,
  record = {},
  news = {},
  students = {},
  courseLoad;
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
function render() {
  if (!active) return;
  if (admin)
    management($("desk"), students, news, async (title, text) => {
      const entry = push(ref(db, "announce"));
      await set(entry, { title, text, subj: "all", ts: serverTimestamp() });
      news[entry.key] = { title, text, subj: "all", ts: Date.now() };
      render();
      $("status").textContent = "Announcement published.";
    });
  else
    studentPage($("desk"), record, news, async (path, value) => {
      try {
        await set(
          ref(db, "students/" + active.uid + "/" + path),
          value === "timestamp" ? serverTimestamp() : value,
        );
        const [type, course, key] = path.split("/");
        record[type] ??= {};
        record[type][course] ??= {};
        record[type][course][key] = value === "timestamp" ? Date.now() : value;
      } catch (err) {
        $("status").textContent =
          "Progress could not be saved. Check your connection and retry.";
        throw err;
      }
    });
}
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
});
async function enterWorkspace(user) {
  const token = ++session;
  active = null;
  news = {};
  record = {};
  students = {};
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
    if (!admin)
      await update(ref(db, "students/" + user.uid), {
        email: user.email,
        lastSeen: serverTimestamp(),
      });
    const [data, ann] = await Promise.all([
      get(ref(db, admin ? "students" : "students/" + user.uid)),
      get(ref(db, "announce")),
    ]);
    if (token !== session) return;
    if (admin) students = data.val() || {};
    else record = data.val() || {};
    news = ann.val() || {};
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
