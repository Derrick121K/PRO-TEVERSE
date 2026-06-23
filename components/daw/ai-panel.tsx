"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDAWStore, type Note } from "@/lib/daw-store"
import { audioEngine } from "@/lib/audio-engine"
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
  icon: React.ElementType
  color: string
}

const aiFeatures: AIFeature[] = [
  {
    id: 'producer',
    name: 'GossipAI-PROD Producer',
    description: 'One session: drums, melody & bass â€” mixed for your project',
    icon: Headphones,
    color: '#a855f7',
  },
  {
    id: 'text-to-music',
    name: 'Text to Music',
    description: 'Describe your music and let GossipAI-PROD generate it',
    icon: Wand2,
    color: '#00d4ff'
  },
  {
    id: 'melody-gen',
    name: 'Melody Generator',
    description: 'Generate melodies in any key and scale',
    icon: Music,
    color: '#8b5cf6'
  },
  {
    id: 'drum-gen',
    name: 'Drum Pattern',
    description: 'Create drum patterns in various styles',
    icon: Drum,
    color: '#ec4899'
  },
  {
    id: 'auto-mix',
    name: 'Auto Mix',
    description: 'Let GossipAI-PROD balance and enhance your mix',
    icon: Sliders,
    color: '#10b981'
  }
]

const musicalKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const scales = ['Major', 'Minor', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Harmonic Minor']
const drumStyles = ['Hip Hop', 'Trap', 'House', 'Techno', 'Lo-Fi', 'Drill', 'Boom Bap', 'Future Bass']

const keyToRoot: Record<string, number> = {
  'C': 60, 'C#': 61, 'D': 62, 'D#': 63, 'E': 64, 'F': 65,
  'F#': 66, 'G': 67, 'G#': 68, 'A': 69, 'A#': 70, 'B': 71
}

const scalePatterns: Record<string, number[]> = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Minor': [0, 2, 3, 5, 7, 8, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11]
}

const producerGenres = ['Trap', 'Lo-Fi', 'House', 'Hip Hop', 'Electronic', 'R&B'] as const

const PRODUCER_PRESETS: Record<string, { key: string; scale: string; drum: string }> = {
  Trap: { key: 'C', scale: 'Minor', drum: 'Trap' },
  'Lo-Fi': { key: 'F', scale: 'Major', drum: 'Lo-Fi' },
  House: { key: 'A', scale: 'Minor', drum: 'House' },
  'Hip Hop': { key: 'D', scale: 'Dorian', drum: 'Boom Bap' },
  Electronic: { key: 'E', scale: 'Minor', drum: 'Techno' },
  'R&B': { key: 'G', scale: 'Major', drum: 'Hip Hop' },
}

type ProducerTrackPlan = {
  name: string
  instrumentKey: string | undefined
  notes: Note[]
  color: string
}

type AIGenerateResponse = {
  source?: string
  notes?: Note[]
  pattern?: Note[]
  stepPattern?: Record<string, boolean[]>
  audioLoopUrl?: string | null
  title?: string | null
}

function generateBassLine(key: string, lengthBeats: number): Note[] {
  const rootMidi = (keyToRoot[key] ?? 60) - 24
  const notes: Note[] = []
  for (let step = 0; step < lengthBeats * 2; step++) {
    const t = step * 0.5
    const interval = step % 4 < 2 ? 0 : 7
    notes.push({
      id: `bass-${step}`,
      pitch: rootMidi + interval,
      start: t,
      duration: 0.45,
      velocity: 78 + Math.random() * 18,
    })
  }
  return notes
}

