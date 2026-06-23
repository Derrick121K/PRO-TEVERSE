export type AIGenRequest = {
  mode: string
  prompt?: string
  style?: string
  key?: string
  scale?: "major" | "minor" | "pentatonic" | string
  bpm?: number
  bars?: number
  energy?: number
  complexity?: number
}

export type AINote = {
  id: string
  pitch: number
  start: number
  duration: number
  velocity: number
}

export type AIStepPattern = {
  kick: boolean[]
  snare: boolean[]
  hihat: boolean[]
  clap: boolean[]
}

export type AIPatternItem = {
  instrument: "kick" | "snare" | "hihat" | "clap" | "bass" | "chord" | "melody"
  steps?: boolean[]
  notes?: AINote[]
}

export type AIGenResult = {
  mode: string
  provider: "offline-musical"
  title: string
  notes: AINote[]
  pattern: AIPatternItem[]
  stepPattern: AIStepPattern
  audioLoopUrl: string | null
}

const NOTE_INDEX: Record<string, number> = {
  c: 0,
  "c#": 1,
  db: 1,
  d: 2,
  "d#": 3,
  eb: 3,
  e: 4,
  f: 5,
  "f#": 6,
  gb: 6,
  g: 7,
  "g#": 8,
  ab: 8,
  a: 9,
  "a#": 10,
  bb: 10,
  b: 11,
}

const SCALE_INTERVALS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 3, 5, 7, 10],
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hashText(text: string) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRandom(seedText: string) {
  let seed = hashText(seedText) || 1
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), 61 | seed)
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296
  }
}

function parseKey(input?: string) {
  const value = (input || "C minor").trim().toLowerCase()
  const parts = value.split(/\s+/)
  const tonic = NOTE_INDEX[parts[0] || "c"] ?? 0
  const scale =
    value.includes("major") ? "major" :
    value.includes("pent") ? "pentatonic" :
    "minor"

  return { tonic, scale }
}

function detectStyle(request: AIGenRequest) {
  const text = `${request.prompt || ""} ${request.style || ""} ${request.mode || ""}`.toLowerCase()

  if (text.includes("amapiano") || text.includes("log drum") || text.includes("piano")) return "amapiano"
  if (text.includes("house") || text.includes("edm") || text.includes("dance")) return "house"
  if (text.includes("trap")) return "trap"
  if (text.includes("hip") || text.includes("rap")) return "hiphop"
  if (text.includes("afro")) return "afrobeat"

  return "modern"
}

function getProgression(style: string, scale: string) {
  if (style === "amapiano") return [0, 10, 8, 10]
  if (style === "house") return scale === "major" ? [0, 7, 9, 5] : [0, 8, 3, 10]
  if (style === "trap") return [0, 8, 10, 7]
  if (style === "afrobeat") return scale === "major" ? [0, 5, 7, 9] : [0, 3, 8, 10]
  return scale === "major" ? [0, 7, 9, 5] : [0, 8, 3, 10]
}

function makeStepPattern(style: string, bars: number, energy: number): AIStepPattern {
  const totalSteps = bars * 16
  const kick = Array(totalSteps).fill(false)
  const snare = Array(totalSteps).fill(false)
  const hihat = Array(totalSteps).fill(false)
  const clap = Array(totalSteps).fill(false)

  for (let bar = 0; bar < bars; bar++) {
    const offset = bar * 16

    if (style === "amapiano") {
      ;[0, 6, 10, 14].forEach((step) => kick[offset + step] = true)
      ;[4, 12].forEach((step) => clap[offset + step] = true)
      ;[2, 5, 8, 11, 14].forEach((step) => hihat[offset + step] = true)
      if (energy > 65) {
        kick[offset + 15] = true
        hihat[offset + 15] = true
      }
    } else if (style === "house") {
      ;[0, 4, 8, 12].forEach((step) => kick[offset + step] = true)
      ;[4, 12].forEach((step) => clap[offset + step] = true)
      ;[2, 6, 10, 14].forEach((step) => hihat[offset + step] = true)
    } else if (style === "trap") {
      ;[0, 7, 10].forEach((step) => kick[offset + step] = true)
      ;[4, 12].forEach((step) => snare[offset + step] = true)
      for (let step = 0; step < 16; step += energy > 70 ? 1 : 2) hihat[offset + step] = true
    } else if (style === "hiphop") {
      ;[0, 7, 11].forEach((step) => kick[offset + step] = true)
      ;[4, 12].forEach((step) => snare[offset + step] = true)
      ;[0, 3, 6, 8, 11, 14].forEach((step) => hihat[offset + step] = true)
    } else {
      ;[0, 4, 8, 12].forEach((step) => kick[offset + step] = true)
      ;[4, 12].forEach((step) => clap[offset + step] = true)
      ;[2, 6, 10, 14].forEach((step) => hihat[offset + step] = true)
    }
  }

  return { kick, snare, hihat, clap }
}

function chordNotes(rootPitch: number, scale: string) {
  const third = scale === "major" ? 4 : 3
  return [rootPitch, rootPitch + third, rootPitch + 7]
}

