"use client"

import { useState, type ElementType } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDAWStore, type Note } from "@/lib/daw-store"
import {
  Sparkles,
  Wand2,
  Music,
  Drum,
  Sliders,
  RefreshCw,
  Play,
  Loader2,
  ChevronDown,
  ChevronRight,
  Headphones,
} from "lucide-react"

interface AIFeature {
  id: string
  name: string
  description: string
  icon: ElementType
  color: string
}

const aiFeatures: AIFeature[] = [
  {
    id: "producer",
    name: "Offline AI Producer",
    description: "Offline session: drums, melody and bass mixed for your project",
    icon: Headphones,
    color: "#a855f7",
  },
  {
    id: "text-to-music",
    name: "Text to Music",
    description: "Describe your music and generate local MIDI patterns offline",
    icon: Wand2,
    color: "#00d4ff",
  },
  {
    id: "melody-gen",
    name: "Melody Generator",
    description: "Generate melodies locally in any key and scale",
    icon: Music,
    color: "#8b5cf6",
  },
  {
    id: "drum-gen",
    name: "Drum Pattern",
    description: "Create local drum patterns in different styles",
    icon: Drum,
    color: "#ec4899",
  },
  {
    id: "auto-mix",
    name: "Auto Mix",
    description: "Balance track volume and pan locally",
    icon: Sliders,
    color: "#10b981",
  },
]

const musicalKeys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const scales = ["Major", "Minor", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Harmonic Minor"]
const drumStyles = ["Hip Hop", "Trap", "House", "Techno", "Lo-Fi", "Drill", "Boom Bap", "Future Bass"]
const producerGenres = ["Trap", "Lo-Fi", "House", "Hip Hop", "Electronic", "R&B", "Amapiano"] as const

const keyToRoot: Record<string, number> = {
  C: 60,
  "C#": 61,
  D: 62,
  "D#": 63,
  E: 64,
  F: 65,
  "F#": 66,
  G: 67,
  "G#": 68,
  A: 69,
  "A#": 70,
  B: 71,
}

const scalePatterns: Record<string, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
}

const producerPresets: Record<string, { key: string; scale: string; drum: string; bassRoot: number }> = {
  Trap: { key: "C", scale: "Minor", drum: "Trap", bassRoot: 36 },
  "Lo-Fi": { key: "F", scale: "Major", drum: "Lo-Fi", bassRoot: 41 },
  House: { key: "A", scale: "Minor", drum: "House", bassRoot: 45 },
  "Hip Hop": { key: "D", scale: "Dorian", drum: "Boom Bap", bassRoot: 38 },
  Electronic: { key: "E", scale: "Minor", drum: "Techno", bassRoot: 40 },
  "R&B": { key: "G", scale: "Major", drum: "Hip Hop", bassRoot: 43 },
  Amapiano: { key: "C", scale: "Minor", drum: "House", bassRoot: 36 },
}

type ProducerTrackPlan = {
  name: string
  instrumentKey: string | undefined
  notes: Note[]
  color: string
}

function randomVelocity(base: number, spread = 18) {
  return Math.min(127, Math.max(1, base + Math.random() * spread))
}

function generateMelody(key: string, scale: string, complexity: number): Note[] {
  const root = keyToRoot[key] ?? 60
  const pattern = scalePatterns[scale] || scalePatterns.Minor
  const notes: Note[] = []
  const numNotes = Math.floor(6 + (complexity / 100) * 14)
  const stepSize = complexity > 65 ? 0.5 : 1

  for (let i = 0; i < numNotes; i++) {
    const scaleIndex = Math.floor(Math.random() * pattern.length)
    const octave = i % 5 === 0 ? 12 : 0

    notes.push({
      id: `offline-melody-${i}`,
      pitch: root + pattern[scaleIndex] + octave,
      start: Number((i * stepSize).toFixed(2)),
      duration: complexity > 70 ? 0.45 : 0.85,
      velocity: randomVelocity(70, 30),
    })
  }

  return notes
}

function generateBassLine(key: string, lengthBeats: number): Note[] {
  const rootMidi = (keyToRoot[key] ?? 60) - 24
  const notes: Note[] = []

  for (let step = 0; step < lengthBeats * 2; step++) {
    const t = step * 0.5
    const interval = step % 8 < 4 ? 0 : 7

    notes.push({
      id: `offline-bass-${step}`,
      pitch: rootMidi + interval,
      start: t,
      duration: 0.45,
      velocity: randomVelocity(78, 18),
    })
  }

  return notes
}

