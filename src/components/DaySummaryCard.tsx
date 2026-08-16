import { useEffect, useState } from "react";

type DaySummaryItem = {
  text: string;
  keyPhrase: string | null;
  sourceUrl: string;
  image: string | null;
};

type DaySummaryData = {
  items: DaySummaryItem[];
};

function renderItemText(item: DaySummaryItem) {
  const idx = item.keyPhrase ? item.text.indexOf(item.keyPhrase) : -1;

  if (idx === -1) {
    return <p className="day-summary-row-text">{item.text}</p>;
  }

  const before = item.text.slice(0, idx);
  const after = item.text.slice(idx + (item.keyPhrase as string).length);

  return (
    <p className="day-summary-row-text">
      {before}
      <a
        className="day-summary-link"
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {item.keyPhrase}
      </a>
      {after}
    </p>
  );
}

export default function DaySummaryCard() {
  const [data, setData] = useState<DaySummaryData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr(null);
        const res = await fetch("https://nightcap-eta.vercel.app/api/daySummary");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "Failed to load today's summary");
          setData({ items: [] });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Loading
  if (data === null) {
    return (
      <div className="day-summary-card" aria-busy="true">
        <div className="day-summary-row">
          <p className="day-summary-row-text">Looking back at today…</p>
        </div>
      </div>
    );
  }

  // Error or empty
  if (err || data.items.length === 0) {
    return (
      <div className="day-summary-card">
        <div className="day-summary-row">
          <p className="day-summary-empty">Not much to report from today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="day-summary-card">
      {data.items.map((item, i) => (
        <div
          className={`day-summary-row ${i % 2 === 1 ? "reverse" : ""}`}
          key={i}
        >
          {item.image && (
            <div className="day-summary-thumb-wrap">
              <img className="day-summary-thumb" src={item.image} alt="" />
            </div>
          )}
          {renderItemText(item)}
        </div>
      ))}
    </div>
  );
}
