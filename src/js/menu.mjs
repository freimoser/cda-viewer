// Hamburger-Menü (≤760px). Eigene Datei wegen CSP (kein Inline-Script).
const btn = document.getElementById("menu-btn");
const nav = document.getElementById("site-nav");
if (btn && nav) {
  const set = (open) => { nav.classList.toggle("open", open); btn.setAttribute("aria-expanded", open ? "true" : "false"); };
  btn.addEventListener("click", () => set(!nav.classList.contains("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
}
