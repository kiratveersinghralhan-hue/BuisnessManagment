const reduce = matchMedia("(prefers-reduced-motion: reduce)");

export function showToast(message) {
  const el = document.getElementById("toast");
  if (!el || !message) return;
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("is-visible"), 2600);
}

// Skippable academic intro reveal (once per tab session, never blocks input).
const splash = document.getElementById("intro-splash");
if (splash) {
  let alreadySeen = false;
  try {
    alreadySeen = sessionStorage.getItem("br_intro_seen") === "1";
  } catch {
    /* ignore storage restrictions */
  }
  const dismissIntro = () => {
    if (splash.hidden) return;
    splash.classList.add("is-leaving");
    try {
      sessionStorage.setItem("br_intro_seen", "1");
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      splash.hidden = true;
      splash.setAttribute("aria-hidden", "true");
    }, reduce.matches ? 0 : 280);
  };
  if (!reduce.matches && !alreadySeen) {
    splash.hidden = false;
    splash.setAttribute("aria-hidden", "false");
    document.getElementById("skip-intro")?.addEventListener("click", dismissIntro);
    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") dismissIntro();
    }, { once: true });
    document.addEventListener("focusin", (ev) => {
      if (ev.target instanceof Element && !splash.contains(ev.target)) dismissIntro();
    }, { once: true });
    setTimeout(dismissIntro, 1150);
  }
}

// Scroll progress indicator.
const progress = document.getElementById("scroll-progress");
if (progress) {
  let raf = 0;
  const syncProgress = () => {
    raf = 0;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    progress.style.width = pct.toFixed(2) + "%";
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

// Bidirectional smooth scroll reveal.
const seen = new WeakSet();
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !reduce.matches) {
          const fromTop = entry.boundingClientRect.top < 0;
          entry.target.animate(
            [
              {
                opacity: 0.72,
                transform: "translateY(" + (fromTop ? "-10" : "10") + "px)",
              },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          );
        }
      }
    },
    { threshold: 0.06 },
  );
  const selector = ".course,.fact-card,.reading,.banner,.unit,.intro,.kpi-card,.study-tool-card,.panel";
  function attach(node) {
    if (!(node instanceof Element)) return;
    for (const el of [node, ...node.querySelectorAll(selector)]) {
      if (el.matches(selector) && !seen.has(el)) {
        seen.add(el);
        observer.observe(el);
      }
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
