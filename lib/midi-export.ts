import { Midi } from '@tonejs/midi'
import type { Track } from './daw-store'

/**
 * One DAW track â†’ one Standard MIDI File track. Times use clip + note (beats) â†’ seconds via BPM.
 */
export function exportProjectToMidi(tracks: Track[], bpm: number): Uint8Array {
  const midi = new Midi()
  midi.header.setTempo(bpm)

  for (const t of tracks) {
    const hasNotes = t.clips.some((c) => c.notes.length > 0)
    if (!hasNotes) continue

    const mTrack = midi.addTrack()
    mTrack.name = t.name.slice(0, 120)

    for (const clip of t.clips) {
      for (const note of clip.notes) {
        const startSec = ((clip.start + note.start) / bpm) * 60
        const durationSec = (note.duration / bpm) * 60
        mTrack.addNote({
          midi: Math.max(0, Math.min(127, note.pitch)),
          time: Math.max(0, startSec),
          duration: Math.max(0.01, durationSec),
          velocity: Math.max(0.01, Math.min(1, note.velocity / 127)),
        })
      }
    }
  }

  if (midi.tracks.length === 0) {
    midi.addTrack()
  }

  return midi.toArray()
}

export function downloadMidiBlob(tracks: Track[], bpm: number, filename: string) {
  const data = exportProjectToMidi(tracks, bpm)
  const blob = new Blob([data], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.mid') ? filename : `${filename}.mid`
  a.click()
  URL.revokeObjectURL(url)
}
