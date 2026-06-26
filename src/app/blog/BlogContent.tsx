"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  hadith: string | null;
}

const categories = ["All", "Salah", "Quran", "Dhikr", "Habits", "Duas", "Seerah", "Fiqh"];

export default function BlogContent({ posts }: { posts: Post[] }) {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? posts : posts.filter((p) => p.category === active);

  return (
    <>
      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              active === cat
                ? "bg-slate-900 text-white border-slate-900"
                : "border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-slate-400 text-sm">
            No posts in this category yet. Check back soon!
          </div>
        ) : (
          filtered.map(({ slug, title, excerpt, category, date, readTime, hadith }) => (
            <Link
              key={slug}
              href={`/blog/${slug}`}
              className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="h-44 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <span className="arabic text-blue-400 text-4xl opacity-30">جنتي</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {category}
                  </span>
                  {hadith && <span className="text-xs text-slate-400">· {hadith}</span>}
                </div>
                <h2 className="font-bold text-slate-900 text-base leading-tight mb-3 group-hover:text-blue-600 transition-colors">
                  {title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4">{excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Calendar size={12} />
                  <span>{new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span>·</span>
                  <span>{readTime} read</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
