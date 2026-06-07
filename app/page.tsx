import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { SiteFooter } from "@/components/landing/site-footer";
import { AuthHeaderActions } from "@/features/auth";

export default function Home() {
  return (
    <>
      <SiteHeader
        desktopAuthActions={<AuthHeaderActions />}
        mobileAuthActions={<AuthHeaderActions mobile />}
      />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
