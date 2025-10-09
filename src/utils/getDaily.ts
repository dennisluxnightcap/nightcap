import type { Daily } from "@/types";
import { getStaticContent } from "./getStatic";

async function getHeadlines() {
  try {
    // Fetch from your own proxy endpoint (works on both web + Android)
    const res = await fetch("https://nightcap-eta.vercel.app/api/news", {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Bad response");
    const data = await res.json();

    // Return just the article list (ignore metadata)
    return data.articles ?? [];
  } catch (err) {
    console.error("News fetch failed:", err);
    return [];
  }
}

export async function getDaily(d: Date = new Date()): Promise<Daily> {
  const articles = await getHeadlines();
  const staticContent = getStaticContent(d);

  return {
    summary: articles,
    feelGood: staticContent.feelGood,
    learn: staticContent.learn,
    story: staticContent.story,
    breathing: staticContent.breathing,
    brightspot: staticContent.brightspot,
    video: staticContent.video,
  };
}
