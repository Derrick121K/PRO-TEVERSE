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
  startSeconds?: number
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
const PROJECT_STORAGE_KEY = "proteverse-one-studio-project"

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function cleanFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Imported Audio"
}

function isPersistentAudioUrl(audioUrl?: string) {
  return Boolean(audioUrl && audioUrl.startsWith("/"))
}

function serializeTrackForSave(track: AudioTrack) {
  const persistentAudioUrl = isPersistentAudioUrl(track.audioUrl) ? track.audioUrl : undefined

  return {
    ...track,
    audioUrl: persistentAudioUrl,
    needsReimport: !persistentAudioUrl,
    note: persistentAudioUrl
      ? "This track uses a project sound-library path and can reload."
      : "This track was imported from the user's PC and must be re-imported after refresh.",
  }
}

function normalizeStartSeconds(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(600, value))
}

function formatSeconds(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return "Unknown"

  if (seconds < 10) {
    return `${seconds.toFixed(2)}s`
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60).toString().padStart(2, "0")
  return `${mins}:${secs}`
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index))
  }
}

function audioBufferToWav(buffer: AudioBuffer) {
  const channelCount = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const sampleCount = buffer.length
  const bytesPerSample = 2
  const blockAlign = channelCount * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = sampleCount * blockAlign
  const wav = new ArrayBuffer(44 + dataSize)
  const view = new DataView(wav)

  writeAscii(view, 0, "RIFF")
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(view, 8, "WAVE")
  writeAscii(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channelCount, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, "data")
  view.setUint32(40, dataSize, true)

  let offset = 44

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const channel = buffer.getChannelData(channelIndex)
      const sample = Math.max(-1, Math.min(1, channel[sampleIndex] || 0))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += bytesPerSample
    }
  }

  return wav
}

function scheduleRenderTone(
  context: OfflineAudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "sine",
  gainValue = 0.18
) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)

  gain.gain.setValueAtTime(gainValue, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  oscillator.connect(gain)
  gain.connect(context.destination)

  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.02)
}

function scheduleRenderKick(context: OfflineAudioContext, startTime: number) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(135, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(45, startTime + 0.16)

  gain.gain.setValueAtTime(0.9, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22)

  oscillator.connect(gain)
  gain.connect(context.destination)

  oscillator.start(startTime)
  oscillator.stop(startTime + 0.24)
}

function scheduleRenderNoise(
  context: OfflineAudioContext,
  startTime: number,
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

  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()

  source.buffer = buffer
  filter.type = filterType
  filter.frequency.setValueAtTime(filterFrequency, startTime)

  gain.gain.setValueAtTime(gainValue, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)

  source.start(startTime)
}

function scheduleRenderPatternSound(
  context: OfflineAudioContext,
  role: StepRow["role"],
  startTime: number
) {
  if (role === "kick") {
    scheduleRenderKick(context, startTime)
    return
  }

  if (role === "clap") {
    scheduleRenderNoise(context, startTime, 0.12, "bandpass", 1800, 0.24)
    return
  }

  if (role === "hat") {
    scheduleRenderNoise(context, startTime, 0.05, "highpass", 6500, 0.12)
    return
  }

  if (role === "bass") {
    scheduleRenderTone(context, 55, startTime, 0.18, "sawtooth", 0.2)
    return
  }

  if (role === "chord") {
    ;[261.63, 311.13, 392].forEach((frequency) =>
      scheduleRenderTone(context, frequency, startTime, 0.35, "triangle", 0.07)
    )
    return
  }

  scheduleRenderTone(context, 523.25, startTime, 0.16, "square", 0.08)
}

