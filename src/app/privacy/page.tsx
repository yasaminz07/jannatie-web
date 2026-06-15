import { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Jannatie",
  description: "Jannatie Privacy Policy — UK GDPR compliant. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted text-sm mb-10">Last updated: January 2025 · Jannatie Ltd, England & Wales</p>

            <div className="prose prose-sm max-w-none space-y-10 text-foreground">

              <section>
                <h2 className="text-xl font-bold mb-3">1. Who we are</h2>
                <p className="text-muted leading-relaxed">
                  Jannatie Ltd (&ldquo;Jannatie&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a company registered in England and Wales.
                  We operate the website jannatie.com and the Jannatie progressive web application
                  (together, the &ldquo;Service&rdquo;). We are the data controller for your personal data.
                  Our ICO registration number is [ICO Registration Number].
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">2. Data we collect</h2>
                <p className="text-muted leading-relaxed mb-3">We collect only what is necessary to provide the Service:</p>
                <ul className="space-y-2 text-muted text-sm">
                  <li><strong className="text-foreground">Account data:</strong> Your name, email address, and optionally a profile photo.</li>
                  <li><strong className="text-foreground">Usage data:</strong> Habits you track, lessons you complete, XP earned, and streak counts — stored to provide personalisation.</li>
                  <li><strong className="text-foreground">Payment data:</strong> Processed securely by Stripe. We never store full card numbers.</li>
                  <li><strong className="text-foreground">Device data:</strong> Browser type, device type, and general location (country level) for analytics.</li>
                  <li><strong className="text-foreground">Communication data:</strong> If you contact us by email.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">3. How we use your data</h2>
                <ul className="space-y-2 text-muted text-sm">
                  <li>To provide and improve the Service</li>
                  <li>To process payments and manage subscriptions</li>
                  <li>To send transactional emails (account, receipts, password reset)</li>
                  <li>To send our newsletter — only if you have opted in</li>
                  <li>To monitor for security and fraud</li>
                  <li>To comply with legal obligations</li>
                </ul>
                <p className="text-muted text-sm mt-3">
                  We do <strong className="text-foreground">not</strong> sell your personal data.
                  We do <strong className="text-foreground">not</strong> use your data for advertising targeting.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">4. Legal basis (UK GDPR)</h2>
                <ul className="space-y-2 text-muted text-sm">
                  <li><strong className="text-foreground">Contract performance:</strong> Providing the Service you signed up for.</li>
                  <li><strong className="text-foreground">Legitimate interests:</strong> Product analytics, security, fraud prevention.</li>
                  <li><strong className="text-foreground">Consent:</strong> Newsletter emails and optional cookies.</li>
                  <li><strong className="text-foreground">Legal obligation:</strong> Accounting records, regulatory compliance.</li>
                </ul>
              </section>

              <section id="cookies">
                <h2 className="text-xl font-bold mb-3">5. Cookies</h2>
                <p className="text-muted text-sm leading-relaxed">
                  We use strictly necessary cookies for authentication sessions, and optional analytics cookies
                  (PostHog, with EU hosting) if you consent. You can withdraw consent at any time from your
                  account settings. We do not use third-party advertising cookies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">6. Data retention</h2>
                <p className="text-muted text-sm leading-relaxed">
                  We retain your account data for as long as your account is active. If you delete your account,
                  we delete your personal data within 30 days, except where retention is required by law
                  (e.g. accounting records: 6 years).
                </p>
              </section>

              <section id="gdpr">
                <h2 className="text-xl font-bold mb-3">7. Your rights (UK GDPR)</h2>
                <p className="text-muted text-sm leading-relaxed mb-3">You have the right to:</p>
                <ul className="space-y-1 text-muted text-sm">
                  <li>Access your personal data</li>
                  <li>Rectify inaccurate data</li>
                  <li>Erase your data (&ldquo;right to be forgotten&rdquo;)</li>
                  <li>Restrict or object to processing</li>
                  <li>Data portability</li>
                  <li>Withdraw consent at any time</li>
                  <li>Lodge a complaint with the ICO (ico.org.uk)</li>
                </ul>
                <p className="text-muted text-sm mt-3">
                  To exercise any of these rights, email us at <strong className="text-foreground">privacy@jannatie.com</strong>.
                  We will respond within 30 days.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">8. Third-party processors</h2>
                <ul className="space-y-2 text-muted text-sm">
                  <li><strong className="text-foreground">Firebase (Google):</strong> Authentication and database — EU data residency available.</li>
                  <li><strong className="text-foreground">Stripe:</strong> Payment processing — PCI-DSS compliant.</li>
                  <li><strong className="text-foreground">Azure OpenAI:</strong> AI Buddy responses — no data used for training.</li>
                  <li><strong className="text-foreground">PostHog:</strong> Product analytics — EU hosted, no personal data in events.</li>
                  <li><strong className="text-foreground">Sentry:</strong> Error tracking — anonymised where possible.</li>
                  <li><strong className="text-foreground">Brevo:</strong> Transactional email.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">9. Contact</h2>
                <p className="text-muted text-sm">
                  Jannatie Ltd · privacy@jannatie.com · [Registered Address], England
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
