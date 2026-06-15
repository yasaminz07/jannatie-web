import { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Heart, BookOpen, Shield, Users, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Our Story and Mission",
  description: "Learn about Jannatie, why we built it, and our commitment to authentic Islamic values.",
};

const values = [
  {
    icon: BookOpen,
    title: "Authentic knowledge",
    desc: "Every piece of Islamic content is sourced from authenticated texts — Sahih al-Bukhari, Sahih Muslim, and trusted scholars. We cite every hadith with its collection and number.",
  },
  {
    icon: Heart,
    title: "Compassion over guilt",
    desc: "We build with the understanding that growth is a journey, not a race. No red indicators, no shaming, no guilt. Just warm, consistent encouragement.",
  },
  {
    icon: Shield,
    title: "Privacy by design",
    desc: "We are UK GDPR compliant from day one. Your spiritual journey is personal — we never sell your data, never track you for ads, and never profit from your faith.",
  },
  {
    icon: Users,
    title: "Community, not competition",
    desc: "Our leaderboards celebrate collective mosque progress, not individual ranking. Islam is a community — we build tools that reflect that.",
  },
  {
    icon: Star,
    title: "Scholar-first",
    desc: "Every Islamic ruling, Fiqh guidance, and learning content is reviewed by a qualified Sunni scholar before it appears in the app. We hold ourselves to that standard always.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center py-16">
            <div className="arabic text-accent text-4xl mb-4">جنتي</div>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Our story
            </h1>
            <p className="text-xl text-muted leading-relaxed">
              Jannatie means &ldquo;My Paradise&rdquo; in Arabic. It was born from a simple
              question: why isn&apos;t there a beautiful, Islamic-values-driven app
              that actually helps Muslims grow?
            </p>
          </div>

          {/* Story */}
          <div className="prose prose-lg max-w-none mb-20">
            <div className="bg-card border border-border rounded-2xl p-10 mb-8">
              <p className="text-foreground leading-relaxed text-lg mb-5">
                We are a team of British Muslims who noticed the same frustration: the
                apps we used felt generic, disconnected from Islamic values, and
                often made us feel worse — not better — when we missed a prayer or
                fell behind on Quran.
              </p>
              <p className="text-muted leading-relaxed mb-5">
                Islam is not a list of boxes to tick. It is a living, breathing
                relationship with Allah ﷻ that is built through consistency, mercy,
                and knowledge. We built Jannatie to reflect that — warm encouragement
                instead of guilt, authentic knowledge instead of vague &ldquo;Islamic
                content&rdquo;, and a community that lifts each other up.
              </p>
              <p className="text-muted leading-relaxed">
                Every feature — the Habit Tracker, AI Buddy, Learning Game, Calendar,
                and Progress system — was designed with a single question in mind:
                <em> does this help someone get closer to Allah ﷻ?</em>
              </p>
            </div>

            <div className="bg-primary-50 border border-primary-500/20 rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-3">Our Islamic content charter</h2>
              <ul className="space-y-3 text-sm text-foreground leading-relaxed">
                <li>✅ All Islamic rulings reviewed by a qualified Sunni scholar before publishing</li>
                <li>✅ All hadith include collection name and number (e.g. Bukhari 1:1)</li>
                <li>✅ All duas include Arabic text, transliteration, and English translation</li>
                <li>✅ PBUH / ﷺ used after every mention of Prophet Muhammad</li>
                <li>✅ AI Buddy responses always include the guidance-only disclaimer</li>
                <li>✅ No content that could cause division between Muslim communities</li>
                <li>✅ Scholar verification badge shown on all reviewed AI responses</li>
              </ul>
            </div>
          </div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-foreground mb-10 text-center">Our values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {values.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-card border border-border rounded-2xl p-6">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={20} className="text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bismillah close */}
          <div className="text-center bg-foreground text-white rounded-2xl p-12">
            <div className="arabic text-accent text-4xl mb-4">وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ</div>
            <p className="text-gray-400 text-sm mb-4">
              &ldquo;And my success is not but through Allah.&rdquo; (Quran 11:88)
            </p>
            <p className="text-white text-base">
              We ask Allah ﷻ to accept this work and make it a means of benefit for
              the Ummah. Ameen.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
