const reduce = matchMedia("(prefers-reduced-motion: reduce)");

export function showToast(message) {
  const el = document.getElementById("toast");
  if (!el || !message) return;
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("is-visible"), 2600);
}

// Crisp scroll progress bar
const progress = document.getElementById("scroll-progress");
if (progress) {
  let raf = 0;
  const syncProgress = () => {
    raf = 0;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progress.style.width = (ratio * 100).toFixed(2) + "%";
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!raf) raf = requestAnimationFrame(syncProgress);
    },
    { passive: true },
  );
  window.addEventListener("resize", syncProgress, { passive: true });
  syncProgress();
}

// Subtle desktop 3D card tilt (no neon, crisp shadow lift)
const canTilt =
  !reduce.matches && matchMedia("(hover: hover) and (pointer: fine)").matches;
const tiltBound = new WeakSet();
const tiltSelector = ".course,.fact-card,.study-tool-card,.kpi-card,.resource-card,.video-card";

function attachTilt(el) {
  if (!canTilt || tiltBound.has(el)) return;
  tiltBound.add(el);
  el.addEventListener("pointermove", (ev) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (ev.clientX - r.left) / r.width;
    const py = (ev.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 4.5;
    const ry = (px - 0.5) * 5.5;
    el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-2px)`;
  });
  el.addEventListener("pointerleave", () => {
    el.style.transform = "";
  });
}

// Smooth bidirectional scroll reveal
const seen = new WeakSet();
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      let batch = 0;
      for (const entry of entries) {
        if (entry.isIntersecting && !reduce.matches) {
          const fromTop = entry.boundingClientRect.top < 0;
          const delay = Math.min(batch * 30, 150);
          batch++;
          entry.target.animate(
            [
              {
                opacity: 0.65,
                transform: `translateY(${fromTop ? "-12" : "14"}px)`,
              },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 320,
              delay,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards",
            },
          );
        }
      }
    },
    { threshold: 0.05 },
  );
  const selector =
    ".course,.fact-card,.reading,.banner,.unit,.intro,.kpi-card,.study-tool-card,.panel,.resource-card,.video-card";

  function attach(node) {
    if (!(node instanceof Element)) return;
    for (const el of [node, ...node.querySelectorAll(selector)]) {
      if (el.matches(selector) && !seen.has(el)) {
        seen.add(el);
        observer.observe(el);
      }
    }
    for (const el of [node, ...node.querySelectorAll(tiltSelector)]) {
      if (el.matches(tiltSelector)) attachTilt(el);
    }
  }
  attach(document.body);
  const mainEl = document.querySelector("main");
  if (mainEl) {
    new MutationObserver((changes) => {
      for (const c of changes) {
        for (const node of c.addedNodes) attach(node);
        for (const node of c.removedNodes) {
          if (node instanceof Element) {
            for (const el of [node, ...node.querySelectorAll(selector)]) {
              if (seen.has(el)) {
                observer.unobserve(el);
                seen.delete(el);
              }
            }
          }
        }
      }
    }).observe(mainEl, { childList: true, subtree: true });
  }
}

document.querySelector("#top")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reduce.matches ? "instant" : "smooth" });
});


// Replayable cinematic entrance: wordmark, diagonal blade, then two split panels.
// Does not run for people who requested reduced motion. No sessionStorage skip,
// so first-load animation remains visible after deployment and on repeat visits.
const intro = document.getElementById("intro-screen");
if (intro) {
  const skip = document.getElementById("intro-skip");
  const replay = document.getElementById("intro-replay");
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const finish = () => {
    clear();
    intro.classList.add("is-done");
    intro.classList.remove("is-playing");
    intro.setAttribute("aria-hidden", "true");
    intro.removeAttribute("aria-modal");
    intro.setAttribute("inert", "");
    const t = setTimeout(() => { intro.hidden = true; }, 720);
    timers.push(t);
  };
  const play = () => {
    clear();
    if (reduce.matches) { finish(); return; }
    intro.hidden = false;
    intro.removeAttribute("inert");
    intro.setAttribute("aria-hidden", "false");
    intro.setAttribute("aria-modal", "true");
    intro.classList.remove("is-done", "is-cutting", "is-playing");
    // Restart animations even after replay. Keep visible 2 seconds for branding.
    void intro.offsetWidth;
    requestAnimationFrame(() => intro.classList.add("is-playing"));
    timers.push(setTimeout(() => { intro.classList.remove("is-playing"); intro.classList.add("is-cutting"); }, 1150));
    timers.push(setTimeout(finish, 2360));
  };
  skip?.addEventListener("click", finish);
  replay?.addEventListener("click", play);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !intro.hidden) finish();
  });
  play();
}
