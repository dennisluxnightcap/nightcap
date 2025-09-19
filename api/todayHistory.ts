// /api/todayHistory.ts
// @ts-nocheck
/**
 * Today in History (Wikipedia API)
 * - Pulls events for today's date
 * - Filters to items that have an image
 * - Caches in memory for NEWS_TTL_HOURS (default 12h)
 *
 * Env:
 * - NEWS_TTL_HOURS (optional, default 12)
 */

const RETURN_N_DEFAULT = 3;
const DEFAULT_TTL_HOURS = 12;

let LAST_OK = { ts: 0, items: [] as any[] };
let ongoingFetch: Promise<boolean> | null = null;

/* -----------------------
   Helpers
   ----------------------- */
function ttlExpired() {
  const ttlHrs = parseInt(process.env.NEWS_TTL_HOURS || "") || DEFAULT_TTL_HOURS;
  return (Date.now() - LAST_OK.ts) > ttlHrs * 3600 * 1000;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* -----------------------
   Fetch from Wikipedia
   ----------------------- */
async function fetchFromWikipedia() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wikipedia error: ${res.status}`);
  const data = await res.json();

  // Filter events with at least one thumbnail
  let events = data.events.filter(ev => ev.pages?.some(p => p.thumbnail));

  // Shuffle and keep top 5
  events = shuffleArray(events).slice(0, 5);

  LAST_OK = {
    ts: Date.now(),
    items: events.map(ev => {
      const page = ev.pages[0];
      return {
        year: ev.year,
        text: ev.text,
        image: page.thumbnail?.source || null,
        link: page.content_urls.desktop.page
      };
    })
  };

  return true;
}

/* -----------------------
   API Handler
   ----------------------- */
export default async function handler(req, res) {
  const n = parseInt(req.query.n || "") || RETURN_N_DEFAULT;

  if (!ttlExpired()) {
    return res.json(LAST_OK.items.slice(0, n));
  }

  if (!ongoingFetch) {
    ongoingFetch = fetchFromWikipedia().finally(() => {
      ongoingFetch = null;
    });
  }

  try {
    await ongoingFetch;
  } catch (err) {
    console.error(err);
  }

  res.json(LAST_OK.items.slice(0, n));
}
