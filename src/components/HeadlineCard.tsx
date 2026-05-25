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

        const key = "M03lo3mDZHrtPmCyN8wm43gAWt7IDqIZj4LTrlUnkNHtFn78";
        const data = await fetch(
          `https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${key}`
        ).then(r => r.ok ? r.json() : { results: [] });

        const allowedSections = new Set(["World", "Technology", "Science", "Sports", "Business", "Health"]);
        const junkPattern = /newsletter|subscribe|sign up|sign-up|quiz|crossword|wordle|podcast/i;
        const seenTopics = new Set<string>();

        const articles: NewsItem[] = [];
        for (const a of (data.results || [])) {
          if (!a.title || !a.url || a.item_type !== "Article") continue;
          if (junkPattern.test(a.title)) continue;
          if (!allowedSections.has(a.section)) continue;

          const facets: string[] = [
            ...(a.des_facet || []),
            ...(a.geo_facet || []),
          ];

          const isDuplicate = facets.some(f => seenTopics.has(f));
          if (isDuplicate) continue;

          facets.forEach(f => seenTopics.add(f));
          articles.push({
            title: a.title,
            url: a.url,
            image: a.multimedia?.[0]?.url || null,
            publishedAt: a.published_date || "",
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
