const TMDB_API = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";
const ESPN_API = "https://site.api.espn.com/apis/site/v2/sports";

const TIER_LABELS = {
  free: "Free",
  ads: "Free with Ads",
  flatrate: "Subscription",
  rent: "Rent",
  buy: "Buy",
};
const TIER_ORDER = ["free", "ads", "flatrate", "rent", "buy"];

// Stable homepages for streaming services, matched by substring against the
// provider name TMDB/JustWatch returns. We link straight to the service
// instead of guessing a deep-search URL (those paths change and break).
const PROVIDER_HOMES = [
  ["tubi", "https://tubitv.com"],
  ["pluto tv", "https://pluto.tv"],
  ["roku channel", "https://therokuchannel.roku.com"],
  ["freevee", "https://www.amazon.com/adlp/freevee"],
  ["crackle", "https://www.crackle.com"],
  ["plex", "https://watch.plex.tv"],
  ["kanopy", "https://www.kanopy.com"],
  ["hoopla", "https://www.hoopladigital.com"],
  ["freeform", "https://www.freeform.com"],
  ["redbox", "https://www.redbox.com/free-live-tv"],
  ["netflix", "https://www.netflix.com"],
  ["max", "https://www.max.com"],
  ["hulu", "https://www.hulu.com"],
  ["disney", "https://www.disneyplus.com"],
  ["paramount", "https://www.paramountplus.com"],
  ["showtime", "https://www.paramountplus.com"],
  ["starz", "https://www.starz.com"],
  ["espn", "https://plus.espn.com"],
  ["fubo", "https://www.fubo.tv"],
  ["peacock", "https://www.peacocktv.com"],
  ["prime video", "https://www.amazon.com/gp/video/storefront"],
  ["amazon", "https://www.amazon.com/gp/video/storefront"],
  ["apple tv", "https://tv.apple.com"],
  ["google play", "https://play.google.com/store/movies"],
  ["youtube", "https://www.youtube.com/feed/storefront"],
  ["vudu", "https://www.vudu.com"],
  ["microsoft", "https://www.xbox.com/en-us/movies-tv"],
];

// Broadcaster -> homepage + short badge label, for the Sports tab.
const NETWORK_HOMES = [
  ["espn+", "https://plus.espn.com", "ESPN+"],
  ["espn2", "https://www.espn.com/watch", "ESPN2"],
  ["espn", "https://www.espn.com/watch", "ESPN"],
  ["abc", "https://abc.com/watch-live", "ABC"],
  ["nbc", "https://www.nbc.com/live", "NBC"],
  ["cbs", "https://www.cbs.com/live-tv", "CBS"],
  ["fox", "https://www.fox.com/live", "FOX"],
  ["tnt", "https://www.tntdrama.com/watchtnt", "TNT"],
  ["tbs", "https://www.tbs.com/watchtbs", "TBS"],
  ["trutv", "https://www.trutv.com/watch", "truTV"],
  ["peacock", "https://www.peacocktv.com", "PCK"],
  ["paramount+", "https://www.paramountplus.com", "P+"],
  ["prime video", "https://www.amazon.com/gp/video/storefront", "PRIME"],
  ["amazon", "https://www.amazon.com/gp/video/storefront", "PRIME"],
  ["apple tv", "https://tv.apple.com", "ATV"],
  ["nba tv", "https://www.nba.com/watch", "NBATV"],
  ["nba league pass", "https://www.nba.com/watch", "NBALP"],
  ["mlb network", "https://www.mlb.com/live-stream-games", "MLBN"],
  ["mlb.tv", "https://www.mlb.com/live-stream-games", "MLBTV"],
  ["nhl network", "https://www.nhl.com/tv", "NHLN"],
  ["nfl network", "https://www.nfl.com/network", "NFLN"],
  ["nfl+", "https://www.nfl.com/plus", "NFL+"],
];

const els = {
  settingsBtn: document.getElementById("settingsBtn"),
  setupNotice: document.getElementById("setupNotice"),
  openSettings: document.getElementById("openSettings"),
  tabs: document.getElementById("tabs"),
  panelMovies: document.getElementById("panel-movies"),
  panelSports: document.getElementById("panel-sports"),

  form: document.getElementById("searchForm"),
  query: document.getElementById("query"),
  searchBtn: document.getElementById("searchBtn"),
  status: document.getElementById("status"),
  candidates: document.getElementById("candidates"),
  results: document.getElementById("results"),
  regionLabel: document.getElementById("regionLabel"),
  changeRegion: document.getElementById("changeRegion"),

  sportsForm: document.getElementById("sportsForm"),
  team: document.getElementById("team"),
  sportsSearchBtn: document.getElementById("sportsSearchBtn"),
  sportsStatus: document.getElementById("sportsStatus"),
  sportsCandidates: document.getElementById("sportsCandidates"),
  sportsResults: document.getElementById("sportsResults"),
};

