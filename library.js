import { catalog } from "./catalog.js";
import { escapeHTML as e, href } from "./student.js";
import { showToast } from "./motion.js";

/* ---------- Curated extra reference videos (IDs verified via YouTube oEmbed) ---------- */
const extraVideos = {
  alac: [
    ["fNk_zzaMoSs", null, "Vectors, what even are they? · Essence of linear algebra (3Blue1Brown)"],
    ["kYB8IZa5AuE", "la-trans", "Linear transformations and matrices · 3Blue1Brown"],
    ["XkY2DOUCWMU", "la-ops", "Matrix multiplication as composition · 3Blue1Brown"],
    ["Ip3X9LOh2dk", "la-det", "The determinant · 3Blue1Brown"],
    ["PFDu9oVAE-g", "la-eig", "Eigenvectors and eigenvalues · 3Blue1Brown"],
    ["WUvTyaaNkzM", null, "The essence of calculus · 3Blue1Brown"],
    ["9vKqVkMQHKk", null, "The paradox of the derivative · 3Blue1Brown"],
  ],
  aiml: [
    ["ukzFI9rgwfU", null, "What is Machine Learning? · Introduction (Simplilearn)"],
    ["aircAruvnKk", null, "But what is a neural network? · 3Blue1Brown"],
    ["LPZh9BOjkQs", "ai-tokens", "Large Language Models explained briefly · 3Blue1Brown"],
    ["wjZofJX0v4M", "ai-tokens", "Transformers, the tech behind LLMs · 3Blue1Brown"],
  ],
  dviz: [["5Zg-C8AAIGg", null, "The beauty of data visualization · David McCandless (TED)"]],
};

/* ---------- Curated external references ---------- */
export const references = {
  pbm: [
    ["OpenStax · Principles of Management (free textbook)", "https://openstax.org/details/books/principles-management"],
    ["Harvard Business Review · Management articles", "https://hbr.org/topic/subject/management"],
    ["Investopedia · SWOT analysis", "https://www.investopedia.com/terms/s/swot.asp"],
    ["Investopedia · Porter’s Five Forces", "https://www.investopedia.com/terms/p/porter.asp"],
  ],
  prog: [
    ["Official Python tutorial", "https://docs.python.org/3/tutorial/"],
    ["W3Schools · Python with live examples", "https://www.w3schools.com/python/"],
    ["Python Tutor · visualise code step by step", "https://pythontutor.com/"],
    ["Harvard CS50P · Introduction to Programming with Python", "https://cs50.harvard.edu/python/"],
  ],
  alac: [
    ["3Blue1Brown · Essence of linear algebra (playlist)", "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab"],
    ["3Blue1Brown · Essence of calculus (playlist)", "https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr"],
    ["Khan Academy · Linear algebra", "https://www.khanacademy.org/math/linear-algebra"],
    ["Khan Academy · Calculus 1", "https://www.khanacademy.org/math/calculus-1"],
    ["MIT OpenCourseWare · 18.06 Linear Algebra", "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/"],
    ["Desmos · Matrix calculator", "https://www.desmos.com/matrix"],
  ],
  aiml: [
    ["Google · Machine Learning Crash Course", "https://developers.google.com/machine-learning/crash-course"],
    ["Prompt Engineering Guide", "https://www.promptingguide.ai/"],
    ["Kaggle Learn · Intro to Machine Learning", "https://www.kaggle.com/learn/intro-to-machine-learning"],
    ["Elements of AI · free online course", "https://www.elementsofai.com/"],
  ],
  dviz: [
    ["The Data Visualisation Catalogue", "https://datavizcatalogue.com/"],
    ["From Data to Viz · choose the right chart", "https://www.data-to-viz.com/"],
    ["Kaggle Learn · Data Visualization", "https://www.kaggle.com/learn/data-visualization"],
    ["Our World in Data · real datasets & charts", "https://ourworldindata.org/"],
    ["Storytelling with Data", "https://www.storytellingwithdata.com/"],
  ],
  drm: [
    ["Google Business Profile Help (reviews & listings)", "https://support.google.com/business/"],
    ["Moz · Beginner’s Guide to SEO", "https://moz.com/beginners-guide-to-seo"],
    ["Google Skillshop · free digital marketing courses", "https://skillshop.withgoogle.com/"],
  ],
  arts: [
    ["musictheory.net · tempo, rhythm & dynamics lessons", "https://www.musictheory.net/"],
    ["Khan Academy · Arts & humanities", "https://www.khanacademy.org/humanities"],
    ["National Theatre · productions & learning", "https://www.nationaltheatre.org.uk/"],
  ],
};

