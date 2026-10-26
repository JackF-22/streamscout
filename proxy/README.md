# StreamScout proxy

Keeps the TMDB API key off users' machines so the extension works with zero setup.

1. Get a TMDB API key (free): https://www.themoviedb.org/settings/api
2. `npm i -g wrangler && wrangler login`
3. `cd proxy && wrangler secret put TMDB_API_KEY` (paste the key)
4. `wrangler deploy` — note the URL it prints (https://streamscout-proxy.<you>.workers.dev)
5. Put that URL in `popup/config.js` as `PROXY_URL`.

Free Workers tier allows 100k requests/day; responses are cached for an hour.
Users who prefer their own key can still enter one in the extension's settings.