let settings = { apiKey: "", region: "US", myServices: [], watchableOnly: false, favTeams: [] };
let lastTitle = null;
let currentTeam = null;
const leagueTeamsCache = {};
const LEAGUES = [
  { id: "football/nfl", label: "NFL" },
  { id: "basketball/nba", label: "NBA" },
  { id: "baseball/mlb", label: "MLB" },
  { id: "hockey/nhl", label: "NHL" },
  { id: "basketball/wnba", label: "WNBA" },
  { id: "soccer/usa.1", label: "MLS" },
  { id: "soccer/eng.1", label: "Premier League" },
  { id: "football/college-football", label: "NCAAF" },
  { id: "basketball/mens-college-basketball", label: "NCAAM" },
];
const TEAM_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function clear(el) {
  el.innerHTML = "";
  el.classList.add("hidden");
}

function setStatus(el, msg, isError = false, loading = false) {
  el.textContent = msg || "";
  el.classList.toggle("hidden", !msg);
  el.classList.toggle("error", isError);
  el.classList.toggle("loading", loading && Boolean(msg));
}

function setBusy(btn, busy) {
  btn.disabled = busy;
  btn.textContent = busy ? "…" : "Search";
}

class FriendlyError extends Error {}

async function fetchJson(url, service) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (err) {
    throw new FriendlyError(
      err.name === "TimeoutError"
        ? `${service} is taking too long to respond. Try again in a moment.`
        : `Can't reach ${service}. Check your internet connection and try again.`
    );
  }
  if (res.status === 401) {
    throw new FriendlyError("Your TMDB API key was rejected. Check it in settings.");
  }
  if (res.status === 429) {
    throw new FriendlyError(`${service} is busy right now. Try again in a minute.`);
  }
  if (!res.ok) {
    throw new FriendlyError(`${service} had a problem (error ${res.status}). Try again later.`);
  }
  try {
    return await res.json();
  } catch {
    throw new FriendlyError(`${service} sent an unexpected response. Try again later.`);
  }
}

function errorMessage(err) {
  return err instanceof FriendlyError ? err.message : "Something went wrong. Please try again.";
}

function homeFor(name, table) {
  const lower = name.toLowerCase();
  const match = table.find(([needle]) => lower.includes(needle));
  return match || null;
}

// ---------- Tabs ----------

function switchTab(target) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.tab === target));
  els.panelMovies.classList.toggle("active", target === "movies");
  els.panelSports.classList.toggle("active", target === "sports");
  (target === "movies" ? els.query : els.team).focus();
  chrome.storage.local.set({ lastTab: target });
}

els.tabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (btn) switchTab(btn.dataset.tab);
});

// Swipe between tabs: two-finger trackpad swipe (horizontal wheel) or touch drag.
function swipeTo(dir) {
  // dir > 0 = swipe left (go to the next tab), dir < 0 = swipe right (previous).
  switchTab(dir > 0 ? "sports" : "movies");
}

let wheelX = 0;
let wheelLockedUntil = 0;
document.addEventListener(
  "wheel",
  (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    if (e.target.closest(".candidates")) return; // let the match strip scroll
    if (Date.now() < wheelLockedUntil) return;
    wheelX += e.deltaX;
    if (Math.abs(wheelX) > 60) {
      swipeTo(wheelX);
      wheelX = 0;
      wheelLockedUntil = Date.now() + 500;
    }
  },
  { passive: true }
);

let touchStart = null;
document.addEventListener("touchstart", (e) => {
  touchStart = e.target.closest(".candidates")
    ? null
    : { x: e.touches[0].clientX, y: e.touches[0].clientY };
});
document.addEventListener("touchend", (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) swipeTo(-dx);
});

// ---------- My services ----------

const servicesView = document.getElementById("servicesView");
const serviceGrid = document.getElementById("serviceGrid");

