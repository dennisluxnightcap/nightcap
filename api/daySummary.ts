// /api/daySummary.ts
// @ts-nocheck
/**
 * Day Summary — calm, plain-language overview of today's news.
 * - Pulls Guardian (widened past world-only) + BBC World RSS
 * - Dedupes across both sources so they cross-check each other
 * - Sends the combined list to Claude, which judges what's actually
 *   significant and writes 2-4 calm sentences, each tagged to the real
 *   source article it's based on
 * - Refreshes once the user has crossed their own local 8pm (evening
 *   winddown time), using the IANA timezone the client reports via
 *   x-user-tz, plus a 12h floor so it also updates mid-day if checked
 *   both morning and evening. Falls back to UTC if no timezone is sent.
 * - This endpoint is public, so a shared client key (not real security,
 *   just filters out generic bots/scanners) gates whether a request is
 *   allowed to trigger a fresh, paid Claude call. Unrecognized requests
 *   just get back whatever's already cached, never force a new fetch.
 */
import Parser from "rss-parser";

const RESET_HOUR_LOCAL = 20; // 8pm
const MAX_STALENESS_MS = 12 * 60 * 60 * 1000; // 12h floor
const CLIENT_KEY = "nightcap-day-summary-2026";

/* ---------- local-midnight-style reset boundary (evening reset, per-user tz) ---------- */
function getUtcOffsetMinutes(timeZone, date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+0";
  const match = tzPart.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!match) return 0;
  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  return hours * 60 + (hours < 0 ? -minutes : minutes);
}

function getLocalDateParts(timeZone, date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const rawHour = get("hour");
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: rawHour === "24" ? 0 : Number(rawHour),
  };
}

// Most recent past-or-current local RESET_HOUR_LOCAL:00, as a UTC epoch ms.
function mostRecentResetBoundaryMs(timeZone, now) {
  const { year, month, day, hour } = getLocalDateParts(timeZone, now);
  const boundaryDate = new Date(Date.UTC(year, month - 1, day));
  if (hour < RESET_HOUR_LOCAL) {
    boundaryDate.setUTCDate(boundaryDate.getUTCDate() - 1);
  }
  const offsetMinutes = getUtcOffsetMinutes(timeZone, now);
  return (
    Date.UTC(
      boundaryDate.getUTCFullYear(),
      boundaryDate.getUTCMonth(),
      boundaryDate.getUTCDate(),
      RESET_HOUR_LOCAL,
      0,
      0
    ) -
    offsetMinutes * 60000
  );
}

function isCacheStale(lastFetchedTs, timeZone, now = new Date()) {
  if (Date.now() - lastFetchedTs > MAX_STALENESS_MS) return true;
  try {
    return lastFetchedTs < mostRecentResetBoundaryMs(timeZone, now);
  } catch {
    return lastFetchedTs < mostRecentResetBoundaryMs("UTC", now);
  }
}

const rssParser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
    ],
  },
});

globalThis._DAYSUMMARY_CACHE = globalThis._DAYSUMMARY_CACHE || { ts: 0, data: null };
let LAST_OK = globalThis._DAYSUMMARY_CACHE;
let ongoingFetch = null;

/* ---------- text helpers (same approach as dailyNews.js) ---------- */
const MAX_TITLE_LEN = 180;

function sanitizeTextForUI(s = "") {
  let t = s.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim();
  t = t
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
  return t.length > MAX_TITLE_LEN ? t.slice(0, MAX_TITLE_LEN - 1).trim() + "…" : t;
}

