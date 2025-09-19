// /api/dailyNews.ts
// @ts-nocheck
const RETURN_N_DEFAULT = 5; // show 5 instead of 3
const DEFAULT_TTL_HOURS = 6; // 6h TTL for free GNews plan

// Use globalThis so cache persists across hot reloads in dev
globalThis._DAILYNEWS_CACHE = globalThis._DAILYNEWS_CACHE || { ts: 0, items: [] };
let LAST_OK = globalThis._DAILYNEWS_CACHE;
let ongoingFetch: Promise<boolean> | null = null;

/* ---------- helpers ---------- */
const MAX_TITLE_LEN = 180;
function sanitizeTextForUI(s?: string | null) {
  if (!s) return "";
  let t = String(s).replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim();
  t = t
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
  return t.length > MAX_TITLE_LEN ? t.slice(0, MAX_TITLE_LEN - 1).trim() + "…" : t;
}
const normalizeTitle = (t: string) =>
  (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

/* ---------- blacklist ---------- */
const BLACKLIST = ["dailymail.co.uk", "mailonline.com"];
function isBlacklisted(url: string): boolean {
  return BLACKLIST.some(bad => url.includes(bad));
}

/* ---------- fuzzy dedupe ---------- */
function titleSimilarity(a: string, b: string): number {
  const wa = normalizeTitle(a).split(" ");
  const wb = normalizeTitle(b).split(" ");
  const setA = new Set(wa);
  const setB = new Set(wb);

  const intersection = [...setA].filter(w => setB.has(w)).length;
  const minLen = Math.min(setA.size, setB.size);

  return minLen === 0 ? 0 : intersection / minLen; // overlap coefficient
}

function dedupe(arr: any[], limit: number, requireImage: boolean) {
  const out: any[] = [];

  for (const a of arr) {
    if (!a?.title || !a?.url) continue;
    if (requireImage && !a.image) continue;
    if (isBlacklisted(a.url)) continue;

    const tooSimilar = out.some(b => {
      const sim = titleSimilarity(a.title, b.title);
      return sim >= 0.65; // overlap coefficient cutoff
    });

    if (tooSimilar) continue;

    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}

/* ---------- build GNews API URL ---------- */
function buildGNewsURL(key: string) {
  const u = new URL("https://gnews.io/api/v4/top-headlines");
  u.searchParams.set("token", key);
  u.searchParams.set("lang", "en");
  u.searchParams.set("topic", "world");
  u.searchParams.set("max", "15"); // fetch a bit more to allow for dedupe/blacklist
  return u.toString();
}

/* ---------- handler ---------- */
export default async function handler(req, res) {
  const KEY = process.env.GNEWS_KEY || "";
  const RETURN_N = Math.max(1, Number(req.query.n || RETURN_N_DEFAULT));
  const wantImages = req.query.image === "1";
  const debug = String(req.query.debug || "") === "1";

  const ttlHours = Number(process.env.NEWS_TTL_HOURS || DEFAULT_TTL_HOURS);
  const TTL_MS = Math.max(0, ttlHours) * 60 * 60 * 1000;

  // sanitize titles on way out
  const origJson = res.json.bind(res);
  res.json = (obj) => {
    if (obj && Array.isArray(obj.items)) {
      obj.items = obj.items.map(it => ({ ...it, title: sanitizeTextForUI(it.title || "") }));
    }
    return origJson(obj);
  };

  if (debug) {
    return res.status(200).json({
      hasKey: !!KEY,
      lastCacheTs: LAST_OK.ts,
      lastCacheCount: (LAST_OK.items || []).length,
      TTL_hours: ttlHours,
    });
  }

  // raw probe
  if (req.query.raw === "1") {
    if (!KEY) return res.status(200).json({ status: 200, used_url: null, results_len: 0, body: "no key" });
    try {
      const url = buildGNewsURL(KEY);
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      const txt = await r.text();
      let j: any = null; try { j = JSON.parse(txt); } catch {}
      const results = Array.isArray(j?.articles) ? j.articles : [];
      return res.status(200).json({
        status: r.status,
        used_url: url,
        results_len: results.length,
        body: j ?? txt.slice(0, 1000),
      });
    } catch (e) {
      return res.status(200).json({ status: 0, used_url: null, results_len: 0, body: String(e) });
    }
  }

  try {
    // serve fresh memory cache
    if (Date.now() - LAST_OK.ts < TTL_MS && LAST_OK.items.length) {
      res.setHeader("x-cache", "mem-hit-ttl-fresh");
      res.setHeader("Cache-Control", `s-maxage=${Math.floor(TTL_MS / 1000)}, stale-while-revalidate=600`);
      return res.status(200).json({ items: LAST_OK.items.slice(0, RETURN_N) });
    }

    if (!KEY) {
      res.setHeader("x-cache", "no-key");
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ items: [] });
    }

    if (ongoingFetch) {
      try { await ongoingFetch; } catch {}
    } else {
      ongoingFetch = (async () => {
        try {
          const url = buildGNewsURL(KEY);
          const r = await fetch(url, { headers: { Accept: "application/json" } });
          if (!r.ok) {
            console.warn("GNews non-OK:", r.status, await r.text().catch(() => ""));
            LAST_OK = { ts: Date.now(), items: [] };
            return false;
          }
          const j = await r.json().catch(() => ({}));
          const raw = Array.isArray(j?.articles) ? j.articles : [];

          const base = raw.map((a: any) => ({
            title: a?.title || "",
            url: a?.url || "",
            image: a?.image || null,
            publishedAt: a?.publishedAt || "",
          }));

          let out = dedupe(base, RETURN_N, wantImages);
         

          LAST_OK = globalThis._DAILYNEWS_CACHE = { ts: Date.now(), items: out };
          return true;
        } catch (e) {
          console.error("ongoingFetch error:", e);
          LAST_OK = globalThis._DAILYNEWS_CACHE = { ts: Date.now(), items: [] };
          return false;
        }
      })();

      try { await ongoingFetch; } catch {} finally { ongoingFetch = null; }
    }

    res.setHeader("Cache-Control", `s-maxage=${Math.floor(TTL_MS / 1000)}, stale-while-revalidate=600`);
    res.setHeader("x-cache", LAST_OK.items.length ? "miss-upstream-ok" : "miss-no-results");
    return res.status(200).json({ items: LAST_OK.items.slice(0, RETURN_N) });
  } catch (err) {
    console.error("dailyNews handler error:", err);
    res.setHeader("x-cache", "error");
    return res.status(200).json({ items: [] });
  }
}
