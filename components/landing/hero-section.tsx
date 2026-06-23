"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, Sparkles } from "lucide-react"
import { WaveformVisualizer } from "./waveform-visualizer"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-pink/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
          <Sparkles className="h-4 w-4 text-neon-cyan" />
          <span className="text-sm text-muted-foreground">GossipAI-PROD Music Production</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="text-foreground">The Future of</span>
          <br />
          <span className="gradient-text text-glow-cyan">Music Production</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Create professional-quality music with tools powered by GossipAI-PROD, real-time collaboration,
          and a full-featured DAW right in your browser.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/studio">
            <Button size="lg" className="bg-neon-cyan text-background hover:bg-neon-cyan/90 glow-cyan text-base px-8 py-6">
              <Play className="mr-2 h-5 w-5" />
              Launch Studio
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-border bg-surface-1/50 hover:bg-surface-2 text-base px-8 py-6">
            Watch Demo
          </Button>
        </div>

        {/* Waveform Visualizer */}
        <div className="relative max-w-4xl mx-auto">
          <WaveformVisualizer />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-3xl mx-auto">
          {[
            { value: "100K+", label: "Producers" },
            { value: "1M+", label: "Tracks Created" },
            { value: "5+", label: "GossipAI-PROD Producer" },
            { value: "24/7", label: "Cloud Access" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-neon-cyan">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
