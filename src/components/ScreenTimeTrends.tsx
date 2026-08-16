import { useState } from "react";
import { formatDuration } from "../utils/screenTime";
import {
  getScreenTimeAverage,
  getScreenTimeStreak,
  type ScreenTimeLog,
} from "../utils/screenTimeTracker";

const RANGE_OPTIONS = [7, 14] as const;
type Range = (typeof RANGE_OPTIONS)[number];

// Below this many real entries, a line chart is just a couple of points —
// show an encouraging message instead until there's enough history to trend.
const MIN_ENTRIES_FOR_CHART = 3;

// Chart geometry: a plot area surrounded by margins for the y-axis (duration)
// and x-axis (date) labels.
const MARGIN_LEFT = 34;
const MARGIN_RIGHT = 6;
const MARGIN_TOP = 18; // room for the end-value label + dot
const MARGIN_BOTTOM = 20; // room for date labels
const PLOT_WIDTH = 280;
const PLOT_HEIGHT = 90;
const VB_WIDTH = MARGIN_LEFT + PLOT_WIDTH + MARGIN_RIGHT;
const VB_HEIGHT = MARGIN_TOP + PLOT_HEIGHT + MARGIN_BOTTOM;

// Candidate y-axis steps (minutes) — pick the smallest that keeps the axis to ~4 gridlines.
const Y_STEP_CANDIDATES_MIN = [15, 30, 60, 90, 120, 180, 240, 300, 360, 480, 600, 720, 900, 1080, 1260, 1440];
const MAX_LABEL_COUNT = 7;

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatWeekday(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
}

/** Smallest "nice" minute step that keeps the axis to at most 4 intervals above 0. */
function pickYStepMinutes(maxMinutes: number): number {
  for (const step of Y_STEP_CANDIDATES_MIN) {
    if (Math.ceil(maxMinutes / step) <= 4) return step;
  }
  return Y_STEP_CANDIDATES_MIN[Y_STEP_CANDIDATES_MIN.length - 1];
}

/** Evenly-spaced point indices to label on the x-axis (always includes first & last). */
function pickLabelIndices(n: number, maxLabels: number): number[] {
  if (n <= maxLabels) return Array.from({ length: n }, (_, i) => i);
  const idx = new Set<number>();
  for (let i = 0; i < maxLabels; i++) {
    idx.add(Math.round((i / (maxLabels - 1)) * (n - 1)));
  }
  return Array.from(idx).sort((a, b) => a - b);
}