export function allVideos() {
  const list = [];
  for (const c of catalog) {
    const own = window.SUBJECT_DATA?.[c.id]?.videos || [];
    for (const [id, topic, title] of [...own, ...(extraVideos[c.id] || [])]) {
      if (/^[\w-]{11}$/.test(id) && !list.some((v) => v.id === id))
        list.push({ id, topic, title, cid: c.id, cname: c.name });
    }
  }
  return list;
}

export function videosFor(cid, topic) {
  return allVideos().filter((v) => v.cid === cid && (!topic || v.topic === topic));
}

/* ---------- Video modal (privacy-enhanced YouTube embed) ---------- */
export function openVideo(id, title) {
  if (!/^[\w-]{11}$/.test(id)) return;
  closeVideo();
  const modal = document.createElement("div");
  modal.className = "video-modal";
  modal.id = "video-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", title || "Video");
  modal.innerHTML =
    '<div class="video-dialog"><div class="video-dialog-head"><strong>' +
    e(title || "Reference video") +
    '</strong><button type="button" class="video-close" aria-label="Close video">✕</button></div>' +
    '<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/' +
    id +
    '?rel=0&autoplay=1" title="' +
    e(title || "Video") +
    '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' +
    '<a class="video-external" href="https://www.youtube.com/watch?v=' +
    id +
    '" target="_blank" rel="noopener">Open on YouTube ↗</a></div>';
  document.body.append(modal);
  document.body.classList.add("modal-open");
  const close = modal.querySelector(".video-close");
  close.onclick = closeVideo;
  modal.onclick = (ev) => {
    if (ev.target === modal) closeVideo();
  };
  close.focus();
}

export function closeVideo() {
  document.getElementById("video-modal")?.remove();
  document.body.classList.remove("modal-open");
}

window.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") closeVideo();
});
window.addEventListener("hashchange", closeVideo);

export function videoCard(v) {
  return (
    '<button type="button" class="video-card" data-video="' +
    v.id +
    '" data-title="' +
    e(v.title) +
    '"><span class="video-thumb"><img loading="lazy" src="https://i.ytimg.com/vi/' +
    v.id +
    '/mqdefault.jpg" alt=""><span class="play-badge" aria-hidden="true">▶</span></span><span class="video-meta"><small>' +
    e(v.cname) +
    "</small><strong>" +
    e(v.title) +
    "</strong></span></button>"
  );
}

export function bindVideoCards(root) {
  root.querySelectorAll("[data-video]").forEach((b) => {
    b.onclick = () => openVideo(b.dataset.video, b.dataset.title);
  });
}

/* ---------- Local per-student storage (bookmarks, notes, planner) ---------- */
function store(kind) {
  const key = "br_" + kind + "_" + (window.__brUid || "anon");
  return {
    get() {
      try {
        return JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        return null;
      }
    },
    set(v) {
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* optional */
      }
    },
  };
}

export const bookmarks = {
  all: () => store("bookmarks").get() || [],
  has: (cid, nid) => bookmarks.all().some((b) => b.cid === cid && b.nid === nid),
  toggle(cid, nid, title) {
    let list = bookmarks.all();
    if (bookmarks.has(cid, nid)) list = list.filter((b) => !(b.cid === cid && b.nid === nid));
    else list.unshift({ cid, nid, title, ts: Date.now() });
    store("bookmarks").set(list.slice(0, 100));
    return bookmarks.has(cid, nid);
  },
};

