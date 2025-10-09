import type { Daily } from "@/types";
import { getStaticContent } from "./getStatic";

async function getHeadlines() {
  // hard-code key so it always works in Android build
  const GNEWS_API_KEY = "d98739eb9b8ac50f63d3df46060dc55e";

  const url = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_API_KEY}&lang=en&country=us&max=5`;
  // proxy avoids CORS errors in WebView
  const proxy = "https://api.allorigins.win/raw?url=";

  try {
    const res = await fetch(`${proxy}${encodeURIComponent(url)}`, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Bad response");
    const data = await res.json();
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
