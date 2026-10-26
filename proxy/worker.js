// Cloudflare Worker: forwards a small, fixed set of read-only TMDB requests,
// adding the API key server-side so it never ships in the extension.
//   GET /search?query=...
//   GET /providers/{movie|tv}/{id}
// Secret: TMDB_API_KEY (wrangler secret put TMDB_API_KEY)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
};

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...extra },
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "GET") return json({ error: "method not allowed" }, 405);

    // Soft per-IP limit (120 requests/minute) using the edge cache as a counter.
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const bucket = new Request(`https://ratelimit.invalid/${ip}/${Math.floor(Date.now() / 60000)}`);
    const seen = await caches.default.match(bucket);
    const count = seen ? Number(await seen.text()) : 0;
    if (count >= 120) return json({ error: "rate limit exceeded" }, 429, { "Retry-After": "60" });
    ctx.waitUntil(
      caches.default.put(bucket, new Response(String(count + 1), { headers: { "Cache-Control": "max-age=60" } }))
    );

    const url = new URL(request.url);
    let target;

    if (url.pathname === "/search") {
      const query = (url.searchParams.get("query") || "").slice(0, 100);
      if (!query) return json({ error: "missing query" }, 400);
      target = new URL("https://api.themoviedb.org/3/search/multi");
      target.searchParams.set("include_adult", "false");
      target.searchParams.set("query", query);
    } else {
      const m = url.pathname.match(/^\/providers\/(movie|tv)\/(\d{1,10})$/);
      if (!m) return json({ error: "not found" }, 404);
      target = new URL(`https://api.themoviedb.org/3/${m[1]}/${m[2]}/watch/providers`);
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString());
    const hit = await cache.match(cacheKey);
    if (hit) return hit;

    target.searchParams.set("api_key", env.TMDB_API_KEY);
    const upstream = await fetch(target);
    const res = json(await upstream.json().catch(() => ({})), upstream.status, {
      "Cache-Control": upstream.ok ? "public, max-age=3600" : "no-store",
    });
    if (upstream.ok) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  },
};
