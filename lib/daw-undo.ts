import type { DAWState, Track } from './daw-store'
import type { StepSequencerState } from './daw-step-sequencer-defaults'

const MAX = 50

export type HistorySnapshot = {
  tracks: Track[]
  bpm: number
  timeSignature: [number, number]
  masterVolume: number
  loopStart: number
  loopEnd: number
  loopEnabled: boolean
  /** Omitted in older in-memory history entries */
  stepSequencer?: StepSequencerState
  metronomeEnabled?: boolean
}

const past: HistorySnapshot[] = []
const future: HistorySnapshot[] = []

function takeSnapshot(get: () => DAWState): HistorySnapshot {
  const s = get()
  return {
    tracks: JSON.parse(JSON.stringify(s.tracks)) as Track[],
    bpm: s.bpm,
    timeSignature: [s.timeSignature[0], s.timeSignature[1]],
    masterVolume: s.masterVolume,
    loopStart: s.loopStart,
    loopEnd: s.loopEnd,
    loopEnabled: s.loopEnabled,
    stepSequencer: JSON.parse(JSON.stringify(s.stepSequencer)) as StepSequencerState,
    metronomeEnabled: s.metronomeEnabled,
  }
}

/** Call before applying a discrete project mutation (not transport-only / selection). */
export function pushHistory(get: () => DAWState) {
  const snap = takeSnapshot(get)
  const last = past[past.length - 1]
  if (last && JSON.stringify(last) === JSON.stringify(snap)) return
  past.push(snap)
  if (past.length > MAX) past.shift()
  future.length = 0
}

export function undo(get: () => DAWState, apply: (snap: HistorySnapshot) => void) {
  if (past.length === 0) return
  const cur = takeSnapshot(get)
  const prev = past.pop()!
  future.push(cur)
  apply(prev)
}

export function redo(get: () => DAWState, apply: (snap: HistorySnapshot) => void) {
  if (future.length === 0) return
  const cur = takeSnapshot(get)
  const nxt = future.pop()!
  past.push(cur)
  apply(nxt)
}

export function canUndo() {
  return past.length > 0
}

export function canRedo() {
  return future.length > 0
}