function renderServiceGrid() {
  serviceGrid.innerHTML = "";
  let lastGroup = null;
  MY_SERVICES.forEach((svc) => {
    const group = svc.group || "streaming";
    if (group !== lastGroup) {
      const label = document.createElement("div");
      label.className = "group-label";
      label.textContent = group === "live" ? "Live TV (for sports)" : "Streaming services";
      serviceGrid.appendChild(label);
      lastGroup = group;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "service-opt" + (settings.myServices.includes(svc.key) ? " on" : "");
    btn.setAttribute("aria-pressed", settings.myServices.includes(svc.key));
    btn.innerHTML = `<span class="box">${
      settings.myServices.includes(svc.key) ? "✓" : ""
    }</span><span>${escapeHtml(svc.label)}</span>`;
    btn.addEventListener("click", () => {
      const on = settings.myServices.includes(svc.key);
      settings.myServices = on
        ? settings.myServices.filter((k) => k !== svc.key)
        : [...settings.myServices, svc.key];
      chrome.storage.local.set({ myServices: settings.myServices });
      renderServiceGrid();
    });
    serviceGrid.appendChild(btn);
  });
}

const settingsView = document.getElementById("settingsView");
let currentView = null; // "services" | "settings" | null

function openView(name) {
  if (name === "services") renderServiceGrid();
  if (name === "settings") renderSettingsView();
  els.tabs.classList.add("hidden");
  els.panelMovies.classList.remove("active");
  els.panelSports.classList.remove("active");
  servicesView.classList.toggle("hidden", name !== "services");
  settingsView.classList.toggle("hidden", name !== "settings");
  currentView = name;
}

function closeViews() {
  servicesView.classList.add("hidden");
  settingsView.classList.add("hidden");
  els.tabs.classList.remove("hidden");
  const onSports = document.querySelector(".tab.active")?.dataset.tab === "sports";
  els.panelMovies.classList.toggle("active", !onSports);
  els.panelSports.classList.toggle("active", onSports);
  currentView = null;
  if (lastTitle) showTitleResult(lastTitle);
  if (onSports) {
    renderFavorites();
    if (currentTeam) showTeamResult(currentTeam);
  }
}

const openServices = () => openView("services");

function toggleView(name) {
  if (currentView === name) closeViews();
  else openView(name);
}

document.getElementById("myServicesBtn").addEventListener("click", () => toggleView("services"));
document.getElementById("servicesDone").addEventListener("click", closeViews);
document.getElementById("settingsDone").addEventListener("click", closeViews);

// ---------- Appearance & region (settings view) ----------

function renderSettingsView() {
  document
    .querySelectorAll("#modeSeg button")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === appearance.mode));
  const sw = document.getElementById("accentSwatches");
  sw.innerHTML = "";
  Object.entries(ACCENTS).forEach(([name, color]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch" + (appearance.accent === name ? " active" : "");
    b.style.background = color;
    b.title = name[0].toUpperCase() + name.slice(1);
    b.setAttribute("aria-label", b.title + " accent");
    b.addEventListener("click", () => {
      saveAppearance({ accent: name });
      renderSettingsView();
    });
    sw.appendChild(b);
  });
  document.getElementById("regionInput").value = settings.region;
}

document.getElementById("modeSeg").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  saveAppearance({ mode: b.dataset.mode });
  renderSettingsView();
});

document.getElementById("regionInput").addEventListener("input", (e) => {
  const v = e.target.value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(v)) return;
  settings.region = v;
  els.regionLabel.textContent = v;
  chrome.storage.local.set({ region: v });
});

document.getElementById("advancedLink").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// ---------- Settings ----------

async function loadSettings() {
  const stored = await chrome.storage.local.get(["apiKey", "region", "myServices", "watchableOnly", "favTeams"]);
  settings.apiKey = stored.apiKey || "";
  settings.myServices = stored.myServices || [];
  settings.watchableOnly = Boolean(stored.watchableOnly);
  settings.favTeams = stored.favTeams || [];
  settings.region = stored.region || "US";
  els.regionLabel.textContent = settings.region;

  const ready = Boolean(settings.apiKey || PROXY_URL);
  els.setupNotice.classList.toggle("hidden", ready);
  els.searchBtn.disabled = !ready;
  els.query.disabled = !ready;
}

els.settingsBtn.addEventListener("click", () => toggleView("settings"));
els.openSettings.addEventListener("click", () => chrome.runtime.openOptionsPage());
els.changeRegion.addEventListener("click", (e) => {
  e.preventDefault();
  openView("settings");
});

// ---------- Movies & TV ----------

