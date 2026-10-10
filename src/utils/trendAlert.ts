// src/utils/trendAlert.ts
// Arithmetic-only trend detection: compares two adjacent, non-overlapping
// windows of recent history and flags a shift only when it clears the
// person's own noise floor (not a flat threshold), isn't driven by a single
// outlier entry, and hasn't already been shown for this same stretch.

export type TrendDirection = "up" | "down";

export type TrendResult = {
  direction: TrendDirection;
  recentAvg: number;
  priorAvg: number;
} | null;

const WINDOW = 4;
const MIN_TOTAL = WINDOW * 2;
const COOLDOWN_ENTRIES = 3;

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdev(values: number[]): number {
  const mean = average(values);
  return Math.sqrt(average(values.map((v) => (v - mean) ** 2)));
}

/**
 * values must be chronologically ascending (oldest first).
 * concernDirection is the only direction worth alerting on for this metric
 * (e.g. "down" for mood, "up" for screen time) — an improvement in the
 * other direction is never flagged.
 */
function detectTrend(
  values: number[],
  concernDirection: TrendDirection,
  absoluteFloor: number
): TrendResult {
  if (values.length < MIN_TOTAL) return null;

  const prior = values.slice(-MIN_TOTAL, -WINDOW);
  const recent = values.slice(-WINDOW);

  const priorAvg = average(prior);
  const recentAvg = average(recent);
  const diff = recentAvg - priorAvg;

  const direction: TrendDirection = diff > 0 ? "up" : "down";
  if (direction !== concernDirection) return null;

  // Adaptive noise floor: the shift has to clear this person's own recent
  // variance, not just a flat percentage — otherwise naturally noisy metrics
  // (screen time especially) trigger constantly.
  const noiseFloor = Math.max(stdev(recent), absoluteFloor);
  if (Math.abs(diff) <= noiseFloor) return null;

  // Guard against one bad/unusual night dragging the average on its own.
  const worseCount =
    concernDirection === "up"
      ? recent.filter((v) => v > priorAvg).length
      : recent.filter((v) => v < priorAvg).length;
  if (worseCount < 2) return null;

  return { direction, recentAvg, priorAvg };
}

type StoredAlertState = { direction: TrendDirection; entryCountAtShow: number };

function shouldShow(key: string, result: TrendResult, totalEntries: number): boolean {
  if (!result || typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const state = JSON.parse(raw) as StoredAlertState;
      const sameDirection = state.direction === result.direction;
      const tooSoon = totalEntries - state.entryCountAtShow < COOLDOWN_ENTRIES;
      if (sameDirection && tooSoon) return false;
    }
  } catch {
    // corrupt state shouldn't block the alert
  }
  return true;
}

function markShown(key: string, result: TrendResult, totalEntries: number): void {
  if (!result || typeof window === "undefined") return;
  const state: StoredAlertState = { direction: result.direction, entryCountAtShow: totalEntries };
  localStorage.setItem(key, JSON.stringify(state));
}

const MOOD_COOLDOWN_KEY = "nightcapMoodTrendAlert_v1";
const SCREENTIME_COOLDOWN_KEY = "nightcapScreenTimeTrendAlert_v1";

export function getMoodTrendAlert(
  logsAscending: { date: string; mood: number }[]
): TrendResult {
  const result = detectTrend(logsAscending.map((l) => l.mood), "down", 0.75);
  return shouldShow(MOOD_COOLDOWN_KEY, result, logsAscending.length) ? result : null;
}

export function markMoodTrendAlertShown(
  result: TrendResult,
  totalEntries: number
): void {
  markShown(MOOD_COOLDOWN_KEY, result, totalEntries);
}

export function getScreenTimeTrendAlert(
  logsAscending: { date: string; totalMs: number }[]
): TrendResult {
  const result = detectTrend(logsAscending.map((l) => l.totalMs), "up", 15 * 60 * 1000);
  return shouldShow(SCREENTIME_COOLDOWN_KEY, result, logsAscending.length) ? result : null;
}

export function markScreenTimeTrendAlertShown(
  result: TrendResult,
  totalEntries: number
): void {
  markShown(SCREENTIME_COOLDOWN_KEY, result, totalEntries);
}
