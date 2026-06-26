"use client"

import { useMemo, useRef, useState } from "react"
import { FolderOpen, Headphones, Library, Pause, Play, Search, ShieldCheck } from "lucide-react"
import {
  soundLibraryCategories,
  soundLibraryManifest,
  type SoundLibraryItem,
} from "@/lib/sound-library/manifest"

const categories: Array<"all" | SoundLibraryItem["category"]> = [
  "all",
  ...soundLibraryCategories,
]

function canPreview(path: string) {
  return /\.(wav|mp3|ogg|m4a|aac|flac)$/i.test(path)
}

function labelCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export function SampleBrowser() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<"all" | SoundLibraryItem["category"]>("all")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [message, setMessage] = useState("Add legal audio files to the folders, then register them in the manifest.")
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return soundLibraryManifest.filter((item) => {
      const matchesCategory = category === "all" || item.category === category
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.role.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [category, query])

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setPlayingId(null)
  }

  async function playPreview(item: SoundLibraryItem) {
    if (!canPreview(item.path)) {
      setMessage(`${item.name} is a placeholder. Add a real .wav, .mp3 or .ogg file before previewing.`)
      return
    }

    if (playingId === item.id) {
      stopPreview()
      return
    }

    stopPreview()

    const audio = new Audio(item.path)
    audioRef.current = audio
    setPlayingId(item.id)
    setMessage(`Previewing ${item.name}`)

    audio.onended = () => {
      setPlayingId(null)
      setMessage("Preview ended.")
    }

    try {
      await audio.play()
    } catch {
      setPlayingId(null)
      setMessage("Preview failed. Check that the audio file exists and is supported.")
    }
  }

  return (
    <section className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-400/10 p-3">
                  <Library className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">
                    PRO-TEVERSE
                  </p>
                  <h1 className="text-3xl font-black">Local Sound Library</h1>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                Browse legal offline sounds for drums, bass, keys, vocals, FX and loops.
                Only add sounds you own or sounds with a license that allows redistribution.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4" />
                Offline + legal-first
              </div>
              <p className="mt-1 text-xs text-emerald-100/80">
                No cloud API. No paid/cracked sample packs.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search kick, log drum, vocal, FX..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as "all" | SoundLibraryItem["category"])}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All categories" : labelCategory(item)}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
            {message}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
              const previewable = canPreview(item.path)
              const isPlaying = playingId === item.id

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        {item.category} / {item.role}
                      </p>
                      <h2 className="mt-2 text-lg font-bold">{item.name}</h2>
                    </div>

                    <button
                      onClick={() => void playPreview(item)}
                      className="rounded-2xl bg-cyan-400 px-3 py-2 text-slate-950 transition hover:bg-cyan-300"
                      title={previewable ? "Preview sound" : "Placeholder only"}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-slate-500" />
                      <span className="truncate">{item.path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      <span>License: {item.license}</span>
                    </div>
                    {item.bpm && <p>BPM: {item.bpm}</p>}
                    {item.key && <p>Key: {item.key}</p>}
                  </div>

                  {!previewable && (
                    <p className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-100">
                      Placeholder file. Replace with a legal audio file and update the manifest path.
                    </p>
                  )}
                </article>
              )
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">
              <Headphones className="mx-auto h-8 w-8" />
              <p className="mt-3">No sounds match your search yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
