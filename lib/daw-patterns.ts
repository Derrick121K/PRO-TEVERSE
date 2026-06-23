import {
  createDefaultStepSequencerState,
  type StepSequencerState,
} from "./daw-step-sequencer-defaults"

export interface DawPattern {
  id: string
  name: string
  stepSequencer: StepSequencerState
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export function createInitialPatterns(): { patterns: DawPattern[]; currentPatternId: string } {
  const stepSequencer = createDefaultStepSequencerState()
  const id = generateId()
  return {
    patterns: [{ id, name: "Pattern 1", stepSequencer }],
    currentPatternId: id,
  }
}

export function cloneStepSequencer(state: StepSequencerState): StepSequencerState {
  return JSON.parse(JSON.stringify(state)) as StepSequencerState
}

export function syncPatternSnapshot(
  patterns: DawPattern[],
  currentPatternId: string,
  stepSequencer: StepSequencerState
): DawPattern[] {
  return patterns.map((p) =>
    p.id === currentPatternId ? { ...p, stepSequencer: cloneStepSequencer(stepSequencer) } : p
  )
}

export function stepSequencerToMidiNotes(
  stepSequencer: StepSequencerState,
  patternBars: number = 1
): Array<{ pitch: number; start: number; duration: number; velocity: number }> {
  const beatsPerBar = 4
  const patternLengthBeats = patternBars * beatsPerBar
  const notes: Array<{ pitch: number; start: number; duration: number; velocity: number }> = []
  stepSequencer.rows.forEach((row) => {
    row.steps.forEach((step, idx) => {
      if (!step.active || row.muted) return
      const stepBeat = (idx / stepSequencer.stepCount) * patternLengthBeats
      if (stepBeat >= patternLengthBeats) return
      notes.push({
        pitch: row.note,
        start: stepBeat,
        duration: Math.min(0.25, patternLengthBeats - stepBeat),
        velocity: step.velocity,
      })
    })
  })
  return notes
}
