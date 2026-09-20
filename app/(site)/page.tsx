import { HomeHero } from "@/components/sections/home-hero";
import { HeatSection } from "@/components/sections/heat-section";
import { CraftSection } from "@/components/sections/craft-section";
import { DishSection } from "@/components/sections/dish-section";
import { AmbianceSection } from "@/components/sections/ambiance-section";
import { ExperienceSection } from "@/components/sections/experience-section";
import { ArrivalSection } from "@/components/sections/arrival-section";
import { MembershipSection } from "@/components/sections/membership-section";

export default function Home() {
  return (
    <>
      {/* A 7-beat film: video → fire → craft → dish → room → evening → arrival.
          No two consecutive beats share motion; text always follows the image. */}
      <HomeHero />
      <HeatSection />
      <CraftSection />
      <DishSection />
      <AmbianceSection />
      <MembershipSection />
      <ExperienceSection />
      <ArrivalSection />
    </>
  );
}
