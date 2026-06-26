"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Creator",
    price: "$0",
    period: "forever",
    description: "Essential tools for musicians",
    features: [
      "Up to 5 projects",
      "100+ quality instruments",
      "Basic effects & reverb",
      "MP3 export",
      "2GB cloud storage",
      "Community forum access",
      "Public collaboration",
    ],
    cta: "Get Started Free",
    popular: false
  },
  {
    name: "Professional",
    price: "$12",
    period: "/month",
    description: "Everything you need to produce",
    features: [
      "Unlimited projects",
      "500+ premium instruments",
      "Advanced offline AI composition",
      "Lossless export (WAV/FLAC)",
      "100GB cloud storage",
      "Real-time collaboration",
      "VST3 plugin support",
      "Professional mixing tools",
      "Email & chat support"
    ],
    cta: "Start 14-Day Trial",
    popular: true
  },
  {
    name: "Studio",
    price: "$29",
    period: "/month",
    description: "For producers & small studios",
    features: [
      "Everything in Professional",
      "Unlimited cloud storage",
      "Team workspaces (up to 5)",
      "Advanced MIDI routing",
      "Sidechain routing",
      "Spectral editing",
      "Priority support (24/7)",
      "Custom presets library",
      "Advanced metering tools",
      "SSL integration"
    ],
    cta: "Start 14-Day Trial",
    popular: false
  }
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 lg:px-8 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-neon-cyan/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-neon-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Start for free, upgrade when you need more power.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-6 ${
                plan.popular 
                  ? 'glass-strong border-neon-cyan/50 glow-cyan scale-105' 
                  : 'glass border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-neon-cyan text-background text-xs font-semibold">
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-neon-cyan' : 'text-foreground'}`}>
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-neon-cyan' : 'text-muted-foreground'}`} />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/studio" className="block">
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-neon-cyan text-background hover:bg-neon-cyan/90' 
                      : 'bg-surface-2 text-foreground hover:bg-surface-3'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
