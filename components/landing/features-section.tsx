"use client"

import { 
  Wand2, 
  Users, 
  Sliders, 
  Cloud, 
  Music, 
  Plug 
} from "lucide-react"

const features = [
  {
    icon: Wand2,
    title: "Offline AI Composition Engine",
    description: "Generate melodies, drum patterns, and full arrangements with Offline AI. Transform ideas into music in seconds with our local offline generation tools.",
    color: "text-neon-cyan",
    glow: "glow-cyan"
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Work with multiple producers simultaneously with live MIDI/audio sync. Share projects instantly and see changes in real-time with zero latency.",
    color: "text-neon-purple",
    glow: "glow-purple"
  },
  {
    icon: Sliders,
    title: "Professional Audio Engine",
    description: "64-bit audio processing, multi-track recording, advanced routing, and 50+ built-in effects. Studio-quality mixing at your fingertips.",
    color: "text-neon-pink",
    glow: "glow-pink"
  },
  {
    icon: Cloud,
    title: "Cloud Storage & Sync",
    description: "Access your projects anywhere. Automatic versioning, collaborative backups, and instant sync across devices.",
    color: "text-neon-cyan",
    glow: "glow-cyan"
  },
  {
    icon: Music,
    title: "Extensive Sound Library",
    description: "500+ premium instruments, 10,000+ samples, and integration with Freesound API. Access millions of sounds instantly.",
    color: "text-neon-purple",
    glow: "glow-purple"
  },
  {
    icon: Plug,
    title: "VST3 & Plugin Support",
    description: "Load your favorite third-party plugins. Full MIDI learn, preset management, and multi-instance support.",
    color: "text-neon-pink",
    glow: "glow-pink"
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 lg:px-8 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neon-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Everything You Need to <span className="gradient-text">Create</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Professional music production tools powered by Offline AI,
            all accessible from your browser.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative glass rounded-xl p-6 hover:bg-surface-2/50 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-lg bg-surface-2 ${feature.color} mb-4 group-hover:${feature.glow} transition-all`}>
                <feature.icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className={`absolute inset-0 rounded-xl ${feature.glow} opacity-20`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
