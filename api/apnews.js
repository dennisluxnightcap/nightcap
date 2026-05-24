import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [["media:content", "mediaContent", { keepArray: false }]],
  },
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const feed = await parser.parseURL("https://apnews.com/hub/ap-top-news/rss");
    const articles = feed.items.slice(0, 10).map((item) => ({
      title: item.title || "",
      url: item.link || "",
      image: item.mediaContent?.$.url || item.enclosure?.url || null,
      publishedAt: item.pubDate || "",
    }));
    res.status(200).json({ articles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch AP News" });
  }
}
