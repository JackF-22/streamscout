# Chrome Web Store listing — StreamScout

**Name:** StreamScout
**Category:** Entertainment
**Language:** English

**Summary (≤132 chars):**
Find where any movie, show, or live game is streaming — free, subscription, rent or buy — and jump straight to it.

**Description:**
Stop hopping between apps to find where something is playing.

MOVIES & TV
• Search any title and see every service carrying it in your region
• Grouped by Free, Free with Ads, Subscription, Rent and Buy
• One click opens the service directly

SPORTS
• Type a team name — NFL, NBA, MLB, NHL, WNBA, MLS, Premier League and college football & basketball are searched automatically
• Pin your favorite teams for one-click access
• See the next game, which networks and apps are broadcasting it, and whether it's on a service you have

MY SERVICES
• Tell it which subscriptions you have (Netflix, Hulu, Peacock, YouTube TV, cable and more)
• Results highlight what you can watch right now, and a filter hides everything else

FAST
• Search as you type, open with Option/Alt+Shift+S, swipe to switch between Movies and Sports
• Light, dark or automatic mode with six accent colors
• Tell it which subscriptions you have and it highlights what you can watch right now
• Remembers your last tab
• No account and no setup

Privacy: no tracking, no ads, nothing collected. See the privacy policy.

Movie and TV data from TMDB; streaming availability from JustWatch via TMDB; sports data from ESPN. StreamScout is not endorsed or certified by TMDB, JustWatch, ESPN or any league.

## Single purpose
Help users find where a movie, TV show, or sports game is available to watch.

## Permission justifications
- **storage** — saves the user's region, last tab, chosen services, pinned teams, appearance, a cached team list, and an optional personal TMDB key locally.
- **Host: api.themoviedb.org** — searches titles and fetches streaming availability (used when the user supplies their own key).
- **Host: site.api.espn.com** — fetches team lists, schedules and broadcast networks.
- No remote code is executed; no data is collected.

## Data usage disclosures (Privacy tab)
Collects no user data categories. Certify: not sold, not used for unrelated purposes, not used for creditworthiness.

## Assets checklist
- [x] 128×128 icon (`icons/icon128.png`)
- [x] Screenshots 1280×800 (`docs/screenshots/1-…5-*.png`)
- [x] Small promo tile 440×280 (`docs/screenshots/promo-tile-440x280.png`)
- [x] Official TMDB logo (`icons/tmdb-logo.svg`) and attribution
- [x] `PROXY_URL` set in `popup/config.js`; proxy deployed with rate limiting
- [x] Upload package built: `../streamscout-1.0.0.zip` (extension files only)
- [ ] Privacy policy hosted at a public URL (`docs/privacy.html` is ready, e.g. GitHub Pages) and linked in the listing
- [ ] Support email / homepage URL entered in the listing
- [ ] Network-to-service map in `popup/services.js` reviewed
- [ ] Final click-through of the installed extension in Chrome
- [ ] Upload at chrome.google.com/webstore/devconsole ($5 one-time developer fee)