function posterUrl(path, size = "w92") {
  return path ? `${IMG_BASE}/${size}${path}` : "";
}

// Uses the bundled proxy when configured and the user hasn't set their own key.
function tmdbUrl(path, params = {}) {
  const qs = new URLSearchParams(params);
  if (settings.apiKey || !PROXY_URL) {
    qs.set("api_key", settings.apiKey);
    return `${TMDB_API}/${path.direct}?${qs}`;
  }
  return `${PROXY_URL}/${path.proxy}?${qs}`;
}

async function searchTitles(query) {
  const url = tmdbUrl({ direct: "search/multi", proxy: "search" }, {
    query,
    include_adult: "false",
  });
  const data = await fetchJson(url, "TMDB");
  return (data.results || []).filter(
    (r) => r.media_type === "movie" || r.media_type === "tv"
  );
}

async function fetchProviders(mediaType, id) {
  const url = tmdbUrl({
    direct: `${mediaType}/${id}/watch/providers`,
    proxy: `providers/${mediaType}/${id}`,
  });
  const data = await fetchJson(url, "TMDB");
  return data.results ? data.results[settings.region] : null;
}

function markActive(container, btn) {
  container.querySelectorAll(".candidate").forEach((b) => b.classList.toggle("active", b === btn));
}

function renderCandidates(container, items, onPick) {
  clear(container);
  if (items.length <= 1) return;

  container.classList.remove("hidden");
  items.slice(0, 6).forEach((item) => {
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date || "";
    const year = date ? date.slice(0, 4) : "";
    const kind = item.media_type === "tv" ? "TV" : "Movie";

    const btn = document.createElement("button");
    btn.className = "candidate";
    btn.innerHTML = `
      <img src="${posterUrl(item.poster_path)}" alt="" />
      <div class="meta">
        <span class="title">${escapeHtml(title)}</span>
        <span class="sub">${kind}${year ? " · " + year : ""}</span>
      </div>
    `;
    btn.addEventListener("click", () => {
      markActive(container, btn);
      onPick(item);
    });
    container.appendChild(btn);
  });
  container.firstElementChild?.classList.add("active");
}

function buildProviderChip(provider, fallbackLink) {
  const home = homeFor(provider.provider_name, PROVIDER_HOMES);
  const href = home ? home[1] : fallbackLink || "#";
  const destinationLabel = home ? provider.provider_name : "full watch page";

  const chip = document.createElement("a");
  chip.className = "provider-chip";
  chip.href = href;
  chip.target = "_blank";
  chip.rel = "noopener";
  chip.title = `Opens ${destinationLabel}`;
  const ownedKey = ownedServiceKey(provider.provider_name);
  if (ownedKey && expandServices(settings.myServices).has(ownedKey)) chip.classList.add("owned");
  chip.innerHTML = `
    <img src="${IMG_BASE}/w45${provider.logo_path}" alt="" />
    <span>${escapeHtml(provider.provider_name)}</span>
    <span class="nav-arrow">↗</span>
  `;
  return chip;
}

let titleSeq = 0;

