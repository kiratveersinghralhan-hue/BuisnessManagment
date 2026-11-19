/* Boardroom Theme · persistent, accessible, independent of Firebase. */
(() => {
  const key = "boardroom:theme:v14";
  let theme = "light";
  try { if (localStorage.getItem(key) === "midnight") theme = "midnight"; } catch {}
  const root = document.documentElement;
  const update = (next) => {
    theme = next === "midnight" ? "midnight" : "light";
    root.dataset.theme = theme;
    root.style.colorScheme = theme === "midnight" ? "dark" : "light";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "midnight" ? "#0d0e12" : "#f8f6ff";
    document.querySelectorAll(".theme-toggle").forEach(button => {
      const isDark = theme === "midnight";
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to midnight theme");
      const symbol = button.querySelector(".theme-symbol");
      const label = button.querySelector(".theme-label");
      if (symbol) symbol.textContent = isDark ? "☀" : "☾";
      if (label) label.textContent = isDark ? "Light" : "Dark";
    });
  };
  update(theme);
  document.addEventListener("DOMContentLoaded", () => {
    update(theme);
    document.querySelectorAll(".theme-toggle").forEach(button => {
      button.addEventListener("click", () => {
        const next = theme === "midnight" ? "light" : "midnight";
        try { localStorage.setItem(key, next); } catch {}
        update(next);
      });
    });
  });
})();
