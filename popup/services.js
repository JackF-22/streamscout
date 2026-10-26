// Subscription services a user can say they own. `match` is tested against the
// provider name TMDB/JustWatch returns, so variants like "Netflix Standard with
// Ads" or "Paramount+ Amazon Channel" still count. Rent/buy stores (Amazon
// Video, Apple TV Store, ...) are deliberately not listed: owning an account
// there doesn't mean a title is included.
const MY_SERVICES = [
  { key: "netflix", label: "Netflix", match: /^netflix/i },
  { key: "prime", label: "Prime Video", match: /prime video/i },
  { key: "disney", label: "Disney+", match: /^disney/i },
  { key: "hulu", label: "Hulu", match: /^hulu(?!.*live)/i },
  { key: "max", label: "Max", match: /^(hbo )?max\b/i },
  { key: "appletv", label: "Apple TV+", match: /^apple tv(\+| plus)/i },
  { key: "peacock", label: "Peacock", match: /^peacock/i },
  { key: "paramount", label: "Paramount+", match: /^paramount(\+| plus)/i },
  { key: "espn", label: "ESPN+", match: /^espn/i },
  { key: "starz", label: "Starz", match: /^starz/i },
  { key: "showtime", label: "Showtime", match: /^showtime/i },
  { key: "amc", label: "AMC+", match: /^amc\+|^amc plus/i },
  { key: "mgm", label: "MGM+", match: /^mgm\+|^mgm plus/i },
  { key: "discovery", label: "Discovery+", match: /^discovery(\+| plus)/i },
  { key: "crunchyroll", label: "Crunchyroll", match: /^crunchyroll/i },
  { key: "britbox", label: "BritBox", match: /^britbox/i },
  { key: "shudder", label: "Shudder", match: /^shudder/i },
  { key: "youtubepremium", label: "YouTube Premium", match: /youtube premium/i },
  // Live TV: these carry the broadcast and cable channels sports air on.
  // They have no TMDB catalog of their own (match: null), except where noted.
  { key: "antenna", label: "Antenna (free local channels)", match: null, group: "live" },
  { key: "cable", label: "Cable / satellite", match: null, group: "live" },
  { key: "youtubetv", label: "YouTube TV", match: /^youtube tv/i, group: "live" },
  { key: "hulu_live", label: "Hulu + Live TV", match: /^hulu.*live/i, group: "live" },
  { key: "fubo", label: "Fubo", match: /^fubo/i, group: "live" },
  { key: "sling", label: "Sling TV", match: /^sling/i, group: "live" },
  { key: "foxone", label: "Fox One", match: /^fox one/i, group: "live" },
];

// Owning one of these also means owning the service it contains.
const IMPLIES = { hulu_live: ["hulu"] };

function expandServices(keys) {
  const set = new Set(keys);
  keys.forEach((k) => (IMPLIES[k] || []).forEach((i) => set.add(i)));
  return set;
}

function ownedServiceKey(providerName) {
  const svc = MY_SERVICES.find((s) => s.match && s.match.test(providerName));
  return svc ? svc.key : null;
}

// Which of the user's services typically carry a broadcast network. Based on
// general carriage, not the user's local market or plan, so the UI says
// "typically". Anything not matched here is shown as "check local listings".
const LOCAL_TV = ["antenna", "cable", "youtubetv", "hulu_live", "fubo"];
const CABLE_TV = ["cable", "youtubetv", "hulu_live", "fubo", "sling"];
const NETWORK_CARRIERS = [
  [/^abc$/i, LOCAL_TV],
  [/^cbs$/i, [...LOCAL_TV, "paramount"]],
  [/^nbc$/i, [...LOCAL_TV, "peacock"]],
  [/^fox$/i, [...LOCAL_TV, "foxone", "sling"]],
  [/^cw$/i, ["antenna", "cable", "youtubetv", "fubo"]],
  [/^espn[2u]?$|^espnews$|^sec network|^acc network|^longhorn/i, ["cable", "youtubetv", "hulu_live", "fubo", "espn"]],
  [/^espn\+/i, ["espn"]],
  [/^fs[12]$|^fox sports 1/i, [...CABLE_TV, "foxone"]],
  [/^(tnt|tbs|trutv)$/i, [...CABLE_TV, "max"]],
  [/^(usa net|usa network|cnbc|golf|btn|big ten)/i, CABLE_TV],
  [/^(nfl net|nfl network)/i, ["cable", "youtubetv", "hulu_live", "fubo"]],
  [/^(nba tv|mlb net|nhl net)/i, ["cable"]],
  [/^peacock/i, ["peacock"]],
  [/^prime video|^amazon/i, ["prime"]],
  [/^apple tv/i, ["appletv"]],
  [/^netflix/i, ["netflix"]],
  [/^disney\+/i, ["disney"]],
  [/^paramount\+/i, ["paramount"]],
  [/^(max|hbo max)$/i, ["max"]],
];

function carriersFor(networkName) {
  const hit = NETWORK_CARRIERS.find(([re]) => re.test(networkName));
  return hit ? hit[1] : null;
}
