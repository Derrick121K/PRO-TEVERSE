import { useDAWStore, type Track } from "./daw-store"
import systemEngineProject from "./system-engine-project.json"
import { parseFlpChannelSampleRefs, parseFlpPlaylistHints } from "./flp-view"

const DEMO_PROJECT_KEY = "PRO-TEVERSE-demo-seeded-v2"
const SYSTEM_PROJECT_APPLIED_KEY = "PRO-TEVERSE-system-project-applied-v1"

type SystemEngineProjectClip = {
  name: string
  audioUrl: string
  start: number
  duration: number
}

type SystemEngineProjectTrack = {
  name: string
  color: string
  clips: SystemEngineProjectClip[]
}

type SystemEngineProjectManifest = {
  bpm?: number
  flpUrl?: string
  samples?: Array<{ source: string; url: string; durationSec?: number }>
  trackPlan?: SystemEngineProjectTrack[]
}

const SYSTEM_PROJECT = systemEngineProject as SystemEngineProjectManifest

function normalizeFileKey(value: string): string {
  return value.replace(/\\/g, "/").split("/").pop()?.toLowerCase() ?? value.toLowerCase()
}

const createSystemSampleTracks = (): Track[] => {
  const trackPlan = SYSTEM_PROJECT.trackPlan ?? []
  if (trackPlan.length === 0) return []
  return trackPlan.map((t, tIdx) => {
    const trackId = `nkosi-track-${tIdx + 1}`
    return {
      id: trackId,
      name: t.name,
      instrument: "lead",
      type: "audio",
      color: t.color || "#8b5cf6",
      volume: 0.8,
      pan: tIdx === 0 ? 0 : tIdx % 2 === 0 ? -0.08 : 0.08,
      muted: false,
      solo: false,
      armed: false,
      effects: [],
      clips: t.clips.map((c, cIdx) => ({
        id: `${trackId}-clip-${cIdx + 1}`,
        trackId,
        name: c.name,
        start: Math.max(0, c.start),
        duration: Math.max(0.5, c.duration),
        color: t.color || "#8b5cf6",
        clipType: "audio" as const,
        notes: [],
        audioUrl: c.audioUrl,
      })),
    }
  })
}

const createDefaultDemoTracks = (): Track[] => [
  {
    id: "demo-drums",
    name: "Demo Drums",
    instrument: "kick",
    type: "midi",
    color: "#00d4ff",
    volume: 0.82,
    pan: 0,
    muted: false,
    solo: false,
    armed: false,
    effects: [],
    clips: [
      {
        id: "demo-drums-clip",
        trackId: "demo-drums",
        name: "Drum Groove",
        start: 0,
        duration: 16,
        color: "#00d4ff",
        clipType: "midi",
        notes: [
          { id: "d1", pitch: 36, start: 0, duration: 0.25, velocity: 115 },
          { id: "d2", pitch: 36, start: 4, duration: 0.25, velocity: 112 },
          { id: "d3", pitch: 36, start: 8, duration: 0.25, velocity: 120 },
          { id: "d4", pitch: 36, start: 12, duration: 0.25, velocity: 112 },
          { id: "d5", pitch: 38, start: 4, duration: 0.25, velocity: 102 },
          { id: "d6", pitch: 38, start: 12, duration: 0.25, velocity: 105 },
          { id: "d7", pitch: 42, start: 2, duration: 0.125, velocity: 84 },
          { id: "d8", pitch: 42, start: 6, duration: 0.125, velocity: 86 },
          { id: "d9", pitch: 42, start: 10, duration: 0.125, velocity: 83 },
          { id: "d10", pitch: 42, start: 14, duration: 0.125, velocity: 88 },
        ],
      },
    ],
  },
  {
    id: "demo-bass",
    name: "Demo Bass",
    instrument: "subBass",
    type: "midi",
    color: "#10b981",
    volume: 0.75,
    pan: -0.04,
    muted: false,
    solo: false,
    armed: false,
    effects: [],
    clips: [
      {
        id: "demo-bass-clip",
        trackId: "demo-bass",
        name: "Bassline",
        start: 0,
        duration: 16,
        color: "#10b981",
        clipType: "midi",
        notes: [
          { id: "b1", pitch: 36, start: 0, duration: 2, velocity: 104 },
          { id: "b2", pitch: 39, start: 4, duration: 2, velocity: 98 },
          { id: "b3", pitch: 43, start: 8, duration: 2, velocity: 100 },
          { id: "b4", pitch: 39, start: 12, duration: 2, velocity: 102 },
        ],
      },
    ],
  },
  {
    id: "demo-lead",
    name: "Demo Lead",
    instrument: "lead",
    type: "midi",
    color: "#8b5cf6",
    volume: 0.7,
    pan: 0.08,
    muted: false,
    solo: false,
    armed: false,
    effects: [],
    clips: [
      {
        id: "demo-lead-clip",
        trackId: "demo-lead",
        name: "Hook",
        start: 0,
        duration: 16,
        color: "#8b5cf6",
        clipType: "midi",
        notes: [
          { id: "m1", pitch: 60, start: 0, duration: 1, velocity: 98 },
          { id: "m2", pitch: 63, start: 2, duration: 1, velocity: 92 },
          { id: "m3", pitch: 67, start: 4, duration: 1.5, velocity: 100 },
          { id: "m4", pitch: 65, start: 7, duration: 1, velocity: 90 },
          { id: "m5", pitch: 63, start: 10, duration: 1, velocity: 95 },
          { id: "m6", pitch: 67, start: 12, duration: 1.5, velocity: 100 },
        ],
      },
    ],
  },
]

