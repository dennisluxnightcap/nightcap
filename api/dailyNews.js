// /api/dailyNews.js

const RETURN_N_DEFAULT = 5; // how many headlines to return
const DEFAULT_TTL_HOURS = 6; // cache for 6h (GNews free-tier friendly)

// keep memory cache across requests
globalThis._DAILYNEWS_CACHE = globalThis._DAILYNEWS_CACHE || { ts: 0, items: [] };
let LAST_OK = globalThis._DAILYNEWS_CACHE;

/* ---------- helpers ---------- */
const MAX_TITLE_LEN = 180;

function sanitizeTextForUI(s = "") {
  let t = s.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim();
  t = t
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
  return t.length > MAX_TITLE_LEN ? t.slice(0, MAX_TITLE_LEN - 1).trim() + "…" : t;
}

function normalizeTitle(t = "") {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/* ---------- blacklist ---------- */
const BLACKLIST = ["dailymail.co.uk", "mailonline.com"];

function isBlacklisted(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (/\.(ie)$/.test(host)) return true; // block .ie domains
    return BLACKLIST.some(bad => host.includes(bad));
  } catch {
    return false;
  }
}

/* ---------- dedupe ---------- */
function titleSimilarity(a, b) {
  const wa = normalizeTitle(a).split(" ");
  const wb = normalizeTitle(b).split(" ");
  const setA = new Set(wa);
  const setB = new Set(wb);
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const minLen = Math.min(setA.size, setB.size);
  return minLen === 0 ? 0 : intersection / minLen;
}

function dedupe(arr, limit, requireImage) {
  const out = [];
  for (const a of arr) {
    if (!a?.title || !a?.url) continue;
    if (requireImage && !a.image) continue;
    if (isBlacklisted(a.url)) continue;
    if (out.some(b => titleSimilarity(a.title, b.title) >= 0.65)) continue;
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}

/* ---------- build GNews URL ---------- */
function buildGNewsURL(key) {
  const u = new URL("https://gnews.io/api/v4/top-headlines");
  u.searchParams.set("token", key);
  u.searchParams.set("lang", "en");
  u.searchParams.set("topic", "world");
  u.searchParams.set("max", "15"); // fetch extra to allow for dedupe
  return u.toString();
}

/* ---------- main handler ---------- */
export default async function handler(req, res) {
  const KEY = process.env.GNEWS_KEY || "d98739eb9b8ac50f63d3df46060dc55e";
  const RETURN_N = Math.max(1, Number(req.query.n || RETURN_N_DEFAULT));
  const wantImages = req.query.image === "1";
  const ttlHours = Number(process.env.NEWS_TTL_HOURS || DEFAULT_TTL_HOURS);
  const TTL_MS = ttlHours * 60 * 60 * 1000;

  // use cache if still fresh
  if (Date.now() - LAST_OK.ts < TTL_MS && LAST_OK.items.length) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("x-cache", "mem-hit");
    return res.status(200).json({ items: LAST_OK.items.slice(0, RETURN_N) });
  }

  try {
    const r = await fetch(buildGNewsURL(KEY));
    if (!r.ok) throw new Error(`GNews returned ${r.status}`);

    const j = await r.json();
    const raw = Array.isArray(j?.articles) ? j.articles : [];

    const base = raw.map(a => ({
      title: sanitizeTextForUI(a?.title || ""),
      url: a?.url || "",
      image: a?.image || null,
      publishedAt: a?.publishedAt || "",
    }));

    const out = dedupe(base, RETURN_N, wantImages);
    LAST_OK = globalThis._DAILYNEWS_CACHE = { ts: Date.now(), items: out };

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ items: out });
  } catch (e) {
    console.error("dailyNews error:", e);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ items: [] });
  }
}
