"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  soundLibraryCategories,
  soundLibraryManifest,
  type SoundLibraryItem,
} from "@/lib/sound-library/manifest"
import { canPreviewSoundPath } from "@/lib/sound-library/selected-sound"
import {
  Download,
  FileAudio,
  Headphones,
  Library,
  Search,
  FolderOpen,
  Music2,
  Pause,
  Play,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react"

type AudioTrack = {
  id: string
  name: string
  fileName: string
  audioUrl?: string
  duration?: number
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  createdAt: string
}

type StepRow = {
  id: string
  name: string
  role: "kick" | "clap" | "hat" | "bass" | "chord" | "melody"
  steps: boolean[]
}

const stepCount = 16

const emptySteps = () => Array.from({ length: stepCount }, () => false)

const presetRows: StepRow[] = [
  {
    id: "kick",
    name: "Kick",
    role: "kick",
    steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
  },
  {
    id: "clap",
    name: "Clap",
    role: "clap",
    steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
  },
  {
    id: "hat",
    name: "Hi-Hat",
    role: "hat",
    steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
  },
  {
    id: "bass",
    name: "Bass / Log Drum",
    role: "bass",
    steps: [true, false, false, true, false, false, true, false, true, false, false, true, false, true, false, false],
  },
  {
    id: "chord",
    name: "Chords",
    role: "chord",
    steps: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
  },
  {
    id: "melody",
    name: "Melody",
    role: "melody",
    steps: emptySteps(),
  },
]

const supportedAudioExtensions = /\.(wav|mp3|ogg|m4a|aac|flac)$/i

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function cleanFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Imported Audio"
}

function formatSeconds(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return "Unknown"
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60).toString().padStart(2, "0")
  return `${mins}:${secs}`
}

