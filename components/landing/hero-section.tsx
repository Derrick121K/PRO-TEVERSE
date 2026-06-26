import Link from "next/link"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-32 pb-20 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-neon-cyan/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
          <Sparkles className="h-4 w-4 text-neon-cyan" />
          <span className="text-sm text-muted-foreground">Offline AI Music Production</span>
        </div>

        <h1 className="max-w-5xl text-5xl font-black tracking-tight text-foreground md:text-7xl lg:text-8xl">
          The Future of{" "}
          <span className="gradient-text">Offline Music Production</span>
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
          Create professional-quality music offline with local AI pattern generation,
          ZIP project editing, legal sound libraries, and a desktop-ready DAW.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/pro-studio">
            <Button className="h-14 rounded-2xl bg-neon-cyan px-8 text-base font-bold text-background hover:bg-neon-cyan/90 glow-cyan">
              Launch Studio
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          <Link href="/studio">
            <Button
              variant="outline"
              className="h-14 rounded-2xl border-white/10 px-8 text-base font-bold"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { value: "100%", label: "Offline Ready" },
            { value: "Local", label: "AI Producer" },
            { value: "ZIP", label: "Project Studio" },
            { value: "Legal", label: "Sound Library" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
            >
              <div className="text-2xl font-black gradient-text">{item.value}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