export default function StudioPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const playbackNodesRef = useRef<{
    source: MediaElementAudioSourceNode
    gain: GainNode
    panner: StereoPannerNode | null
  } | null>(null)

  const [bpm, setBpm] = useState(112)
  const [songKey, setSongKey] = useState("C minor")
  const [projectName, setProjectName] = useState("PRO-TEVERSE Offline Project")
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [rows, setRows] = useState<StepRow[]>(presetRows)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [isTransportPlaying, setIsTransportPlaying] = useState(false)
  const [message, setMessage] = useState("Ready. Import audio, build a pattern, then export your project.")
  const [isRenderingWav, setIsRenderingWav] = useState(false)

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

  function disconnectPlaybackNodes() {
    if (!playbackNodesRef.current) return

    try {
      playbackNodesRef.current.source.disconnect()
      playbackNodesRef.current.gain.disconnect()
      playbackNodesRef.current.panner?.disconnect()
    } catch {
      // Already disconnected.
    }

    playbackNodesRef.current = null
  }

  function stopPreview() {
    disconnectPlaybackNodes()

if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.currentTime = 0
    }

    setPlayingTrackId(null)
    setPlayingLibraryId(null)
  }

  function loadTrackDuration(trackId: string, audioUrl?: string) {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)

    audio.onloadedmetadata = () => {
      if (!Number.isFinite(audio.duration)) return

      setTracks((current) =>
        current.map((item) =>
          item.id === trackId ? { ...item, duration: audio.duration } : item
        )
      )
    }

    audio.onerror = () => {
      setMessage("Could not read track duration. The audio may still play.")
    }
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
    loadTrackDuration(id, audioUrl)
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
    const context = getAudioContext()

    previewAudioRef.current = audio
    setPlayingTrackId(track.id)
    setMessage(`Playing ${track.name} with volume ${Math.round(track.volume * 100)}% and pan ${track.pan}.`)

    if (context) {
      try {
        const source = context.createMediaElementSource(audio)
        const gain = context.createGain()
        const panner =
          typeof context.createStereoPanner === "function"
            ? context.createStereoPanner()
            : null

        gain.gain.value = track.muted ? 0 : track.volume

        if (panner) {
          panner.pan.value = Math.max(-1, Math.min(1, track.pan))
          source.connect(gain)
          gain.connect(panner)
          panner.connect(context.destination)
        } else {
          source.connect(gain)
          gain.connect(context.destination)
        }

        playbackNodesRef.current = { source, gain, panner }
      } catch {
        audio.volume = track.muted ? 0 : track.volume
      }
    } else {
      audio.volume = track.muted ? 0 : track.volume
    }

    audio.onended = () => {
      disconnectPlaybackNodes()
      setPlayingTrackId(null)
      setMessage("Playback stopped.")
    }

    try {
      await audio.play()
    } catch {
      disconnectPlaybackNodes()
      setPlayingTrackId(null)
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
    const context = getAudioContext()

    previewAudioRef.current = audio
    setPlayingLibraryId(item.id)
    setMessage(`Previewing library sound: ${item.name}`)

    if (context) {
      try {
        const source = context.createMediaElementSource(audio)
        const gain = context.createGain()
        const panner =
          typeof context.createStereoPanner === "function"
            ? context.createStereoPanner()
            : null

        gain.gain.value = 0.8

        if (panner) {
          panner.pan.value = 0
          source.connect(gain)
          gain.connect(panner)
          panner.connect(context.destination)
        } else {
          source.connect(gain)
          gain.connect(context.destination)
        }

        playbackNodesRef.current = { source, gain, panner }
      } catch {
        audio.volume = 0.8
      }
    } else {
      audio.volume = 0.8
    }

    audio.onended = () => {
      disconnectPlaybackNodes()
      setPlayingLibraryId(null)
      setMessage("Library preview ended.")
    }

    try {
      await audio.play()
    } catch {
      disconnectPlaybackNodes()
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

    if (playable) {
      loadTrackDuration(id, item.path)
    }

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
      app: "PRO-TEVERSE",
      version: "one-studio-rebuild",
      projectName,
      bpm,
      songKey,
      rows,
      tracks: tracks.map(serializeTrackForSave),
      savedAt: new Date().toISOString(),
    }

    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(payload, null, 2))
    setMessage("Project saved locally. Sound-library tracks can reload; PC-imported audio must be re-imported after refresh.")
  }

  function loadProject() {
    const saved = localStorage.getItem(PROJECT_STORAGE_KEY)

    if (!saved) {
      setMessage("No saved project found yet.")
      return
    }

    try {
      const parsed = JSON.parse(saved) as {
        projectName?: string
        bpm?: number
        songKey?: string
        rows?: StepRow[]
        pattern?: StepRow[]
        tracks?: Array<Partial<AudioTrack>>
      }

      setProjectName(parsed.projectName || "PRO-TEVERSE Offline Project")
      setBpm(typeof parsed.bpm === "number" ? parsed.bpm : 112)
      setSongKey(parsed.songKey || "C minor")

      const loadedRows = Array.isArray(parsed.rows)
        ? parsed.rows
        : Array.isArray(parsed.pattern)
          ? parsed.pattern
          : presetRows

      setRows(loadedRows)

      const loadedTracks: AudioTrack[] = Array.isArray(parsed.tracks)
        ? parsed.tracks.map((track) => ({
            id: typeof track.id === "string" ? track.id : makeId(),
            name: typeof track.name === "string" ? track.name : "Recovered Track",
            fileName: typeof track.fileName === "string" ? track.fileName : "missing-audio-file",
            audioUrl:
              typeof track.audioUrl === "string" && isPersistentAudioUrl(track.audioUrl)
                ? track.audioUrl
                : undefined,
            duration: typeof track.duration === "number" ? track.duration : undefined,
            startSeconds: typeof track.startSeconds === "number" ? normalizeStartSeconds(track.startSeconds) : 0,
            volume: typeof track.volume === "number" ? track.volume : 0.8,
            pan: typeof track.pan === "number" ? track.pan : 0,
            muted: Boolean(track.muted),
            solo: Boolean(track.solo),
            createdAt: typeof track.createdAt === "string" ? track.createdAt : new Date().toISOString(),
          }))
        : []

      setTracks(loadedTracks)
      loadedTracks.forEach((track) => {
        if (track.audioUrl && !track.duration) loadTrackDuration(track.id, track.audioUrl)
      })
      setCurrentStep(null)
      setIsTransportPlaying(false)
      setMessage(`Loaded saved project: ${parsed.projectName || "PRO-TEVERSE Offline Project"}. Re-import PC audio if any track has no playback.`)
    } catch {
      setMessage("Saved project could not be loaded. The local save may be corrupted.")
    }
  }

  function clearProject() {
    stopPatternPlayback()
    localStorage.removeItem(PROJECT_STORAGE_KEY)
    setProjectName("PRO-TEVERSE Offline Project")
    setBpm(112)
    setSongKey("C minor")
    setRows(presetRows)
    setTracks([])
    setMessage("Project cleared.")
  }

  async function exportPatternWav() {
    if (isRenderingWav) return

    setIsRenderingWav(true)
    setMessage("Rendering pattern and timeline WAV...")

    try {
      const OfflineAudioContextConstructor =
        window.OfflineAudioContext ||
        (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext

      if (!OfflineAudioContextConstructor) {
        setMessage("WAV rendering is not supported in this browser.")
        return
      }

      const sampleRate = 44100
      const safeBpm = Math.max(40, Math.min(220, bpm))
      const stepSeconds = 60 / safeBpm / 4
      const barsToRender = 8
      const patternSeconds = stepSeconds * stepCount * barsToRender
      const hasSolo = tracks.some((track) => track.solo)

      const playableTracks = tracks.filter(
        (track) =>
          track.audioUrl &&
          !track.muted &&
          (!hasSolo || track.solo)
      )

      const longestTrackSeconds = playableTracks.reduce(
        (longest, track) => Math.max(longest, (track.startSeconds ?? 0) + (track.duration || 0)),
        0
      )

      const renderSeconds = Math.max(patternSeconds + 0.6, longestTrackSeconds + 0.6)
      const frameCount = Math.ceil(sampleRate * renderSeconds)
      const offlineContext = new OfflineAudioContextConstructor(2, frameCount, sampleRate)

      for (let bar = 0; bar < barsToRender; bar += 1) {
        for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
          const startTime = (bar * stepCount + stepIndex) * stepSeconds

          rows.forEach((row) => {
            if (row.steps[stepIndex]) {
              scheduleRenderPatternSound(offlineContext, row.role, startTime)
            }
          })
        }
      }

      const failedTracks: string[] = []

      await Promise.all(
        playableTracks.map(async (track) => {
          try {
            const response = await fetch(track.audioUrl as string)
            const arrayBuffer = await response.arrayBuffer()
            const decoded = await offlineContext.decodeAudioData(arrayBuffer.slice(0))
            const source = offlineContext.createBufferSource()
            const gain = offlineContext.createGain()
            const panner =
              typeof offlineContext.createStereoPanner === "function"
                ? offlineContext.createStereoPanner()
                : null

            source.buffer = decoded
            gain.gain.value = track.volume

            if (panner) {
              panner.pan.value = Math.max(-1, Math.min(1, track.pan))
              source.connect(gain)
              gain.connect(panner)
              panner.connect(offlineContext.destination)
            } else {
              source.connect(gain)
              gain.connect(offlineContext.destination)
            }

            source.start(normalizeStartSeconds(track.startSeconds ?? 0))
          } catch {
            failedTracks.push(track.name)
          }
        })
      )

      const renderedBuffer = await offlineContext.startRendering()
      const wav = audioBufferToWav(renderedBuffer)
      const blob = new Blob([wav], { type: "audio/wav" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = `${projectName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-mix.wav`
      link.click()

      URL.revokeObjectURL(url)

      if (failedTracks.length > 0) {
        setMessage(`WAV exported with pattern and ${playableTracks.length - failedTracks.length} timeline tracks. Some tracks failed: ${failedTracks.join(", ")}.`)
      } else {
        setMessage(`WAV exported with pattern and ${playableTracks.length} timeline track(s).`)
      }
    } catch {
      setMessage("WAV export failed. Try stopping playback first, then export again.")
    } finally {
      setIsRenderingWav(false)
    }
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
        audioUrl: isPersistentAudioUrl(track.audioUrl) ? track.audioUrl : undefined,
        needsReimport: !isPersistentAudioUrl(track.audioUrl),
        duration: track.duration,
        startSeconds: track.startSeconds ?? 0,
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
              onClick={loadProject}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-400/20"
            >
              <FolderOpen className="h-4 w-4" />
              Load
            </button>

            <button
              onClick={clearProject}
              className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-100 hover:bg-red-400/20"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>

            <button
              onClick={() => void exportPatternWav()}
              disabled={isRenderingWav}
              className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm font-bold text-fuchsia-100 hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Music2 className="h-4 w-4" />
              {isRenderingWav ? "Rendering..." : "Export WAV"}
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
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-bold text-cyan-100">Timeline Start Positions</p>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Set when each timeline track should start in the exported WAV mix.
            </p>

            {tracks.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">
                Add tracks to the timeline to control their start positions.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {tracks.map((track) => (
                  <div key={`start-${track.id}`} className="rounded-2xl border border-white/10 bg-slate-900 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{track.name}</p>
                        <p className="text-xs text-slate-400">
                          Starts at {(track.startSeconds ?? 0).toFixed(2)}s
                        </p>
                      </div>

                      <input
                        type="number"
                        min={0}
                        max={600}
                        step={0.25}
                        value={track.startSeconds ?? 0}
                        onChange={(event) => {
                          const startSeconds = normalizeStartSeconds(Number(event.target.value))

                          setTracks((current) =>
                            current.map((item) =>
                              item.id === track.id ? { ...item, startSeconds } : item
                            )
                          )
                        }}
                        className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none"
                      />
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={32}
                      step={0.25}
                      value={track.startSeconds ?? 0}
                      onChange={(event) => {
                        const startSeconds = normalizeStartSeconds(Number(event.target.value))

                        setTracks((current) =>
                          current.map((item) =>
                            item.id === track.id ? { ...item, startSeconds } : item
                          )
                        )
                      }}
                      className="mt-3 w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
            <p className="text-sm font-bold text-cyan-100">Next Engine Steps</p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>1. Pattern playback added.</p>
              <p>2. Sound library panel added.</p>
              <p>3. Save/load project added.</p>
              <p>4. Pattern WAV export added.</p>
              <p>5. Sound-library duration loading added.</p>
              <p>6. Mixer pan playback added.</p>
              <p>7. Timeline tracks added to WAV export.</p>
              <p>8. Timeline start positions added.</p>
              <p>9. Desktop installer later.</p>
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
