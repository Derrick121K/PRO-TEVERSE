"use client"

import type { LucideIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { ZipStudioProject } from "@/lib/zip-studio/types"
import { ZIP_STUDIO_SESSION_KEY } from "@/lib/zip-studio/types"
import { buildZipProjectPrompt, summarizeZipProject } from "@/lib/zip-studio/project-tools"
import { generateZipMatchedPatternLocally } from "@/lib/local-engine/zip-pattern"
import {
  Bot,
  Boxes,
  Brain,
  Cable,
  ChevronRight,
  CircleDot,
  Drum,
  FileArchive,
  Gauge,
  Guitar,
  KeyboardMusic,
  Layers3,
  Library,
  Mic2,
  Piano,
  Radio,
  Save,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Wand2,
  Waves,
} from "lucide-react"
type StudioPanel = "channel-rack" | "playlist" | "piano-roll" | "mixer" | "plugins" | "ai"

type PluginCategory = "Generator" | "Sampler" | "Effect" | "Mastering" | "AI"

type Plugin = {
  name: string
  category: PluginCategory
  purpose: string
  status: "Ready" | "Planned" | "AI Assisted"
}

const plugins: Plugin[] = [
  { name: "PRO Sampler", category: "Sampler", purpose: "Load WAV/MP3 samples from ZIP projects and trigger them in patterns.", status: "Ready" },
  { name: "Slice Lab", category: "Sampler", purpose: "Chop loops into playable slices for hooks, vocals, drums, and melodies.", status: "Planned" },
  { name: "Log Drum Bass", category: "Generator", purpose: "Amapiano-style log drum and bassline generator.", status: "AI Assisted" },
  { name: "808 Bass", category: "Generator", purpose: "Trap/hip-hop 808 bass with glide, pitch, and distortion.", status: "Planned" },
  { name: "Piano Keys", category: "Generator", purpose: "Clean piano, chords, pads, and basic keyboard sounds.", status: "Ready" },
  { name: "Wave Synth", category: "Generator", purpose: "Lead, pad, pluck, and bass synthesis for melodies.", status: "Planned" },
  { name: "Drum Machine", category: "Generator", purpose: "Kick, clap, snare, hat, percussion and step sequencing.", status: "Ready" },
  { name: "EQ Pro", category: "Effect", purpose: "Shape bass, mids and highs for every channel.", status: "Planned" },
  { name: "Compressor", category: "Effect", purpose: "Control dynamics and make sounds more balanced.", status: "Planned" },
  { name: "Reverb Space", category: "Effect", purpose: "Add room, hall, plate and ambient space.", status: "Planned" },
  { name: "Delay Echo", category: "Effect", purpose: "Tempo-synced echo for vocals, leads and FX.", status: "Planned" },
  { name: "Distortion Drive", category: "Effect", purpose: "Add grit, warmth and punch.", status: "Planned" },
  { name: "Stereo Imager", category: "Mastering", purpose: "Widen or narrow the stereo field.", status: "Planned" },
  { name: "Limiter Max", category: "Mastering", purpose: "Protect the master output and increase loudness.", status: "Planned" },
  { name: "Master Analyzer", category: "Mastering", purpose: "Visualize peaks, loudness, stereo balance and frequency.", status: "Planned" },
  { name: "AI Pattern Builder", category: "AI", purpose: "Generate drums, bass, chords and melodies from prompt/project sounds.", status: "AI Assisted" },
  { name: "AI Arrangement", category: "AI", purpose: "Turn loops into intro, verse, hook, bridge, drop and outro.", status: "AI Assisted" },
  { name: "AI Mix Assistant", category: "AI", purpose: "Suggest volume, panning and plugin chains for cleaner mixes.", status: "AI Assisted" },
]

const channels = [
  { name: "Kick", type: "Drum", plugin: "Drum Machine", color: "bg-cyan-400", steps: [0, 6, 10, 14, 15] },
  { name: "Clap", type: "Drum", plugin: "Drum Machine", color: "bg-fuchsia-400", steps: [4, 12] },
  { name: "Hi-Hat", type: "Drum", plugin: "Drum Machine", color: "bg-amber-300", steps: [2, 5, 8, 11, 14, 15] },
  { name: "Log Drum", type: "Bass", plugin: "Log Drum Bass", color: "bg-emerald-400", steps: [0, 7, 10, 15] },
  { name: "Chords", type: "Keys", plugin: "Piano Keys", color: "bg-violet-400", steps: [0, 4, 8, 12] },
  { name: "Lead", type: "Melody", plugin: "Wave Synth", color: "bg-pink-400", steps: [1, 3, 7, 9, 13] },
]

const playlistSections = [
  { name: "Intro", bars: "1 - 8", idea: "Filtered drums + soft chords" },
  { name: "Build", bars: "9 - 16", idea: "Add hats, riser, lead preview" },
  { name: "Hook", bars: "17 - 32", idea: "Full drums, log drum, catchy melody" },
  { name: "Verse", bars: "33 - 48", idea: "Reduce energy, keep bass groove" },
  { name: "Drop", bars: "49 - 64", idea: "Full pattern with variation" },
  { name: "Outro", bars: "65 - 72", idea: "Remove drums and fade ambience" },
]

const mixerTracks = [
  "Master",
  "Drums",
  "Kick",
  "Clap",
  "Hi-Hat",
  "Bass",
  "Chords",
  "Lead",
  "Vocals",
  "FX",
]

const browserItems: Array<{ title: string; subtitle: string; Icon: LucideIcon }> = [
  { title: "ZIP Samples", subtitle: "Open nkosi.zip audio files", Icon: FileArchive },
  { title: "Drums", subtitle: "Kicks, claps, hats, snares", Icon: Drum },
  { title: "Bass", subtitle: "Log drum, 808, sub bass", Icon: Guitar },
  { title: "Keys", subtitle: "Piano, pads, chords", Icon: KeyboardMusic },
  { title: "Vocals", subtitle: "Hooks, chops, adlibs", Icon: Mic2 },
  { title: "FX", subtitle: "Risers, impacts, sweeps", Icon: Waves },
  { title: "Radio Ready", subtitle: "Master chain templates", Icon: Radio },
  { title: "Offline Song", subtitle: "Generate full song ideas locally", Icon: Bot },
]

function statusStyle(status: Plugin["status"]) {
  if (status === "Ready") return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
  if (status === "AI Assisted") return "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
  return "border-slate-400/30 bg-white/5 text-slate-300"
}

function PanelButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition ${
        active
          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

export default function ProStudioPage() {
  const [panel, setPanel] = useState<StudioPanel>("channel-rack")
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | "All">("All")
  const [bpm, setBpm] = useState(112)
  const [key, setKey] = useState("C minor")
  const [zipProject, setZipProject] = useState<ZipStudioProject | null>(null)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiStatus, setAiStatus] = useState("Load a ZIP project, then generate a matching pattern.")
  const [aiResult, setAiResult] = useState<{
    title?: string | null
    source?: string
    notes?: unknown[]
    pattern?: unknown[]
    matchedZipProject?: {
      projectName: string
      sourceZipName: string
      trackCount: number
      activeTrackCount: number
      bpm: number
      key: string
    } | null
  } | null>(null)
  const [isAiGenerating, setIsAiGenerating] = useState(false)

  useEffect(() => {
    const saved =
      sessionStorage.getItem(ZIP_STUDIO_SESSION_KEY) ||
      localStorage.getItem(ZIP_STUDIO_SESSION_KEY)

    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as ZipStudioProject
      setZipProject(parsed)
      setBpm(parsed.bpm || 112)
      setKey(parsed.key || "C minor")
      setAiPrompt(buildZipProjectPrompt(parsed))
    } catch {
      setZipProject(null)
    }
  }, [])

  const visiblePlugins = useMemo(() => {
    if (selectedCategory === "All") return plugins
    return plugins.filter((plugin) => plugin.category === selectedCategory)
  }, [selectedCategory])

  async function generateZipMatchedPattern() {
    if (!zipProject) {
      setAiStatus("Open ZIP Studio, upload a ZIP, and click Save Editable Layer first.")
      return
    }

    setIsAiGenerating(true)
    setAiStatus("Generating offline pattern from your imported ZIP project...")

    try {
      const data = generateZipMatchedPatternLocally(zipProject, aiPrompt)

      setAiResult(data)
      setAiStatus("Offline ZIP-matched pattern generated successfully. No API was used.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Offline AI generation failed"
      setAiStatus(message)
    } finally {
      setIsAiGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050713] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_30%)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-cyan-300">
                <Sparkles className="h-4 w-4" />
                PRO-TEVERSE AI DAW
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
                Pro Studio Workspace
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                A modern DAW workflow with channel rack, playlist arrangement, piano roll,
                mixer, native plugins, ZIP project import, and AI music assistance.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/zip-studio" className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950">
                Open ZIP Project
              </Link>
              <Link href="/studio" className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
                Classic Studio
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Tempo</p>
              <div className="mt-2 flex items-center gap-3">
                <Gauge className="h-5 w-5 text-cyan-300" />
                <input
                  type="number"
                  min={60}
                  max={220}
                  value={bpm}
                  onChange={(event) => setBpm(Number(event.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-lg font-bold"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Key</p>
              <div className="mt-2 flex items-center gap-3">
                <Piano className="h-5 w-5 text-violet-300" />
                <input
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-lg font-bold"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Project Mode</p>
              <p className="mt-3 text-lg font-bold text-emerald-300">
                {zipProject ? "ZIP Project Loaded" : "Pattern + Playlist"}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">AI Mode</p>
              <p className="mt-3 text-lg font-bold text-cyan-300">
                {zipProject ? `${zipProject.tracks.length} ZIP Tracks` : "Co-Producer Ready"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[260px_1fr_300px]">
        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <Boxes className="h-5 w-5 text-cyan-300" />
            Workspace
          </h2>

          <div className="space-y-2">
            <PanelButton active={panel === "channel-rack"} label="Channel Rack" icon={<Drum className="h-4 w-4" />} onClick={() => setPanel("channel-rack")} />
            <PanelButton active={panel === "playlist"} label="Playlist" icon={<Layers3 className="h-4 w-4" />} onClick={() => setPanel("playlist")} />
            <PanelButton active={panel === "piano-roll"} label="Piano Roll" icon={<KeyboardMusic className="h-4 w-4" />} onClick={() => setPanel("piano-roll")} />
            <PanelButton active={panel === "mixer"} label="Mixer" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setPanel("mixer")} />
            <PanelButton active={panel === "plugins"} label="Plugin Rack" icon={<Cable className="h-4 w-4" />} onClick={() => setPanel("plugins")} />
            <PanelButton active={panel === "ai"} label="AI Producer" icon={<Brain className="h-4 w-4" />} onClick={() => setPanel("ai")} />
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm font-semibold text-slate-200">File System</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <Link href="/zip-studio" className="flex items-center gap-2 hover:text-cyan-200">
                <FileArchive className="h-4 w-4" />
                ZIP / FLP Layer
              </Link>
              <Link href="/fl-studio" className="flex items-center gap-2 hover:text-cyan-200">
                <Upload className="h-4 w-4" />
                FLP Import
              </Link>
              <Link href="/export" className="flex items-center gap-2 hover:text-cyan-200">
                <Save className="h-4 w-4" />
                Export
              </Link>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          {panel === "channel-rack" && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Channel Rack</h2>
                  <p className="text-sm text-slate-400">Create patterns using drums, bass, chords, leads and samples.</p>
                </div>
                <button className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">
                  Add Channel
                </button>
              </div>

              <div className="space-y-3">
                {channels.map((channel) => (
                  <div key={channel.name} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${channel.color}`} />
                        <div>
                          <p className="font-semibold">{channel.name}</p>
                          <p className="text-xs text-slate-500">{channel.type} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {channel.plugin}</p>
                        </div>
                      </div>
                      <button className="rounded-xl border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/10">
                        Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-16 gap-1">
                      {Array.from({ length: 16 }).map((_, index) => (
                        <button
                          key={index}
                          className={`h-8 rounded-lg border text-[10px] ${
                            channel.steps.includes(index)
                              ? `${channel.color} border-white/20 text-slate-950`
                              : "border-white/10 bg-slate-950 text-slate-600"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {panel === "playlist" && (
            <div>
              <h2 className="text-2xl font-bold">Playlist Arrangement</h2>
              <p className="mt-1 text-sm text-slate-400">Turn patterns into a full song structure.</p>

              <div className="mt-5 grid gap-3">
                {playlistSections.map((section) => (
                  <div key={section.name} className="grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-[120px_120px_1fr]">
                    <p className="font-bold text-cyan-200">{section.name}</p>
                    <p className="text-sm text-slate-400">{section.bars}</p>
                    <p className="text-sm text-slate-300">{section.idea}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {panel === "piano-roll" && (
            <div>
              <h2 className="text-2xl font-bold">Piano Roll</h2>
              <p className="mt-1 text-sm text-slate-400">Edit notes, chords, bass and melody timing.</p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"].map((note, row) => (
                  <div key={note} className="grid grid-cols-[60px_1fr] border-b border-white/5 last:border-b-0">
                    <div className="border-r border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-400">{note}</div>
                    <div className="grid grid-cols-16 gap-px bg-white/5 p-px">
                      {Array.from({ length: 16 }).map((_, index) => {
                        const active = (row + index) % 7 === 0 || (row === 3 && [0, 4, 8, 12].includes(index))
                        return (
                          <div key={index} className={`h-9 rounded ${active ? "bg-cyan-400" : "bg-slate-950"}`} />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {panel === "mixer" && (
            <div>
              <h2 className="text-2xl font-bold">Mixer</h2>
              <p className="mt-1 text-sm text-slate-400">Route channels, control volume, pan, effects and mastering.</p>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
                {mixerTracks.map((track, index) => (
                  <div key={track} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-sm font-bold">{track}</p>
                    <p className="text-xs text-slate-500">Insert {index}</p>
                    <div className="mt-4 flex h-40 items-end justify-center rounded-xl bg-slate-950 p-2">
                      <div className="h-28 w-5 rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400" />
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-400">
                      <p>EQ Pro</p>
                      <p>Compressor</p>
                      <p>Limiter</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {panel === "plugins" && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Native Plugin Rack</h2>
                  <p className="text-sm text-slate-400">PRO-TEVERSE plugins for production, mixing and AI assistance.</p>
                </div>

                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value as PluginCategory | "All")}
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option>All</option>
                  <option>Generator</option>
                  <option>Sampler</option>
                  <option>Effect</option>
                  <option>Mastering</option>
                  <option>AI</option>
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {visiblePlugins.map((plugin) => (
                  <div key={plugin.name} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{plugin.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{plugin.category}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[10px] ${statusStyle(plugin.status)}`}>
                        {plugin.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{plugin.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {panel === "ai" && (
            <div>
              <h2 className="text-2xl font-bold">AI Co-Producer</h2>
              <p className="mt-1 text-sm text-slate-400">
                Use AI to generate patterns, improve arrangements and match imported ZIP project sounds.
              </p>

              {zipProject && (
                <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="font-bold text-emerald-200">Imported ZIP Project Loaded</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {zipProject.projectName} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {summarizeZipProject(zipProject).activeTracks} active tracks ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· BPM {zipProject.bpm} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {zipProject.key}
                  </p>
                  <textarea
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    className="mt-3 min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-sm text-slate-200"
                  />

                  <button
                    onClick={() => void generateZipMatchedPattern()}
                    disabled={isAiGenerating}
                    className="mt-3 rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAiGenerating ? "Generating..." : "Generate ZIP-Matched Pattern"}
                  </button>

                  <p className="mt-3 text-sm text-slate-300">{aiStatus}</p>

                  {aiResult && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="font-bold text-cyan-200">{aiResult.title || "AI Pattern"}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        Source: {aiResult.source || "unknown"} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Notes: {aiResult.notes?.length || 0} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Pattern groups: {aiResult.pattern?.length || 0}
                      </p>
                      {aiResult.matchedZipProject && (
                        <p className="mt-1 text-xs text-emerald-200">
                          Matched {aiResult.matchedZipProject.activeTrackCount}/{aiResult.matchedZipProject.trackCount} active ZIP tracks from {aiResult.matchedZipProject.sourceZipName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  ["Generate Pattern", "Create drums, bass, chords and melody in the selected key."],
                  ["Match ZIP Project", "Use imported samples as the sound source instead of unrelated random notes."],
                  ["Create Arrangement", "Turn a loop into intro, hook, verse, drop and outro."],
                  ["Mix Assistant", "Suggest volume, pan, EQ, compression and master chain."],
                  ["Offline Full Song", "Use the local engine for full song idea generation."],
                  ["Export Plan", "Prepare MIDI, project JSON, modified ZIP and later WAV render."],
                ].map(([title, description]) => (
                  <button key={title} className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-left hover:bg-cyan-400/10">
                    <p className="flex items-center gap-2 font-bold text-cyan-100">
                      <Wand2 className="h-4 w-4" />
                      {title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <Library className="h-5 w-5 text-fuchsia-300" />
            Production Browser
          </h2>

          <div className="space-y-3">
            {browserItems.map(({ title, subtitle, Icon }) => (
              <div key={title} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-slate-500">{subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-200">
              <CircleDot className="h-4 w-4" />
              Next Engine Step
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {zipProject
                ? `${zipProject.projectName} is connected. Next: render active ZIP tracks into a WAV mix preview.`
                : "Connect ZIP Studio tracks into this workspace and add a Web Audio mix renderer so edits produce a real WAV preview."}
            </p>
          </div>
        </aside>
      </section>
    </main>
  )
}
