export type AIGenMode = "drums" | "melody" | "loop"

export type AIGenRequest = {
  mode: AIGenMode
  prompt?: string
  key?: string
  scale?: string
  style?: string
  complexity?: number
  bpm?: number
}

export type AINote = {
  id: string
  pitch: number
  start: number
  duration: number
  velocity: number
}

export type AIStepPattern = Record<string, boolean[]>

export type AIGenResult = {
  mode: AIGenMode
  provider: "offline" | "external" | "suno"
  notes: AINote[]
  pattern: AINote[]
  stepPattern: AIStepPattern
  audioLoopUrl: string | null
  title?: string
}

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

const DRUM_PITCH_TO_ROW: Array<{ row: string; pitch: number[] }> = [
  { row: "kick", pitch: [35, 36] },
  { row: "snare", pitch: [37, 38, 40] },
  { row: "hihat", pitch: [42, 44, 46] },
  { row: "clap", pitch: [39] },
]

function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seeded(seed: number) {
  let s = seed || 1
  return () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function clampComplexity(v: number | undefined): number {
  const n = v ?? 50
  return Math.max(0, Math.min(100, n))
}

function makeStepPattern(notes: AINote[], stepCount = 16): AIStepPattern {
  const pattern: AIStepPattern = {
    kick: Array.from({ length: stepCount }, () => false),
    snare: Array.from({ length: stepCount }, () => false),
    hihat: Array.from({ length: stepCount }, () => false),
    clap: Array.from({ length: stepCount }, () => false),
  }
  for (const note of notes) {
    const step = Math.max(0, Math.min(stepCount - 1, Math.floor(note.start) % stepCount))
    const row = DRUM_PITCH_TO_ROW.find((r) => r.pitch.includes(note.pitch))?.row
    if (row && pattern[row]) pattern[row][step] = true
  }
  return pattern
}

function generateOfflineDrums(req: AIGenRequest): AINote[] {
  const complexity = clampComplexity(req.complexity)
  const rand = seeded(hashSeed(`drums:${req.style ?? ""}:${req.prompt ?? ""}:${complexity}`))
  const hits: AINote[] = []
  for (let i = 0; i < 16; i += 1) {
    const kickChance = i % 4 === 0 ? 0.96 : 0.1 + complexity / 250
    const snareChance = i % 8 === 4 ? 0.92 : 0.06 + complexity / 340
    const hatChance = i % 2 === 0 ? 0.9 : 0.15 + complexity / 220

    if (rand() < kickChance) {
      hits.push({ id: `k-${i}`, pitch: 36, start: i, duration: 0.25, velocity: 96 + Math.floor(rand() * 22) })
    }
    if (rand() < snareChance) {
      hits.push({ id: `s-${i}`, pitch: 38, start: i, duration: 0.25, velocity: 84 + Math.floor(rand() * 24) })
    }
    if (rand() < hatChance) {
      hits.push({
        id: `h-${i}`,
        pitch: 42,
        start: i + (i % 2 === 0 ? 0.5 : 0),
        duration: 0.1,
        velocity: 60 + Math.floor(rand() * 30),
      })
    }
    if (rand() < 0.05 + complexity / 450) {
      hits.push({ id: `c-${i}`, pitch: 39, start: i, duration: 0.2, velocity: 70 + Math.floor(rand() * 26) })
    }
  }
  return hits
}

function generateOfflineMelody(req: AIGenRequest): AINote[] {
  const complexity = clampComplexity(req.complexity)
  const root = keyToRoot[req.key ?? "C"] ?? 60
  const scale = scalePatterns[req.scale ?? "Minor"] ?? scalePatterns.Minor
  const rand = seeded(hashSeed(`melody:${req.key ?? ""}:${req.scale ?? ""}:${complexity}:${req.prompt ?? ""}`))
  const count = Math.max(6, Math.floor(6 + (complexity / 100) * 12))
  const notes: AINote[] = []
  for (let i = 0; i < count; i += 1) {
    const degree = scale[Math.floor(rand() * scale.length)] ?? 0
    const octave = rand() > 0.65 ? 24 : 12
    const start = i * (rand() > 0.75 ? 0.5 : 1)
    const duration = rand() > 0.6 ? 0.5 : rand() > 0.3 ? 1 : 1.5
    notes.push({
      id: `m-${i}`,
      pitch: root + degree + octave,
      start,
      duration,
      velocity: 76 + Math.floor(rand() * 34),
    })
  }
  return notes
}

function generateOfflineLoop(req: AIGenRequest): AINote[] {
  const p = (req.prompt ?? "").toLowerCase()
  if (p.includes("drum") || p.includes("beat")) return generateOfflineDrums(req)
  if (p.includes("happy")) return generateOfflineMelody({ ...req, key: "C", scale: "Major" })
  if (p.includes("dark") || p.includes("trap")) return generateOfflineMelody({ ...req, key: "D", scale: "Minor" })
  return generateOfflineMelody(req)
}

function normalizeExternalPayload(mode: AIGenMode, payload: unknown): AIGenResult {
  const data = payload as {
    notes?: AINote[]
    pattern?: AINote[]
    stepPattern?: AIStepPattern
    audioLoopUrl?: string | null
  }
  const notes = Array.isArray(data.notes) ? data.notes : []
  const pattern = Array.isArray(data.pattern) ? data.pattern : notes
  return {
    mode,
    provider: "external",
    notes,
    pattern,
    stepPattern: data.stepPattern ?? makeStepPattern(pattern),
    audioLoopUrl: data.audioLoopUrl ?? null,
  }
}

export async function generateAIMusic(req: AIGenRequest): Promise<AIGenResult> {
  const sunoBase = process.env.SUNO_API_URL
  if (sunoBase && req.mode === "loop") {
    try {
      const { generateSunoAudio } = await import("./suno-client")
      const { audioUrl, title } = await generateSunoAudio(sunoBase, {
        prompt: req.prompt,
        style: req.style,
        bpm: req.bpm,
      })
      return {
        mode: req.mode,
        provider: "suno",
        notes: [],
        pattern: [],
        stepPattern: makeStepPattern([]),
        audioLoopUrl: audioUrl,
        title,
      }
    } catch {
      // Fall through to generic external API or offline generation.
    }
  }

  const externalUrl = process.env.AI_MUSIC_API_URL
  if (externalUrl) {
    try {
      const res = await fetch(externalUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.AI_MUSIC_API_KEY
            ? { Authorization: `Bearer ${process.env.AI_MUSIC_API_KEY}` }
            : {}),
        },
        body: JSON.stringify(req),
      })
      if (res.ok) {
        return normalizeExternalPayload(req.mode, await res.json())
      }
    } catch {
      // Fall back to deterministic local generation.
    }
  }

  const notes =
    req.mode === "drums"
      ? generateOfflineDrums(req)
      : req.mode === "melody"
        ? generateOfflineMelody(req)
        : generateOfflineLoop(req)
  return {
    mode: req.mode,
    provider: "offline",
    notes,
    pattern: req.mode === "drums" ? notes : [],
    stepPattern: req.mode === "drums" ? makeStepPattern(notes) : makeStepPattern([]),
    audioLoopUrl: null,
  }
}
