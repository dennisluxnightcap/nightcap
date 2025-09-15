// /api/dailyNews.ts
// @ts-nocheck
export default async function handler(req, res) {
  const KEY = process.env.GNEWS_KEY || "";
  if (!KEY) return res.status(500).json({ error: "Missing GNEWS_KEY" });

  const MAX_FETCH = 12;
  const RETURN_N = Number(req.query.n || 3);
  const requireImage = req.query.image === "1"; // pass ?image=1 if you want images only

  const WHITELIST = [
    "reuters.com",
    "apnews.com",
    "bbc.co.uk",
    "bbc.com",
    "theguardian.com",
    "nytimes.com",
    "washingtonpost.com",
    "aljazeera.com",
    "bloomberg.com",
    "politico.com",
    "france24.com",
    "axios.com"
  ];

  try {
    const topic = encodeURIComponent(req.query.topic || "world");
    const lang = encodeURIComponent(req.query.lang || "en");
    const api = new URL("https://gnews.io/api/v4/top-headlines");
    api.searchParams.set("lang", lang);
    api.searchParams.set("topic", topic);
    api.searchParams.set("max", String(MAX_FETCH));
    api.searchParams.set("token", KEY);

    const r = await fetch(api.toString(), { headers: { Accept: "application/json" } });
    if (!r.ok) return res.status(r.status).send(await r.text());
    const j = await r.json();
    const items = (j.articles || []).filter(Boolean);

    // helpers
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours
    function domainOf(u) {
      try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
    }
    function normalize(t) {
      return (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    }
    const STOP = new Set(["the","a","an","of","in","on","and","to","for","with","by","from","at","is","that","this","as","be"]);
    function wordsSet(text) {
      return new Set((text||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean).filter(w=>!STOP.has(w)));
    }

    // pipeline: whitelist, recency, optional image, required fields
    let cand = items
      .filter(a => a.title && a.url && a.publishedAt)
      .filter(a => {
        const urlDom = domainOf(a.url).toLowerCase();
        const srcName = (a.source && a.source.name || "").toLowerCase();
        return WHITELIST.some(d => urlDom.includes(d) || srcName.includes(d));
      })
      .filter(a => {
        const t = Date.parse(a.publishedAt);
        return !Number.isNaN(t) && t >= cutoff;
      })
      .filter(a => (requireImage ? !!a.image : true))
      .map(a => ({ title: a.title, url: a.url, image: a.image || null, publishedAt: a.publishedAt }));

    // newest-first
    cand.sort((x, y) => Date.parse(y.publishedAt) - Date.parse(x.publishedAt));

    // simple dedupe: exact normalized title + word-overlap filter
    const out = [];
    const seenNorm = new Set();
    for (const art of cand) {
      const norm = normalize(art.title);
      if (seenNorm.has(norm)) continue;

      let isDup = false;
      const wA = wordsSet(art.title);
      for (const chosen of out) {
        const wB = wordsSet(chosen.title);
        let inter = 0;
        for (const w of wA) if (wB.has(w)) inter++;
        const smaller = Math.min(wA.size || 1, wB.size || 1);
        if (smaller > 0 && inter / smaller >= 0.65) { isDup = true; break; }
      }
      if (isDup) continue;

      out.push(art);
      seenNorm.add(norm);
      if (out.length >= RETURN_N) break;
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ items: out });
  } catch (err) {
    console.error("dailyNews error", err);
    return res.status(500).json({ error: err?.message || "server error" });
  }
}
