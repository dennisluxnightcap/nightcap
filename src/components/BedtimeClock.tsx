import { useState } from "react";
import { minutesSinceNoon, type BedtimeLog } from "../utils/bedtimeTracker";

const RANGE_OPTIONS = [5, 10, 20] as const;
type Range = (typeof RANGE_OPTIONS)[number];

// Below this many real entries, a handful of dots on a dial doesn't say
// anything yet — show an encouraging message instead.
const MIN_ENTRIES_FOR_CHART = 5;

const VB = 220;
const CENTER = VB / 2;
const DOT_R = 82; // radius the night dots sit on
const ARC_R = 68; // radius of the min→max range band
const TICK_INNER_R = 86;
const TICK_OUTER_R = 92;
const LABEL_R = 101;

const ACCENT = "#8bb4ff";
const AVG_ACCENT = "#ffa94d";

// Every 3 hours, for dial context.
const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

function hourTickLabel(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}${period}`;
}

/** Angle (deg, 0 = top/midnight, clockwise) for an actual clock time. */
function angleFromDate(d: Date): number {
  return ((d.getHours() * 60 + d.getMinutes()) / 1440) * 360;
}

/** Angle for a noon-shifted minute value — left unwrapped (may exceed 360) so arc math stays monotonic; sin/cos handle the periodicity. */
function angleFromNoonShifted(noonMin: number): number {
  return ((noonMin + 720) / 1440) * 360;
}

function polar(r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER + r * Math.sin(rad), y: CENTER - r * Math.cos(rad) };
}

/** Middle value of noon-shifted minutes — resistant to one-off outlier nights, unlike a mean. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Converts a noon-shifted average/min/max back into a real clock-time label. */
function noonShiftedToClockLabel(noonMin: number): string {
  let actualMin = Math.round(noonMin + 720) % 1440;
  if (actualMin < 0) actualMin += 1440;
  const h24 = Math.floor(actualMin / 60);
  const m = actualMin % 60;
  const period = h24 < 12 ? "AM" : "PM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function BedtimeClock({ logs }: { logs: BedtimeLog[] }) {
  const [range, setRange] = useState<Range>(10);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (logs.length === 0) {
    return (
      <p className="history-label" style={{ opacity: 0.5, textAlign: "center" }}>
        Complete a few wind-downs to start tracking your bedtime pattern.
      </p>
    );
  }

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const windowed = sorted.slice(-range);
  const dates = windowed.map((e) => new Date(e.bedtime));

  const noonMins = dates.map(minutesSinceNoon);
  const avgNoonMin = median(noonMins);
  const minNoonMin = Math.min(...noonMins);
  const maxNoonMin = Math.max(...noonMins);

  const nowPt = polar(DOT_R, angleFromDate(new Date()));

  const arcStart = angleFromNoonShifted(minNoonMin);
  const arcEnd = angleFromNoonShifted(maxNoonMin);
  const arcSpan = arcEnd - arcStart;
  const arcStartPt = polar(ARC_R, arcStart);
  const arcEndPt = polar(ARC_R, arcEnd);
  const arcLargeFlag = arcSpan > 180 ? 1 : 0;

  const avgAngle = angleFromNoonShifted(avgNoonMin);
  const avgPt = polar(DOT_R, avgAngle);

  const active = activeIndex != null ? windowed[activeIndex] : null;
  const activeAngle = active ? angleFromDate(new Date(active.bedtime)) : 0;
  const activePt = active ? polar(DOT_R, activeAngle) : null;

  return (
    <div className="bedtime-clock">
      <p className="history-label">Your trends</p>

      <div className="bedtime-stats-row">
        <div className="bedtime-stat-tile">
          <span className="bedtime-stat-value">{windowed.length}</span>
          <span className="bedtime-stat-caption">Entries</span>
        </div>
        <div className="bedtime-stat-tile bedtime-stat-tile-avg">
          <span className="bedtime-stat-value bedtime-stat-value-avg">{noonShiftedToClockLabel(avgNoonMin)}</span>
          <span className="bedtime-stat-caption">Avg</span>
        </div>
        <div className="bedtime-stat-tile">
          <span className="bedtime-stat-value bedtime-stat-value-small">
            {noonShiftedToClockLabel(minNoonMin)}–{noonShiftedToClockLabel(maxNoonMin)}
          </span>
          <span className="bedtime-stat-caption">Range</span>
        </div>
      </div>

      {logs.length < MIN_ENTRIES_FOR_CHART ? (
        <p className="history-label" style={{ opacity: 0.5, textAlign: "center", marginTop: "0.4rem" }}>
          Check in a couple more nights to see your bedtime pattern take shape.
        </p>
      ) : (
        <>
          <div className="bedtime-range-toggle" role="group" aria-label="Chart range">
            {RANGE_OPTIONS.map((n) => (
              <button
                key={n}
                className={`bedtime-range-btn ${range === n ? "active" : ""}`}
                onClick={() => {
                  setRange(n);
                  setActiveIndex(null);
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="bedtime-clock-dial">
            <svg
              viewBox={`0 0 ${VB} ${VB}`}
              className="bedtime-clock-svg"
              onPointerLeave={() => setActiveIndex(null)}
            >
              {/* dial ring */}
              <circle cx={CENTER} cy={CENTER} r={TICK_INNER_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

              {/* hour ticks + labels */}
              {HOUR_TICKS.map((h) => {
                const angle = (h / 24) * 360;
                const inner = polar(TICK_INNER_R, angle);
                const outer = polar(TICK_OUTER_R, angle);
                const label = polar(LABEL_R, angle);
                return (
                  <g key={h}>
                    <line
                      x1={inner.x}
                      y1={inner.y}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth={1}
                    />
                    <text
                      x={label.x}
                      y={label.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="bedtime-axis-label"
                    >
                      {hourTickLabel(h)}
                    </text>
                  </g>
                );
              })}

              {/* range band: min -> max bedtime */}
              {arcSpan > 0.5 && (
                <path
                  d={`M${arcStartPt.x.toFixed(1)},${arcStartPt.y.toFixed(1)} A${ARC_R},${ARC_R} 0 ${arcLargeFlag} 1 ${arcEndPt.x.toFixed(1)},${arcEndPt.y.toFixed(1)}`}
                  fill="none"
                  stroke={ACCENT}
                  strokeOpacity={0.22}
                  strokeWidth={10}
                  strokeLinecap="round"
                />
              )}

              {/* night dots, semi-transparent so overlapping nights read as denser */}
              {windowed.map((entry) => {
                const pt = polar(DOT_R, angleFromDate(new Date(entry.bedtime)));
                return <circle key={entry.date} cx={pt.x} cy={pt.y} r={4} fill={ACCENT} fillOpacity={0.38} />;
              })}

              {/* average marker */}
              <circle cx={avgPt.x} cy={avgPt.y} r={6} fill="none" stroke={AVG_ACCENT} strokeWidth={2} />

              {/* live "right now" marker */}
              <circle
                cx={nowPt.x}
                cy={nowPt.y}
                r={5}
                fill={ACCENT}
                className="bedtime-now-ping"
              />
              <circle cx={nowPt.x} cy={nowPt.y} r={5} fill={ACCENT} className="bedtime-now-dot" />

              {/* active (tapped) dot */}
              {activePt && <circle cx={activePt.x} cy={activePt.y} r={6} fill="none" stroke="#fff" strokeWidth={1.5} />}

              {/* hit targets for tap */}
              {windowed.map((entry, i) => {
                const pt = polar(DOT_R, angleFromDate(new Date(entry.bedtime)));
                return (
                  <circle
                    key={`hit-${entry.date}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={12}
                    fill="transparent"
                    onPointerEnter={() => setActiveIndex(i)}
                    onPointerDown={() => setActiveIndex(i)}
                  />
                );
              })}

              {/* center label */}
              <text x={CENTER} y={CENTER - 4} textAnchor="middle" className="bedtime-center-value">
                {noonShiftedToClockLabel(avgNoonMin)}
              </text>
              <text x={CENTER} y={CENTER + 14} textAnchor="middle" className="bedtime-center-caption">
                avg bedtime
              </text>
            </svg>

            {active && (
              <div
                className="bedtime-tooltip"
                style={{
                  left: `${(activePt!.x / VB) * 100}%`,
                  top: `${(activePt!.y / VB) * 100}%`,
                }}
              >
                <span className="bedtime-tooltip-value">
                  {new Date(active.bedtime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
                <span className="bedtime-tooltip-date">{formatShortDate(active.date)}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
