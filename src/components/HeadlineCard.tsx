import { useEffect, useState } from "react";
import { getHeadlines, type Headline } from "../utils/getHeadlines";

const icons = ["🌍", "📈", "❤️", "✨", "🧠", "📰"];

function faviconFor(url?: string) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?sz=64&domain=${u.hostname}`;
  } catch {
    return undefined;
  }
}

export default function HeadlineCard() {
  const [items, setItems] = useState<Headline[] | null>(null);

  useEffect(() => {
    getHeadlines().then(setItems);
  }, []);

  if (items === null) {
    return (
      <div className="facts">
        <div className="fact-card glow">
          <span className="icon">📝</span>
          <p>Loading headlines…</p>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="facts">
        <div className="fact-card glow">
          <span className="icon">📝</span>
          <p>No headlines loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="facts">
      {items.map((it, i) => {
        const thumb = faviconFor(it.url);
        return (
          <div
            key={i}
            className={`fact-card glow variant-${i}`}
            onClick={() => it.url && window.open(it.url, "_blank", "noopener,noreferrer")}
            role={it.url ? "link" : "group"}
            tabIndex={0}
          >
            <span
              className={`icon ${i % 3 === 0 ? "blue" : i % 3 === 1 ? "green" : "pink"}`}
              aria-hidden
            >
              {thumb ? <img className="thumb" src={thumb} alt="" /> : icons[i % icons.length]}
            </span>
            <p className="headline">{it.title}</p>
          </div>
        );
      })}
    </div>
  );
}
