import React from "react";
import type { SummaryItem } from "@/types";

export default function HeadlineCard({ item }: { item: SummaryItem }) {
  const content = (
    <article className="summary-card">
      {item.image ? (
        <div className="thumb">
          <img src={item.image} alt="" loading="lazy" />
        </div>
      ) : null}

      <div className="meta">
        <h3 className="headline">{item.title}</h3>

        {item.description ? (
          <details className="fold">
            <summary className="fold-toggle">Quick summary</summary>
            <p className="fold-body">{item.description}</p>
          </details>
        ) : null}
      </div>
    </article>
  );

  return item.url ? (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="summary-link"
      aria-label={`Open: ${item.title}`}
    >
      {content}
    </a>
  ) : (
    content
  );
}