export const notes = {
  all: () => store("notes").get() || {},
  get: (cid, nid) => notes.all()[cid + "/" + nid]?.text || "",
  set(cid, nid, title, text) {
    const all = notes.all();
    if (text.trim()) all[cid + "/" + nid] = { title, text: text.slice(0, 4000), ts: Date.now() };
    else delete all[cid + "/" + nid];
    store("notes").set(all);
  },
};

/* ---------- Videos page (#videos) ---------- */
export function videosPage(root) {
  const vids = allVideos();
  const subjects = catalog.filter((c) => vids.some((v) => v.cid === c.id));
  root.innerHTML =
    '<div class="page-head"><small class="eyebrow">Reference video library</small><h1>Watch &amp; learn</h1><p class="lead">' +
    vids.length +
    " hand-picked explainer videos mapped to your syllabus. Videos play inside Boardroom using YouTube’s privacy-enhanced mode.</p></div>" +
    '<div class="toolbar"><div class="filter-chips" role="group" aria-label="Filter by subject"><button type="button" class="chip active" data-f="all">All subjects</button>' +
    subjects
      .map((c) => '<button type="button" class="chip" data-f="' + c.id + '">' + e(c.name) + "</button>")
      .join("") +
    '</div><label class="search-inline"><span class="sr-label">Search videos</span><input id="video-search" type="search" placeholder="Search videos…"></label></div>' +
    '<div id="video-grid" class="video-grid"></div>';
  let filter = "all";
  const grid = root.querySelector("#video-grid");
  const input = root.querySelector("#video-search");
  function draw() {
    const q = input.value.trim().toLowerCase();
    const list = vids.filter(
      (v) => (filter === "all" || v.cid === filter) && (v.title + " " + v.cname).toLowerCase().includes(q),
    );
    grid.innerHTML = list.map(videoCard).join("") || '<p class="muted">No videos match your search.</p>';
    bindVideoCards(grid);
  }
  root.querySelectorAll("[data-f]").forEach((b) => {
    b.onclick = () => {
      filter = b.dataset.f;
      root.querySelectorAll("[data-f]").forEach((x) => x.classList.toggle("active", x === b));
      draw();
    };
  });
  input.oninput = draw;
  draw();
  return () => closeVideo();
}

/* ---------- Resources hub (#resources) ---------- */
export function resourcesPage(root) {
  const all = window.SUBJECT_DATA || {};
  root.innerHTML =
    '<div class="page-head"><small class="eyebrow">Resource centre</small><h1>References &amp; revision</h1><p class="lead">Trusted external references, quick revision sheets and official CULMS links for every subject.</p></div>' +
    '<div class="resource-grid">' +
    catalog
      .map((c) => {
        const d = all[c.id];
        const refs = references[c.id] || [];
        const vcount = videosFor(c.id).length;
        return (
          '<article class="resource-card"><div class="course-top"><small>' +
          e(c.code) +
          "</small>" +
          (d ? '<span class="status-pill">Notes ready</span>' : '<span class="status-pill soon">Coming soon</span>') +
          "</div><h3>" +
          e(c.name) +
          '</h3><ul class="ref-list">' +
          refs
            .map(
              ([label, url]) =>
                '<li><a href="' + url + '" target="_blank" rel="noopener">' + e(label) + " ↗</a></li>",
            )
            .join("") +
          '<li><a href="' +
          c.url +
          '" target="_blank" rel="noopener">Official CULMS course page ↗</a></li></ul><div class="lesson-actions">' +
          (d?.revision ? href("Revision sheet", c.id + "/revision", true) : "") +
          (d ? href("Study resources", c.id + "/resources") : "") +
          (vcount ? href(vcount + " videos", "videos") : "") +
          href("Self-test", c.id + "/practice") +
          "</div></article>"
        );
      })
      .join("") +
    "</div>";
  return () => {};
}