async function showTitleResult(item) {
  lastTitle = item;
  const seq = ++titleSeq;
  clear(els.results);
  setStatus(els.status, "Checking streaming options…", false, true);

  try {
    const regionData = await fetchProviders(item.media_type, item.id);
    if (seq !== titleSeq) return;
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date || "";
    const year = date ? date.slice(0, 4) : "";

    els.results.innerHTML = "";

    const header = document.createElement("div");
    header.className = "result-header";
    header.innerHTML = `
      <img src="${posterUrl(item.poster_path)}" alt="" />
      <div>
        <div class="title">${escapeHtml(title)}</div>
        <div class="sub">${item.media_type === "tv" ? "TV" : "Movie"}${
      year ? " · " + year : ""
    } · ${settings.region}</div>
      </div>
    `;
    els.results.appendChild(header);

    const hasAny = regionData && TIER_ORDER.some((t) => (regionData[t] || []).length);

    const mine = expandServices(settings.myServices);
    const isOwned = (p) => {
      const k = ownedServiceKey(p.provider_name);
      return Boolean(k && mine.has(k));
    };
    const ownedNow = (regionData?.flatrate || []).filter(isOwned);
    const freeNow = [...(regionData?.free || []), ...(regionData?.ads || [])];

    if (hasAny) {
      const banner = document.createElement("div");
      if (!mine.size) {
        banner.className = "mine-banner no";
        banner.innerHTML = `Tell us which services you have and we'll show what you can watch now. <a href="#" id="bannerServices">Choose services →</a>`;
      } else if (ownedNow.length) {
        banner.className = "mine-banner yes";
        banner.textContent = `✓ Included with your services: ${[
          ...new Set(ownedNow.map((p) => MY_SERVICES.find((s) => s.key === ownedServiceKey(p.provider_name)).label)),
        ].join(", ")}`;
      } else if (freeNow.length) {
        banner.className = "mine-banner yes";
        banner.textContent = "✓ Free to watch (not on your subscriptions)";
      } else {
        banner.className = "mine-banner no";
        banner.textContent = "Not on any of your services. Rent or buy options below.";
      }
      els.results.appendChild(banner);
      banner.querySelector("#bannerServices")?.addEventListener("click", (e) => {
        e.preventDefault();
        openServices();
      });

      if (mine.size) {
        const toggle = document.createElement("label");
        toggle.className = "mine-toggle";
        toggle.innerHTML = `<input type="checkbox" ${
          settings.watchableOnly ? "checked" : ""
        } /> Only what I can watch now`;
        toggle.querySelector("input").addEventListener("change", (e) => {
          settings.watchableOnly = e.target.checked;
          chrome.storage.local.set({ watchableOnly: settings.watchableOnly });
          showTitleResult(item);
        });
        els.results.appendChild(toggle);
      }
    }

    if (regionData?.link) {
      const link = document.createElement("a");
      link.href = regionData.link;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "primary-link";
      link.title = "Opens the full TMDB watch page for this title";
      link.textContent = "Open full watch page →";
      els.results.appendChild(link);
    }

    if (!hasAny) {
      const none = document.createElement("div");
      none.className = "no-results";
      none.textContent = `No streaming info found for ${settings.region} right now.`;
      els.results.appendChild(none);
    } else {
      const filtering = settings.watchableOnly && mine.size;
      let shown = 0;
      TIER_ORDER.forEach((tier) => {
        let providers = regionData[tier] || [];
        if (filtering) {
          if (tier === "rent" || tier === "buy") providers = [];
          if (tier === "flatrate") providers = providers.filter(isOwned);
        }
        if (!providers.length) return;
        shown++;

        const group = document.createElement("div");
        group.className = "tier-group";
        group.dataset.tier = tier;

        const title = document.createElement("div");
        title.className = "tier-title";
        title.innerHTML = `<span class="dot"></span>${TIER_LABELS[tier]}`;
        group.appendChild(title);

        const row = document.createElement("div");
        row.className = "chip-row";
        providers.forEach((p) => row.appendChild(buildProviderChip(p, regionData.link)));
        group.appendChild(row);

        els.results.appendChild(group);
      });
      if (!shown) {
        const none = document.createElement("div");
        none.className = "no-results";
        none.textContent = "Nothing you can watch right now. Uncheck the filter to see rent and buy options.";
        els.results.appendChild(none);
      }
    }

    els.results.classList.remove("hidden");
    setStatus(els.status, "");
  } catch (err) {
    setStatus(els.status, errorMessage(err), true);
  }
}

let movieSeq = 0;

async function handleMovieSearch(e) {
  e?.preventDefault();
  const query = els.query.value.trim();
  if (!query || !(settings.apiKey || PROXY_URL)) return;
  const seq = ++movieSeq;

  clear(els.candidates);
  clear(els.results);
  setStatus(els.status, "Searching…", false, true);
  setBusy(els.searchBtn, true);

  try {
    const items = await searchTitles(query);
    if (seq !== movieSeq) return;
    if (items.length === 0) {
      setStatus(els.status, "No matches found.", true);
      return;
    }
    setStatus(els.status, "");
    renderCandidates(els.candidates, items, showTitleResult);
    await showTitleResult(items[0]);
  } catch (err) {
    if (seq === movieSeq) setStatus(els.status, errorMessage(err), true);
  } finally {
    if (seq === movieSeq) setBusy(els.searchBtn, false);
  }
}

els.form.addEventListener("submit", handleMovieSearch);

// Search as you type: wait for a short pause, ignore very short input.
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
const typeSearchMovies = debounce(() => {
  const q = els.query.value.trim();
  if (q.length >= 2) return handleMovieSearch();
  movieSeq++;
  clear(els.candidates);
  clear(els.results);
  setStatus(els.status, "");
  setBusy(els.searchBtn, false);
  lastTitle = null;
}, 350);
els.query.addEventListener("input", typeSearchMovies);

