import type { Daily } from "@/types";

async function tryJson(path: string) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getDaily(): Promise<Daily> {
  // Always read default.json
  const daily = await tryJson(`/content/daily/default.json`);
  if (daily) return daily as Daily;

  // Fallback if file missing
  return {
    summary: [],
    feelGood: "",
    learn: "",
    breathing: { pattern: "4-7-8", rounds: 3 }
  } as Daily;
}
