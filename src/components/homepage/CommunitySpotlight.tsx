"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Heart, MessageCircle, Share2, CakeSlice } from "lucide-react";

const points = [
  "Dedicated dashboard for mosques, businesses & organizations",
  "Post structured events with photo, date, time and venue",
  "Followers get notified the moment you post a new event",
  "Send and accept collaboration requests with other communities",
];

export default function CommunitySpotlight() {
  return (
    <section className="relative py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-4">
              For mosques, businesses & creators
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-6">
              Reach your community,
              <br />
              not just your followers.
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Community accounts give mosques, halal businesses and Muslim
              creators a dedicated dashboard to post real events and reach
              local people who actually want to show up.
            </p>

            <div className="space-y-3 mb-10">
              {points.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  </div>
                  <p className="text-slate-500 text-sm">{point}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/signup-community"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors"
              >
                Create a community account
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/features#community"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all group"
              >
                Learn more
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Right — event card mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="glass-deep rounded-3xl overflow-hidden p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  CM
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-slate-900 truncate">Central Mosque Youth</p>
                    <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400">@centralmosqueyouth · 842 followers</p>
                </div>
              </div>

              <div className="glass-sm rounded-2xl p-5">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 mb-1">
                  <CakeSlice size={14} className="text-blue-500" /> Charity Bake Sale
                </p>
                <p className="text-xs text-slate-400 mb-4">Sat 14 March · 12–4 PM · Community Hall, Birmingham</p>
                <div className="flex items-center gap-5 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Heart size={13} /> 96</span>
                  <span className="flex items-center gap-1.5"><MessageCircle size={13} /> 14</span>
                  <span className="flex items-center gap-1.5"><Share2 size={13} /> 8</span>
                </div>
              </div>

              <p className="text-slate-400 text-xs mt-4 text-center">
                Followers see this the moment it&apos;s posted.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
