import { nightcapDateKey } from "./nightcapDay";

export type ScreenTimeLog = {
  date: string; // YYYY-MM-DD
  totalMs: number;
};

const KEY = "nightcapScreenTime_v1";

export function getScreenTimeLogs(): ScreenTimeLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScreenTimeLog[]) : [];
  } catch {
    return [];
  }
}

export function recordScreenTime(totalMs: number, date = new Date()): void {
  if (typeof window === "undefined") return;
  const logs = getScreenTimeLogs();
  const today = nightcapDateKey(date);

  const idx = logs.findIndex((e) => e.date === today);
  const entry: ScreenTimeLog = { date: today, totalMs };

  if (idx >= 0) {
    logs[idx] = entry;
  } else {
    logs.push(entry);
  }

  logs.sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(KEY, JSON.stringify(logs));
}

export function getScreenTimeAverage(logs: ScreenTimeLog[]): number {
  if (!logs.length) return 0;
  return logs.reduce((sum, e) => sum + e.totalMs, 0) / logs.length;
}

/** Consecutive-day logging streak, ending today (or yesterday if today isn't logged yet). */
export function getScreenTimeStreak(logs: ScreenTimeLog[] = getScreenTimeLogs()): number {
  if (!logs.length) return 0;
  const dates = new Set(logs.map((e) => e.date));
  const cursor = new Date();

  if (!dates.has(nightcapDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(nightcapDateKey(cursor))) return 0;
  }

  let streak = 0;
  while (dates.has(nightcapDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