function makeChords(tonic: number, scale: string, progression: number[], bars: number): AINote[] {
  const notes: AINote[] = []
  const base = 48 + tonic

  for (let bar = 0; bar < bars; bar++) {
    const root = base + progression[bar % progression.length]
    const chord = chordNotes(root, scale)

    chord.forEach((pitch, index) => {
      notes.push({
        id: `chord-${bar}-${index}`,
        pitch,
        start: bar * 4,
        duration: 3.75,
        velocity: 72 + index * 4,
      })
    })
  }

  return notes
}

function makeBass(style: string, tonic: number, progression: number[], bars: number): AINote[] {
  const notes: AINote[] = []
  const base = 36 + tonic

  for (let bar = 0; bar < bars; bar++) {
    const root = base + progression[bar % progression.length]
    const starts = style === "amapiano" ? [0, 1.5, 2.5, 3.5] : [0, 2]

    starts.forEach((beat, index) => {
      notes.push({
        id: `bass-${bar}-${index}`,
        pitch: root + (style === "amapiano" && index % 2 ? 12 : 0),
        start: bar * 4 + beat,
        duration: style === "amapiano" ? 0.45 : 0.9,
        velocity: style === "amapiano" ? 112 : 95,
      })
    })
  }

  return notes
}

function makeMelody(
  request: AIGenRequest,
  tonic: number,
  scale: string,
  progression: number[],
  bars: number,
  style: string
): AINote[] {
  const random = createRandom(`${request.prompt || ""}|${request.key || ""}|${style}|${bars}`)
  const intervals = SCALE_INTERVALS[scale] || SCALE_INTERVALS.minor
  const notes: AINote[] = []
  const base = style === "amapiano" ? 72 + tonic : 60 + tonic
  const density = clamp(Number(request.complexity ?? 55), 20, 90)

  for (let bar = 0; bar < bars; bar++) {
    const chordRoot = progression[bar % progression.length]
    const slots = density > 70 ? [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] : [0, 1, 1.5, 2.5, 3]

    slots.forEach((beat, index) => {
      const shouldRest = random() < (density > 70 ? 0.16 : 0.28)
      if (shouldRest && index !== 0) return

      const scaleIndex = Math.floor(random() * intervals.length)
      const octave = random() > 0.72 ? 12 : 0
      const pitch = base + chordRoot + intervals[scaleIndex] + octave

      notes.push({
        id: `mel-${bar}-${index}`,
        pitch: clamp(pitch, 48, 96),
        start: bar * 4 + beat,
        duration: random() > 0.75 ? 1 : 0.5,
        velocity: Math.floor(78 + random() * 34),
      })
    })
  }

  return notes
}

function makeTitle(style: string, mode: string, bpm: number, key?: string) {
  const cleanStyle = style.charAt(0).toUpperCase() + style.slice(1)
  const cleanMode = mode.charAt(0).toUpperCase() + mode.slice(1)
  return `${cleanStyle} ${cleanMode} Idea - ${key || "C minor"} @ ${bpm} BPM`
}

export async function generateAIMusic(request: AIGenRequest): Promise<AIGenResult> {
  const style = detectStyle(request)
  const bpm = clamp(Number(request.bpm ?? (style === "amapiano" ? 112 : 120)), 60, 180)
  const bars = clamp(Number(request.bars ?? 4), 2, 16)
  const energy = clamp(Number(request.energy ?? 70), 1, 100)

  const parsed = parseKey(request.key)
  const scale = request.scale && SCALE_INTERVALS[request.scale] ? request.scale : parsed.scale
  const tonic = parsed.tonic
  const progression = getProgression(style, scale)

  const stepPattern = makeStepPattern(style, bars, energy)
  const chordNotesList = makeChords(tonic, scale, progression, bars)
  const bassNotes = makeBass(style, tonic, progression, bars)
  const melodyNotes = makeMelody(request, tonic, scale, progression, bars, style)

  const requestedMode = (request.mode || "full").toLowerCase()
  const wantsDrums = requestedMode.includes("drum") || requestedMode.includes("beat")
  const wantsBass = requestedMode.includes("bass")
  const wantsChord = requestedMode.includes("chord")
  const wantsFull = requestedMode.includes("full") || requestedMode.includes("song") || requestedMode.includes("arrangement")

  let notes: AINote[]

  if (wantsDrums) {
    notes = []
  } else if (wantsBass) {
    notes = bassNotes
  } else if (wantsChord) {
    notes = chordNotesList
  } else if (wantsFull) {
    notes = [...chordNotesList, ...bassNotes, ...melodyNotes]
  } else {
    notes = melodyNotes
  }

  return {
    mode: request.mode || "full",
    provider: "offline-musical",
    title: makeTitle(style, request.mode || "full", bpm, request.key),
    notes,
    pattern: [
      { instrument: "kick", steps: stepPattern.kick },
      { instrument: "snare", steps: stepPattern.snare },
      { instrument: "hihat", steps: stepPattern.hihat },
      { instrument: "clap", steps: stepPattern.clap },
      { instrument: "chord", notes: chordNotesList },
      { instrument: "bass", notes: bassNotes },
      { instrument: "melody", notes: melodyNotes },
    ],
    stepPattern,
    audioLoopUrl: null,
  }
}