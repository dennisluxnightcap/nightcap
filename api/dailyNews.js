// /api/dailyNews.js — Guardian API

const RETURN_N_DEFAULT = 5;
const DEFAULT_TTL_HOURS = 6;

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
    if (out.some(b => titleSimilarity(a.title, b.title) >= 0.65)) continue;
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}

function buildGuardianURL(key) {
  const u = new URL("https://content.guardianapis.com/search");
  u.searchParams.set("api-key", key);
  u.searchParams.set("section", "world");
  u.searchParams.set("show-fields", "thumbnail,trailText");
  u.searchParams.set("order-by", "newest");
  u.searchParams.set("page-size", "50");          // fetch lots so we have room to filter
  return u.toString();
}

/* ---------- main handler ---------- */
export default async function handler(req, res) {
  const KEY = process.env.GUARDIAN_KEY || "6047c790-a24b-4dc3-9a9b-ab9fb70f0208";
  const RETURN_N = Math.max(1, Number(req.query.n || RETURN_N_DEFAULT));
  const wantImages = req.query.image === "1";
  const ttlHours = Number(process.env.NEWS_TTL_HOURS || DEFAULT_TTL_HOURS);
  const TTL_MS = ttlHours * 60 * 60 * 1000;

  if (Date.now() - LAST_OK.ts < TTL_MS && LAST_OK.items.length) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("x-cache", "mem-hit");
    return res.status(200).json({ items: LAST_OK.items.slice(0, RETURN_N) });
  }

  try {
    const r = await fetch(buildGuardianURL(KEY));
    if (!r.ok) throw new Error(`Guardian returned ${r.status}`);

    const j = await r.json();
    const raw = Array.isArray(j?.response?.results) ? j.response.results : [];

    // Only keep major global sections, no liveblogs
    const filtered = raw.filter(a => a.type !== "liveblog");

    const base = filtered.map(a => ({
      title: sanitizeTextForUI(a?.webTitle || ""),
      url: a?.webUrl || "",
      image: a?.fields?.thumbnail || null,
      publishedAt: a?.webPublicationDate || "",
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