function normalizeTitle(t = "") {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function titleSimilarity(a, b) {
  const wa = normalizeTitle(a).split(" ");
  const wb = normalizeTitle(b).split(" ");
  const setA = new Set(wa);
  const setB = new Set(wb);
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const minLen = Math.min(setA.size, setB.size);
  return minLen === 0 ? 0 : intersection / minLen;
}

const JUNK_TITLE_PATTERN =
  /briefing:|as it happened|\|\s*letters|europe live|monday briefing|tuesday briefing|wednesday briefing|thursday briefing|friday briefing/i;

function dedupe(articles) {
  const out = [];
  for (const a of articles) {
    if (!a.title || !a.url) continue;
    if (JUNK_TITLE_PATTERN.test(a.title)) continue;
    if (out.some((b) => titleSimilarity(a.title, b.title) >= 0.65)) continue;
    out.push(a);
  }
  return out;
}

/* ---------- source fetchers ---------- */
async function fetchGuardian() {
  // Not reading process.env.GUARDIAN_KEY here: something set on Vercel returns
  // a 401 with it, while this key is proven working everywhere else in the app.
  const key = "6047c790-a24b-4dc3-9a9b-ab9fb70f0208";
  const u = new URL("https://content.guardianapis.com/search");
  u.searchParams.set("api-key", key);
  u.searchParams.set("section", "world|culture|science|sport|business|technology");
  u.searchParams.set("show-fields", "thumbnail");
  u.searchParams.set("order-by", "newest");
  u.searchParams.set("page-size", "40");

  const r = await fetch(u.toString());
  if (!r.ok) throw new Error(`Guardian returned ${r.status}`);
  const j = await r.json();
  const raw = Array.isArray(j?.response?.results) ? j.response.results : [];

  return raw
    .filter((a) => a.type !== "liveblog")
    .map((a) => ({
      source: "Guardian",
      title: sanitizeTextForUI(a?.webTitle || ""),
      url: a?.webUrl || "",
      image: a?.fields?.thumbnail || null,
    }));
}

async function fetchBBC() {
  const feed = await rssParser.parseURL("https://feeds.bbci.co.uk/news/world/rss.xml");
  return (feed.items || []).map((item) => ({
    source: "BBC",
    title: sanitizeTextForUI(item.title || ""),
    url: item.link || "",
    image: item.enclosure?.url || item.mediaThumbnail?.$?.url || item.mediaContent?.$?.url || null,
  }));
}

/* ---------- AI write-up ---------- */
async function writeSummary(articles) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const list = articles.map((a, i) => `${i}. [${a.source}] ${a.title}`).join("\n");

  const prompt = `Here is a list of today's news articles from two independent outlets (Guardian and BBC), across world, culture, science, sport, business, and technology:

${list}

Write a calm, plain-language overview of what actually happened today, for a bedtime winddown app — the opposite of alarming or sensational news framing.

Rules:
- 2-4 short, distinct items. Each item is one plain sentence (not headline-style) about a genuinely significant event of the day.
- Judge significance yourself from the content — don't just repeat whatever is most frequent. A story reported independently by both outlets is A SIGNAL, not proof, of significance — Guardian and BBC are both British outlets, so they will naturally both cover UK-domestic stories (energy bills, cost of living, UK government policy, UK economic data) simply because they share a British audience, not because those stories are globally important. Do not include a UK-domestic policy/economic story just because both outlets ran it. Prioritize events with real global, cross-border, or human-stakes significance (disasters, conflict, major international developments) over domestic British news coverage.
- Lead with anything genuinely new. Treat ongoing/continuing situations (a war, a trial, a long-running crisis) as one brief mention rather than dwelling on them.
- Do NOT force in a positive or "lighter" item if nothing genuinely light happened — only include one if it's actually among the day's real, significant events.
- For each item, set sourceIndex to the number of the article (from the list above) it's primarily based on.
- For each item, set keyPhrase to a short phrase (a few words), copied verbatim from that item's own text, that a reader would want to click through to read more about. It must read naturally as part of the sentence.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    sourceIndex: { type: "integer" },
                    keyPhrase: { type: "string" },
                  },
                  required: ["text", "sourceIndex", "keyPhrase"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (data.stop_reason === "refusal" || !data.content?.[0]?.text) {
    throw new Error("Claude refused or returned no content");
  }

  const parsed = JSON.parse(data.content[0].text);
  return Array.isArray(parsed.items) ? parsed.items : [];
}

/* ---------- combine + cache ---------- */
async function buildDaySummary() {
  const [guardian, bbc] = await Promise.all([
    fetchGuardian().catch(() => []),
    fetchBBC().catch(() => []),
  ]);

  const combined = dedupe([...guardian, ...bbc]);
  if (combined.length === 0) {
    LAST_OK = globalThis._DAYSUMMARY_CACHE = { ts: Date.now(), data: { items: [] } };
    return;
  }

  const aiItems = await writeSummary(combined);

  const items = aiItems
    .map((it) => {
      const article = combined[it.sourceIndex];
      if (!article) return null;
      const keyPhrase = it.keyPhrase && it.text?.includes(it.keyPhrase) ? it.keyPhrase : null;
      return { text: it.text, keyPhrase, sourceUrl: article.url, image: article.image };
    })
    .filter(Boolean);

  LAST_OK = globalThis._DAYSUMMARY_CACHE = { ts: Date.now(), data: { items } };
}

/* ---------- handler ---------- */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const userTz = req.headers["x-user-tz"] || "UTC";
  const ttlExpired = isCacheStale(LAST_OK.ts, userTz);

  if (!ttlExpired && LAST_OK.data) {
    res.setHeader("x-cache", "mem-hit");
    return res.status(200).json(LAST_OK.data);
  }

  // Cache is stale. Only a request carrying the app's own key is allowed to
  // trigger a fresh (paid) fetch -- anything else just gets what's cached,
  // even if stale, so a bot/scanner/monitor hitting this public URL can
  // never itself force a new Claude call.
  if (req.headers["x-client-key"] !== CLIENT_KEY) {
    res.setHeader("x-cache", "stale-unauthorized");
    return res.status(200).json(LAST_OK.data || { items: [] });
  }

  if (!ongoingFetch) {
    ongoingFetch = buildDaySummary().finally(() => {
      ongoingFetch = null;
    });
  }

  try {
    await ongoingFetch;
  } catch (e) {
    console.error("daySummary error:", e);
    return res.status(200).json({ items: [], error: e.message });
  }

  res.status(200).json(LAST_OK.data || { items: [] });
}
