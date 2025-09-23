import type { Daily } from "@/types";
import { getStaticContent } from "./getStatic";

async function tryJson(path: string) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getDaily(d: Date = new Date()): Promise<Daily> {
  const daily = await tryJson(`/content/daily/default.json`);
  const staticContent = getStaticContent(d);

  return {
    summary: daily?.summary ?? [],
    feelGood: staticContent.feelGood,
    learn: staticContent.learn,
    story: staticContent.story,
    breathing: staticContent.breathing,
    brightspot: staticContent.brightspot, // ✅ included
  };
}