function generateAmapianoLogBass(key: string): Note[] {
  const rootMidi = (keyToRoot[key] ?? 60) - 24
  const rhythm = [0, 0.75, 1.5, 2.5, 3, 4.25, 5.5, 6.25, 7, 8, 9.25, 10, 11.5, 12, 13.25, 14.5]

  return rhythm.map((start, index) => ({
    id: `offline-log-${index}`,
    pitch: rootMidi + (index % 4 === 3 ? 10 : index % 2 === 0 ? 0 : 7),
    start,
    duration: 0.35,
    velocity: randomVelocity(82, 24),
  }))
}

function generateDrumPattern(style: string, intensity: number): Note[] {
  const notes: Note[] = []
  const steps = 16
  const lowerStyle = style.toLowerCase()

  for (let i = 0; i < steps; i++) {
    const strongKick = i % 4 === 0
    const houseKick = lowerStyle.includes("house") && i % 4 === 0
    const trapKick = lowerStyle.includes("trap") && [0, 3, 7, 10, 12].includes(i)
    const boomKick = lowerStyle.includes("boom") && [0, 6, 10].includes(i)

    if (strongKick || houseKick || trapKick || boomKick || Math.random() < intensity / 280) {
      notes.push({
        id: `offline-kick-${i}`,
        pitch: 36,
        start: i,
        duration: 0.25,
        velocity: randomVelocity(88, 22),
      })
    }

    if (i % 8 === 4 || (lowerStyle.includes("trap") && [4, 12].includes(i))) {
      notes.push({
        id: `offline-snare-${i}`,
        pitch: 38,
        start: i,
        duration: 0.25,
        velocity: randomVelocity(82, 18),
      })
    }

    if (i % 2 === 1 || Math.random() < 0.35 + intensity / 250) {
      notes.push({
        id: `offline-hat-${i}`,
        pitch: 42,
        start: i + 0.5,
        duration: 0.12,
        velocity: randomVelocity(48, 28),
      })
    }
  }

  return notes
}

function generateTextToMusic(prompt: string, complexity: number): Note[] {
  const lower = prompt.toLowerCase()

  if (lower.includes("amapiano") || lower.includes("log")) {
    return [...generateDrumPattern("House", complexity), ...generateAmapianoLogBass("C")]
  }

  if (lower.includes("bass") || lower.includes("deep") || lower.includes("808")) {
    return generateBassLine("C", 16)
  }

  if (lower.includes("drum") || lower.includes("beat")) {
    return generateDrumPattern("House", complexity)
  }

  if (lower.includes("happy") || lower.includes("major")) {
    return generateMelody("C", "Major", complexity)
  }

  return generateMelody("C", "Minor", complexity)
}

function buildStepPatternFromNotes(notes: Note[]) {
  const rows: Record<string, boolean[]> = {
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    hihat: Array(16).fill(false),
  }

  for (const note of notes) {
    const index = Math.max(0, Math.min(15, Math.floor(note.start) % 16))

    if (note.pitch === 36) rows.kick[index] = true
    if (note.pitch === 38) rows.snare[index] = true
    if (note.pitch === 42) rows.hihat[index] = true
  }

  return rows
}

