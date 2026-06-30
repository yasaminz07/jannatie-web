import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NotificationDemo from "@/components/for-communities/NotificationDemo";
import {
  Building2, BadgeCheck, ArrowRight, Calendar, Bell, Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "For Communities — Mosques, Businesses & Creators",
  description:
    "Create a dedicated community account on Jannatie to post events, reach local followers, and connect with other communities.",
};

const benefits = [
  {
    icon: Calendar,
    title: "Post structured events",
    desc: "Title, description, photo, date, time and venue, laid out clearly so people actually show up.",
  },
  {
    icon: Bell,
    title: "Followers get notified instantly",
    desc: "The moment you post, everyone following your community gets a notification, no algorithm in the way.",
  },
  {
    icon: BadgeCheck,
    title: "Verified badge",
    desc: "Every approved community account gets a verified badge so people know you're official.",
  },
  {
    icon: Users,
    title: "Connect with other communities",
    desc: "Send and accept collaboration requests with other mosques, businesses and organizers.",
  },
];

const memberPoints = [
  "Search and follow any community by name",
  "Get a notification the second they post an event",
  "RSVP and add events straight to your calendar",
  "Your own activity stays private — communities can't follow you back",
];

export default function ForCommunitiesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 bg-[#fafafa]">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 size={28} className="text-primary-500" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-5">
            Built for mosques, businesses
            <br />
            and creators.
          </h1>
          <p className="text-xl text-muted leading-relaxed mb-8">
            A dedicated account type for posting real events and reaching local
            people who actually want to show up, completely separate from
            personal accounts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup-community"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors"
            >
              Create a community account
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/features#community"
              className="inline-flex items-center gap-2 text-primary-500 font-semibold text-sm hover:gap-3 transition-all"
            >
              See all features
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 gap-5 mb-24">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-6">
              <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-primary-500" />
              </div>
              <h3 className="font-bold text-foreground mb-1.5">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* For normal users */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-50/60 border border-primary-500/10 rounded-3xl p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary-500 text-sm font-semibold uppercase tracking-widest mb-3">
                Already on Jannatie?
              </p>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                You don&apos;t need a community account to benefit.
              </h2>
              <p className="text-muted leading-relaxed mb-6">
                Follow any mosque, business or creator from their profile and
                you&apos;ll get notified the moment they post a new event,
                straight to your notification bell. No need to keep checking back.
              </p>
              <ul className="space-y-3">
                {memberPoints.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck size={12} className="text-primary-500" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <NotificationDemo />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
