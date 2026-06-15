import { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MessageCircle, BookOpen, CheckSquare, Calendar, TrendingUp, BadgeCheck, Shield, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Features — Everything for Your Deen",
  description: "Explore all 5 Jannatie features: AI Buddy, Habit Tracker, Learning Game, Islamic Calendar, and Progress tracking.",
};

const features = [
  {
    id: "ai-buddy",
    icon: MessageCircle,
    name: "AI Buddy",
    tagline: "Scholar-reviewed answers, available 24/7",
    description:
      "Ask any Islamic question and get answers grounded in Sahih Bukhari and Sahih Muslim. Every response includes the hadith collection name and number so you can verify it yourself.",
    bullets: [
      "Covers Fiqh, Aqeedah, Duas, and daily life questions",
      "Cites exact hadith: e.g. Bukhari 1:1, Muslim 705",
      "Scholar-verified badge on reviewed responses",
      "Clear disclaimer: guidance only, never a fatwa",
      "Free tier: 5 messages/day · Premium: unlimited",
    ],
    example: {
      question: "What is the reward for praying Fajr in congregation?",
      answer:
        "The Prophet ﷺ said: 'Whoever prays Fajr is under the protection of Allah.' (Muslim 657). And: 'The most burdensome prayers for the hypocrites are Isha and Fajr, but if they knew what reward they hold, they would attend them even crawling.' (Bukhari 657)",
    },
  },
  {
    id: "habits",
    icon: CheckSquare,
    name: "Habit Tracker",
    tagline: "Build consistency without guilt",
    description:
      "Track your daily Islamic practices with a system designed around positive reinforcement. No red streaks, no guilt trips — just steady, sustainable growth in your deen.",
    bullets: [
      "Categories: Salah, Quran, Dhikr, Fasting, Charity, Study, Good Deeds",
      "Streak counter with Streak Shield (one guilt-free skip/week)",
      "Weekly mini progress bars per habit",
      "Daily summary: '4 of 6 habits completed today'",
      "Completion message: 'Masha'Allah! All done for today ✨'",
    ],
    example: null,
  },
  {
    id: "learn",
    icon: BookOpen,
    name: "Learning Game",
    tagline: "Earn XP as your knowledge grows",
    description:
      "Gamified Islamic education covering Quran, Duas, Seerah, Fiqh, Arabic, Prophets, History and Manners. All content is sourced from authenticated texts with references.",
    bullets: [
      "8 topic areas with graded difficulty levels",
      "Each lesson earns XP — correct answers reward +10 XP",
      "Wrong answers show the correct one, no punishment",
      "All Quranic ayat cited with surah and verse number",
      "All hadith cited with collection and hadith number",
    ],
    example: null,
  },
  {
    id: "calendar",
    icon: Calendar,
    name: "Islamic Calendar",
    tagline: "Never miss an important date",
    description:
      "A community-powered Islamic calendar showing Hijri dates alongside Gregorian, mosque events, study circles, and personal Islamic milestones.",
    bullets: [
      "Hijri + Gregorian dual-date display",
      "Mosque events, study circles, community events",
      "Color-coded by type: mosque (blue), study (orange)",
      "RSVP to events and add to your personal calendar",
      "Private cycle tracker layer for female users",
    ],
    example: null,
  },
  {
    id: "progress",
    icon: TrendingUp,
    name: "Progress & XP",
    tagline: "Level up your deen",
    description:
      "Watch your Islamic growth unfold through XP, levels, badges and streaks. A community leaderboard celebrates collective mosque progress — not individual competition.",
    bullets: [
      "5 levels: Mubtadi → Mujahid → Talib → Hafidh → Wali",
      "XP earned from habits, learning, and community",
      "30+ badges to earn — from first prayer to 100-day streak",
      "Weekly summary vs last week with trend arrows",
      "Mosque collective leaderboard — grow together",
    ],
    example: null,
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <h1 className="text-5xl font-bold text-foreground mb-5">
            Five tools for your deen.<br />
            <span className="text-primary-500">All in one place.</span>
          </h1>
          <p className="text-xl text-muted leading-relaxed">
            Built with Islamic values, backed by authentic sources, and designed
            to help you grow — gently and consistently.
          </p>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {features.map(({ id, icon: Icon, name, tagline, description, bullets, example }, i) => (
            <section id={id} key={id} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-5">
                  <Icon size={26} className="text-accent" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">{name}</h2>
                <p className="text-primary-500 font-semibold mb-4">{tagline}</p>
                <p className="text-muted leading-relaxed mb-6">{description}</p>
                <ul className="space-y-3">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                      <BadgeCheck size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`${i % 2 === 1 ? "lg:order-1" : ""} bg-card border border-border rounded-2xl p-8`}>
                {example ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <div className="bg-primary-500 text-white text-sm rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%]">
                        {example.question}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-foreground text-sm rounded-2xl rounded-bl-sm px-4 py-3 max-w-[90%] leading-relaxed">
                        {example.answer}
                        <div className="flex items-center gap-1 mt-2 text-primary-500 text-xs">
                          <BadgeCheck size={12} />
                          Scholar-verified · Hadith cited
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted text-center">For guidance only — not a fatwa.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
                    <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center">
                      <Icon size={30} className="text-primary-500" />
                    </div>
                    <p className="text-muted text-sm">Experience {name} inside the app →</p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Trust section */}
        <div className="max-w-4xl mx-auto px-4 mt-24 py-16 bg-primary-50 rounded-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Our Islamic content commitment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            {[
              { icon: Shield, title: "Scholar-reviewed", desc: "All content reviewed before publishing" },
              { icon: BadgeCheck, title: "Cited sources", desc: "Every hadith includes reference number" },
              { icon: Zap, title: "Sunni tradition", desc: "Grounded in Sahih Bukhari & Muslim" },
            ].map(({ icon: I, title, desc }) => (
              <div key={title} className="bg-card rounded-xl p-5 border border-border">
                <I size={22} className="text-primary-500 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
