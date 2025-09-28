// src/utils/moodStore.ts
export type MoodValue = 1 | 2 | 3 | 4 | 5;

export type MoodLog = {
  date: string;   // YYYY-MM-DD
  mood: MoodValue;
  ts: number;     // epoch ms
};

const KEY = "moodLogs_v1";

function localISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getMoodLogs(): MoodLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MoodLog[]) : [];
  } catch {
    return [];
  }
}

export function saveMoodForDate(mood: MoodValue, date = localISO()): MoodLog[] {
  if (typeof window === "undefined") return [];
  const now = Date.now();
  const logs = getMoodLogs();
  const idx = logs.findIndex((e) => e.date === date);
  if (idx >= 0) {
    logs[idx] = { date, mood, ts: now };
  } else {
    logs.push({ date, mood, ts: now });
  }
  localStorage.setItem(KEY, JSON.stringify(logs));
  return logs;
}

export function getTodayMood(): MoodLog | undefined {
  const today = localISO();
  return getMoodLogs().find((e) => e.date === today);
}

// ✅ NEW FUNCTION
export function getYesterdayMood(): MoodLog | undefined {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = localISO(d);
  return getMoodLogs().find((e) => e.date === yesterday);
}
