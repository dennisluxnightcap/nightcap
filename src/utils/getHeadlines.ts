export type Headline = { title: string; url: string; source?: string; publishedAt?: string };

export async function getHeadlines(): Promise<Headline[]> {
  try {
    const res = await fetch("/api/dailyNews", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Accept both shapes: prod {items} and dev {articles}
    if (Array.isArray(data?.items)) return data.items as Headline[];
    if (Array.isArray(data?.articles)) {
      return data.articles.map((a: any) => ({
        title: a.title, url: a.url,
        source: a?.source?.name ?? "", publishedAt: a?.publishedAt ?? ""
      }));
    }
    return [];
  } catch {
    return [];
  }
}
