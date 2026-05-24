// src/utils/getDaily.ts
import type { Daily, HistoryEvent } from "@/types";
import { getStaticContent } from "./getStatic";

/* -----------------------
   Wikipedia API type helpers
   ----------------------- */
type WikiPage = {
  thumbnail?: { source: string };
  content_urls: { desktop: { page: string } };
};

type WikiEvent = {
  year: number | string;
  text: string;
  pages?: WikiPage[];
};

/* -----------------------
   Fetch news headlines
   ----------------------- */
async function getHeadlines() {
  try {
    const res = await fetch("https://nightcap-eta.vercel.app/api/dailyNews?n=5&image=1", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Bad response");
    const data = await res.json();
    return data.items ?? [];
  } catch (err) {
    console.error("News fetch failed:", err);
    return [];
  }
}

/* -----------------------
   Today in History (client-side)
   ----------------------- */
async function getHistory(): Promise<HistoryEvent[]> {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wikipedia error: ${res.status}`);
    const data: { events: WikiEvent[] } = await res.json();

    // Filter events with thumbnails and pick 3 random ones
    const events: HistoryEvent[] = data.events
      .filter((ev: WikiEvent) => ev.pages?.some((p) => p.thumbnail))
      .sort(() => Math.random() - 0.5) // shuffle
      .slice(0, 3)
      .map((ev: WikiEvent) => {
        const page = ev.pages![0];
        return {
          year: ev.year,
          text: ev.text,
          image: page.thumbnail?.source || null,
          link: page.content_urls.desktop.page,
        };
      });

    return events;
  } catch (err) {
    console.error("History fetch failed:", err);
    return [];
  }
}

/* -----------------------
   Build the Daily object
   ----------------------- */
export async function getDaily(d: Date = new Date()): Promise<Daily> {
  const [articles, history] = await Promise.all([
    getHeadlines(),
    getHistory(),
  ]);

  const staticContent = getStaticContent(d);

  return {
    summary: articles,
    history,
    feelGood: staticContent.feelGood,
    learn: staticContent.learn,
    story: staticContent.story,
    breathing: staticContent.breathing,
    brightspot: staticContent.brightspot,
    video: staticContent.video,
  };
}
