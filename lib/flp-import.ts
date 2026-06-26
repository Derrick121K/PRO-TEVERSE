import type { Track } from "./daw-store"
import {
  parseFlpChannelSampleRefs,
  parseFlpPlaylistHints,
  parseFlpSummary,
  type FlpProjectSummary,
} from "./flp-view"

export const FLP_IMPORT_SESSION_KEY = "PRO-TEVERSE-flp-import-v1"

export type FlpImportPayload = {
  summary: FlpProjectSummary
  fileName: string
  tracks: Track[]
  bpm: number
}

function normalizeFileKey(value: string): string {
  return value.replace(/\\/g, "/").split("/").pop()?.toLowerCase() ?? value.toLowerCase()
}

export type SampleFileMap = Record<string, string>

/**
 * Build playable tracks from an FLP buffer and optional sample file map (filename -> blob URL).
 */
export function buildTracksFromFlp(
  flpBuffer: ArrayBuffer,
  sampleMap: SampleFileMap = {},
  fileName = "project.flp"
): FlpImportPayload | { error: string } {
  const summary = parseFlpSummary(flpBuffer)
  if (!summary.ok) {
    return { error: summary.error ?? "Could not parse FLP" }
  }

  const refs = parseFlpChannelSampleRefs(flpBuffer)
  const playlistHints = parseFlpPlaylistHints(flpBuffer)
  const bpm = summary.bpm ?? 120

  const mapped = refs
    .map((r) => {
      const source = r.sampleFileName ? normalizeFileKey(r.sampleFileName) : null
      if (!source) return null
      const url = sampleMap[source] ?? sampleMap[r.sampleFileName ?? ""]
      if (!url) return null
      return {
        name: r.channelName || source.replace(/\.[^.]+$/, ""),
        url,
        durationBeats: 2,
      }
    })
    .filter(Boolean) as Array<{ name: string; url: string; durationBeats: number }>

  if (mapped.length === 0) {
    return {
      error:
        "No matching samples. Upload WAV files that match channel sample names in the FLP.",
    }
  }

  const tracks: Track[] = mapped.slice(0, 32).map((m, i) => {
    const trackId = `flp-track-${i + 1}`
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
          clipType: "audio",
          notes: [],
          audioUrl: m.url,
        },
      ],
    }
  })

  return {
    summary,
    fileName,
    tracks,
    bpm,
  }
}

export function saveFlpImportToSession(payload: FlpImportPayload): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(FLP_IMPORT_SESSION_KEY, JSON.stringify(payload))
}

export function loadFlpImportFromSession(): FlpImportPayload | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(FLP_IMPORT_SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as FlpImportPayload
  } catch {
    return null
  }
}

export function clearFlpImportSession(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(FLP_IMPORT_SESSION_KEY)
}

export function buildSampleMapFromFiles(files: File[]): SampleFileMap {
  const map: SampleFileMap = {}
  for (const f of files) {
    const key = normalizeFileKey(f.name)
    map[key] = URL.createObjectURL(f)
    map[f.name] = map[key]
  }
  return map
}

