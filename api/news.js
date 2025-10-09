// api/news.js

export default async function handler(req, res) {
  const GNEWS_API_KEY = "d98739eb9b8ac50f63d3df46060dc55e";
  const url = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_API_KEY}&lang=en&country=us&max=5`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch" });
  }
}
