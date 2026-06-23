import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { DawPreviewSection } from "@/components/landing/daw-preview-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { FooterSection } from "@/components/landing/footer-section"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <DawPreviewSection />
      <PricingSection />
      <TestimonialsSection />
      <FooterSection />
    </main>
  )
}