/* ---------- Planner (#planner): deadlines, bookmarks, notes ---------- */
export function plannerPage(root) {
  const plan = store("planner");
  root.innerHTML =
    '<div class="page-head"><small class="eyebrow">Personal study planner</small><h1>Planner &amp; saved items</h1><p class="lead">Track exams and deadlines, revisit bookmarked lessons and your private lesson notes. Saved on this device.</p></div>' +
    '<div class="planner-layout"><section class="panel"><h2>Deadlines &amp; exams</h2><form id="task-form" class="task-form"><label>What’s due?<input name="title" required maxlength="80" placeholder="e.g. ALAC Unit 3 test"></label><div class="form-row-3"><label>Date<input name="date" type="date" required></label><label>Subject<select name="cid"><option value="">General</option>' +
    catalog.map((c) => '<option value="' + c.id + '">' + e(c.name) + "</option>").join("") +
    '</select></label><button class="primary">Add</button></div></form><ul id="task-list" class="task-list"></ul></section>' +
    '<section class="panel"><h2>Bookmarked lessons</h2><ul id="bm-list" class="saved-list"></ul><h2>My lesson notes</h2><div id="note-list"></div></section></div>';

  const form = root.querySelector("#task-form");
  const list = root.querySelector("#task-list");
  function tasks() {
    return plan.get() || [];
  }
  function draw() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = tasks().sort((a, b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date));
    list.innerHTML =
      items
        .map((t, i) => {
          const due = new Date(t.date + "T00:00:00");
          const days = Math.round((due - today) / 86400000);
          const label = t.done
            ? "Done"
            : days < 0
              ? Math.abs(days) + " day" + (Math.abs(days) === 1 ? "" : "s") + " overdue"
              : days === 0
                ? "Due today"
                : days + " day" + (days === 1 ? "" : "s") + " left";
          const cls = t.done ? "is-done" : days < 0 ? "is-late" : days <= 3 ? "is-soon" : "";
          return (
            '<li class="task ' +
            cls +
            '"><label class="check-label"><input type="checkbox" data-done="' +
            t.id +
            '"' +
            (t.done ? " checked" : "") +
            "><span><strong>" +
            e(t.title) +
            "</strong><small>" +
            e(catalog.find((c) => c.id === t.cid)?.name || "General") +
            " · " +
            e(due.toLocaleDateString()) +
            '</small></span></label><span class="countdown">' +
            label +
            '</span><button type="button" class="icon-btn" data-del="' +
            t.id +
            '" aria-label="Delete ' +
            e(t.title) +
            '">✕</button></li>'
          );
        })
        .join("") || '<li class="muted">No deadlines yet. Add your next test or assignment above.</li>';
    list.querySelectorAll("[data-done]").forEach((cb) => {
      cb.onchange = () => {
        plan.set(tasks().map((t) => (t.id === cb.dataset.done ? { ...t, done: cb.checked } : t)));
        draw();
      };
    });
    list.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = () => {
        plan.set(tasks().filter((t) => t.id !== b.dataset.del));
        draw();
      };
    });
  }
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const f = form.elements;
    plan.set([
      ...tasks(),
      { id: Date.now().toString(36), title: f.title.value.trim(), date: f.date.value, cid: f.cid.value, done: false },
    ]);
    form.reset();
    showToast("Deadline added");
    draw();
  };
  draw();

  const bms = bookmarks.all();
  root.querySelector("#bm-list").innerHTML =
    bms
      .map(
        (b) =>
          '<li><a href="#' +
          b.cid +
          "/lesson/" +
          b.nid +
          '"><strong>' +
          e(b.title) +
          "</strong><small>" +
          e(catalog.find((c) => c.id === b.cid)?.name || "") +
          "</small></a></li>",
      )
      .join("") || '<li class="muted">Use the ☆ Bookmark button on any lesson to save it here.</li>';

  const ns = Object.entries(notes.all()).sort((a, b) => b[1].ts - a[1].ts);
  root.querySelector("#note-list").innerHTML =
    ns
      .map(
        ([k, n]) =>
          '<article class="note-item"><a href="#' +
          k.split("/")[0] +
          "/lesson/" +
          k.split("/")[1] +
          '"><strong>' +
          e(n.title) +
          "</strong></a><p>" +
          e(n.text.slice(0, 220)) +
          (n.text.length > 220 ? "…" : "") +
          "</p></article>",
      )
      .join("") || '<p class="muted">Notes you write under any lesson appear here.</p>';
  return () => {};
}
