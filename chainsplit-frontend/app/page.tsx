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
 * Public-facing marketing page for ChainSplit
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--cs-bg-offwhite)] relative">
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