// ---------- Sports ----------

function slimTeam(t, league) {
  return {
    id: t.id,
    league: league.id,
    leagueLabel: league.label,
    displayName: t.displayName || t.name || "",
    shortDisplayName: t.shortDisplayName || t.displayName || "",
    abbreviation: t.abbreviation || "",
    location: t.location || "",
    logo: t.logos?.[0]?.href || "",
  };
}

// Team lists rarely change, so keep a slimmed copy for a week.
async function getAllTeams() {
  const { teamCache } = await chrome.storage.local.get("teamCache");
  const fresh = teamCache && Date.now() - teamCache.ts < TEAM_CACHE_TTL ? teamCache.data : {};
  const data = { ...fresh };

  const missing = LEAGUES.filter((l) => !data[l.id]);
  const results = await Promise.allSettled(
    missing.map(async (l) => {
      const res = await fetchJson(`${ESPN_API}/${l.id}/teams?limit=1000`, "ESPN");
      const teams = (res.sports?.[0]?.leagues?.[0]?.teams || []).map((t) => slimTeam(t.team, l));
      return [l.id, teams];
    })
  );
  results.forEach((r) => {
    if (r.status === "fulfilled") data[r.value[0]] = r.value[1];
  });
  if (missing.length && Object.keys(data).length > Object.keys(fresh).length) {
    chrome.storage.local.set({ teamCache: { ts: Object.keys(fresh).length ? teamCache.ts : Date.now(), data } });
  }
  if (!Object.keys(data).length) throw results[0].reason;
  return LEAGUES.flatMap((l) => data[l.id] || []);
}

function matchTeams(teams, query) {
  const q = query.toLowerCase();
  const rank = (t) => LEAGUES.findIndex((l) => l.id === t.league);
  return teams
    .filter((t) =>
      [t.displayName, t.shortDisplayName, t.abbreviation, t.location]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q))
    )
    .sort((a, b) => {
      const aExact = a.shortDisplayName.toLowerCase() === q || a.abbreviation.toLowerCase() === q;
      const bExact = b.shortDisplayName.toLowerCase() === q || b.abbreviation.toLowerCase() === q;
      if (aExact !== bExact) return aExact ? -1 : 1;
      if (a.displayName.length !== b.displayName.length) return a.displayName.length - b.displayName.length;
      return rank(a) - rank(b);
    });
}

async function getNextGame(league, teamId) {
  // ESPN's soccer schedule only lists played matches unless asked for fixtures.
  const qs = league.startsWith("soccer/") ? "?fixture=true" : "";
  const data = await fetchJson(`${ESPN_API}/${league}/teams/${teamId}/schedule${qs}`, "ESPN");
  const now = Date.now();
  return (
    (data.events || [])
      .filter((e) => new Date(e.date).getTime() >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null
  );
}

const teamKey = (t) => `${t.league}:${t.id}`;
const isFav = (t) => settings.favTeams.some((f) => teamKey(f) === teamKey(t));

function toggleFav(team) {
  settings.favTeams = isFav(team)
    ? settings.favTeams.filter((f) => teamKey(f) !== teamKey(team))
    : [...settings.favTeams, team];
  chrome.storage.local.set({ favTeams: settings.favTeams });
  renderFavorites();
}

function renderFavorites() {
  const box = document.getElementById("favTeams");
  box.innerHTML = "";
  const show = settings.favTeams.length && !els.team.value.trim();
  box.classList.toggle("hidden", !show);
  if (!show) return;
  const label = document.createElement("div");
  label.className = "label";
  label.textContent = "Pinned teams";
  const chips = document.createElement("div");
  chips.className = "fav-chips";
  settings.favTeams.forEach((t) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "fav-chip" + (currentTeam && teamKey(currentTeam) === teamKey(t) ? " active" : "");
    b.innerHTML = `<img src="${escapeHtml(t.logo)}" alt="" /><span>${escapeHtml(
      t.shortDisplayName || t.displayName
    )}</span><span class="lg">${escapeHtml(t.leagueLabel)}</span>`;
    b.addEventListener("click", () => {
      clear(els.sportsCandidates);
      showTeamResult(t);
    });
    chips.appendChild(b);
  });
  box.append(label, chips);
}

