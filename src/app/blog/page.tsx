import { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BlogContent from "./BlogContent";

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

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h1 className="text-5xl font-bold text-foreground mb-5">
              Islamic Guidance & Growth
            </h1>
            <p className="text-xl text-muted">
              Authentic articles grounded in hadith. All references cited.
            </p>
          </div>

          <BlogContent posts={posts} />
        </div>
      </main>
      <Footer />
    </>
  );
}
