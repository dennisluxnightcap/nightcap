import React, { useEffect, useState } from "react";

type NewsItem = {
  title: string;
  url: string;
  image: string | null;
  publishedAt: string;
};

export default function HeadlineCard({ n = 5 }: { n?: number }) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr(null);

        const key = "6047c790-a24b-4dc3-9a9b-ab9fb70f0208";
        const url = `https://content.guardianapis.com/search?api-key=${key}&section=world&show-fields=thumbnail&order-by=newest&page-size=50`;
        const data = await fetch(url).then(r => r.ok ? r.json() : { response: { results: [] } });

        const results = data?.response?.results ?? [];
        const junkPattern = /briefing:|as it happened|\|\s*letters|europe live|monday briefing|tuesday briefing|wednesday briefing|thursday briefing|friday briefing/i;
        const regionalUrlPattern = /\/(australia-news|us-news|uk-news|canada|india|sport|culture|lifestyle|books|film|music|food|travel)\//;
        const stopWords = new Set(["about","after","against","around","before","between","could","first","great","large","might","other","since","still","their","there","these","those","under","until","where","which","while","would","years","being","police","murder","killed","attack","people","rights","deaths","report","claims","inside","taking","making","saying","called","latest","during","within","without","across","again","warned","guilty","fears","linked","unsolved","missing","charged","allegedly","attempting","tourists","tourist","driving","centre","summer","historic","global","former","senior","world"]);

        const getKeywords = (title: string) =>
          title.toLowerCase().split(/\W+/).filter(w => w.length > 5 && !stopWords.has(w));

        const MAX_AGE_MS = 26 * 60 * 60 * 1000; // 26 hours — keeps a big story from freezing on screen for days
        const now = Date.now();

        // Filter junk, stale, and no-image articles
        const clean = results.filter((a: any) =>
          a.webTitle && a.webUrl &&
          a.type !== "liveblog" &&
          !junkPattern.test(a.webTitle) &&
          !regionalUrlPattern.test(a.webUrl) &&
          a.fields?.thumbnail &&
          a.webPublicationDate &&
          now - new Date(a.webPublicationDate).getTime() <= MAX_AGE_MS
        );

        // Score each article by how many others in the pool share topic keywords
        const keywordSets = clean.map((a: any) => new Set(getKeywords(a.webTitle)));
        const scored = clean.map((a: any, i: number) => {
          let score = 0;
          for (let j = 0; j < keywordSets.length; j++) {
            if (i === j) continue;
            if ([...(keywordSets[i] as Set<string>)].some(w => (keywordSets[j] as Set<string>).has(w))) score++;
          }
          return { a, score };
        });

        // Sort by coverage score descending — most-covered stories surface first
        scored.sort((x: any, y: any) => y.score - x.score);

        // Dedup by keywords and pick top n
        const seenWords = new Set<string>();
        const articles: NewsItem[] = [];
        for (const { a } of scored) {
          const keywords = getKeywords(a.webTitle);
          if (keywords.some((w: string) => seenWords.has(w))) continue;
          keywords.forEach((w: string) => seenWords.add(w));
          articles.push({
            title: a.webTitle,
            url: a.webUrl,
            image: a.fields.thumbnail,
            publishedAt: a.webPublicationDate || "",
          });
          if (articles.length >= n) break;
        }

        if (!cancelled) setItems(articles);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load headlines");
          setItems([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [n]);

  // Loading skeletons
  if (items === null) {
    return (
      <div className="facts">
        {[...Array(n)].map((_, i) => (
          <div key={i} className="fact-card glow" aria-busy="true">
            <div
              className="headline-media skeleton"
              style={{
                height: 80,
                width: 80,
                borderRadius: 8,
                marginRight: 12,
              }}
            />
            <p className="headline" style={{ opacity: 0.6 }}>
              Loading headline…
            </p>
          </div>
        ))}
      </div>
    );
  }

  // Error or empty
  if (err || items.length === 0) {
    return (
      <div className="facts">
        <div className="fact-card glow">
          <p className="headline">Couldn’t load today’s headlines.</p>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="facts">
      {items.map((it, i) => (
        <div
          key={it.url || i}
          className={`fact-card glow variant-${i}`}
          onClick={() =>
            it.url && window.open(it.url, "_blank", "noopener,noreferrer")
          }
          role={it.url ? "link" : "group"}
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && it.url) {
              window.open(it.url, "_blank", "noopener,noreferrer");
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
        >
          {it.image && (
            <img
              src={it.image}
              alt={it.title}
              loading="lazy"
              style={{
                width: 80,
                height: 80,
                objectFit: "cover",
                borderRadius: 8,
                flexShrink: 0,
              }}
            />
          )}
          <p className="headline" style={{ flex: 1 }}>
            {it.title}
          </p>
        </div>
      ))}
    </div>
  );
}