function renderSportsCandidates(teams, onPick) {
  clear(els.sportsCandidates);
  if (teams.length <= 1) return;

  els.sportsCandidates.classList.remove("hidden");
  teams.slice(0, 20).forEach((t) => {
    const btn = document.createElement("button");
    btn.className = "candidate";
    btn.innerHTML = `
      <img src="${escapeHtml(t.logo)}" alt="" style="object-fit:contain;" />
      <div class="meta">
        <span class="title">${escapeHtml(t.displayName)}</span>
        <span class="sub">${escapeHtml(t.leagueLabel)} · ${escapeHtml(t.abbreviation)}</span>
      </div>
    `;
    btn.addEventListener("click", () => {
      markActive(els.sportsCandidates, btn);
      onPick(t);
    });
    els.sportsCandidates.appendChild(btn);
  });
  els.sportsCandidates.firstElementChild?.classList.add("active");
}

function networkBadgeAbbr(name) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 5).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 5)
    .toUpperCase();
}

function serviceLabel(key) {
  return MY_SERVICES.find((s) => s.key === key)?.label || key;
}

function buildTeamHead(team) {
  const head = document.createElement("div");
  head.className = "team-head";
  head.innerHTML = `
    <img src="${escapeHtml(team.logo)}" alt="" />
    <div class="info">
      <div class="name">${escapeHtml(team.displayName)}</div>
      <div class="sub">${escapeHtml(team.leagueLabel)}</div>
    </div>
  `;
  const star = document.createElement("button");
  star.type = "button";
  star.className = "fav-btn" + (isFav(team) ? " on" : "");
  star.textContent = isFav(team) ? "★" : "☆";
  star.title = isFav(team) ? "Unpin team" : "Pin team";
  star.setAttribute("aria-label", star.title);
  star.addEventListener("click", () => {
    toggleFav(team);
    star.className = "fav-btn" + (isFav(team) ? " on" : "");
    star.textContent = isFav(team) ? "★" : "☆";
    star.title = isFav(team) ? "Unpin team" : "Pin team";
  });
  head.appendChild(star);
  return head;
}

// Which of the user's services typically carry the game's networks.
function buildCarryBanner(broadcasts) {
  const mine = expandServices(settings.myServices);
  const banner = document.createElement("div");

  if (!mine.size) {
    banner.className = "mine-banner no";
    banner.innerHTML = `Tell us which services you have and we'll show which of these you can watch. <a href="#" id="sportsBannerServices">Choose services →</a>`;
    banner.querySelector("a").addEventListener("click", (e) => {
      e.preventDefault();
      openServices();
    });
    return banner;
  }

  const watch = [];
  const needs = new Set();
  let unknown = 0;
  broadcasts.forEach((b) => {
    const name = b.media?.shortName || "";
    const carriers = carriersFor(name);
    if (!carriers) return void unknown++;
    const via = carriers.filter((k) => mine.has(k));
    if (via.length) watch.push(`${name} (${serviceLabel(via[0])})`);
    else carriers.slice(0, 3).forEach((k) => needs.add(serviceLabel(k)));
  });

  if (watch.length) {
    banner.className = "mine-banner yes";
    banner.textContent = `✓ You can typically watch this on: ${[...new Set(watch)].join(", ")}`;
  } else if (needs.size) {
    banner.className = "mine-banner no";
    banner.textContent = `Not on your services. Typically available through: ${[...needs].slice(0, 4).join(", ")}`;
  } else {
    banner.className = "mine-banner no";
    banner.textContent = "We can't tell if you get this one. Check your local listings.";
  }
  return banner;
}

let teamSeq = 0;

