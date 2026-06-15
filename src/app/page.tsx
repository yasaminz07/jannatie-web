import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/homepage/Hero";
import SocialProof from "@/components/homepage/SocialProof";
import FeaturesGrid from "@/components/homepage/FeaturesGrid";
import HowItWorks from "@/components/homepage/HowItWorks";
import AIBuddySpotlight from "@/components/homepage/AIBuddySpotlight";
import Statistics from "@/components/homepage/Statistics";
import Testimonials from "@/components/homepage/Testimonials";
import PricingPreview from "@/components/homepage/PricingPreview";
import FinalCTA from "@/components/homepage/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <FeaturesGrid />
        <HowItWorks />
        <AIBuddySpotlight />
        <Statistics />
        <Testimonials />
        <PricingPreview />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
