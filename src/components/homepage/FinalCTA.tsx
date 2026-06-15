"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="py-24 bg-primary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="arabic text-accent text-3xl mb-4">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
          <p className="text-xs text-muted mb-8">In the name of Allah, the Most Gracious, the Most Merciful</p>

          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
            Your deen deserves more than a reminder app.
            <span className="text-primary-500"> Start your journey today.</span>
          </h2>

          <p className="text-muted text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of Muslims building consistent habits, growing in
            knowledge, and earning reward every single day — with Jannatie.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary-500 text-white font-bold px-10 py-4 rounded-xl text-lg hover:bg-primary-600 hover:shadow-blue-glow hover:scale-[1.02] transition-all duration-150"
          >
            Create your free account →
          </Link>

          <p className="text-sm text-muted mt-5">
            No credit card. No commitment. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
