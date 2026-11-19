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


// Friendly first-visit motion. Skip for repeat sessions and reduced-motion users.
const hello = document.getElementById("intro-screen");
if (hello) {
  const hide = () => { hello.classList.add("is-done"); setTimeout(() => hello.remove(), 800); };
  let shown = false;
  try { shown = sessionStorage.getItem("br_studio_intro_v2") === "1"; sessionStorage.setItem("br_studio_intro_v2", "1"); } catch {}
  if (reduce.matches || shown) hide();
  else setTimeout(hide, 1550);
}
