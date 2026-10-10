import type { StepLog } from "../utils/stepTracker";

const PLOT_WIDTH = 280;
const PLOT_HEIGHT = 80;
const MARGIN_TOP = 24;
const MARGIN_BOTTOM = 18;
// Calm, neutral color — deliberately not the screentime green/red good-bad scale,
// since there's no "good" or "bad" step count to signal here.
const BAR_COLOR = "#8ca0c4";
const REFERENCE_STEPS = 10000;
const REFERENCE_COLOR = "rgba(255,255,255,0.35)";
const GRIDLINE_COLOR = "rgba(255,255,255,0.08)";
const GRID_STEPS = [0, 5000];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatWeekday(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
}

function formatSteps(n: number): string {
  if (n < 1000) return `${n}`;
  const thousands = n / 1000;
  return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
}

export default function StepTrends({ logs }: { logs: StepLog[] }) {
  if (logs.length < 2) return null;

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const windowed = sorted.slice(-7);
  const maxSteps = Math.max(...windowed.map((e) => e.steps), 1);
  const scaleMax = Math.max(maxSteps, REFERENCE_STEPS);

  const barWidth = PLOT_WIDTH / windowed.length;
  const barGap = barWidth * 0.28;
  const vbHeight = MARGIN_TOP + PLOT_HEIGHT + MARGIN_BOTTOM;
  const referenceY = MARGIN_TOP + PLOT_HEIGHT - (REFERENCE_STEPS / scaleMax) * PLOT_HEIGHT;

  return (
    <div className="screentime-trends step-trends">
      <hr className="mood-trends-divider" />
      <svg
        viewBox={`0 0 ${PLOT_WIDTH} ${vbHeight}`}
        preserveAspectRatio="none"
        className="screentime-line-svg"
      >
        {/* faint scale gridlines — just for reading the bars against, no meaning attached */}
        {GRID_STEPS.map((steps) => {
          const gridY = MARGIN_TOP + PLOT_HEIGHT - (steps / scaleMax) * PLOT_HEIGHT;
          const labelY = steps === 0 ? gridY + 9 : gridY - 4;
          return (
            <g key={steps}>
              <line x1={0} y1={gridY} x2={PLOT_WIDTH} y2={gridY} stroke={GRIDLINE_COLOR} strokeWidth={1} />
              <text x={2} y={labelY} className="screentime-axis-label">
                {steps === 0 ? "0" : formatSteps(steps)}
              </text>
            </g>
          );
        })}

        {/* 10k reference line — context, not a target: bars don't change color
            based on it, it's just a familiar mark to place the numbers against. */}
        <line
          x1={0}
          y1={referenceY}
          x2={PLOT_WIDTH}
          y2={referenceY}
          stroke={REFERENCE_COLOR}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text x={2} y={referenceY - 4} className="screentime-axis-label">
          10k
        </text>

        {windowed.map((entry, i) => {
          const h = (entry.steps / scaleMax) * PLOT_HEIGHT;
          const x = i * barWidth + barGap / 2;
          const y = MARGIN_TOP + PLOT_HEIGHT - h;
          const w = barWidth - barGap;
          return (
            <g key={entry.date}>
              <rect x={x} y={y} width={w} height={Math.max(h, 2)} rx={3} fill={BAR_COLOR} opacity={0.75} />
              <text
                x={x + w / 2}
                y={Math.max(y - 4, 9)}
                textAnchor="middle"
                className="screentime-axis-label"
              >
                {formatSteps(entry.steps)}
              </text>
              <text
                x={x + w / 2}
                y={MARGIN_TOP + PLOT_HEIGHT + 13}
                textAnchor="middle"
                className="screentime-axis-label"
              >
                {formatWeekday(entry.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