export function AIPanel() {
  const [activeFeature, setActiveFeature] = useState<string | null>("producer")
  const [isGenerating, setIsGenerating] = useState(false)
  const [textPrompt, setTextPrompt] = useState("")
  const [selectedKey, setSelectedKey] = useState("C")
  const [selectedScale, setSelectedScale] = useState("Minor")
  const [selectedDrumStyle, setSelectedDrumStyle] = useState("Trap")
  const [selectedProducerGenre, setSelectedProducerGenre] = useState<string>("Trap")
  const [complexity, setComplexity] = useState(50)
  const [generatedResult, setGeneratedResult] = useState<string | null>(null)
  const [producerSession, setProducerSession] = useState<ProducerTrackPlan[] | null>(null)
  const [generatedNotes, setGeneratedNotes] = useState<Note[]>([])
  const [generatedStepPattern, setGeneratedStepPattern] = useState<Record<string, boolean[]> | null>(null)
  const [generatingHint, setGeneratingHint] = useState<string | null>(null)

  const { addTrack, addClip, tracks, updateTrack } = useDAWStore()

  async function handleGenerate(featureId: string) {
    setIsGenerating(true)
    setGeneratedResult(null)
    setGeneratingHint("Generating locally on this device...")
    setGeneratedStepPattern(null)

    if (featureId !== "producer") {
      setProducerSession(null)
    }

    await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 450))

    let result = ""
    let notes: Note[] = []

    switch (featureId) {
      case "producer": {
        const preset = producerPresets[selectedProducerGenre] ?? producerPresets.Trap
        const melody = generateMelody(preset.key, preset.scale, complexity)
        const drums = generateDrumPattern(preset.drum, complexity)
        const bass =
          selectedProducerGenre === "Amapiano"
            ? generateAmapianoLogBass(preset.key)
            : generateBassLine(preset.key, 16)

        setProducerSession([
          {
            name: `${selectedProducerGenre} Drums`,
            instrumentKey: "kick",
            notes: drums,
            color: "#ec4899",
          },
          {
            name: `${selectedProducerGenre} Melody`,
            instrumentKey: "lead",
            notes: melody,
            color: "#8b5cf6",
          },
          {
            name: `${selectedProducerGenre} Bass`,
            instrumentKey: selectedProducerGenre === "Amapiano" ? "subBass" : "subBass",
            notes: bass,
            color: "#10b981",
          },
        ])

        result = `Offline session ready: drums, melody and bass for ${selectedProducerGenre}`
        break
      }

      case "text-to-music": {
        notes = generateTextToMusic(textPrompt || "ambient chill", complexity)
        result = `Offline text-to-music ready: ${notes.length} notes`
        break
      }

      case "melody-gen": {
        notes = generateMelody(selectedKey, selectedScale, complexity)
        result = `Offline melody ready: ${notes.length} notes in ${selectedKey} ${selectedScale}`
        break
      }

      case "drum-gen": {
        notes = generateDrumPattern(selectedDrumStyle, complexity)
        setGeneratedStepPattern(buildStepPatternFromNotes(notes))
        result = `Offline drum pattern ready: ${notes.length} hits in ${selectedDrumStyle}`
        break
      }

      case "auto-mix": {
        tracks.forEach((track) => {
          const newVolume = 0.58 + Math.random() * 0.32
          updateTrack(track.id, { volume: newVolume, pan: (Math.random() - 0.5) * 0.35 })
        })

        result = `Applied offline mix balance to ${tracks.length} tracks`
        break
      }
    }

    setGeneratedResult(result)
    setGeneratedNotes(notes)
    setGeneratingHint(null)
    setIsGenerating(false)
  }

  function applyProducerSession(plans: ProducerTrackPlan[]) {
    for (const plan of plans) {
      addTrack("midi", plan.name, plan.instrumentKey)

      const state = useDAWStore.getState()
      const newTrackId = state.tracks[state.tracks.length - 1]?.id

      if (newTrackId && plan.notes.length > 0) {
        const notes = plan.notes.map((note) => ({
          ...note,
          id: note.id || `n-${Math.random().toString(36).slice(2)}`,
        }))

        addClip(newTrackId, {
          trackId: newTrackId,
          name: "Offline producer session",
          start: 0,
          duration: 16,
          color: plan.color,
          notes,
        })
      }
    }

    const state = useDAWStore.getState()

    state.tracks.forEach((track) => {
      state.updateTrack(track.id, {
        volume: 0.55 + Math.random() * 0.35,
        pan: (Math.random() - 0.5) * 0.4,
      })
    })
  }

  function handleApply() {
    if (activeFeature === "producer" && producerSession?.length) {
      applyProducerSession(producerSession)
      setProducerSession(null)
      setGeneratedResult(null)
      setGeneratedNotes([])
      setGeneratedStepPattern(null)
      return
    }

    if (activeFeature === "drum-gen" && generatedStepPattern) {
      useDAWStore.setState((state) => ({
        stepSequencer: {
          ...state.stepSequencer,
          enabled: true,
          rows: state.stepSequencer.rows.map((row) => {
            const pattern = generatedStepPattern[row.id]

            if (!pattern) return row

            return {
              ...row,
              steps: row.steps.map((cell, index) => ({
                ...cell,
                active: Boolean(pattern[index % pattern.length]),
              })),
            }
          }),
        },
      }))
    }

    let trackName = "Offline AI Generated"
    let instrumentKey: string | undefined = "lead"

    if (activeFeature === "melody-gen") {
      trackName = `Melody ${selectedKey} ${selectedScale}`
    } else if (activeFeature === "drum-gen") {
      trackName = `Drums ${selectedDrumStyle}`
      instrumentKey = "kick"
    } else if (activeFeature === "text-to-music") {
      trackName = `Offline ${textPrompt.split(" ").slice(0, 2).join(" ") || "Track"}`
    }

    addTrack("midi", trackName, instrumentKey)

    const state = useDAWStore.getState()
    const newTrackId = state.tracks[state.tracks.length - 1]?.id

    if (newTrackId && generatedNotes.length > 0) {
      const notes = generatedNotes.map((note) => ({
        ...note,
        id: note.id || `n-${Math.random().toString(36).slice(2)}`,
      }))

      addClip(newTrackId, {
        trackId: newTrackId,
        name: "Offline generated",
        start: 0,
        duration: 16,
        color: "#8b5cf6",
        notes,
      })
    }

    setGeneratedResult(null)
    setGeneratedNotes([])
    setGeneratedStepPattern(null)
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface-1">
      <div className="flex h-8 items-center border-b border-border bg-surface-2 px-3">
        <Headphones className="mr-2 h-4 w-4 text-neon-purple" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Offline AI Producer
        </span>
        <span className="ml-2 hidden text-[9px] text-muted-foreground/80 sm:inline">
          PRO-TEVERSE offline engine
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {aiFeatures.map((feature) => (
            <div key={feature.id}>
              <button
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-all ${
                  activeFeature === feature.id
                    ? "border border-border bg-surface-2"
                    : "hover:bg-surface-2/50"
                }`}
                onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
              >
                <div className="rounded p-1.5" style={{ backgroundColor: `${feature.color}20` }}>
                  <feature.icon className="h-4 w-4" style={{ color: feature.color }} />
                </div>

                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-foreground">{feature.name}</div>
                  <div className="text-[10px] text-muted-foreground">{feature.description}</div>
                </div>

                {activeFeature === feature.id ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {activeFeature === feature.id && (
                <div className="mt-2 space-y-3 rounded-lg bg-surface-2 p-3">
                  {feature.id === "producer" && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Genre / vibe</label>
                        <select
                          className="h-8 w-full rounded border border-border bg-surface-1 px-2 text-sm text-foreground"
                          value={selectedProducerGenre}
                          onChange={(event) => setSelectedProducerGenre(event.target.value)}
                        >
                          {producerGenres.map((genre) => (
                            <option key={genre} value={genre}>
                              {genre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          Session energy: {complexity}%
                        </label>
                        <Slider value={[complexity]} onValueChange={([value]) => setComplexity(value)} max={100} step={10} />
                      </div>

                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        Builds drums, melody and bass locally. Apply adds three tracks and balances the session.
                      </p>
                    </>
                  )}

                  {feature.id === "text-to-music" && (
                    <>
                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        Describe the sound you want. This runs locally on the device and creates MIDI notes without cloud APIs.
                      </p>

                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Describe your music</label>
                        <textarea
                          className="h-20 w-full resize-none rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
                          placeholder="A chill amapiano beat with log drum and soft keys..."
                          value={textPrompt}
                          onChange={(event) => setTextPrompt(event.target.value)}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          Complexity: {complexity}%
                        </label>
                        <Slider value={[complexity]} onValueChange={([value]) => setComplexity(value)} max={100} step={10} />
                      </div>
                    </>
                  )}

                  {feature.id === "melody-gen" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Key</label>
                          <select
                            className="h-8 w-full rounded border border-border bg-surface-1 px-2 text-sm text-foreground"
                            value={selectedKey}
                            onChange={(event) => setSelectedKey(event.target.value)}
                          >
                            {musicalKeys.map((key) => (
                              <option key={key} value={key}>
                                {key}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">Scale</label>
                          <select
                            className="h-8 w-full rounded border border-border bg-surface-1 px-2 text-sm text-foreground"
                            value={selectedScale}
                            onChange={(event) => setSelectedScale(event.target.value)}
                          >
                            {scales.map((scale) => (
                              <option key={scale} value={scale}>
                                {scale}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          Complexity: {complexity}%
                        </label>
                        <Slider value={[complexity]} onValueChange={([value]) => setComplexity(value)} max={100} step={10} />
                      </div>
                    </>
                  )}

                  {feature.id === "drum-gen" && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Style</label>
                        <select
                          className="h-8 w-full rounded border border-border bg-surface-1 px-2 text-sm text-foreground"
                          value={selectedDrumStyle}
                          onChange={(event) => setSelectedDrumStyle(event.target.value)}
                        >
                          {drumStyles.map((style) => (
                            <option key={style} value={style}>
                              {style}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          Intensity: {complexity}%
                        </label>
                        <Slider value={[complexity]} onValueChange={([value]) => setComplexity(value)} max={100} step={10} />
                      </div>
                    </>
                  )}

                  {feature.id === "auto-mix" && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Balance levels and pan across all tracks locally.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Tracks to process:</span>
                        <span className="font-medium text-neon-cyan">{tracks.length}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    style={{ backgroundColor: feature.color }}
                    onClick={() => void handleGenerate(feature.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {generatingHint ?? "Generating..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>

                  {generatedResult && (
                    <div className="rounded-lg border border-border bg-surface-1 p-3">
                      <p className="mb-2 text-xs text-foreground">{generatedResult}</p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => void handleGenerate(feature.id)}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Regenerate
                        </Button>

                        <Button
                          size="sm"
                          className="flex-1 bg-neon-cyan text-xs text-background hover:bg-neon-cyan/90"
                          onClick={handleApply}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="mt-4 rounded-lg border border-neon-purple/20 bg-surface-2 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-neon-purple" />
              <span className="text-xs font-medium text-foreground">Pro Tip</span>
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              For Text to Music, describe genre, mood, instruments and tempo. PRO-TEVERSE now generates locally without cloud APIs.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
