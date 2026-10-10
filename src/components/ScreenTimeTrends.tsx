import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
const GOOD_COLOR = "#34d399";
const BAD_COLOR = "#f87171";
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

/** Catmull-Rom-to-Bezier smoothed path through the given points, instead of straight segments. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length < 3) {
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  }
  const d = [`M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`);
  }
  return d.join(" ");
}

export default function ScreenTimeTrends({ logs }: { logs: ScreenTimeLog[] }) {
  const [range, setRange] = useState<Range>(7);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // This chart mounts while its "Good night" screen is still fading in over
  // several seconds — an instant-on-mount celebration would play, invisibly,
  // underneath that fade. Wait until the screen has actually settled in.
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCelebrate(true), 3000);
    return () => clearTimeout(t);
  }, []);

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

  // The "good zone": on or below your own average — the band gets a subtle
  // green wash, and any dot that lands in it (today's especially) turns green.
  const avgY = Math.max(MARGIN_TOP, Math.min(baselineY, baselineY - (avgMs / niceMaxMs) * PLOT_HEIGHT));
  const avgFraction = (avgY - MARGIN_TOP) / (baselineY - MARGIN_TOP);
  const isGood = (ms: number) => ms <= avgMs;

  const linePath = smoothPath(points);

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
                  <stop offset="0%" stopColor={GOOD_COLOR} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={GOOD_COLOR} stopOpacity="0.05" />
                </linearGradient>
                <linearGradient
                  id="screentimeLineGradient"
                  x1="0"
                  y1={MARGIN_TOP}
                  x2="0"
                  y2={baselineY}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset={Math.max(0, avgFraction - 0.15)} stopColor={BAD_COLOR} />
                  <stop offset={Math.min(1, avgFraction + 0.15)} stopColor={GOOD_COLOR} />
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

              {/* good zone: flat band below the average line */}
              <rect
                x={MARGIN_LEFT}
                y={avgY}
                width={PLOT_WIDTH}
                height={baselineY - avgY}
                fill="url(#screentimeAreaFill)"
              />
              {/* average reference line */}
              <line
                x1={MARGIN_LEFT}
                y1={avgY}
                x2={MARGIN_LEFT + PLOT_WIDTH}
                y2={avgY}
                stroke={GOOD_COLOR}
                strokeWidth={1}
                strokeDasharray="4 3"
                opacity={0.5}
              />
              {/* soft glow behind the line */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#screentimeLineGradient)"
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.25}
              />
              <path
                d={linePath}
                fill="none"
                stroke="url(#screentimeLineGradient)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* per-day dots */}
              {points.map((p) => (
                <circle
                  key={p.entry.date}
                  cx={p.x}
                  cy={p.y}
                  r={2.5}
                  fill={isGood(p.entry.totalMs) ? GOOD_COLOR : BAD_COLOR}
                  stroke="#0b0f1a"
                  strokeWidth={1.5}
                />
              ))}

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
                  <circle
                    cx={last.x}
                    cy={last.y}
                    r={4}
                    fill={isGood(last.entry.totalMs) ? GOOD_COLOR : BAD_COLOR}
                    stroke="#0b0f1a"
                    strokeWidth={2}
                  />
                  {isGood(last.entry.totalMs) && celebrate && (
                    <>
                      {/* bright flash */}
                      <motion.circle
                        cx={last.x}
                        cy={last.y}
                        fill={GOOD_COLOR}
                        initial={{ r: 4, opacity: 0.95 }}
                        animate={{ r: 34, opacity: 0 }}
                        transition={{ duration: 1.1, ease: "easeOut" }}
                      />
                      {/* two more rings, staggered for a rippling pulse */}
                      <motion.circle
                        cx={last.x}
                        cy={last.y}
                        fill="none"
                        stroke={GOOD_COLOR}
                        strokeWidth={2}
                        initial={{ r: 4, opacity: 0.9 }}
                        animate={{ r: 24, opacity: 0 }}
                        transition={{ duration: 1.3, delay: 0.15, ease: "easeOut" }}
                      />
                      <motion.circle
                        cx={last.x}
                        cy={last.y}
                        fill="none"
                        stroke={GOOD_COLOR}
                        strokeWidth={1.5}
                        initial={{ r: 4, opacity: 0.8 }}
                        animate={{ r: 30, opacity: 0 }}
                        transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
                      />
                      {/* sparkle particles bursting outward, two waves for a fuller firework */}
                      {Array.from({ length: 10 }).map((_, i) => {
                        const angle = (i / 10) * Math.PI * 2;
                        const dist = 26 + (i % 3) * 5;
                        return (
                          <motion.circle
                            key={`spark-a-${i}`}
                            r={2}
                            fill={i % 2 === 0 ? GOOD_COLOR : "#ffe08a"}
                            initial={{ cx: last.x, cy: last.y, opacity: 1 }}
                            animate={{
                              cx: last.x + Math.cos(angle) * dist,
                              cy: last.y + Math.sin(angle) * dist,
                              opacity: 0,
                            }}
                            transition={{ duration: 1.1, ease: "easeOut", delay: 0.05 + i * 0.02 }}
                          />
                        );
                      })}
                      {Array.from({ length: 8 }).map((_, i) => {
                        const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
                        const dist = 16;
                        return (
                          <motion.circle
                            key={`spark-b-${i}`}
                            r={1.4}
                            fill={i % 2 === 0 ? "#ffe08a" : GOOD_COLOR}
                            initial={{ cx: last.x, cy: last.y, opacity: 1 }}
                            animate={{
                              cx: last.x + Math.cos(angle) * dist,
                              cy: last.y + Math.sin(angle) * dist,
                              opacity: 0,
                            }}
                            transition={{ duration: 0.9, ease: "easeOut", delay: 0.35 + i * 0.02 }}
                          />
                        );
                      })}
                      {/* the dot itself, popping with a bit of overshoot on top of the static one */}
                      <motion.circle
                        cx={last.x}
                        cy={last.y}
                        fill={GOOD_COLOR}
                        stroke="#0b0f1a"
                        strokeWidth={2}
                        initial={{ r: 0 }}
                        animate={{ r: [0, 8, 4] }}
                        transition={{ duration: 0.7, times: [0, 0.55, 1], delay: 0.1, ease: "easeOut" }}
                      />
                    </>
                  )}
                </>
              )}

              {/* active (hovered/tapped) point */}
              {active && (
                <circle
                  cx={active.x}
                  cy={active.y}
                  r={4}
                  fill={isGood(active.entry.totalMs) ? GOOD_COLOR : BAD_COLOR}
                  stroke="#0b0f1a"
                  strokeWidth={2}
                />
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
