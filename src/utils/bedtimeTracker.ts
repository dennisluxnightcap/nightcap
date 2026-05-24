// src/utils/bedtimeTracker.ts
export type BedtimeLog = {
  date: string;   // YYYY-MM-DD
  bedtime: string; // ISO string for the time
  ts: number;     // epoch ms
};

const KEY = "nightcapBedtimes_v1";

function localISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
  const today = localISO(date);

  const idx = logs.findIndex((e) => e.date === today);
  const newEntry: BedtimeLog = { date: today, bedtime: date.toISOString(), ts: now };

  if (idx >= 0) {
    logs[idx] = newEntry; // overwrite today's entry
  } else {
    logs.push(newEntry);
  }

  // Keep only last 7 entries, newest first
  logs.sort((a, b) => b.ts - a.ts);
  const trimmed = logs.slice(0, 7);

  localStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function getBedtimeHistory(): Date[] {
  return getBedtimeLogs()
    .map((e) => new Date(e.bedtime))
    .sort((a, b) => b.getTime() - a.getTime());
}
