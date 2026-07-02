import { Nav } from "@/components/nav/Nav";
import { Hero } from "@/components/hero/Hero";
import { FeaturedTemplates } from "@/components/sections/FeaturedTemplates";
import { WhyDesignMatters } from "@/components/sections/WhyDesignMatters";
import { WhyLaymade } from "@/components/sections/WhyLaymade";
import { Pricing } from "@/components/sections/Pricing";
import { SocialProof } from "@/components/sections/SocialProof";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/ui/Footer";
import { FadeIn } from "@/components/ui/FadeIn";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FadeIn><FeaturedTemplates /></FadeIn>
        <WhyDesignMatters />
        <FadeIn><WhyLaymade /></FadeIn>
        <FadeIn><Pricing /></FadeIn>
        <FadeIn><SocialProof /></FadeIn>
        <FadeIn><Contact /></FadeIn>
      </main>
      <Footer />
    </>
  );
}