export default function StudioPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  const [bpm, setBpm] = useState(112)
  const [songKey, setSongKey] = useState("C minor")
  const [projectName, setProjectName] = useState("PRO-TEVERSE Offline Project")
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [rows, setRows] = useState<StepRow[]>(presetRows)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [isTransportPlaying, setIsTransportPlaying] = useState(false)
  const [message, setMessage] = useState("Ready. Import audio, build a pattern, then export your project.")

  const [libraryQuery, setLibraryQuery] = useState("")
  const [libraryCategory, setLibraryCategory] = useState<"all" | SoundLibraryItem["category"]>("all")
  const [playingLibraryId, setPlayingLibraryId] = useState<string | null>(null)

  const rowsRef = useRef<StepRow[]>(presetRows)
  const audioContextRef = useRef<AudioContext | null>(null)
  const patternTimerRef = useRef<number | null>(null)
  const currentStepRef = useRef(0)
  const [currentStep, setCurrentStep] = useState<number | null>(null)

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  useEffect(() => {
    return () => {
      if (patternTimerRef.current !== null) {
        window.clearInterval(patternTimerRef.current)
      }

      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
      }

      void audioContextRef.current?.close()
    }
  }, [])

  function getAudioContext() {
    if (typeof window === "undefined") return null

    if (!audioContextRef.current) {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

      if (!AudioContextConstructor) return null
      audioContextRef.current = new AudioContextConstructor()
    }

    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume()
    }

    return audioContextRef.current
  }

  function playTone(
    context: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    gainValue = 0.18
  ) {
    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    gain.gain.setValueAtTime(gainValue, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(now)
    oscillator.stop(now + duration + 0.02)
  }

  function playKick(context: AudioContext) {
    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(135, now)
    oscillator.frequency.exponentialRampToValueAtTime(45, now + 0.16)

    gain.gain.setValueAtTime(0.9, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(now)
    oscillator.stop(now + 0.24)
  }

  function playNoise(
    context: AudioContext,
    duration: number,
    filterType: BiquadFilterType,
    filterFrequency: number,
    gainValue: number
  ) {
    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration))
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate)
    const samples = buffer.getChannelData(0)

    for (let index = 0; index < sampleCount; index += 1) {
      samples[index] = Math.random() * 2 - 1
    }

    const now = context.currentTime
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()

    source.buffer = buffer
    filter.type = filterType
    filter.frequency.setValueAtTime(filterFrequency, now)

    gain.gain.setValueAtTime(gainValue, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(context.destination)

    source.start(now)
  }

  function playPatternSound(context: AudioContext, role: StepRow["role"]) {
    if (role === "kick") {
      playKick(context)
      return
    }

    if (role === "clap") {
      playNoise(context, 0.12, "bandpass", 1800, 0.24)
      return
    }

    if (role === "hat") {
      playNoise(context, 0.05, "highpass", 6500, 0.12)
      return
    }

    if (role === "bass") {
      playTone(context, 55, 0.18, "sawtooth", 0.2)
      return
    }

    if (role === "chord") {
      ;[261.63, 311.13, 392].forEach((frequency) =>
        playTone(context, frequency, 0.35, "triangle", 0.07)
      )
      return
    }

    playTone(context, 523.25, 0.16, "square", 0.08)
  }

  function playPatternStep(stepIndex: number) {
    const context = getAudioContext()

    if (!context) {
      setMessage("Pattern playback is not supported in this browser.")
      return
    }

    rowsRef.current.forEach((row) => {
      if (row.steps[stepIndex]) {
        playPatternSound(context, row.role)
      }
    })
  }

  function startPatternPlayback() {
    stopPreview()

    if (patternTimerRef.current !== null) {
      window.clearInterval(patternTimerRef.current)
      patternTimerRef.current = null
    }

    const context = getAudioContext()

    if (!context) {
      setMessage("Pattern playback is not supported in this browser.")
      return
    }

    const safeBpm = Math.max(40, Math.min(220, bpm))
    const stepMs = Math.max(40, (60 / safeBpm / 4) * 1000)

    currentStepRef.current = 0
    setCurrentStep(0)
    setIsTransportPlaying(true)
    setMessage(`Pattern playback started at ${safeBpm} BPM.`)

    playPatternStep(0)

    patternTimerRef.current = window.setInterval(() => {
      const nextStep = (currentStepRef.current + 1) % stepCount
      currentStepRef.current = nextStep
      setCurrentStep(nextStep)
      playPatternStep(nextStep)
    }, stepMs)
  }

  function stopPatternPlayback() {
    if (patternTimerRef.current !== null) {
      window.clearInterval(patternTimerRef.current)
      patternTimerRef.current = null
    }

    stopPreview()
    setCurrentStep(null)
    setIsTransportPlaying(false)
    setMessage("Transport stopped.")
  }

  const activeStepCount = useMemo(
    () => rows.reduce((total, row) => total + row.steps.filter(Boolean).length, 0),
    [rows]
  )

  const filteredLibraryItems = useMemo(() => {
    const normalizedQuery = libraryQuery.trim().toLowerCase()

    return soundLibraryManifest.filter((item) => {
      const matchesCategory = libraryCategory === "all" || item.category === libraryCategory
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.role.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [libraryCategory, libraryQuery])

  function stopPreview() {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.currentTime = 0
    }

    setPlayingTrackId(null)
    setPlayingLibraryId(null)
  }

  async function importAudio(file: File) {
    if (!supportedAudioExtensions.test(file.name)) {
      setMessage("Unsupported file. Please use WAV, MP3, OGG, M4A, AAC or FLAC.")
      return
    }

    const audioUrl = URL.createObjectURL(file)
    const id = makeId()

    const track: AudioTrack = {
      id,
      name: cleanFileName(file.name),
      fileName: file.name,
      audioUrl,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      createdAt: new Date().toISOString(),
    }

    setTracks((current) => [...current, track])
    setMessage(`${file.name} imported as an audio track.`)

    const audio = new Audio(audioUrl)
    audio.onloadedmetadata = () => {
      setTracks((current) =>
        current.map((item) =>
          item.id === id ? { ...item, duration: audio.duration } : item
        )
      )
    }
  }

  async function playTrack(track: AudioTrack) {
    if (!track.audioUrl) {
      setMessage("This track has no playable audio. Re-import the local file.")
      return
    }

    if (playingTrackId === track.id) {
      stopPreview()
      return
    }

    stopPreview()

    const audio = new Audio(track.audioUrl)
    audio.volume = track.muted ? 0 : track.volume
    previewAudioRef.current = audio
    setPlayingTrackId(track.id)
    setMessage(`Playing ${track.name}`)

    audio.onended = () => {
      setPlayingTrackId(null)
    setPlayingLibraryId(null)
      setMessage("Playback stopped.")
    }

    try {
      await audio.play()
    } catch {
      setPlayingTrackId(null)
    setPlayingLibraryId(null)
      setMessage("Playback failed. Try another audio file.")
    }
  }


  async function previewLibraryItem(item: SoundLibraryItem) {
    if (!canPreviewSoundPath(item.path)) {
      setMessage(`${item.name} is a placeholder. Add a real WAV, MP3 or OGG file in public${item.path}.`)
      return
    }

    if (playingLibraryId === item.id) {
      stopPreview()
      return
    }

    stopPreview()

    const audio = new Audio(item.path)
    previewAudioRef.current = audio
    setPlayingLibraryId(item.id)
    setMessage(`Previewing library sound: ${item.name}`)

    audio.onended = () => {
      setPlayingLibraryId(null)
      setMessage("Library preview ended.")
    }

    try {
      await audio.play()
    } catch {
      setPlayingLibraryId(null)
      setMessage("Library preview failed. Confirm the audio file exists in public/sound-library.")
    }
  }

  function addLibraryItemToTimeline(item: SoundLibraryItem) {
    const playable = canPreviewSoundPath(item.path)
    const id = makeId()

    const track: AudioTrack = {
      id,
      name: item.name,
      fileName: item.path.split("/").pop() || item.name,
      audioUrl: playable ? item.path : undefined,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      createdAt: new Date().toISOString(),
    }

    setTracks((current) => [...current, track])
    setMessage(
      playable
        ? `${item.name} added from Sound Library.`
        : `${item.name} added as a placeholder. Replace the README path with a real legal audio file.`
    )
  }
  function toggleStep(rowId: string, index: number) {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              steps: row.steps.map((step, stepIndex) =>
                stepIndex === index ? !step : step
              ),
            }
          : row
      )
    )
  }

  function clearPattern() {
    setRows((current) => current.map((row) => ({ ...row, steps: emptySteps() })))
    setMessage("Pattern cleared.")
  }

  function loadAmapianoPreset() {
    setRows(presetRows)
    setBpm(112)
    setSongKey("C minor")
    setMessage("Amapiano starter pattern loaded.")
  }

  function updateTrack(trackId: string, updates: Partial<AudioTrack>) {
    setTracks((current) =>
      current.map((track) => (track.id === trackId ? { ...track, ...updates } : track))
    )
  }

  function removeTrack(trackId: string) {
    if (playingTrackId === trackId) stopPreview()
    setTracks((current) => current.filter((track) => track.id !== trackId))
    setMessage("Track removed.")
  }

  function saveProject() {
    const payload = {
      projectName,
      bpm,
      songKey,
      rows,
      tracks: tracks.map((track) => ({
        ...track,
        audioUrl: undefined,
        note: "Local audio files must be re-imported because browsers cannot permanently store file paths.",
      })),
      savedAt: new Date().toISOString(),
    }

    localStorage.setItem("proteverse-one-studio-project", JSON.stringify(payload, null, 2))
    setMessage("Project saved locally in this browser.")
  }

  function exportProjectJson() {
    const payload = {
      app: "PRO-TEVERSE",
      version: "one-studio-rebuild",
      projectName,
      bpm,
      songKey,
      pattern: rows,
      tracks: tracks.map((track) => ({
        id: track.id,
        name: track.name,
        fileName: track.fileName,
        duration: track.duration,
        volume: track.volume,
        pan: track.pan,
        muted: track.muted,
        solo: track.solo,
        createdAt: track.createdAt,
      })),
      exportedAt: new Date().toISOString(),
      legalNotice:
        "This project export does not include copyrighted audio files. Keep proof of licensing for all samples.",
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${projectName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-project.json`
    link.click()
    URL.revokeObjectURL(url)

    setMessage("Project JSON exported.")
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-black/30 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
              PRO-TEVERSE One Studio
            </p>
            <h1 className="mt-2 text-3xl font-black">Offline Music Studio</h1>
            <p className="mt-1 text-sm text-slate-400">
              One clean workspace for import, pattern making, timeline, mixer and export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={startPatternPlayback}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-300"
            >
              <Play className="h-4 w-4" />
              Play
            </button>

            <button
              onClick={stopPatternPlayback}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>

            <button
              onClick={saveProject}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-400/20"
            >
              <Save className="h-4 w-4" />
              Save
            </button>

            <button
              onClick={exportProjectJson}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[300px_1fr_320px]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-cyan-100">
              <SlidersHorizontal className="h-4 w-4" />
              Project Setup
            </p>

            <label className="mt-4 block text-xs text-slate-400">Project name</label>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block text-xs text-slate-400">
                BPM
                <input
                  type="number"
                  min={60}
                  max={200}
                  value={bpm}
                  onChange={(event) => setBpm(Number(event.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300"
                />
              </label>

              <label className="block text-xs text-slate-400">
                Key
                <input
                  value={songKey}
                  onChange={(event) => setSongKey(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300"
                />
              </label>
            </div>

            <p className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
              Status: {isTransportPlaying ? "Playing" : "Stopped"} / {tracks.length} tracks / {activeStepCount} active pattern steps / Step {currentStep === null ? "-" : currentStep + 1}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-fuchsia-100">
              <FileAudio className="h-4 w-4" />
              Import Audio
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Import your own legal WAV, MP3, OGG, M4A, AAC or FLAC files from this PC.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,.ogg,.m4a,.aac,.flac,audio/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void importAudio(file)
                event.currentTarget.value = ""
              }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-fuchsia-300"
            >
              <Upload className="h-4 w-4" />
              Choose Audio File
            </button>

            <p className="mt-3 flex items-center gap-2 text-xs text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Use only your own or properly licensed sounds.
            </p>
          </div>
        </aside>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-cyan-100">
              <Library className="h-4 w-4" />
              Sound Library
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Browse local legal sounds. Placeholder README files must be replaced with real licensed audio files.
            </p>

            <label className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={libraryQuery}
                onChange={(event) => setLibraryQuery(event.target.value)}
                placeholder="Search kick, bass, vocal..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </label>

            <select
              value={libraryCategory}
              onChange={(event) => setLibraryCategory(event.target.value as "all" | SoundLibraryItem["category"])}
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
            >
              <option value="all">All categories</option>
              {soundLibraryCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
              {filteredLibraryItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">
                  <Headphones className="mx-auto h-5 w-5" />
                  <p className="mt-2">No library sounds found.</p>
                </div>
              ) : (
                filteredLibraryItems.map((item) => {
                  const playable = canPreviewSoundPath(item.path)

                  return (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold">{item.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                            {item.category} / {item.role}
                          </p>
                        </div>

                        <button
                          onClick={() => void previewLibraryItem(item)}
                          className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300"
                        >
                          {playingLibraryId === item.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                      </div>

                      <p className="mt-2 truncate text-xs text-slate-400">{item.path}</p>
                      <p className="mt-1 text-xs text-emerald-200">License: {item.license}</p>

                      {!playable && (
                        <p className="mt-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-2 py-1 text-xs text-yellow-100">
                          Placeholder only
                        </p>
                      )}

                      <button
                        onClick={() => addLibraryItemToTimeline(item)}
                        className="mt-3 w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/20"
                      >
                        Add to Timeline
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-cyan-100">
                  <Wand2 className="h-4 w-4" />
                  Pattern Maker
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Build a simple 16-step drum, bass, chord and melody pattern.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={loadAmapianoPreset}
                  className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
                >
                  Amapiano Preset
                </button>
                <button
                  onClick={clearPattern}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-900 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-bold">{row.name}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{row.role}</p>
                  </div>

                  <div className="grid grid-cols-8 gap-2 md:grid-cols-16">
                    {row.steps.map((active, index) => (
                      <button
                        key={`${row.id}-${index}`}
                        onClick={() => toggleStep(row.id, index)}
                        className={`h-9 rounded-lg text-xs font-bold transition ${currentStep === index ? "ring-2 ring-fuchsia-300 scale-105" : ""} ${
                          active
                            ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                            : "bg-slate-800 text-slate-500 hover:bg-slate-700"
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

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-cyan-100">
              <Music2 className="h-4 w-4" />
              Timeline
            </p>

            <div className="mt-4 space-y-3">
              {tracks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                  No audio tracks yet. Import a local audio file to start.
                </div>
              ) : (
                tracks.map((track) => (
                  <div key={track.id} className="rounded-2xl border border-white/10 bg-slate-900 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{track.name}</p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <FolderOpen className="h-3 w-3" />
                          {track.fileName} / {formatSeconds(track.duration)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => void playTrack(track)}
                          className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300"
                        >
                          {playingTrackId === track.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() => removeTrack(track.id)}
                          className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-400/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 h-12 rounded-xl bg-gradient-to-r from-cyan-400/30 via-fuchsia-400/30 to-emerald-400/30" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-cyan-100">
              <SlidersHorizontal className="h-4 w-4" />
              Mixer
            </p>

            <div className="mt-4 space-y-3">
              {tracks.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400">
                  Import audio to show mixer channels.
                </p>
              ) : (
                tracks.map((track) => (
                  <div key={track.id} className="rounded-2xl border border-white/10 bg-slate-900 p-3">
                    <p className="font-bold">{track.name}</p>

                    <label className="mt-3 block text-xs text-slate-400">
                      Volume {Math.round(track.volume * 100)}%
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={track.volume}
                        onChange={(event) =>
                          updateTrack(track.id, { volume: Number(event.target.value) })
                        }
                        className="mt-2 w-full"
                      />
                    </label>

                    <label className="mt-3 block text-xs text-slate-400">
                      Pan {track.pan}
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.01}
                        value={track.pan}
                        onChange={(event) =>
                          updateTrack(track.id, { pan: Number(event.target.value) })
                        }
                        className="mt-2 w-full"
                      />
                    </label>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateTrack(track.id, { muted: !track.muted })}
                        className={`rounded-xl px-3 py-2 text-xs font-bold ${
                          track.muted
                            ? "bg-red-400 text-slate-950"
                            : "border border-white/10 text-slate-300"
                        }`}
                      >
                        Mute
                      </button>

                      <button
                        onClick={() => updateTrack(track.id, { solo: !track.solo })}
                        className={`rounded-xl px-3 py-2 text-xs font-bold ${
                          track.solo
                            ? "bg-yellow-300 text-slate-950"
                            : "border border-white/10 text-slate-300"
                        }`}
                      >
                        Solo
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-bold text-cyan-100">Next Engine Steps</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>1. Pattern playback added.</p>
              <p>2. Sound library panel added.</p>
              <p>3. Add WAV render/export.</p>
              <p>4. Redirect old pages to this Studio.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Status</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>
          </div>
        </aside>
      </section>
    </main>
  )
}