async function showTeamResult(team) {
  const seq = ++teamSeq;
  currentTeam = team;
  renderFavorites();
  clear(els.sportsResults);
  setStatus(els.sportsStatus, "Checking schedule…", false, true);

  try {
    const event = await getNextGame(team.league, team.id);
    if (seq !== teamSeq) return;
    els.sportsResults.innerHTML = "";
    els.sportsResults.appendChild(buildTeamHead(team));

    if (!event) {
      const none = document.createElement("div");
      none.className = "no-results";
      none.textContent = `No upcoming ${team.displayName} games on ESPN's schedule.`;
      els.sportsResults.appendChild(none);
      els.sportsResults.classList.remove("hidden");
      setStatus(els.sportsStatus, "");
      return;
    }

    const comp = event.competitions?.[0];
    const when = new Date(event.date).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const venue = comp?.venue?.fullName;
    const broadcasts = comp?.broadcasts || [];

    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <div class="matchup">${escapeHtml(event.name || event.shortName)}</div>
      <div class="when">${when}${venue ? " · " + escapeHtml(venue) : ""}</div>
    `;
    els.sportsResults.appendChild(card);

    if (!broadcasts.length) {
      const none = document.createElement("div");
      none.className = "no-results";
      none.textContent = "No broadcast info listed yet for this game.";
      els.sportsResults.appendChild(none);
    } else {
      els.sportsResults.appendChild(buildCarryBanner(broadcasts));
      const mine = expandServices(settings.myServices);

      broadcasts.forEach((b) => {
        const name = b.media?.shortName || "Unknown";
        const market = b.market?.type || "";
        const type = b.type?.shortName || "";
        const home = homeFor(name, NETWORK_HOMES);
        const abbr = home ? home[2] : networkBadgeAbbr(name);
        const via = (carriersFor(name) || []).filter((k) => mine.has(k));

        const row = document.createElement(home ? "a" : "div");
        row.className = "broadcast-row" + (via.length ? " owned" : "");
        if (home) {
          row.href = home[1];
          row.target = "_blank";
          row.rel = "noopener";
          row.title = `Opens ${name}`;
        }
        const tags = [market, type].filter(Boolean).join(" · ");
        row.innerHTML = `
          <span class="net-badge">${escapeHtml(abbr)}</span>
          <span class="broadcast-meta">
            <span class="name">${escapeHtml(name)}</span>
            <span class="tags">${escapeHtml(tags)}${
          via.length
            ? `${tags ? " · " : ""}<span class="via">✓ via ${escapeHtml(serviceLabel(via[0]))}</span>`
            : !carriersFor(name)
            ? `${tags ? " · " : ""}check local listings`
            : ""
        }</span>
          </span>
          ${home ? '<span class="nav-arrow">↗</span>' : ""}
        `;
        els.sportsResults.appendChild(row);
      });

      const caveat = document.createElement("div");
      caveat.className = "sports-caveat";
      caveat.textContent =
        "Based on typical carriage. Your local market, plan, or blackout rules may differ, and some networks need a cable/satellite login.";
      els.sportsResults.appendChild(caveat);
    }

    els.sportsResults.classList.remove("hidden");
    setStatus(els.sportsStatus, "");
  } catch (err) {
    if (seq === teamSeq) setStatus(els.sportsStatus, errorMessage(err), true);
  }
}

let sportsSeq = 0;

async function handleSportsSearch(e) {
  e?.preventDefault();
  const query = els.team.value.trim();
  if (!query) return;
  const seq = ++sportsSeq;

  renderFavorites();
  clear(els.sportsCandidates);
  clear(els.sportsResults);
  setStatus(els.sportsStatus, "Searching…", false, true);
  setBusy(els.sportsSearchBtn, true);

  try {
    const teams = await getAllTeams();
    if (seq !== sportsSeq) return;
    const matches = matchTeams(teams, query);
    if (matches.length === 0) {
      setStatus(els.sportsStatus, "No team found with that name.", true);
      return;
    }
    setStatus(els.sportsStatus, "");
    renderSportsCandidates(matches, showTeamResult);
    await showTeamResult(matches[0]);
  } catch (err) {
    if (seq === sportsSeq) setStatus(els.sportsStatus, errorMessage(err), true);
  } finally {
    if (seq === sportsSeq) setBusy(els.sportsSearchBtn, false);
  }
}

els.sportsForm.addEventListener("submit", handleSportsSearch);

const typeSearchSports = debounce(() => {
  const q = els.team.value.trim();
  if (q.length >= 2) return handleSportsSearch();
  sportsSeq++;
  teamSeq++;
  currentTeam = null;
  clear(els.sportsCandidates);
  clear(els.sportsResults);
  setStatus(els.sportsStatus, "");
  setBusy(els.sportsSearchBtn, false);
  renderFavorites();
}, 300);
els.team.addEventListener("input", () => {
  if (!els.team.value.trim()) renderFavorites();
  typeSearchSports();
});

// Reopen on the last-used tab. First launch asks which services the user has.
async function init() {
  await loadSettings();
  const saved = await chrome.storage.local.get(["lastTab", "servicesPrompted"]);
  switchTab(saved.lastTab === "sports" ? "sports" : "movies");
  chrome.storage.local.remove(["lastMovieQuery", "lastTeamQuery"]);
  renderFavorites();
  if (!saved.servicesPrompted) {
    chrome.storage.local.set({ servicesPrompted: true });
    openServices();
  }
}

init();
