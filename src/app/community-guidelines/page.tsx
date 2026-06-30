import { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Community Guidelines — Jannatie",
  description: "Guidelines for respectful, beneficial conduct across Jannatie — for users and community accounts alike.",
};

const SECTIONS = [
  { id: "who-this-applies-to", label: "1. Who this applies to" },
  { id: "our-principles", label: "2. Our principles" },
  { id: "expected-conduct", label: "3. Expected conduct" },
  { id: "prohibited-content", label: "4. Prohibited content and behaviour" },
  { id: "community-accounts", label: "5. Community account responsibilities" },
  { id: "reporting", label: "6. Reporting and moderation" },
  { id: "enforcement", label: "7. Enforcement" },
  { id: "appeals", label: "8. Appeals" },
  { id: "contact", label: "9. Contact" },
];

export default function CommunityGuidelinesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 bg-slate-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Community Guidelines</h1>
            <p className="text-muted text-sm mb-10">Last updated: January 2025 · Applies to every user and community account on Jannatie</p>

            {/* Quick nav */}
            <nav className="mb-10 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">On this page</p>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-10 text-sm leading-relaxed">

              <section id="who-this-applies-to">
                <h2 className="text-xl font-bold text-foreground mb-3">1. Who this applies to</h2>
                <p className="text-muted">
                  These guidelines apply to every person and organisation on Jannatie — individual users,
                  and community accounts representing mosques, businesses and organisers. Creating an
                  account, posting an event, or leaving a comment means you agree to follow them. They sit
                  alongside, and don&apos;t replace, our{" "}
                  <a href="/terms" className="text-blue-600 hover:underline">Terms and Conditions of Service</a>.
                </p>
              </section>

              <section id="our-principles">
                <h2 className="text-xl font-bold text-foreground mb-3">2. Our principles</h2>
                <p className="text-muted">
                  Jannatie exists to help Muslims grow their deen and build good habits together. We ask
                  everyone to engage with good character (akhlaq) — honesty, respect, and consideration for
                  others — the same standard we&apos;d want reflected in any space built for the ummah.
                </p>
              </section>

              <section id="expected-conduct">
                <h2 className="text-xl font-bold text-foreground mb-3">3. Expected conduct</h2>
                <ul className="space-y-2 text-muted">
                  <li>Be respectful, even in disagreement — discuss ideas, not people.</li>
                  <li>Keep comments on community events relevant and constructive.</li>
                  <li>Use your real name or a genuine display name — don&apos;t impersonate another person, mosque or organisation.</li>
                  <li>Credit sources when sharing Islamic knowledge, and avoid presenting personal opinion as established ruling.</li>
                  <li>Respect differences of school of thought (madhhab) and cultural practice within the bounds of mainstream Sunni and Shia scholarship.</li>
                </ul>
              </section>

              <section id="prohibited-content">
                <h2 className="text-xl font-bold text-foreground mb-3">4. Prohibited content and behaviour</h2>
                <p className="text-muted mb-3">The following are never allowed, anywhere on Jannatie:</p>
                <ul className="space-y-2 text-muted">
                  <li>Hate speech, harassment, bullying, or threats directed at any individual or group</li>
                  <li>Content that promotes sectarianism, takfir, or division within the Muslim community</li>
                  <li>Sexually explicit, violent, or otherwise haram content</li>
                  <li>Misinformation presented as Islamic ruling, or fatwas issued without scholarly qualification</li>
                  <li>Spam, scams, unsolicited advertising, or phishing links</li>
                  <li>Sharing another person&apos;s private information without consent</li>
                  <li>Fake community accounts, fake events, or impersonation of a real mosque or organisation</li>
                </ul>
              </section>

              <section id="community-accounts">
                <h2 className="text-xl font-bold text-foreground mb-3">5. Community account responsibilities</h2>
                <p className="text-muted mb-3">
                  Community accounts are held to a higher standard, since they represent real organisations
                  and reach followers directly:
                </p>
                <ul className="space-y-2 text-muted">
                  <li>Only post events and announcements that are genuine and accurate</li>
                  <li>Keep your profile information (location, category, contact details) up to date</li>
                  <li>Moderate comments on your own events fairly — you may remove a comment that breaks these guidelines, but may not silence respectful disagreement</li>
                  <li>Do not use your reach to promote unrelated commercial offers without disclosure</li>
                </ul>
              </section>

              <section id="reporting">
                <h2 className="text-xl font-bold text-foreground mb-3">6. Reporting and moderation</h2>
                <p className="text-muted">
                  Any user can report a comment on a community event, and any community account can report a
                  comment left by a user or another community on its posts. Reports are reviewed by our team —
                  not automatically actioned — and we may remove the comment, warn the account, or take no
                  action if the report doesn&apos;t breach these guidelines.
                </p>
              </section>

              <section id="enforcement">
                <h2 className="text-xl font-bold text-foreground mb-3">7. Enforcement</h2>
                <p className="text-muted mb-3">Depending on severity and history, we may:</p>
                <ul className="space-y-2 text-muted">
                  <li>Remove the specific content</li>
                  <li>Issue a warning</li>
                  <li>Temporarily restrict an account&apos;s ability to post or comment</li>
                  <li>Suspend or permanently remove an account for serious or repeated violations</li>
                  <li>Reject or revoke a community account&apos;s approval if it misrepresents the organisation it claims to be</li>
                </ul>
              </section>

              <section id="appeals">
                <h2 className="text-xl font-bold text-foreground mb-3">8. Appeals</h2>
                <p className="text-muted">
                  If you believe a moderation decision was made in error, contact us via{" "}
                  <a href="/support" className="text-blue-600 hover:underline">Support</a> with your account
                  details and we&apos;ll review it.
                </p>
              </section>

              <section id="contact">
                <h2 className="text-xl font-bold text-foreground mb-3">9. Contact</h2>
                <p className="text-muted">
                  Jannatie Ltd · jannatieteam@gmail.com · Birmingham, England
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
