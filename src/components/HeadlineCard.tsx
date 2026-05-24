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

        const r = await fetch(url, { headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error(`Guardian ${r.status}`);
        const data = await r.json();

        const raw = Array.isArray(data?.response?.results) ? data.response.results : [];

        // Filter out liveblogs, map to NewsItem shape
        const articles: NewsItem[] = raw
          .filter((a: any) => a.type !== "liveblog")
          .map((a: any) => ({
            title: a.webTitle || "",
            url: a.webUrl || "",
            image: a.fields?.thumbnail || null,
            publishedAt: a.webPublicationDate || "",
          }))
          .slice(0, n);

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
