// Appearance (light/dark/auto + accent color). Shared by the popup and the
// options page; stored in chrome.storage.local under "appearance".
const ACCENTS = {
  teal: "#00c2a8",
  blue: "#4c8dff",
  violet: "#9b7bff",
  rose: "#ff6b8b",
  amber: "#f0a93b",
  green: "#3ec46d",
};
let appearance = { mode: "auto", accent: "teal" };
const lightQuery = window.matchMedia("(prefers-color-scheme: light)");

function applyAppearance() {
  const mode = appearance.mode === "auto" ? (lightQuery.matches ? "light" : "dark") : appearance.mode;
  document.documentElement.dataset.mode = mode;
  document.documentElement.dataset.accent = ACCENTS[appearance.accent] ? appearance.accent : "teal";
}

function saveAppearance(patch) {
  appearance = { ...appearance, ...patch };
  applyAppearance();
  chrome.storage.local.set({ appearance });
}

lightQuery.addEventListener("change", applyAppearance);
applyAppearance();
chrome.storage.local.get("appearance").then((s) => {
  if (s.appearance) appearance = { ...appearance, ...s.appearance };
  applyAppearance();
});
