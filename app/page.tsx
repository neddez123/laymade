import { Nav } from "@/components/nav/Nav";
import { Hero } from "@/components/hero/Hero";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { FeaturedTemplates } from "@/components/sections/FeaturedTemplates";
import { WhyLaymade } from "@/components/sections/WhyLaymade";
import { Pricing } from "@/components/sections/Pricing";
import { SocialProof } from "@/components/sections/SocialProof";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/ui/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TrustStrip />
        <FeaturedTemplates />
        <WhyLaymade />
        <Pricing />
        <SocialProof />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
