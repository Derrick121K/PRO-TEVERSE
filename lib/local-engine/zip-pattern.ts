import type { ZipStudioProject } from "@/lib/zip-studio/types"

type LocalPatternStep = {
  trackName: string
  role: "drum" | "bass" | "melody" | "vocal" | "fx" | "sample"
  steps: number[]
  volume: number
  startSeconds: number
  notes: string
}

export type LocalZipPatternResult = {
  title: string
  source: "local-offline-engine"
  notes: Array<{
    time: number
    note: string
    velocity: number
    trackName: string
  }>
  pattern: LocalPatternStep[]
  matchedZipProject: {
    projectName: string
    sourceZipName: string
    trackCount: number
    activeTrackCount: number
    bpm: number
    key: string
  }
}

function detectRole(name: string): LocalPatternStep["role"] {
  const lower = name.toLowerCase()

  if (lower.includes("kick") || lower.includes("snare") || lower.includes("clap") || lower.includes("hat") || lower.includes("perc") || lower.includes("drum")) {
    return "drum"
  }

  if (lower.includes("bass") || lower.includes("808") || lower.includes("log")) {
    return "bass"
  }

  if (lower.includes("vox") || lower.includes("vocal") || lower.includes("voice") || lower.includes("hook")) {
    return "vocal"
  }

  if (lower.includes("fx") || lower.includes("rise") || lower.includes("impact") || lower.includes("sweep")) {
    return "fx"
  }

  if (lower.includes("lead") || lower.includes("piano") || lower.includes("keys") || lower.includes("pad") || lower.includes("chord")) {
    return "melody"
  }

  return "sample"
}

function buildSteps(role: LocalPatternStep["role"], index: number) {
  if (role === "drum") {
    return index % 2 === 0 ? [0, 4, 8, 12] : [2, 6, 10, 14]
  }

  if (role === "bass") {
    return [0, 3, 6, 8, 11, 14]
  }

  if (role === "vocal") {
    return [1, 5, 9, 13]
  }

  if (role === "fx") {
    return [0, 15]
  }

  if (role === "melody") {
    return [0, 2, 5, 7, 10, 12, 14]
  }

  return [index % 4, 4 + (index % 4), 8 + (index % 4), 12 + (index % 4)]
}

function notePoolFromKey(key: string) {
  const lower = key.toLowerCase()

  if (lower.includes("minor")) {
    return ["C", "D", "Eb", "F", "G", "Ab", "Bb"]
  }

  return ["C", "D", "E", "F", "G", "A", "B"]
}

export function generateZipMatchedPatternLocally(
  zipProject: ZipStudioProject,
  prompt: string
): LocalZipPatternResult {
  const activeTracks = zipProject.tracks.filter((track) => !track.muted)
  const notes = notePoolFromKey(zipProject.key)
  const promptBoost = prompt.toLowerCase().includes("amapiano") ? 8 : 0

  const pattern = activeTracks.slice(0, 16).map((track, index) => {
    const role = detectRole(track.name)

    return {
      trackName: track.name,
      role,
      steps: buildSteps(role, index),
      volume: track.volume,
      startSeconds: track.startSeconds,
      notes: track.notes,
    }
  })

  const generatedNotes = pattern.flatMap((item, groupIndex) =>
    item.steps.map((step, stepIndex) => ({
      time: step,
      note: notes[(groupIndex + stepIndex + promptBoost) % notes.length],
      velocity: Math.min(127, Math.max(35, Math.round(item.volume * 0.9))),
      trackName: item.trackName,
    }))
  )

  return {
    title: `${zipProject.projectName} Offline Pattern`,
    source: "local-offline-engine",
    notes: generatedNotes,
    pattern,
    matchedZipProject: {
      projectName: zipProject.projectName,
      sourceZipName: zipProject.sourceZipName,
      trackCount: zipProject.tracks.length,
      activeTrackCount: activeTracks.length,
      bpm: zipProject.bpm,
      key: zipProject.key,
    },
  }
}