export function AIPanel() {
  const [activeFeature, setActiveFeature] = useState<string | null>('producer')
  const [isGenerating, setIsGenerating] = useState(false)
  const [textPrompt, setTextPrompt] = useState('')
  const [selectedKey, setSelectedKey] = useState('C')
  const [selectedScale, setSelectedScale] = useState('Minor')
  const [selectedDrumStyle, setSelectedDrumStyle] = useState('Trap')
  const [selectedProducerGenre, setSelectedProducerGenre] = useState<string>('Trap')
  const [complexity, setComplexity] = useState(50)
  const [generatedResult, setGeneratedResult] = useState<string | null>(null)
  const [producerSession, setProducerSession] = useState<ProducerTrackPlan[] | null>(null)
  const [generatedNotes, setGeneratedNotes] = useState<Note[]>([])
  const [generatedType, setGeneratedType] = useState<'midi' | 'audio'>('midi')
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
  const [generatingHint, setGeneratingHint] = useState<string | null>(null)
  const [generatedStepPattern, setGeneratedStepPattern] = useState<Record<string, boolean[]> | null>(null)

  const { addTrack, addClip, tracks, updateTrack } = useDAWStore()

  const generateMelody = (key: string, scale: string, complexity: number): Note[] => {
    const root = keyToRoot[key]
    const pattern = scalePatterns[scale] || scalePatterns['Minor']
    const notes: Note[] = []
    const numNotes = Math.floor(4 + (complexity / 100) * 12)
    const octave = 4 + Math.floor(Math.random() * 2)

    for (let i = 0; i < numNotes; i++) {
      const scaleIndex = Math.floor(Math.random() * pattern.length)
      const pitch = root + pattern[scaleIndex] + (octave * 12)
      const duration = 0.5 + Math.random() * 1.5
      notes.push({
        id: `ai-melody-${i}`,
        pitch,
        start: i * 2,
        duration,
        velocity: 70 + Math.random() * 30
      })
    }
    return notes
  }

  const generateDrumPattern = (style: string, intensity: number): Note[] => {
    const notes: Note[] = []
    const beats = 16
    const kickProb = 0.3 + (intensity / 100) * 0.4
    const snareProb = 0.2 + (intensity / 100) * 0.3

    for (let i = 0; i < beats; i++) {
      if (Math.random() < kickProb) {
        notes.push({ id: `kick-${i}`, pitch: 36, start: i, duration: 0.25, velocity: 90 + Math.random() * 20 })
      }
      if ((i % 4 === 2 || i % 4 === 0) && Math.random() < snareProb) {
        notes.push({ id: `snare-${i}`, pitch: 38, start: i, duration: 0.25, velocity: 85 + Math.random() * 20 })
      }
      if (Math.random() < 0.6) {
        notes.push({ id: `hihat-${i}`, pitch: 42, start: i + 0.5, duration: 0.1, velocity: 50 + Math.random() * 30 })
      }
    }
    return notes
  }

  const generateTextToMusic = (prompt: string, complexity: number): { notes: Note[], type: 'midi' | 'audio' } => {
    const promptLower = prompt.toLowerCase()
    let notes: Note[] = []

    if (promptLower.includes('bass') || promptLower.includes('deep')) {
      const bassNotes = [36, 38, 41, 43, 48]
      for (let i = 0; i < 8; i++) {
        notes.push({ id: `bass-${i}`, pitch: bassNotes[i % bassNotes.length], start: i * 2, duration: 1.5, velocity: 90 })
      }
    } else if (promptLower.includes('melody') || promptLower.includes('happy')) {
      const melody = generateMelody('C', 'Major', complexity)
      notes = melody
    } else if (promptLower.includes('drum') || promptLower.includes('beat')) {
      notes = generateDrumPattern('House', complexity)
    } else {
      notes = generateMelody('C', 'Minor', complexity)
    }

    return { notes, type: 'midi' }
  }

  const handleGenerate = async (featureId: string) => {
    setIsGenerating(true)
    setGeneratedResult(null)
    setGeneratedAudioUrl(null)
    setGeneratingHint(null)
    if (featureId !== 'producer') {
      setProducerSession(null)
    }
    setGeneratedStepPattern(null)

    const usesRemoteApi =
      featureId === 'text-to-music' || featureId === 'melody-gen' || featureId === 'drum-gen'
    if (!usesRemoteApi) {
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1000))
    } else if (featureId === 'text-to-music') {
      setGeneratingHint('Suno may take 1â€“3 minutesâ€¦')
    }

    let result = ''
    let generatedNotes: Note[] = []
    let generatedType: 'midi' | 'audio' = 'midi'
    let audioUrl: string | null = null

    switch (featureId) {
      case 'producer': {
        const preset = PRODUCER_PRESETS[selectedProducerGenre] ?? PRODUCER_PRESETS.Trap
        const mel = generateMelody(preset.key, preset.scale, complexity)
        const d = generateDrumPattern(preset.drum, complexity)
        const bass = generateBassLine(preset.key, 16)
        setProducerSession([
          {
            name: `${selectedProducerGenre} Drums`,
            instrumentKey: 'kick',
            notes: d,
            color: '#ec4899',
          },
          {
            name: `${selectedProducerGenre} Melody`,
            instrumentKey: 'lead',
            notes: mel,
            color: '#8b5cf6',
          },
          {
            name: `${selectedProducerGenre} Bass`,
            instrumentKey: 'subBass',
            notes: bass,
            color: '#10b981',
          },
        ])
        setGeneratedNotes([])
        result = `Session ready: drums, melody & bass Â· ${selectedProducerGenre} @ ${useDAWStore.getState().bpm} BPM`
        break
      }
      case 'text-to-music':
        try {
          const res = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "loop",
              prompt: textPrompt || "ambient chill",
              complexity,
              bpm: useDAWStore.getState().bpm,
            }),
          })
          const data = (await res.json()) as AIGenerateResponse
          if (data.audioLoopUrl) {
            audioUrl = data.audioLoopUrl
            generatedType = 'audio'
            generatedNotes = []
            const label = data.title ?? 'Suno track'
            result =
              data.source === 'suno'
                ? `Suno track ready: ${label}`
                : `Audio ready (${data.source ?? "api"}): ${label}`
          } else {
            generatedNotes = data.notes ?? []
            generatedType = 'midi'
            result = `AI loop ready (${data.source ?? "api"}): ${generatedNotes.length} notes`
          }
        } catch {
          const textResult = generateTextToMusic(textPrompt || 'ambient chill', complexity)
          generatedNotes = textResult.notes
          generatedType = textResult.type
          result = `Offline loop ready: ${generatedNotes.length} notes`
        }
        break
      case 'melody-gen':
        try {
          const res = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "melody",
              key: selectedKey,
              scale: selectedScale,
              complexity,
              bpm: useDAWStore.getState().bpm,
            }),
          })
          const data = (await res.json()) as AIGenerateResponse
          generatedNotes = data.notes ?? []
          result = `AI melody ready (${data.source ?? "api"}): ${generatedNotes.length} notes in ${selectedKey} ${selectedScale}`
        } catch {
          generatedNotes = generateMelody(selectedKey, selectedScale, complexity)
          result = `Offline melody ready in ${selectedKey} ${selectedScale}`
        }
        break
      case 'drum-gen':
        try {
          const res = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "drums",
              style: selectedDrumStyle,
              complexity,
              bpm: useDAWStore.getState().bpm,
            }),
          })
          const data = (await res.json()) as AIGenerateResponse
          generatedNotes = data.pattern ?? data.notes ?? []
          setGeneratedStepPattern(data.stepPattern ?? null)
          result = `AI drum pattern ready (${data.source ?? "api"}): ${generatedNotes.length} hits`
        } catch {
          generatedNotes = generateDrumPattern(selectedDrumStyle, complexity)
          result = `Offline drum pattern ready: ${generatedNotes.length} hits`
        }
        break
      case 'auto-mix':
        tracks.forEach(track => {
          const newVolume = 0.6 + Math.random() * 0.3
          updateTrack(track.id, { volume: newVolume })
        })
        result = `Applied GossipAI-PROD mix to ${tracks.length} tracks`
        break
    }

    setGeneratedResult(result)
    setGeneratedNotes(generatedNotes)
    setGeneratedType(generatedType)
    setGeneratedAudioUrl(audioUrl)
    setGeneratingHint(null)
    setIsGenerating(false)
  }

  const applyProducerSession = (plans: ProducerTrackPlan[]) => {
    for (const plan of plans) {
      addTrack('midi', plan.name, plan.instrumentKey)
      const state = useDAWStore.getState()
      const newTrackId = state.tracks[state.tracks.length - 1]?.id
      if (newTrackId && plan.notes.length > 0) {
        const notes = plan.notes.map((n) => ({
          ...n,
          id: n.id || `n-${Math.random().toString(36).slice(2)}`,
        }))
        addClip(newTrackId, {
          trackId: newTrackId,
          name: 'Producer session',
          start: 0,
          duration: 16,
          color: plan.color,
          notes,
        })
      }
    }
    const { tracks, updateTrack } = useDAWStore.getState()
    tracks.forEach((track) => {
      const newVolume = 0.55 + Math.random() * 0.35
      updateTrack(track.id, { volume: newVolume, pan: (Math.random() - 0.5) * 0.4 })
    })
  }

  const handleApply = () => {
    if (activeFeature === 'producer' && producerSession?.length) {
      applyProducerSession(producerSession)
      setProducerSession(null)
      setGeneratedResult(null)
      setGeneratedNotes([])
      setGeneratedAudioUrl(null)
      setGeneratedStepPattern(null)
      return
    }

    if (activeFeature === 'drum-gen' && generatedStepPattern) {
      useDAWStore.setState((state) => ({
        stepSequencer: {
          ...state.stepSequencer,
          enabled: true,
          rows: state.stepSequencer.rows.map((row) => {
            const pattern = generatedStepPattern[row.id]
            if (!pattern) return row
            return {
              ...row,
              steps: row.steps.map((cell, idx) => ({
                ...cell,
                active: Boolean(pattern[idx % pattern.length]),
              })),
            }
          }),
        },
      }))
    }

    let trackName = 'GossipAI-PROD Generated'
    let instrumentKey: string | undefined = 'lead'

    if (activeFeature === 'melody-gen') {
      trackName = `Melody ${selectedKey} ${selectedScale}`
    } else if (activeFeature === 'drum-gen') {
      trackName = `Drums ${selectedDrumStyle}`
      instrumentKey = 'kick'
    } else if (activeFeature === 'text-to-music') {
      trackName = `Suno ${textPrompt.split(' ').slice(0, 2).join(' ') || 'Track'}`
    }

    const isAudioApply =
      activeFeature === 'text-to-music' && generatedType === 'audio' && generatedAudioUrl

    if (isAudioApply) {
      addTrack('audio', trackName)
      const state = useDAWStore.getState()
      const newTrackId = state.tracks[state.tracks.length - 1]?.id
      const bpm = state.bpm
      const clipDuration = Math.max(16, Math.round((120 / bpm) * 32))
      if (newTrackId) {
        addClip(newTrackId, {
          trackId: newTrackId,
          name: 'Suno Generated',
          start: state.currentBeat,
          duration: clipDuration,
          color: '#00d4ff',
          notes: [],
          audioUrl: generatedAudioUrl,
          clipType: 'audio',
        })
      }
    } else {
      addTrack('midi', trackName, instrumentKey)
      const state = useDAWStore.getState()
      const newTrackId = state.tracks[state.tracks.length - 1]?.id

      if (newTrackId && generatedNotes.length > 0) {
        const notes = generatedNotes.map((n) => ({
          ...n,
          id: n.id || `n-${Math.random().toString(36).slice(2)}`,
        }))
        addClip(newTrackId, {
          trackId: newTrackId,
          name: 'GossipAI-PROD Generated',
          start: 0,
          duration: 16,
          color: '#8b5cf6',
          notes,
        })
      }
    }

    setGeneratedResult(null)
    setGeneratedNotes([])
    setGeneratedAudioUrl(null)
    setGeneratedStepPattern(null)
  }

  return (
    <div className="h-full flex flex-col bg-surface-1 border-l border-border">
      {/* Header */}
      <div className="h-8 bg-surface-2 border-b border-border flex items-center px-3">
        <Headphones className="h-4 w-4 text-neon-purple mr-2" aria-hidden />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          GossipAI-PROD Producer
        </span>
        <span className="text-[9px] text-muted-foreground/80 ml-2 hidden sm:inline">
          PRO-TEVERSE Suno + offline fallback
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Feature Buttons */}
          {aiFeatures.map((feature) => (
            <div key={feature.id}>
              <button
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  activeFeature === feature.id
                    ? 'bg-surface-2 border border-border'
                    : 'hover:bg-surface-2/50'
                }`}
                onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
              >
                <div
                  className="p-1.5 rounded"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
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

              {/* Feature Controls */}
              {activeFeature === feature.id && (
                <div className="mt-2 p-3 bg-surface-2 rounded-lg space-y-3">
                  {feature.id === 'producer' && (
                    <>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Genre / vibe</label>
                        <select
                          className="w-full h-8 px-2 text-sm bg-surface-1 border border-border rounded text-foreground"
                          value={selectedProducerGenre}
                          onChange={(e) => setSelectedProducerGenre(e.target.value)}
                        >
                          {producerGenres.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Session energy: {complexity}%
                        </label>
                        <Slider
                          value={[complexity]}
                          onValueChange={([v]) => setComplexity(v)}
                          max={100}
                          step={10}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Builds drums, melody, and bass for this session. Apply adds three tracks and a light balance
                        across all tracks.
                      </p>
                    </>
                  )}

                  {/* Text to Music Controls */}
                  {feature.id === 'text-to-music' && (
                    <>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Run <code className="bg-surface-2 px-0.5 rounded">npm run suno:dev</code> and set{" "}
                        <code className="bg-surface-2 px-0.5 rounded">SUNO_API_URL</code> for a full song as an audio
                        clip. Otherwise uses offline MIDI.
                      </p>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Describe your music
                        </label>
                        <textarea
                          className="w-full h-20 px-3 py-2 text-sm bg-surface-1 border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-neon-cyan text-foreground placeholder:text-muted-foreground"
                          placeholder="A chill lo-fi beat with jazzy piano and soft drums..."
                          value={textPrompt}
                          onChange={(e) => setTextPrompt(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Complexity: {complexity}%
                        </label>
                        <Slider
                          value={[complexity]}
                          onValueChange={([v]) => setComplexity(v)}
                          max={100}
                          step={10}
                        />
                      </div>
                    </>
                  )}

                  {/* Melody Generator Controls */}
                  {feature.id === 'melody-gen' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Key</label>
                          <select
                            className="w-full h-8 px-2 text-sm bg-surface-1 border border-border rounded text-foreground"
                            value={selectedKey}
                            onChange={(e) => setSelectedKey(e.target.value)}
                          >
                            {musicalKeys.map((key) => (
                              <option key={key} value={key}>{key}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Scale</label>
                          <select
                            className="w-full h-8 px-2 text-sm bg-surface-1 border border-border rounded text-foreground"
                            value={selectedScale}
                            onChange={(e) => setSelectedScale(e.target.value)}
                          >
                            {scales.map((scale) => (
                              <option key={scale} value={scale}>{scale}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Complexity: {complexity}%
                        </label>
                        <Slider
                          value={[complexity]}
                          onValueChange={([v]) => setComplexity(v)}
                          max={100}
                          step={10}
                        />
                      </div>
                    </>
                  )}

                  {/* Drum Pattern Controls */}
                  {feature.id === 'drum-gen' && (
                    <>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Style</label>
                        <select
                          className="w-full h-8 px-2 text-sm bg-surface-1 border border-border rounded text-foreground"
                          value={selectedDrumStyle}
                          onChange={(e) => setSelectedDrumStyle(e.target.value)}
                        >
                          {drumStyles.map((style) => (
                            <option key={style} value={style}>{style}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Intensity: {complexity}%
                        </label>
                        <Slider
                          value={[complexity]}
                          onValueChange={([v]) => setComplexity(v)}
                          max={100}
                          step={10}
                        />
                      </div>
                    </>
                  )}

                  {/* Auto Mix Controls */}
                  {feature.id === 'auto-mix' && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Automatically balance levels, apply EQ, and enhance stereo width across all tracks.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Tracks to process:</span>
                        <span className="text-neon-cyan font-medium">{tracks.length}</span>
                      </div>
                    </div>
                  )}

                  {/* Generate Button */}
                  <Button
                    className="w-full"
                    style={{ backgroundColor: feature.color }}
                    onClick={() => handleGenerate(feature.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {generatingHint ?? 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>

                  {/* Result */}
                  {generatedResult && (
                    <div className="p-3 bg-surface-1 rounded-lg border border-border">
                      <p className="text-xs text-foreground mb-2">{generatedResult}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => handleGenerate(feature.id)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs bg-neon-cyan text-background hover:bg-neon-cyan/90"
                          onClick={handleApply}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pro Tips */}
          <div className="mt-4 p-3 bg-surface-2 rounded-lg border border-neon-purple/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-neon-purple" />
              <span className="text-xs font-medium text-foreground">Pro Tip</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              For Text to Music, describe genre, mood, instruments, and tempo. With PRO-TEVERSE Suno running,
              generation can take a few minutes.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

