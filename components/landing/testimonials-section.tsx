"use client"

import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Marcus Chen",
    role: "Electronic Producer | 50K+ monthly listeners",
    avatar: "MC",
    content: "PRO-TEEVERSE has completely transformed my workflow. GossipAI-PROD tools are incredible - I can generate entire drum patterns in seconds. Perfect for both sketching ideas and professional production.",
    rating: 5
  },
  {
    name: "Sarah Johnson",
    role: "Film Composer | Oscar-nominated",
    avatar: "SJ",
    content: "Finally, a browser-based DAW that doesn&apos;t compromise on features. The synthesis engine and MIDI editing capabilities rival desktop DAWs at a fraction of the cost.",
    rating: 5
  },
  {
    name: "DJ Nova",
    role: "EDM Artist | Beatport Top 10",
    avatar: "DN",
    content: "The real-time collaboration features let me work with producers across the globe seamlessly. The latency is minimal and the creative workflow is unmatched. Essential for modern music production.",
    rating: 5
  },
  {
    name: "Aisha Williams",
    role: "Hip-Hop Producer | Grammy Winner",
    avatar: "AW",
    content: "The piano roll is incredibly intuitive and responsive. The audio engine quality is studio-grade. I&apos;ve produced some of my biggest hits using PRO-TEEVERSE.",
    rating: 5
  }
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 px-6 lg:px-8 relative">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Loved by <span className="gradient-text">Producers</span> Worldwide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Join thousands of artists creating amazing music with PRO-TEEVERSE.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="glass rounded-xl p-6 hover:bg-surface-2/50 transition-all"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-neon-cyan text-neon-cyan" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                  <span className="text-sm font-semibold text-background">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
