// src/components/MoodSlider.tsx
import React, { useEffect, useMemo, useState } from "react";
import { saveMoodForDate, getTodayMood, type MoodValue } from "../utils/moodStore";

type MoodEntry = { mood: MoodValue } | null;

/** Find yesterday's mood directly from localStorage without relying on moodStore exports. */
function getYesterdayMoodFromStorage(): MoodEntry {
  if (typeof window === "undefined") return null; // SSR guard
  try {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD

    // 1) Try the common key pattern first: mood-YYYY-MM-DD
    const direct = localStorage.getItem(`mood-${iso}`);
    if (direct) {
      try {
        const parsed = JSON.parse(direct);
        if (parsed && typeof parsed === "object" && "mood" in parsed) return parsed as MoodEntry;
        // some stores might save just a number
        const asNum = Number(direct);
        if (!Number.isNaN(asNum)) return { mood: asNum as MoodValue };
      } catch {
        const asNum = Number(direct);
        if (!Number.isNaN(asNum)) return { mood: asNum as MoodValue };
      }
    }

    // 2) Fallback: scan all keys for something that includes the date and looks like a mood entry
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (/mood/i.test(key) && key.includes(iso)) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object" && "mood" in parsed) return parsed as MoodEntry;
          const asNum = Number(raw);
          if (!Number.isNaN(asNum)) return { mood: asNum as MoodValue };
        } catch {
          const asNum = Number(raw);
          if (!Number.isNaN(asNum)) return { mood: asNum as MoodValue };
        }
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/* --- Inline SVG icons --- */
function Face({ kind, active }: { kind: MoodValue; active: boolean }) {
  const color = active ? "rgba(255,77,77,1)" : "rgba(231,236,255,0.4)";
  const glow = active ? "0 0 6px rgba(255,77,77,0.8)" : "none";

  const mouth = (() => {
    switch (kind) {
      case 1: return <path d="M7 18c3-5 11-5 14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />;
      case 2: return <path d="M8 17c2-3 8-3 10 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />;
      case 3: return <line x1="9" y1="17" x2="17" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
      case 4: return <path d="M8 16c2 2 6 2 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />;
      case 5: return <path d="M7 15c3 5 11 5 14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />;
      default: return null;
    }
  })();

  return (
    <svg
      viewBox="0 0 28 28"
      style={{ width: "40px", height: "40px", color, filter: `drop-shadow(${glow})` }}
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
  onComplete,
  showContinue = true,
}: {
  onComplete?: () => void;
  showContinue?: boolean;
}) {
  const initial = getTodayMood()?.mood ?? 3;
  const [value, setValue] = useState<MoodValue>(initial);

  // Persist selection immediately when the user changes it
  useEffect(() => {
    saveMoodForDate(value);
  }, [value]);
  

  // Subtle glow depending on mood
  const glow = useMemo(
    () => (value === 3 ? "0 0 20px rgba(255,255,255,0.15)" : "0 0 20px rgba(255,77,77,0.35)"),
    [value]
  );

  // Yesterday’s mood (client only)
  const yesterdayMood = useMemo(getYesterdayMoodFromStorage, []);

  return (
    <section>
      <header className="section-hero mood-hero">
        <div className="badge">
          {/* Polished neon-outline badge icon */}
          <svg
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "36px", height: "36px", filter: "drop-shadow(0 0 8px rgba(255,77,77,0.6))" }}
          >
            <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="2" fill="none" />
            <circle cx="18" cy="20" r="2" fill="#fff" />
            <circle cx="30" cy="20" r="2" fill="#fff" />
            <path d="M16 29c3 3 13 3 16 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {yesterdayMood ? (
          <h2 className="title">
            Yesterday you felt <Face kind={yesterdayMood.mood} active={true} /> — how about today?
          </h2>
        ) : (
          <h2 className="title">
            How are you <span className="accent-red">feeling</span> right now?
          </h2>
        )}
      </header>

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
    </section>
  );
}
