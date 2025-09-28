// src/components/MoodSlider.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  saveMoodForDate,
  getTodayMood,
  getYesterdayMood,
  getMoodLogs,
  type MoodValue,
} from "../utils/moodStore";

/* --- Inline SVG icons --- */
function Face({ kind, active }: { kind: MoodValue; active: boolean }) {
  const color = active ? "rgba(255,77,77,1)" : "rgba(231,236,255,0.4)";
  const glow = active ? "0 0 6px rgba(255,77,77,0.8)" : "none";

  const mouth = (() => {
    switch (kind) {
      case 1:
        return <path d="M7 18c3-5 11-5 14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />;
      case 2:
        return <path d="M8 17c2-3 8-3 10 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />;
      case 3:
        return <line x1="9" y1="17" x2="17" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      case 4:
        return <path d="M8 16c2 2 6 2 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />;
      case 5:
        return <path d="M7 15c3 5 11 5 14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />;
      default:
        return null;
    }
  })();

  return (
    <svg
      viewBox="0 0 28 28"
      style={{
        width: "min(12vw, 40px)",
        height: "min(12vw, 40px)",
        color,
        filter: `drop-shadow(${glow})`,
      }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.6" fill="none" opacity={0.7} />
      <circle cx="11" cy="11" r="1.6" fill="currentColor" />
      <circle cx="17" cy="11" r="1.6" fill="currentColor" />
      {mouth}
    </svg>
  );
}

/* --- Mood scale meta --- */
const MOODS: { id: MoodValue; label: string }[] = [
  { id: 1, label: "Low" },
  { id: 2, label: "Down" },
  { id: 3, label: "Neutral" },
  { id: 4, label: "Good" },
  { id: 5, label: "Great" },
];

export default function MoodSlider({
  onNext,
  onPrev,
}: {
  onNext: () => void;
  onPrev?: () => void;
}) {
  const initial = getTodayMood()?.mood ?? 3;
  const [value, setValue] = useState<MoodValue>(initial);

  useEffect(() => {
    saveMoodForDate(value);
  }, [value]);

  const glow = useMemo(
    () =>
      value === 3
        ? "0 0 20px rgba(255,255,255,0.15)"
        : "0 0 20px rgba(255,77,77,0.35)",
    [value]
  );

  const yesterdayMood = getYesterdayMood();

  const logs = getMoodLogs();
  const history = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    return logs.find((e) => e.date === iso);
  });

  return (
    <section className="mood-section">
      {/* --- Header (outside any card) --- */}
      <div className="section-hero mood-hero">
        <div className="badge">
          <svg
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              width: "36px",
              height: "36px",
              filter: "drop-shadow(0 0 8px rgba(255,77,77,0.6))",
            }}
          >
            <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="2" fill="none" />
            <circle cx="18" cy="20" r="2" fill="#fff" />
            <circle cx="30" cy="20" r="2" fill="#fff" />
            <path d="M16 29c3 3 13 3 16 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {yesterdayMood ? (
          <h2 className="title">
            Yesterday you felt <Face kind={yesterdayMood.mood} active={true} /> – how about{" "}
            <span className="accent-red">today</span>?
          </h2>
        ) : (
          <h2 className="title">
            How are you <span className="accent-red">feeling</span> right now?
          </h2>
        )}
      </div>

      {/* --- Bubble card with content (only one card now) --- */}
      <div className="bubble-card">
        <div className="mood-row" style={{ boxShadow: glow }}>
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={`mood-btn ${value === m.id ? "active" : ""}`}
              onClick={() => setValue(m.id)}
              aria-label={m.label}
              title={m.label}
            >
              <Face kind={m.id} active={value === m.id} />
            </button>
          ))}
        </div>

        <div className="mood-history">
          <p className="history-label">How you’ve felt this week</p>
          <div className="history-row">
            {history.map((entry, i) => (
              <div key={i} className="history-face">
                {entry ? <Face kind={entry.mood} active={true} /> : <span className="placeholder">–</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Nav buttons (outside card) --- */}
      <div style={{ marginTop: 16 }}>
        <nav className="nav-buttons" aria-label="Card navigation">
          <button
            className="nav-btn primary"
            onClick={onPrev ? onPrev : undefined}
            aria-label="Back"
            disabled={!onPrev}
            title={onPrev ? "Back" : ""}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M16 19L8 12l8-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button className="nav-btn primary pulse" onClick={onNext} aria-label="Next" title="Next">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </nav>
      </div>
    </section>
  );
}
