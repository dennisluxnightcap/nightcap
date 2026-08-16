import { useEffect, useState } from "react";

type DaySummaryItem = {
  text: string;
  keyPhrase: string | null;
  sourceUrl: string;
};

type DaySummaryData = {
  leadImage: string | null;
  items: DaySummaryItem[];
};

function renderItemText(item: DaySummaryItem, key: number) {
  const idx = item.keyPhrase ? item.text.indexOf(item.keyPhrase) : -1;

  if (idx === -1) {
    return <span key={key}>{item.text} </span>;
  }

  const before = item.text.slice(0, idx);
  const after = item.text.slice(idx + (item.keyPhrase as string).length);

  return (
    <span key={key}>
      {before}
      <a
        className="day-summary-link"
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {item.keyPhrase}
      </a>
      {after}{" "}
    </span>
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
          setData({ leadImage: null, items: [] });
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
        <p className="day-summary-skeleton-text">Looking back at today…</p>
      </div>
    );
  }

  // Error or empty
  if (err || data.items.length === 0) {
    return (
      <div className="day-summary-card">
        <p className="day-summary-empty">Not much to report from today.</p>
      </div>
    );
  }

  return (
    <div
      className={`day-summary-card ${data.leadImage ? "has-image" : ""}`}
      style={data.leadImage ? { backgroundImage: `url(${data.leadImage})` } : undefined}
    >
      {data.leadImage && <div className="day-summary-scrim" />}
      <p className="day-summary-text">
        {data.items.map((item, i) => renderItemText(item, i))}
      </p>
    </div>
  );
}
