import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/homepage/Hero";
import SocialProof from "@/components/homepage/SocialProof";
import FeaturesGrid from "@/components/homepage/FeaturesGrid";
import HowItWorks from "@/components/homepage/HowItWorks";
import AIBuddySpotlight from "@/components/homepage/AIBuddySpotlight";
import CommunitySpotlight from "@/components/homepage/CommunitySpotlight";
import Statistics from "@/components/homepage/Statistics";
import Testimonials from "@/components/homepage/Testimonials";
import PricingPreview from "@/components/homepage/PricingPreview";
import FinalCTA from "@/components/homepage/FinalCTA";

export default function HomePage() {
  return (
    <>
      {/* Drifting aurora orbs — fixed behind every section so the frosted
          glass cards throughout the page have colour to refract */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="animate-aurora-a absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(96,165,250,0.32) 0%, transparent 65%)" }}
        />
        <div
          className="animate-aurora-b absolute top-[28%] -right-40 w-[42rem] h-[42rem] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.26) 0%, transparent 65%)" }}
        />
        <div
          className="animate-aurora-c absolute bottom-[-12rem] left-[22%] w-[38rem] h-[38rem] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 65%)" }}
        />
      </div>

      <Navbar />
      <main className="relative">
        <Hero />
        <SocialProof />
        <FeaturesGrid />
        <HowItWorks />
        <AIBuddySpotlight />
        <CommunitySpotlight />
        <Statistics />
        <Testimonials />
        <PricingPreview />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
