"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, Volume2, Rewind, FastForward, Square } from "lucide-react"

export function DawPreviewSection() {
  return (
    <section className="py-24 px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-1/50 to-transparent" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Experience the <span className="gradient-text">Power</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A full-featured DAW right in your browser. No downloads, no installation.
          </p>
        </div>

        {/* DAW Preview */}
        <div className="relative rounded-xl overflow-hidden glass-strong glow-cyan/30">
          {/* Transport Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Rewind className="h-4 w-4" />
              </Button>
              <Button size="sm" className="h-8 w-8 p-0 bg-neon-cyan text-background hover:bg-neon-cyan/90">
                <Play className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Square className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <FastForward className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 font-mono text-sm">
              <span className="text-muted-foreground">BPM:</span>
              <span className="text-neon-cyan">120</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-foreground">1:1:0</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div className="w-24 h-2 bg-surface-3 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-neon-cyan rounded-full" />
              </div>
            </div>
          </div>

          {/* Main DAW Area */}
          <div className="flex h-[400px]">
            {/* Track List */}
            <div className="w-48 border-r border-border bg-surface-1">
              {["Drums", "Bass", "Synth Lead", "Pad", "FX"].map((track, i) => (
                <div key={track} className="flex items-center gap-2 px-3 py-3 border-b border-border hover:bg-surface-2 transition-colors">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      backgroundColor: ['#00d4ff', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][i] 
                    }} 
                  />
                  <span className="text-sm text-foreground truncate">{track}</span>
                </div>
              ))}
            </div>

            {/* Timeline Grid */}
            <div className="flex-1 relative overflow-hidden">
              {/* Time Ruler */}
              <div className="h-8 bg-surface-2 border-b border-border flex">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-20 border-r border-border flex items-center px-2">
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                  </div>
                ))}
              </div>

              {/* Track Lanes */}
              <div className="relative">
                {[0, 1, 2, 3, 4].map((trackIndex) => (
                  <div key={trackIndex} className="h-12 border-b border-border relative flex">
                    {/* Grid Lines */}
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-20 border-r border-border/50" />
                    ))}
                    
                    {/* Sample Clips */}
                    {trackIndex === 0 && (
                      <>
                        <div className="absolute top-1 left-1 h-10 w-36 rounded bg-neon-cyan/30 border border-neon-cyan/50 flex items-center px-2">
                          <span className="text-xs text-neon-cyan truncate">Kick Pattern</span>
                        </div>
                        <div className="absolute top-1 left-40 h-10 w-28 rounded bg-neon-cyan/30 border border-neon-cyan/50" />
                      </>
                    )}
                    {trackIndex === 1 && (
                      <div className="absolute top-1 left-1 h-10 w-72 rounded bg-neon-purple/30 border border-neon-purple/50 flex items-center px-2">
                        <span className="text-xs text-neon-purple truncate">Bass Line</span>
                      </div>
                    )}
                    {trackIndex === 2 && (
                      <div className="absolute top-1 left-20 h-10 w-56 rounded bg-neon-pink/30 border border-neon-pink/50 flex items-center px-2">
                        <span className="text-xs text-neon-pink truncate">Lead Melody</span>
                      </div>
                    )}
                    {trackIndex === 3 && (
                      <div className="absolute top-1 left-1 h-10 w-64 rounded bg-emerald-500/30 border border-emerald-500/50" />
                    )}
                  </div>
                ))}

                {/* Playhead */}
                <div className="absolute top-0 left-32 w-0.5 h-full bg-neon-cyan shadow-lg shadow-neon-cyan/50" />
              </div>

              {/* Piano Roll Preview at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-surface-2 border-t border-border">
                <div className="h-6 bg-surface-3 border-b border-border px-2 flex items-center">
                  <span className="text-xs text-muted-foreground">Piano Roll - Lead Melody</span>
                </div>
                <div className="flex h-18">
                  {/* Piano Keys */}
                  <div className="w-12 flex flex-col-reverse">
                    {['C', 'D', 'E', 'F', 'G', 'A'].map((note) => (
                      <div key={note} className="flex-1 border-b border-border text-[10px] flex items-center justify-center text-muted-foreground">
                        {note}4
                      </div>
                    ))}
                  </div>
                  {/* Note Grid */}
                  <div className="flex-1 relative">
                    {/* Grid */}
                    <div className="absolute inset-0 grid grid-cols-16 grid-rows-6">
                      {Array.from({ length: 96 }).map((_, i) => (
                        <div key={i} className="border-r border-b border-border/30" />
                      ))}
                    </div>
                    {/* Notes */}
                    <div className="absolute top-1 left-4 w-8 h-2 rounded-sm bg-neon-pink" />
                    <div className="absolute top-4 left-14 w-12 h-2 rounded-sm bg-neon-pink" />
                    <div className="absolute top-2 left-28 w-6 h-2 rounded-sm bg-neon-pink" />
                    <div className="absolute top-5 left-36 w-10 h-2 rounded-sm bg-neon-pink" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link href="/studio">
            <Button size="lg" className="bg-neon-cyan text-background hover:bg-neon-cyan/90 glow-cyan px-8">
              Try It Now - Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
