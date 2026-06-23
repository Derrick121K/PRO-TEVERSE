/** FL-style channel rack / step grid — shared defaults and types. */

export const DEFAULT_STEP_COUNT = 16
export const AVAILABLE_STEP_COUNTS = [16, 32] as const
export type StepCount = (typeof AVAILABLE_STEP_COUNTS)[number]

export type StepCell = { active: boolean; velocity: number }

export interface StepRowConfig {
  id: string
  name: string
  note: number
  color: string
  icon: string
}

export const DEFAULT_DRUM_STEP_ROWS: StepRowConfig[] = [
  { id: 'kick', name: 'Kick', note: 36, color: '#00d4ff', icon: '🥁' },
  { id: 'snare', name: 'Snare', note: 38, color: '#8b5cf6', icon: '🔥' },
  { id: 'hihat', name: 'Hi-Hat', note: 42, color: '#10b981', icon: '💫' },
  { id: 'clap', name: 'Clap', note: 39, color: '#ec4899', icon: '👏' },
  { id: 'tom1', name: 'Tom High', note: 48, color: '#f59e0b', icon: '🔊' },
  { id: 'tom2', name: 'Tom Mid', note: 45, color: '#ef4444', icon: '🔉' },
  { id: 'perc1', name: 'Perc 1', note: 60, color: '#3b82f6', icon: '✨' },
  { id: 'perc2', name: 'Perc 2', note: 62, color: '#9b59b6', icon: '🌟' },
]

export function emptySteps(stepCount: StepCount = DEFAULT_STEP_COUNT): StepCell[] {
  return Array.from({ length: stepCount }, () => ({ active: false, velocity: 100 }))
}

/** Preset patterns (4 rows × 16 steps) matching first four DEFAULT_DRUM_STEP_ROWS. */
export const STEP_PRESET_PATTERNS: { name: string; pattern: number[][] }[] = [
  { name: 'Basic', pattern: [[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]] },
  { name: 'Trap', pattern: [[1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], [1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0], [1,0,0,0,1,0,0,1,1,0,0,0,1,0,0,1]] },
  { name: 'Boom Bap', pattern: [[1,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0], [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]] },
  { name: 'House', pattern: [[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]] },
  { name: 'Latin', pattern: [[1,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0], [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]] },
]

export function createDefaultStepSequencerState(): StepSequencerState {
  return {
    enabled: true,
    stepCount: DEFAULT_STEP_COUNT,
    swing: 0,
    selectedPreset: 'Basic',
    rows: DEFAULT_DRUM_STEP_ROWS.map((r) => ({
      ...r,
      steps: emptySteps(DEFAULT_STEP_COUNT),
      muted: false,
    })),
  }
}

export interface StepSequencerState {
  /** When false, pattern does not play with transport (editing only). */
  enabled: boolean
  stepCount: StepCount
  swing: number
  selectedPreset: string
  rows: Array<
    StepRowConfig & {
      steps: StepCell[]
      muted: boolean
    }
  >
}
