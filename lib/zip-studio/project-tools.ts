import type { ZipStudioProject } from "./types"

export function buildZipProjectPrompt(project: ZipStudioProject) {
  const trackNames = project.tracks
    .slice(0, 20)
    .map((track, index) => `${index + 1}. ${track.name} (${track.muted ? "muted" : `${track.volume}%`})`)
    .join("\n")

  return [
    `Use this imported ZIP music project as the sound source.`,
    `Project: ${project.projectName}`,
    `Source ZIP: ${project.sourceZipName}`,
    `FLP: ${project.flpFileName || "No FLP detected"}`,
    `BPM: ${project.bpm}`,
    `Key: ${project.key}`,
    `Tracks:`,
    trackNames || "No tracks available",
    ``,
    `Create a pattern that matches the imported samples instead of generating unrelated sounds.`,
  ].join("\n")
}

export function summarizeZipProject(project: ZipStudioProject) {
  const activeTracks = project.tracks.filter((track) => !track.muted)

  return {
    totalTracks: project.tracks.length,
    activeTracks: activeTracks.length,
    mutedTracks: project.tracks.length - activeTracks.length,
    hasFlp: Boolean(project.flpFileName),
    bpm: project.bpm,
    key: project.key,
  }
}
