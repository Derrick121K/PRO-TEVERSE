import Link from "next/link"
import { ArrowRight, Boxes, Library, Music2, Settings, Upload, Wand2 } from "lucide-react"

const hubCards = [
  {
    title: "Pro Studio",
    description: "Main offline AI DAW workspace.",
    href: "/pro-studio",
    Icon: Music2,
  },
  {
    title: "Classic Studio",
    description: "Timeline, piano roll and production tools.",
    href: "/studio",
    Icon: Boxes,
  },
  {
    title: "ZIP Studio",
    description: "Open, edit, preserve and export ZIP/FLP projects.",
    href: "/zip-studio",
    Icon: Upload,
  },
  {
    title: "Sound Library",
    description: "Browse legal local drums, bass, keys, vocals, FX and loops.",
    href: "/sound-library",
    Icon: Library,
  },
  {
    title: "AI Producer",
    description: "Generate patterns locally without cloud APIs.",
    href: "/ai-creator",
    Icon: Wand2,
  },
  {
    title: "Settings",
    description: "Offline mode and desktop-ready preferences.",
    href: "/settings",
    Icon: Settings,
  },
]

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-28 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">PRO-TEVERSE</p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Offline Studio Hub
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Choose your workspace. PRO-TEVERSE now runs as an offline-first music system with local AI generation,
            ZIP project editing, local sound libraries and desktop packaging preparation.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pro-studio"
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Launch Pro Studio
            </Link>
            <Link
              href="/sound-library"
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              Open Sound Library
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hubCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-white/10 bg-slate-900/80 p-5 transition hover:border-cyan-300/40 hover:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-2xl bg-cyan-400/10 p-3">
                  <card.Icon className="h-6 w-6 text-cyan-300" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
              </div>
              <h2 className="mt-5 text-xl font-bold">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
