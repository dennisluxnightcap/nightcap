import React, { useState } from "react";
import type { Daily, SummaryItem } from "@/types";

const icons = ["🌍", "📈", "❤️", "✨", "🧠", "📰"];

function normalize(items: Daily["summary"]): SummaryItem[] {
  return items.map((it) =>
    typeof it === "string" ? { title: it } : it
  );
}

// favicon helper (nice automatic avatar if you don’t provide `image`)
function faviconFor(url?: string) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?sz=64&domain=${u.hostname}`;
  } catch {
    return undefined;
  }
}

export default function DailySummary({ items }: { items: Daily["summary"] }) {
  const list = normalize(items);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const onToggle = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlipped((f) => ({ ...f, [i]: !f[i] }));
  };

  const open = (url?: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section>
      <header className="section-hero summary-hero">
       <div className="badge">
  <img src="/icons/daily.png" alt="Daily recap" className="badge-icon" />
</div>

        <h2 className="title">
          A look back at <span className="accent">today</span>
        </h2>
      </header>

      {list.length ? (
        <div className="facts">
          {list.map((it, i) => {
            const showBack = !!flipped[i] && !!it.description;
            const thumb = it.image || faviconFor(it.url);
            return (
              <div
                key={i}
                className={`fact-card glow variant-${i}`}
                onClick={() => open(it.url)}
                role={it.url ? "link" : "group"}
                tabIndex={0}
              >
                <span
                  className={`icon ${i % 3 === 0 ? "blue" : i % 3 === 1 ? "green" : "pink"}`}
                  aria-hidden
                >
                  {thumb ? <img className="thumb" src={thumb} alt="" /> : icons[i % icons.length]}
                </span>

                {/* front/back content kept inside same pill */}
                <div className={`flip-surface ${showBack ? "flipped" : ""}`}>
                  <div className="front">
                    <p className="headline">{it.title}</p>
                  </div>
                  <div className="back">
                    <p className="summary">{it.description}</p>
                    {it.url && <span className="read-more">Open article →</span>}
                  </div>
                </div>

                {it.description && (
                  <button
  className={`mini-toggle ${showBack ? "open" : ""}`}
  onClick={(e) => onToggle(i, e)}
  aria-label={showBack ? "Hide summary" : "Show summary"}
  title={showBack ? "Hide summary" : "Show summary"}
/>

                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="facts">
          <div className="fact-card glow">
            <span className="icon">📝</span>
            <p>
              Put items under <code>"summary"</code> in{" "}
              <code>/public/content/daily/default.json</code>.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
