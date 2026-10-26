const apiKeyEl = document.getElementById("apiKey");
const regionEl = document.getElementById("region");
const savedEl = document.getElementById("saved");

async function load() {
  const stored = await chrome.storage.local.get(["apiKey", "region"]);
  apiKeyEl.value = stored.apiKey || "";
  regionEl.value = stored.region || "US";
}

document.getElementById("save").addEventListener("click", async () => {
  const apiKey = apiKeyEl.value.trim();
  const region = (regionEl.value.trim() || "US").toUpperCase();
  await chrome.storage.local.set({ apiKey, region });
  savedEl.classList.remove("hidden");
  setTimeout(() => savedEl.classList.add("hidden"), 1500);
});

load();
