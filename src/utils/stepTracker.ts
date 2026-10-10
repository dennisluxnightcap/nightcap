import { nightcapDateKey } from "./nightcapDay";

export type StepLog = {
  date: string; // YYYY-MM-DD
  steps: number;
};

const KEY = "nightcapSteps_v1";

export function getStepLogs(): StepLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StepLog[]) : [];
  } catch {
    return [];
  }
}

export function recordSteps(steps: number, date = new Date()): void {
  if (typeof window === "undefined") return;
  const logs = getStepLogs();
  const today = nightcapDateKey(date);

  const idx = logs.findIndex((e) => e.date === today);
  const entry: StepLog = { date: today, steps };

  if (idx >= 0) {
    logs[idx] = entry;
  } else {
    logs.push(entry);
  }

  logs.sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(KEY, JSON.stringify(logs));
}