function applyProjectSeed(tracks: Track[], bpm: number) {
  const state = useDAWStore.getState()
  const stepRows = state.stepSequencer.rows.map((row) => {
    const steps = row.steps.map((s) => ({ ...s, active: false, velocity: 100 }))
    if (row.id === "kick") [0, 4, 8, 12].forEach((i) => (steps[i].active = true))
    if (row.id === "snare") [4, 12].forEach((i) => (steps[i].active = true))
    if (row.id === "hihat") for (let i = 0; i < steps.length; i += 2) steps[i].active = true
    return { ...row, steps }
  })
  const firstTrackId = tracks[0]?.id ?? "demo-drums"
  const firstClipId = tracks[0]?.clips[0]?.id ?? "demo-drums-clip"
  useDAWStore.setState({
    bpm,
    currentBeat: 0,
    selectedTrackId: firstTrackId,
    selectedClipId: firstClipId,
    tracks,
    stepSequencer: {
      ...state.stepSequencer,
      enabled: true,
      selectedPreset: "Basic",
      rows: stepRows,
    },
  })
}

async function tryBuildSystemTracksFromFlp(): Promise<Track[] | null> {
  if (typeof window === "undefined") return null
  if (!SYSTEM_PROJECT.flpUrl) return null
  const samples = SYSTEM_PROJECT.samples ?? []
  if (samples.length === 0) return null

  const bySource = new Map<string, { url: string; durationSec: number }>()
  for (const s of samples) {
    bySource.set(normalizeFileKey(s.source), {
      url: s.url,
      durationSec: Math.max(0.25, s.durationSec ?? 2),
    })
  }

  const res = await fetch(SYSTEM_PROJECT.flpUrl, { cache: "no-store" })
  if (!res.ok) return null
  const flpBuffer = await res.arrayBuffer()
  const refs = parseFlpChannelSampleRefs(flpBuffer)
  const playlistHints = parseFlpPlaylistHints(flpBuffer)
  const mapped = refs
    .map((r) => {
      const source = r.sampleFileName ? normalizeFileKey(r.sampleFileName) : null
      if (!source) return null
      const match = bySource.get(source)
      if (!match) return null
      return {
        name: r.channelName || source.replace(/\.[^.]+$/, ""),
        url: match.url,
        durationBeats: Math.max(0.5, Number((((match.durationSec * (SYSTEM_PROJECT.bpm ?? 120)) / 60)).toFixed(2))),
      }
    })
    .filter(Boolean) as Array<{ name: string; url: string; durationBeats: number }>

  if (mapped.length === 0) return null
  return mapped.slice(0, 24).map((m, i) => {
    const trackId = `nkosi-track-${i + 1}`
    const hint = playlistHints[i % Math.max(1, playlistHints.length)]
    const start = hint?.startBeats ?? 0
    const duration = hint?.durationBeats ?? m.durationBeats
    return {
      id: trackId,
      name: m.name,
      instrument: "lead",
      type: "audio",
      color: i % 2 === 0 ? "#8b5cf6" : "#00d4ff",
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      effects: [],
      clips: [
        {
          id: `${trackId}-clip-1`,
          trackId,
          name: m.name,
          start,
          duration,
          color: i % 2 === 0 ? "#8b5cf6" : "#00d4ff",
          clipType: "audio" as const,
          notes: [],
          audioUrl: m.url,
        },
      ],
    } as Track
  })
}

export async function loadSystemSampleProject() {
  if (typeof window === "undefined") return
  const tracks = (await tryBuildSystemTracksFromFlp()) ?? createSystemSampleTracks()
  if (tracks.length === 0) return
  applyProjectSeed(tracks, SYSTEM_PROJECT.bpm ?? 120)
  localStorage.setItem(DEMO_PROJECT_KEY, "1")
  localStorage.setItem(SYSTEM_PROJECT_APPLIED_KEY, "1")
}

export function seedDemoProjectIfNeeded() {
  if (typeof window === "undefined") return
  const state = useDAWStore.getState()
  const systemTracks = createSystemSampleTracks()

  const hasSystemProject = state.tracks.some((t) => t.id.startsWith("nkosi-track-"))
  const isLegacyDefaultDemo =
    state.tracks.length > 0 &&
    state.tracks.every((t) => t.id.startsWith("demo-")) &&
    state.tracks.some((t) => t.id === "demo-drums")
  const canMigrateLegacy = isLegacyDefaultDemo && systemTracks.length > 0

  if (hasSystemProject) {
    localStorage.setItem(SYSTEM_PROJECT_APPLIED_KEY, "1")
    return
  }
  if (state.tracks.length > 0 && !canMigrateLegacy) return
  // If the project is empty, always seed a playable demo so transport/sequencer work immediately.
  // This keeps first-run and recovery behavior deterministic.

  const seededTracks = systemTracks.length > 0 ? systemTracks : createDefaultDemoTracks()
  applyProjectSeed(seededTracks, SYSTEM_PROJECT.bpm ?? 120)
  localStorage.setItem(DEMO_PROJECT_KEY, "1")
  if (systemTracks.length > 0) {
    localStorage.setItem(SYSTEM_PROJECT_APPLIED_KEY, "1")
  }
}

