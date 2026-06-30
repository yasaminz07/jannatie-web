export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

interface GNewsArticle {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  sourceName: string;
}

// In-memory cache — keeps us well under GNews's free 100 req/day tier even
// if many users open the Mosque page in the same hour. Resets on cold start.
let cache: { articles: NewsArticle[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ articles: [], configured: false });
  }

  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ articles: cache.articles, configured: true });
  }

  try {
    const q = encodeURIComponent("Islam OR Muslim OR mosque OR Ramadan OR Quran");
    const res = await fetch(
      `https://gnews.io/api/v4/search?q=${q}&lang=en&sortby=publishedAt&max=15&apikey=${apiKey}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) {
      // Serve stale cache rather than nothing if GNews is rate-limiting us
      if (cache) return NextResponse.json({ articles: cache.articles, configured: true });
      return NextResponse.json({ articles: [], configured: true });
    }
    const json = await res.json() as { articles: GNewsArticle[] };
    const articles: NewsArticle[] = (json.articles ?? []).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      image: a.image ?? null,
      publishedAt: a.publishedAt,
      sourceName: a.source?.name ?? "News",
    }));
    cache = { articles, fetchedAt: Date.now() };
    return NextResponse.json({ articles, configured: true });
  } catch {
    if (cache) return NextResponse.json({ articles: cache.articles, configured: true });
    return NextResponse.json({ articles: [], configured: true });
  }
}
