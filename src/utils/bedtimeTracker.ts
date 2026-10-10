// src/utils/bedtimeTracker.ts
import { nightcapDateKey } from "./nightcapDay";

export type BedtimeLog = {
  date: string;   // YYYY-MM-DD
  bedtime: string; // ISO string for the time
  ts: number;     // epoch ms
};

const KEY = "nightcapBedtimes_v1";

export function getBedtimeLogs(): BedtimeLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BedtimeLog[]) : [];
  } catch {
    return [];
  }
}

export function recordBedtime(date = new Date()): BedtimeLog[] {
  if (typeof window === "undefined") return [];
  const logs = getBedtimeLogs();
  const now = Date.now();
  const today = nightcapDateKey(date);

  const idx = logs.findIndex((e) => e.date === today);
  const newEntry: BedtimeLog = { date: today, bedtime: date.toISOString(), ts: now };

  if (idx >= 0) {
    logs[idx] = newEntry; // overwrite today's entry
  } else {
    logs.push(newEntry);
  }

  logs.sort((a, b) => b.ts - a.ts);
  localStorage.setItem(KEY, JSON.stringify(logs));
  return logs;
}

/** Most recent bedtime entry from before today — i.e. "last night," excluding the one just recorded for tonight. */
export function getPreviousBedtimeLog(logs: BedtimeLog[] = getBedtimeLogs()): BedtimeLog | undefined {
  const today = nightcapDateKey();
  return [...logs]
    .filter((e) => e.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function getBedtimeHistory(): Date[] {
  return getBedtimeLogs()
    .map((e) => new Date(e.bedtime))
    .sort((a, b) => b.getTime() - a.getTime());
}

/**
 * Minutes since noon (0-1439), wrapping the day so the "seam" falls at
 * noon instead of midnight. Real bedtimes cluster far from noon, so this
 * value is safe to average/compare with plain min/max — unlike raw
 * minutes-since-midnight, it never has to wrap across the range that
 * actually matters.
 */
export function minutesSinceNoon(d: Date): number {
  const mins = d.getHours() * 60 + d.getMinutes();
  return mins < 720 ? mins + 720 : mins - 720;
}
