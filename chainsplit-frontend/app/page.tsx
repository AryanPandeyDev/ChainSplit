import { Navbar } from "@/components/layout";
import { Footer } from "@/components/layout";
import {
  HeroSection,
  SettlementModesSection,
  HowItWorksSection,
  CTASection,
} from "@/components/landing";
import { AnimatedBackground } from "@/components/background";

/**
 * Landing Page
 * Dark Web3 theme — scoped via .landing-dark class
 */
export default function HomePage() {
  return (
    <div className="landing-dark min-h-screen relative">
      {/* Animated background elements */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10">
        <Navbar transparent />

        <main>
          <HeroSection />
          <SettlementModesSection />
          <HowItWorksSection />
          <CTASection />
        </main>

        <Footer />
      </div>
    </div>
  );
}