export default function ScreenTimeTrends({ logs }: { logs: ScreenTimeLog[] }) {
  const [range, setRange] = useState<Range>(7);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (logs.length === 0) {
    return (
      <p className="history-label" style={{ opacity: 0.5, textAlign: "center" }}>
        Complete a few wind-downs to start seeing your trends.
      </p>
    );
  }

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const windowed = sorted.slice(-range);
  const avgMs = getScreenTimeAverage(windowed);
  const streak = getScreenTimeStreak(logs);

  const maxMs = Math.max(...windowed.map((e) => e.totalMs), 1);
  const yStepMin = pickYStepMinutes(maxMs / 60000);
  const niceMaxMin = Math.max(yStepMin, yStepMin * Math.ceil(maxMs / 60000 / yStepMin));
  const niceMaxMs = niceMaxMin * 60000;

  const yTicks = Array.from(
    { length: niceMaxMin / yStepMin + 1 },
    (_, i) => i * yStepMin
  );

  const points = windowed.map((entry, i) => {
    const x =
      windowed.length === 1
        ? MARGIN_LEFT + PLOT_WIDTH / 2
        : MARGIN_LEFT + (i / (windowed.length - 1)) * PLOT_WIDTH;
    const y = MARGIN_TOP + PLOT_HEIGHT - (entry.totalMs / niceMaxMs) * PLOT_HEIGHT;
    return { x, y, entry };
  });

  const baselineY = MARGIN_TOP + PLOT_HEIGHT;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${baselineY.toFixed(1)} ` +
        `L${points[0].x.toFixed(1)},${baselineY.toFixed(1)} Z`
      : "";

  const last = points[points.length - 1];
  const active = activeIndex != null ? points[activeIndex] : null;

  const bandWidth = points.length > 0 ? PLOT_WIDTH / points.length : PLOT_WIDTH;
  const xLabelIndices = pickLabelIndices(points.length, MAX_LABEL_COUNT);

  return (
    <div className="screentime-trends">
      <p className="history-label">Your trends</p>

      <div className="screentime-stats-row">
        <div className="screentime-stat-tile">
          <span className="screentime-stat-value">{windowed.length}</span>
          <span className="screentime-stat-caption">Entries</span>
        </div>
        <div className="screentime-stat-tile">
          <span className="screentime-stat-value">{formatDuration(avgMs)}</span>
          <span className="screentime-stat-caption">Avg</span>
        </div>
        <div className="screentime-stat-tile">
          <span className="screentime-stat-value">{streak}</span>
          <span className="screentime-stat-caption">Day streak</span>
        </div>
      </div>

      {logs.length < MIN_ENTRIES_FOR_CHART ? (
        <p className="history-label" style={{ opacity: 0.5, textAlign: "center", marginTop: "0.4rem" }}>
          Check in a couple more nights to see your screen time trend take shape.
        </p>
      ) : (
        <>
          <div className="screentime-range-toggle" role="group" aria-label="Chart range">
            {RANGE_OPTIONS.map((n) => (
              <button
                key={n}
                className={`screentime-range-btn ${range === n ? "active" : ""}`}
                onClick={() => {
                  setRange(n);
                  setActiveIndex(null);
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="screentime-line-chart">
            <svg
              viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
              preserveAspectRatio="none"
              className="screentime-line-svg"
              onPointerLeave={() => setActiveIndex(null)}
            >
              <defs>
                <linearGradient id="screentimeAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ce1e6" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#5ce1e6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* y gridlines + duration labels */}
              {yTicks.map((tickMin) => {
                const tickY = MARGIN_TOP + PLOT_HEIGHT - (tickMin / niceMaxMin) * PLOT_HEIGHT;
                return (
                  <g key={tickMin}>
                    <line
                      x1={MARGIN_LEFT}
                      y1={tickY}
                      x2={MARGIN_LEFT + PLOT_WIDTH}
                      y2={tickY}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={1}
                    />
                    <text
                      x={MARGIN_LEFT - 6}
                      y={tickY}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="screentime-axis-label"
                    >
                      {tickMin === 0 ? "0" : formatDuration(tickMin * 60000)}
                    </text>
                  </g>
                );
              })}

              {/* x date labels */}
              {xLabelIndices.map((i) => (
                <text
                  key={points[i].entry.date}
                  x={points[i].x}
                  y={baselineY + 14}
                  textAnchor="middle"
                  className="screentime-axis-label"
                >
                  {range === 7 ? formatWeekday(points[i].entry.date) : formatShortDate(points[i].entry.date)}
                </text>
              ))}

              <path d={areaPath} fill="url(#screentimeAreaFill)" stroke="none" />
              <path
                d={linePath}
                fill="none"
                stroke="#5ce1e6"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* end value label + end dot */}
              {last && (
                <>
                  <text
                    x={Math.min(last.x, VB_WIDTH - MARGIN_RIGHT)}
                    y={Math.max(last.y - 8, 10)}
                    textAnchor="end"
                    className="screentime-line-endlabel"
                  >
                    {formatDuration(last.entry.totalMs)}
                  </text>
                  <circle cx={last.x} cy={last.y} r={4} fill="#5ce1e6" stroke="#0b0f1a" strokeWidth={2} />
                </>
              )}

              {/* active (hovered/tapped) point */}
              {active && (
                <circle cx={active.x} cy={active.y} r={4} fill="#5ce1e6" stroke="#0b0f1a" strokeWidth={2} />
              )}

              {/* hit bands for hover/tap, one per point */}
              {points.map((p, i) => (
                <rect
                  key={p.entry.date}
                  x={MARGIN_LEFT + i * bandWidth}
                  y={0}
                  width={bandWidth}
                  height={VB_HEIGHT}
                  fill="transparent"
                  onPointerEnter={() => setActiveIndex(i)}
                  onPointerDown={() => setActiveIndex(i)}
                />
              ))}
            </svg>

            {active && (
              <div
                className="screentime-tooltip"
                style={{
                  left: `${(active.x / VB_WIDTH) * 100}%`,
                  top: `${(active.y / VB_HEIGHT) * 100}%`,
                }}
              >
                <span className="screentime-tooltip-value">{formatDuration(active.entry.totalMs)}</span>
                <span className="screentime-tooltip-date">{formatShortDate(active.entry.date)}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
