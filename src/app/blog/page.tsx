import { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Islamic Guidance & Growth",
  description: "Authentic Islamic articles, habit-building tips, and deen-growth guidance from Jannatie.",
};

const posts = [
  {
    slug: "virtues-of-fajr-prayer",
    title: "The Virtues of Fajr Prayer: What the Hadith Tell Us",
    excerpt:
      "The Prophet ﷺ said: 'Whoever prays Fajr is under the protection of Allah.' (Muslim 657). We explore the immense reward of beginning your day with Fajr.",
    category: "Salah",
    date: "2025-01-10",
    readTime: "5 min",
    hadith: "Muslim 657",
  },
  {
    slug: "building-quran-habit",
    title: "How to Build a Consistent Quran Habit (From One Page a Day)",
    excerpt:
      "The Prophet ﷺ said: 'The best of you are those who learn the Quran and teach it.' (Bukhari 5027). Practical steps to make Quran a daily non-negotiable.",
    category: "Quran",
    date: "2025-01-08",
    readTime: "7 min",
    hadith: "Bukhari 5027",
  },
  {
    slug: "power-of-morning-dhikr",
    title: "Morning Dhikr: The Prophetic Shield for Your Day",
    excerpt:
      "Abdullah ibn Khubaib (RA) reported that the Prophet ﷺ instructed him to recite Surah Ikhlas and the Mu'awwidhatain each morning. (Abu Dawud 5082). Here's how to make it a habit.",
    category: "Dhikr",
    date: "2025-01-05",
    readTime: "4 min",
    hadith: "Abu Dawud 5082",
  },
  {
    slug: "understanding-streak-in-islam",
    title: "Why Consistency in Worship Matters: The Islamic Case for Habit Streaks",
    excerpt:
      "Aisha (RA) reported: 'The most beloved deeds to Allah are those done regularly, even if small.' (Bukhari 6465). Why small, consistent acts beat occasional big ones.",
    category: "Habits",
    date: "2025-01-02",
    readTime: "6 min",
    hadith: "Bukhari 6465",
  },
  {
    slug: "importance-of-dua",
    title: "The Power of Dua: Your Direct Line to Allah ﷻ",
    excerpt:
      "The Prophet ﷺ said: 'Dua is worship.' (Tirmidhi 2969). Understanding why supplication is one of the most powerful acts a Muslim can perform.",
    category: "Duas",
    date: "2024-12-28",
    readTime: "5 min",
    hadith: "Tirmidhi 2969",
  },
  {
    slug: "seerah-lessons-for-modern-muslims",
    title: "5 Lessons from the Seerah Every Modern Muslim Should Know",
    excerpt:
      "The life of the Prophet ﷺ is the greatest teacher. Five practical wisdoms from the Seerah that apply directly to our challenges today.",
    category: "Seerah",
    date: "2024-12-20",
    readTime: "8 min",
    hadith: null,
  },
];

const categories = ["All", "Salah", "Quran", "Dhikr", "Habits", "Duas", "Seerah", "Fiqh"];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h1 className="text-5xl font-bold text-foreground mb-5">
              Islamic Guidance & Growth
            </h1>
            <p className="text-xl text-muted">
              Authentic articles grounded in hadith. All references cited.
            </p>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  cat === "All"
                    ? "bg-foreground text-white border-foreground"
                    : "border-border text-muted hover:border-primary-500 hover:text-primary-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Posts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(({ slug, title, excerpt, category, date, readTime, hadith }) => (
              <Link
                key={slug}
                href={`/blog/${slug}`}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary-500 hover:shadow-card-hover transition-all duration-200 group"
              >
                {/* Image placeholder */}
                <div className="h-44 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                  <span className="arabic text-primary-500 text-4xl opacity-30">جنتي</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                      {category}
                    </span>
                    {hadith && (
                      <span className="text-xs text-muted">· {hadith}</span>
                    )}
                  </div>
                  <h2 className="font-bold text-foreground text-base leading-tight mb-3 group-hover:text-primary-500 transition-colors">
                    {title}
                  </h2>
                  <p className="text-sm text-muted leading-relaxed line-clamp-3 mb-4">
                    {excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <Calendar size={12} />
                    <span>{new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                    <span>·</span>
                    <span>{readTime} read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
