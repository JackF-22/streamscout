# StreamScout

A Chrome extension that shows where a movie, TV show, or live game is streaming — and whether it's on the services you already have.

- **Movies & TV** — search any title, see free / subscription / rent / buy options for your region (data from TMDB / JustWatch)
- **Sports** — NFL, NBA, MLB, NHL, WNBA, MLS, Premier League, college football & basketball; pin favorite teams (schedules from ESPN)
- **My Services** — tell it your subscriptions (including live TV) and it highlights what you can watch now
- Search as you type, light/dark mode with accent colors, swipe between tabs, `Alt/Option+Shift+S` to open

## Develop
Load the repo folder as an unpacked extension at `chrome://extensions`. The TMDB key lives in a small Cloudflare Worker (`proxy/`, see its README); set `PROXY_URL` in `popup/config.js`.

[Privacy policy](https://jackf-22.github.io/streamscout/privacy.html)

This product uses the TMDB API but is not endorsed or certified by TMDB. Not affiliated with ESPN or any league.
