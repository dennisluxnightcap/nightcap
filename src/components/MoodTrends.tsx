import { useState } from "react";
import { getMoodAverage, getMoodStreak, type MoodLog, type MoodValue } from "../utils/moodStore";
import { Face } from "./MoodSlider";

const RANGE_OPTIONS = [10, 20] as const;
type Range = (typeof RANGE_OPTIONS)[number];

// Below this many real entries, the chart is just 1-2 skinny bars — show an
// encouraging message instead until there's enough history to look like a trend.
const MIN_ENTRIES_FOR_CHART = 3;

const MOOD_LABEL: Record<MoodValue, string> = {
  1: "Low",
  2: "Down",
  3: "Neutral",
  4: "Good",
  5: "Great",
};

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function MoodTrends({ logs }: { logs: MoodLog[] }) {
  const [range, setRange] = useState<Range>(10);

  if (logs.length === 0) {
    return (
      <p className="history-label" style={{ opacity: 0.5, textAlign: "center" }}>
        Check in most days to start seeing your trends.
      </p>
    );
  }

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const windowed = sorted.slice(-range);
  const avg = getMoodAverage(windowed);
  const roundedAvg = Math.min(5, Math.max(1, Math.round(avg))) as MoodValue;
  const streak = getMoodStreak(logs);

  return (
    <div className="mood-trends">
      <p className="history-label">Your trends</p>

      <div className="mood-stats-row">
        <div className="mood-stat-tile">
          <span className="mood-stat-value">{windowed.length}</span>
          <span className="mood-stat-caption">Entries</span>
        </div>
        <div className="mood-stat-tile">
          <Face kind={roundedAvg} active />
          <span className="mood-stat-caption">Avg mood</span>
        </div>
        <div className="mood-stat-tile">
          <span className="mood-stat-value">{streak}</span>
          <span className="mood-stat-caption">{streak === 1 ? "Day streak" : "Day streak"}</span>
        </div>
      </div>

      {logs.length < MIN_ENTRIES_FOR_CHART ? (
        <p className="history-label" style={{ opacity: 0.5, textAlign: "center", marginTop: "0.4rem" }}>
          Check in a couple more days to see your mood chart take shape.
        </p>
      ) : (
        <>
          <div className="mood-range-toggle" role="group" aria-label="Chart range">
            {RANGE_OPTIONS.map((n) => (
              <button
                key={n}
                className={`mood-range-btn ${range === n ? "active" : ""}`}
                onClick={() => setRange(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="mood-chart-scroll">
            <div className="mood-chart">
              {windowed.map((entry) => (
                <div
                  key={entry.date}
                  className="mood-bar-col"
                  title={`${formatShortDate(entry.date)} · ${MOOD_LABEL[entry.mood]}`}
                >
                  <div
                    className={`mood-bar mood-bar-${entry.mood}`}
                    style={{ height: `${(entry.mood / 5) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
