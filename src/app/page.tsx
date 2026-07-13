import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/homepage/Hero";
import SocialProof from "@/components/homepage/SocialProof";
import FeaturesGrid from "@/components/homepage/FeaturesGrid";
import DualQuizSpotlight from "@/components/homepage/DualQuizSpotlight";
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
          style={{ background: "radial-gradient(circle, rgba(96,165,250,0.14) 0%, transparent 65%)" }}
        />
        <div
          className="animate-aurora-b absolute top-[28%] -right-40 w-[42rem] h-[42rem] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(129,140,248,0.10) 0%, transparent 65%)" }}
        />
        <div
          className="animate-aurora-c absolute bottom-[-12rem] left-[22%] w-[38rem] h-[38rem] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(125,211,252,0.08) 0%, transparent 65%)" }}
        />
      </div>

      <Navbar />
      <main className="relative">
        <Hero />
        <SocialProof />
        <FeaturesGrid />
        <DualQuizSpotlight />
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
