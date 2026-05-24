// src/utils/getTodayHistory.ts
export async function getTodayHistory() {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wikipedia error: ${res.status}`);

    // Explicitly type the response shape
    const data: {
      events: {
        year: number | string;
        text: string;
        pages?: {
          thumbnail?: { source: string };
          content_urls: { desktop: { page: string } };
        }[];
      }[];
    } = await res.json();

    // Filter events with a thumbnail
    const events = data.events
      .filter((ev) => ev.pages?.some((p) => p.thumbnail))
      .slice(0, 5);

    // Pick one random event
    const ev = events[Math.floor(Math.random() * events.length)];
    if (!ev || !ev.pages?.length) throw new Error("No valid events");

    const page = ev.pages[0];
    return {
      year: ev.year,
      text: ev.text,
      image: page.thumbnail?.source || null,
      link: page.content_urls.desktop.page,
    };
  } catch (err) {
    console.error("Failed to fetch Today in History:", err);
    return null;
  }
}
