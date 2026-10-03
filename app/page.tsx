import { AgentsSection } from "@/components/home/AgentsSection";
import { DemoSection } from "@/components/home/DemoSection";
import { FAQSection } from "@/components/home/FAQSection";
import { FinalCTASection } from "@/components/home/FinalCTASection";
import { HeroSection } from "@/components/home/HeroSection";
import { LabsSection } from "@/components/home/LabsSection";
import { PricingSection } from "@/components/home/PricingSection";
import { ToolsSection } from "@/components/home/ToolsSection";

export default function HomePage() {
  return (
    <div className="overflow-x-clip">
      <HeroSection />
      <DemoSection />
      <AgentsSection />
      <ToolsSection />
      <LabsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  );
}
