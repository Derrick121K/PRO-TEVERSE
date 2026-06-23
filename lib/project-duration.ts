import type { Track } from './daw-store'

export function getProjectDurationBeats(tracks: Track[]): number {
  let max = 0
  for (const t of tracks) {
    for (const c of t.clips) {
      const end = c.start + c.duration
      if (end > max) max = end
    }
  }
  return max > 0 ? max : 16
}
