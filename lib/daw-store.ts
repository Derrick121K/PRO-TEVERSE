import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { audioEngine, tracksToTrackData, type TrackData } from './audio-engine'
import * as dawHistory from './daw-undo'
import {
  createDefaultStepSequencerState,
  AVAILABLE_STEP_COUNTS,
  type StepCount,
  STEP_PRESET_PATTERNS,
  emptySteps,
  type StepSequencerState,
} from './daw-step-sequencer-defaults'
import {
  createInitialPatterns,
  cloneStepSequencer,
  syncPatternSnapshot,
  stepSequencerToMidiNotes,
  type DawPattern,
} from './daw-patterns'

const ssrStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

// Types
export interface Note {
  id: string
  pitch: number // MIDI note number (0-127)
  start: number // Start time in beats
  duration: number // Duration in beats
  velocity: number // 0-127
}

export type ClipKind = 'midi' | 'audio'

export interface Clip {
  id: string
  trackId: string
  name: string
  start: number // Start time in beats
  duration: number // Duration in beats
  color: string
  notes: Note[] // For MIDI clips
  audioUrl?: string // For audio clips
  /** Defaults to `midi` when missing (persisted projects). */
  clipType?: ClipKind
  /** Trim from start of buffer in seconds (audio only). */
  trimStart?: number
  /** Trim from end of buffer in seconds (audio only). */
  trimEnd?: number
}

export type EffectType =
  | 'reverb'
  | 'delay'
  | 'eq'
  | 'compressor'
  | 'filter'
  | 'distortion'
  | 'chorus'
  | 'phaser'
  | 'tremolo'

export interface Effect {
  id: string
  type: EffectType
  enabled: boolean
  params: Record<string, number>
}

/** Per-track ADSR for poly/mono synth voices (seconds; sustain 0–1). */
export type TrackEnvelope = {
  attack: number
  decay: number
  sustain: number
  release: number
}

export interface Track {
  id: string
  name: string
  /** Tone.js / engine instrument key (e.g. lead, kick, pad). */
  instrument: string
  type: 'midi' | 'audio'
  color: string
  volume: number // 0-1
  pan: number // -1 to 1
  muted: boolean
  solo: boolean
  armed: boolean
  clips: Clip[]
  effects: Effect[]
  /** Optional synth amplitude envelope (poly/mono instruments). */
  envelope?: TrackEnvelope
}

export interface DAWState {
  // Transport
  isPlaying: boolean
  isRecording: boolean
  bpm: number
  timeSignature: [number, number]
  currentBeat: number
  loopEnabled: boolean
  loopStart: number
  loopEnd: number
  masterVolume: number
  metronomeEnabled: boolean
  metronomeVolume: number

  /** Channel rack / step sequencer (16 steps, same transport as timeline). */
  stepSequencer: StepSequencerState

  /** FL-style patterns (channel rack snapshots). */
  patterns: DawPattern[]
  currentPatternId: string

  // Tracks
  tracks: Track[]
  selectedTrackId: string | null
  selectedClipId: string | null

  // UI State
  zoom: number
  scrollX: number
  scrollY: number
  dockPanels: {
    browser: boolean
    producer: boolean
    mixer: boolean
  }
  dockSizes: {
    browser: number
    producer: number
    mixer: number
  }
  workspaceSizes: {
    playlist: number
    rack: number
    piano: number
  }
  clipSnap: number
  noteSnap: number
  simpleMode: boolean
  pianoRollOpen: boolean
  pianoRollClipId: string | null

  // Actions
  play: () => void
  pause: () => void
  stop: () => void
  toggleRecord: () => Promise<void>
  applyFlpImport: (tracks: Track[], bpm: number) => void
  newProject: () => void
  setBpm: (bpm: number) => void
  setTimeSignature: (ts: [number, number]) => void
  setCurrentBeat: (beat: number) => void
  toggleLoop: () => void
  setLoopRange: (start: number, end: number) => void
  setMasterVolume: (volume: number) => void
  setMetronomeEnabled: (on: boolean) => void
  setMetronomeVolume: (v: number) => void

  // Step sequencer (store-backed, plays with transport)
  setStepSequencerEnabled: (on: boolean) => void
  setStepCount: (stepCount: StepCount) => void
  setStepCell: (rowId: string, stepIndex: number, active: boolean, velocity?: number) => void
  clearStepRow: (rowId: string) => void
  toggleStepRowMute: (rowId: string) => void
  setStepSwing: (swing: number) => void
  loadStepPreset: (presetName: string) => void

  selectPattern: (patternId: string) => void
  addPattern: (name?: string) => void
  duplicatePattern: (patternId: string) => void
  renamePattern: (patternId: string, name: string) => void
  sendPatternToPlaylist: (patternBars?: number) => void
  addMixdownFromBlob: (blob: Blob) => Promise<void>

  // Track Actions
  addTrack: (type: 'midi' | 'audio', name?: string, instrumentKey?: string) => void
  removeTrack: (id: string) => void
  updateTrack: (id: string, updates: Partial<Track>) => void
  selectTrack: (id: string | null) => void
  toggleMute: (id: string) => void
  toggleSolo: (id: string) => void
  setTrackVolume: (id: string, volume: number) => void
  setTrackPan: (id: string, pan: number) => void

  // Clip Actions
  addClip: (trackId: string, clip: Omit<Clip, 'id'>) => void
  /** Decodes a local file, adds a clip with `clipType: 'audio'`. */
  addAudioClipFromFile: (trackId: string, file: File) => Promise<void>
  removeClip: (clipId: string) => void
  updateClip: (clipId: string, updates: Partial<Clip>, options?: { recordHistory?: boolean }) => void
  selectClip: (id: string | null) => void
  moveClip: (clipId: string, trackId: string, start: number, options?: { recordHistory?: boolean }) => void
  setTrackEnvelope: (trackId: string, envelope: TrackEnvelope) => void

  // Note Actions (Piano Roll)
  addNote: (clipId: string, note: Omit<Note, 'id'>) => void
  removeNote: (clipId: string, noteId: string) => void
  updateNote: (clipId: string, noteId: string, updates: Partial<Note>) => void
  updateNotesBatch: (
    clipId: string,
    updates: Array<{ noteId: string; updates: Partial<Note> }>,
    options?: { recordHistory?: boolean }
  ) => void

  // Effect Actions
  addEffect: (trackId: string, type: EffectType) => void
  removeEffect: (trackId: string, effectId: string) => void
  toggleEffect: (trackId: string, effectId: string) => void
  updateEffectParam: (trackId: string, effectId: string, param: string, value: number) => void
  reorderTrackEffects: (trackId: string, fromIndex: number, toIndex: number) => void

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // UI Actions
  setZoom: (zoom: number) => void
  setScroll: (x: number, y: number) => void
  setDockOpen: (panel: 'browser' | 'producer' | 'mixer', open: boolean) => void
  toggleDock: (panel: 'browser' | 'producer' | 'mixer') => void
  setDockSize: (panel: 'browser' | 'producer' | 'mixer', size: number) => void
  setWorkspaceSize: (panel: 'playlist' | 'rack' | 'piano', size: number) => void
  setClipSnap: (snap: number) => void
  setNoteSnap: (snap: number) => void
  setSimpleMode: (simple: boolean) => void
  resetStudioLayout: () => void
  openPianoRoll: (clipId: string) => void
  closePianoRoll: () => void
}

// Track colors
const trackColors = [
  '#00d4ff', // cyan
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
]

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9)

const initialPatternState = createInitialPatterns()

function withSyncedPatterns(
  patterns: DawPattern[],
  currentPatternId: string,
  stepSequencer: StepSequencerState
): DawPattern[] {
  return syncPatternSnapshot(patterns, currentPatternId, stepSequencer)
}

async function finalizeMasterRecording(
  get: () => DAWState,
  set: (partial: Partial<DAWState> | ((s: DAWState) => Partial<DAWState>)) => void
) {
  if (!audioEngine.isMasterRecordingActive()) return
  try {
    const blob = await audioEngine.stopRecording()
    await get().addMixdownFromBlob(blob)
  } catch {
    /* ignore empty recording */
  }
  set({ isRecording: false })
}

// Default effect params
const defaultEffectParams: Record<EffectType, Record<string, number>> = {
  reverb: { mix: 0.3, decay: 2, predelay: 0.01 },
  delay: { mix: 0.3, time: 0.25, feedback: 0.4 },
  eq: { lowGain: 0, midGain: 0, highGain: 0 },
  compressor: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25 },
  filter: { frequency: 1000, resonance: 1, type: 0 },
  distortion: { amount: 0.5, mix: 0.5 },
  chorus: { mix: 0.35, rate: 2, delay: 2.5, depth: 0.4 },
  phaser: { mix: 0.35, frequency: 0.4, baseFrequency: 500, octaves: 3 },
  tremolo: { mix: 0.4, speed: 8, depth: 0.6 },
}

export const useDAWStore = create<DAWState>()(
  persist(
    (set, get) => ({
  // Initial state
  isPlaying: false,
  isRecording: false,
  bpm: 120,
  timeSignature: [4, 4],
  currentBeat: 0,
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 16,
  masterVolume: 0.8,
  metronomeEnabled: false,
  metronomeVolume: 0.65,
  patterns: initialPatternState.patterns,
  currentPatternId: initialPatternState.currentPatternId,
  stepSequencer: cloneStepSequencer(initialPatternState.patterns[0].stepSequencer),

  tracks: [],
  selectedTrackId: null,
  selectedClipId: null,

  zoom: 1,
  scrollX: 0,
  scrollY: 0,
  dockPanels: { browser: true, producer: false, mixer: false },
  dockSizes: { browser: 20, producer: 22, mixer: 24 },
  workspaceSizes: { playlist: 78, rack: 22, piano: 20 },
  clipSnap: 0.25,
  noteSnap: 0.25,
  simpleMode: false,
  pianoRollOpen: false,
  pianoRollClipId: null,

  // Transport — audioEngine.start is driven by `AudioEngineSync` when `isPlaying` is true
  play: async () => {
    const state = get()
    await audioEngine.initialize()
    await audioEngine.syncTracks(state.tracks)
    audioEngine.setBPM(state.bpm)
    audioEngine.setMasterVolume(state.masterVolume)
    if (state.isRecording && !audioEngine.isMasterRecordingActive()) {
      await audioEngine.startRecording()
    }
    set({ isPlaying: true })
  },
  pause: () => {
    audioEngine.pause()
    set({ isPlaying: false })
  },
  stop: async () => {
    const state = get()
    audioEngine.stop()
    set({ isPlaying: false, currentBeat: 0 })
    if (state.isRecording && audioEngine.isMasterRecordingActive()) {
      await finalizeMasterRecording(get, set)
    }
  },
  toggleRecord: async () => {
    const state = get()
    if (!state.isRecording) {
      set({ isRecording: true })
      if (state.isPlaying) {
        await audioEngine.initialize()
        await audioEngine.startRecording()
      }
      return
    }
    if (audioEngine.isMasterRecordingActive()) {
      await finalizeMasterRecording(get, set)
      return
    }
    set({ isRecording: false })
  },
  applyFlpImport: (tracks, bpm) => {
    dawHistory.pushHistory(get)
    set({
      tracks,
      bpm,
      currentBeat: 0,
      isPlaying: false,
      isRecording: false,
      selectedTrackId: tracks[0]?.id ?? null,
      selectedClipId: null,
    })
    void audioEngine.syncTracks(tracks)
    audioEngine.setBPM(bpm)
  },
  newProject: () => {
    dawHistory.pushHistory(get)
    const fresh = createInitialPatterns()
    const stepSequencer = cloneStepSequencer(fresh.patterns[0].stepSequencer)
    audioEngine.stop()
    set({
      tracks: [],
      bpm: 120,
      currentBeat: 0,
      isPlaying: false,
      isRecording: false,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 16,
      selectedTrackId: null,
      selectedClipId: null,
      patterns: fresh.patterns,
      currentPatternId: fresh.currentPatternId,
      stepSequencer,
      pianoRollOpen: false,
      pianoRollClipId: null,
    })
  },
  addMixdownFromBlob: async (blob) => {
    const url = URL.createObjectURL(blob)
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer())
    await ctx.close()
    const bpm = get().bpm
    const durationBeats = Math.max(0.25, (buffer.duration * bpm) / 60)
    const startBeat = get().currentBeat
    dawHistory.pushHistory(get)
    const tracks = get().tracks
    let track = tracks.find((t) => t.name === 'Mixdown' && t.type === 'audio')
    if (!track) {
      const newTrack: Track = {
        id: generateId(),
        name: 'Mixdown',
        instrument: 'lead',
        type: 'audio',
        color: '#f59e0b',
        volume: 0.85,
        pan: 0,
        muted: false,
        solo: false,
        armed: false,
        clips: [],
        effects: [],
      }
      set({ tracks: [...tracks, newTrack] })
      track = newTrack
    }
    const clip: Clip = {
      id: generateId(),
      trackId: track.id,
      name: `Mixdown ${new Date().toLocaleTimeString()}`,
      start: startBeat,
      duration: durationBeats,
      color: '#f59e0b',
      notes: [],
      audioUrl: url,
      clipType: 'audio',
    }
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === track!.id ? { ...t, clips: [...t.clips, clip] } : t
      ),
      selectedTrackId: track!.id,
      selectedClipId: clip.id,
    }))
  },
  setBpm: (bpm) => {
    dawHistory.pushHistory(get)
    const clampedBpm = Math.max(20, Math.min(300, bpm))
    audioEngine.setBPM(clampedBpm)
    set({ bpm: clampedBpm })
  },
  setTimeSignature: (timeSignature) => {
    dawHistory.pushHistory(get)
    set({ timeSignature })
  },
  setCurrentBeat: (currentBeat) => set({ currentBeat }),
  toggleLoop: () => {
    dawHistory.pushHistory(get)
    set((state) => ({ loopEnabled: !state.loopEnabled }))
  },
  setLoopRange: (loopStart, loopEnd) => {
    dawHistory.pushHistory(get)
    set({ loopStart, loopEnd })
  },
  setMasterVolume: (masterVolume) => {
    audioEngine.setMasterVolume(masterVolume)
    set({ masterVolume: Math.max(0, Math.min(1, masterVolume)) })
  },
  setMetronomeEnabled: (metronomeEnabled) => {
    dawHistory.pushHistory(get)
    set({ metronomeEnabled })
  },
  setMetronomeVolume: (metronomeVolume) =>
    set({ metronomeVolume: Math.max(0, Math.min(1, metronomeVolume)) }),

  setStepSequencerEnabled: (enabled) => {
    dawHistory.pushHistory(get)
    set((s) => {
      const stepSequencer = { ...s.stepSequencer, enabled }
      return {
        stepSequencer,
        patterns: withSyncedPatterns(s.patterns, s.currentPatternId, stepSequencer),
      }
    })
  },
  setStepCount: (stepCount) => {
    dawHistory.pushHistory(get)
    const safeStepCount = AVAILABLE_STEP_COUNTS.includes(stepCount) ? stepCount : 16
    set((s) => {
      const stepSequencer = {
        ...s.stepSequencer,
        stepCount: safeStepCount,
        rows: s.stepSequencer.rows.map((row) => {
          const next = emptySteps(safeStepCount)
          for (let i = 0; i < Math.min(safeStepCount, row.steps.length); i += 1) {
            next[i] = row.steps[i]
          }
          return { ...row, steps: next }
        }),
      }
      return {
        stepSequencer,
        patterns: withSyncedPatterns(s.patterns, s.currentPatternId, stepSequencer),
      }
    })
  },
  setStepCell: (rowId, stepIndex, active, velocity) => {
    dawHistory.pushHistory(get)
    set((s) => {
      const stepSequencer = {
        ...s.stepSequencer,
        rows: s.stepSequencer.rows.map((r) =>
          r.id === rowId
            ? {
                ...r,
                steps: r.steps.map((c, i) =>
                  i === stepIndex
                    ? {
                        ...c,
                        active,
                        velocity: velocity != null ? Math.max(1, Math.min(127, velocity)) : c.velocity,
                      }
                    : c
                ),
              }
            : r
        ),
      }
      return {
        stepSequencer,
        patterns: withSyncedPatterns(s.patterns, s.currentPatternId, stepSequencer),
      }
    })
  },
  clearStepRow: (rowId) => {
    dawHistory.pushHistory(get)
    set((s) => {
      const stepSequencer = {
        ...s.stepSequencer,
        rows: s.stepSequencer.rows.map((r) =>
          r.id === rowId
            ? { ...r, steps: r.steps.map(() => ({ active: false, velocity: 100 })) }
            : r
        ),
      }
      return {
        stepSequencer,
        patterns: withSyncedPatterns(s.patterns, s.currentPatternId, stepSequencer),
      }
    })
  },
  toggleStepRowMute: (rowId) => {
    dawHistory.pushHistory(get)
    set((s) => {
      const stepSequencer = {
        ...s.stepSequencer,
        rows: s.stepSequencer.rows.map((r) => (r.id === rowId ? { ...r, muted: !r.muted } : r)),
      }
      return {
        stepSequencer,
        patterns: withSyncedPatterns(s.patterns, s.currentPatternId, stepSequencer),
      }
    })
  },
  setStepSwing: (swing) => {
    dawHistory.pushHistory(get)
    set((s) => {
      const stepSequencer = { ...s.stepSequencer, swing: Math.max(0, Math.min(50, swing)) }
      return {
        stepSequencer,
        patterns: withSyncedPatterns(s.patterns, s.currentPatternId, stepSequencer),
      }
    })
  },
  loadStepPreset: (presetName) => {
    dawHistory.pushHistory(get)
    const preset = STEP_PRESET_PATTERNS.find((p) => p.name === presetName)
    if (!preset) return
    set((s) => {
      const stepCount = s.stepSequencer.stepCount
      const rows = s.stepSequencer.rows.map((row, idx) => {
        if (idx < 4 && preset.pattern[idx]) {
          return {
            ...row,
            steps: Array.from({ length: stepCount }, (_, i) => ({
              active: Boolean(preset.pattern[idx][i]),
              velocity: 100,
            })),
          }
        }
        return { ...row, steps: emptySteps(stepCount) }
      })
      const stepSequencer = { ...s.stepSequencer, selectedPreset: presetName, rows }
      return {
        stepSequencer,
        patterns: withSyncedPatterns(s.patterns, s.currentPatternId, stepSequencer),
      }
    })
  },

  selectPattern: (patternId) => {
    dawHistory.pushHistory(get)
    const state = get()
    const synced = withSyncedPatterns(state.patterns, state.currentPatternId, state.stepSequencer)
    const target = synced.find((p) => p.id === patternId)
    if (!target) return
    set({
      patterns: synced,
      currentPatternId: patternId,
      stepSequencer: cloneStepSequencer(target.stepSequencer),
    })
  },
  addPattern: (name) => {
    dawHistory.pushHistory(get)
    const state = get()
    const synced = withSyncedPatterns(state.patterns, state.currentPatternId, state.stepSequencer)
    const id = generateId()
    const stepSequencer = createDefaultStepSequencerState()
    const patternName = name?.trim() || `Pattern ${synced.length + 1}`
    set({
      patterns: [...synced, { id, name: patternName, stepSequencer }],
      currentPatternId: id,
      stepSequencer: cloneStepSequencer(stepSequencer),
    })
  },
  duplicatePattern: (patternId) => {
    dawHistory.pushHistory(get)
    const state = get()
    const synced = withSyncedPatterns(state.patterns, state.currentPatternId, state.stepSequencer)
    const source = synced.find((p) => p.id === patternId)
    if (!source) return
    const id = generateId()
    const copy = {
      id,
      name: `${source.name} copy`,
      stepSequencer: cloneStepSequencer(source.stepSequencer),
    }
    set({
      patterns: [...synced, copy],
      currentPatternId: id,
      stepSequencer: cloneStepSequencer(copy.stepSequencer),
    })
  },
  renamePattern: (patternId, name) => {
    dawHistory.pushHistory(get)
    set((s) => ({
      patterns: s.patterns.map((p) => (p.id === patternId ? { ...p, name: name.trim() || p.name } : p)),
    }))
  },
  sendPatternToPlaylist: (patternBars = 1) => {
    dawHistory.pushHistory(get)
    const state = get()
    const synced = withSyncedPatterns(state.patterns, state.currentPatternId, state.stepSequencer)
    const pattern = synced.find((p) => p.id === state.currentPatternId)
    if (!pattern) return
    const notes = stepSequencerToMidiNotes(pattern.stepSequencer, patternBars)
    if (notes.length === 0) return
    const beatsPerBar = 4
    const clipDuration = patternBars * beatsPerBar
    let trackId = state.selectedTrackId
    if (!trackId || state.tracks.find((t) => t.id === trackId)?.type !== 'midi') {
      get().addTrack('midi', pattern.name, 'kick')
      trackId = get().tracks[get().tracks.length - 1]?.id
    }
    if (!trackId) return
    get().addClip(trackId, {
      trackId,
      name: pattern.name,
      start: state.currentBeat,
      duration: clipDuration,
      color: '#00d4ff',
      notes: notes.map((n) => ({
        id: generateId(),
        pitch: n.pitch,
        start: n.start,
        duration: n.duration,
        velocity: n.velocity,
      })),
      clipType: 'midi',
    })
    set({ patterns: synced })
  },

  // Track actions
  addTrack: (type, name, instrumentKey) => {
    dawHistory.pushHistory(get)
    const tracks = get().tracks
    const lower = (name || '').toLowerCase()
    const isDrumName = lower.includes('kit') || lower.includes('drum')
    const instrument =
      type === 'audio'
        ? 'lead'
        : instrumentKey != null
          ? instrumentKey
          : isDrumName
            ? 'kick'
            : 'lead'
    const newTrack: Track = {
      id: generateId(),
      name: name || `${type === 'midi' ? 'MIDI' : 'Audio'} ${tracks.length + 1}`,
      instrument,
      type,
      color: trackColors[tracks.length % trackColors.length],
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      clips: [],
      effects: []
    }
    set({ tracks: [...tracks, newTrack] })
  },

  removeTrack: (id) => {
    dawHistory.pushHistory(get)
    set((state) => ({
    tracks: state.tracks.filter(t => t.id !== id),
    selectedTrackId: state.selectedTrackId === id ? null : state.selectedTrackId
  }))
  },

  updateTrack: (id, updates) => {
    dawHistory.pushHistory(get)
    set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, ...updates } : t)
  }))
  },

  selectTrack: (id) => set({ selectedTrackId: id }),

  toggleMute: (id) => {
    dawHistory.pushHistory(get)
    const track = get().tracks.find(t => t.id === id)
    const newMuted = !track?.muted
    const vol = track?.volume ?? 0.8
    audioEngine.setTrackMuted(id, newMuted, vol)
    set((state) => ({
      tracks: state.tracks.map(t => t.id === id ? { ...t, muted: newMuted } : t)
    }))
  },
  toggleSolo: (id) => {
    dawHistory.pushHistory(get)
    set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, solo: !t.solo } : t)
  }))
  },

  setTrackVolume: (id, volume) => {
    const v = Math.max(0, Math.min(1, volume))
    const t = get().tracks.find((x) => x.id === id)
    if (t?.muted) {
      audioEngine.setTrackMuted(id, true, v)
    } else {
      audioEngine.setTrackVolume(id, v)
    }
    set((state) => ({
      tracks: state.tracks.map(t => t.id === id ? { ...t, volume: v } : t)
    }))
  },

  setTrackPan: (id, pan) => {
    const p = Math.max(-1, Math.min(1, pan))
    audioEngine.setTrackPan(id, p)
    set((state) => ({
      tracks: state.tracks.map(t => t.id === id ? { ...t, pan: p } : t)
    }))
  },

  // Clip actions
  addClip: (trackId, clipData) => {
    dawHistory.pushHistory(get)
    const clip: Clip = {
      ...clipData,
      id: generateId(),
      clipType: clipData.clipType ?? (clipData.audioUrl ? 'audio' : 'midi'),
    }
    set((state) => ({
      tracks: state.tracks.map(t =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      )
    }))
  },

  addAudioClipFromFile: async (trackId, file) => {
    dawHistory.pushHistory(get)
    const url = URL.createObjectURL(file)
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const buffer = await ctx.decodeAudioData(await file.arrayBuffer())
    await ctx.close()
    const bpm = get().bpm
    const durationBeats = Math.max(0.25, (buffer.duration * bpm) / 60)
    const name = file.name.replace(/\.[^.]+$/, '') || 'Audio'
    const clip: Clip = {
      id: generateId(),
      trackId,
      name,
      start: 0,
      duration: durationBeats,
      color: '#a78bfa',
      notes: [],
      audioUrl: url,
      clipType: 'audio',
    }
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      ),
    }))
  },

  removeClip: (clipId) => {
    dawHistory.pushHistory(get)
    set((state) => ({
      tracks: state.tracks.map(t => ({
        ...t,
        clips: t.clips.filter(c => c.id !== clipId)
      })),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId
    }))
  },

  updateClip: (clipId, updates, options) => {
    if (options?.recordHistory !== false) dawHistory.pushHistory(get)
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
      })),
    }))
  },

  selectClip: (id) => set({ selectedClipId: id }),

  moveClip: (clipId, trackId, start, options) => {
    if (options?.recordHistory !== false) dawHistory.pushHistory(get)
    set((state) => {
    // Find and remove clip from current track
    let movedClip: Clip | null = null
    const tracksWithoutClip = state.tracks.map(t => {
      const clip = t.clips.find(c => c.id === clipId)
      if (clip) {
        movedClip = { ...clip, start, trackId }
        return { ...t, clips: t.clips.filter(c => c.id !== clipId) }
      }
      return t
    })

    // Add clip to target track
    if (movedClip) {
      return {
        tracks: tracksWithoutClip.map(t =>
          t.id === trackId ? { ...t, clips: [...t.clips, movedClip!] } : t
        )
      }
    }
    return state
  })
  },

  setTrackEnvelope: (trackId, envelope) => {
    dawHistory.pushHistory(get)
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, envelope } : t)),
    }))
  },

  // Note actions
  addNote: (clipId, noteData) => {
    dawHistory.pushHistory(get)
    const note: Note = { ...noteData, id: generateId() }
    set((state) => ({
      tracks: state.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c =>
          c.id === clipId ? { ...c, notes: [...c.notes, note] } : c
        )
      }))
    }))
  },

  removeNote: (clipId, noteId) => {
    dawHistory.pushHistory(get)
    set((state) => ({
      tracks: state.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c =>
          c.id === clipId ? { ...c, notes: c.notes.filter(n => n.id !== noteId) } : c
        )
      })),
    }))
  },

  updateNote: (clipId, noteId, updates) => {
    dawHistory.pushHistory(get)
    set((state) => ({
      tracks: state.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c =>
          c.id === clipId
            ? { ...c, notes: c.notes.map(n => n.id === noteId ? { ...n, ...updates } : n) }
            : c
        )
      })),
    }))
  },
  updateNotesBatch: (clipId, batch, options) => {
    if (options?.recordHistory !== false) dawHistory.pushHistory(get)
    const byId = new Map(batch.map((b) => [b.noteId, b.updates]))
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId
            ? {
                ...c,
                notes: c.notes.map((n) => {
                  const updates = byId.get(n.id)
                  return updates ? { ...n, ...updates } : n
                }),
              }
            : c
        ),
      })),
    }))
  },

  // Effect actions
  addEffect: (trackId, type) => {
    dawHistory.pushHistory(get)
    const effect: Effect = {
      id: generateId(),
      type,
      enabled: true,
      params: { ...defaultEffectParams[type] }
    }
    set((state) => ({
      tracks: state.tracks.map(t =>
        t.id === trackId ? { ...t, effects: [...t.effects, effect] } : t
      )
    }))
  },

  removeEffect: (trackId, effectId) => {
    dawHistory.pushHistory(get)
    set((state) => ({
      tracks: state.tracks.map(t =>
        t.id === trackId ? { ...t, effects: t.effects.filter(e => e.id !== effectId) } : t
      ),
    }))
  },

  toggleEffect: (trackId, effectId) => {
    dawHistory.pushHistory(get)
    set((state) => ({
      tracks: state.tracks.map(t =>
        t.id === trackId
          ? { ...t, effects: t.effects.map(e => e.id === effectId ? { ...e, enabled: !e.enabled } : e) }
          : t
      ),
    }))
  },

  updateEffectParam: (trackId, effectId, param, value) => set((state) => ({
    tracks: state.tracks.map(t =>
      t.id === trackId
        ? {
            ...t,
            effects: t.effects.map(e =>
              e.id === effectId ? { ...e, params: { ...e.params, [param]: value } } : e
            )
          }
        : t
    )
  })),

  reorderTrackEffects: (trackId, fromIndex, toIndex) => {
    dawHistory.pushHistory(get)
    set((state) => ({
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t
        const next = [...t.effects]
        const fi = Math.max(0, Math.min(next.length - 1, fromIndex))
        const ti = Math.max(0, Math.min(next.length - 1, toIndex))
        const [moved] = next.splice(fi, 1)
        next.splice(ti, 0, moved)
        return { ...t, effects: next }
      }),
    }))
  },

  undo: () => {
    dawHistory.undo(get, (snap) => {
      set({
        tracks: snap.tracks,
        bpm: snap.bpm,
        timeSignature: snap.timeSignature,
        masterVolume: snap.masterVolume,
        loopStart: snap.loopStart,
        loopEnd: snap.loopEnd,
        loopEnabled: snap.loopEnabled,
        stepSequencer: snap.stepSequencer ?? get().stepSequencer,
        metronomeEnabled: snap.metronomeEnabled ?? get().metronomeEnabled,
      })
      audioEngine.setBPM(snap.bpm)
      audioEngine.setMasterVolume(snap.masterVolume)
    })
  },

  redo: () => {
    dawHistory.redo(get, (snap) => {
      set({
        tracks: snap.tracks,
        bpm: snap.bpm,
        timeSignature: snap.timeSignature,
        masterVolume: snap.masterVolume,
        loopStart: snap.loopStart,
        loopEnd: snap.loopEnd,
        loopEnabled: snap.loopEnabled,
        stepSequencer: snap.stepSequencer ?? get().stepSequencer,
        metronomeEnabled: snap.metronomeEnabled ?? get().metronomeEnabled,
      })
      audioEngine.setBPM(snap.bpm)
      audioEngine.setMasterVolume(snap.masterVolume)
    })
  },

  canUndo: () => dawHistory.canUndo(),
  canRedo: () => dawHistory.canRedo(),

  // UI actions
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setScroll: (scrollX, scrollY) => set({ scrollX, scrollY }),
  setDockOpen: (panel, open) =>
    set((state) => ({ dockPanels: { ...state.dockPanels, [panel]: open } })),
  toggleDock: (panel) =>
    set((state) => ({ dockPanels: { ...state.dockPanels, [panel]: !state.dockPanels[panel] } })),
  setDockSize: (panel, size) =>
    set((state) => ({
      dockSizes: {
        ...state.dockSizes,
        [panel]: Math.max(12, Math.min(40, Math.round(size * 10) / 10)),
      },
    })),
  setWorkspaceSize: (panel, size) =>
    set((state) => ({
      workspaceSizes: {
        ...state.workspaceSizes,
        [panel]: Math.max(10, Math.min(80, Math.round(size * 10) / 10)),
      },
    })),
  setClipSnap: (snap) => set({ clipSnap: Math.max(0, snap) }),
  setNoteSnap: (snap) => set({ noteSnap: Math.max(0, snap) }),
  setSimpleMode: (simpleMode) => set({ simpleMode }),
  resetStudioLayout: () =>
    set({
      dockPanels: { browser: true, producer: false, mixer: false },
      dockSizes: { browser: 20, producer: 22, mixer: 24 },
      workspaceSizes: { playlist: 78, rack: 22, piano: 20 },
      clipSnap: 0.25,
      noteSnap: 0.25,
      simpleMode: false,
    }),
  openPianoRoll: (clipId) => set({ pianoRollOpen: true, pianoRollClipId: clipId }),
  closePianoRoll: () => set({ pianoRollOpen: false, pianoRollClipId: null })
    }),
    {
      name: 'pro-teeverse-daw',
      partialize: (s) => ({
        tracks: s.tracks,
        bpm: s.bpm,
        masterVolume: s.masterVolume,
        timeSignature: s.timeSignature,
        currentBeat: s.currentBeat,
        loopStart: s.loopStart,
        loopEnd: s.loopEnd,
        loopEnabled: s.loopEnabled,
        selectedTrackId: s.selectedTrackId,
        selectedClipId: s.selectedClipId,
        stepSequencer: s.stepSequencer,
        patterns: s.patterns,
        currentPatternId: s.currentPatternId,
        metronomeEnabled: s.metronomeEnabled,
        metronomeVolume: s.metronomeVolume,
        dockPanels: s.dockPanels,
        dockSizes: s.dockSizes,
        workspaceSizes: s.workspaceSizes,
        clipSnap: s.clipSnap,
        noteSnap: s.noteSnap,
        simpleMode: s.simpleMode,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<DAWState> | undefined
        if (!p) return current
        const legacyPanel = (p as { activePanel?: 'browser' | 'ai' | 'mixer' | null }).activePanel
        const mergedDockPanels = p.dockPanels
          ? p.dockPanels
          : legacyPanel
            ? {
                browser: legacyPanel === 'browser',
                producer: legacyPanel === 'ai',
                mixer: legacyPanel === 'mixer',
              }
            : current.dockPanels
        const persistedStep = p.stepSequencer ?? current.stepSequencer
        const persistedStepCount = AVAILABLE_STEP_COUNTS.includes(
          (persistedStep as StepSequencerState).stepCount as StepCount
        )
          ? (persistedStep as StepSequencerState).stepCount
          : 16
        const normalizedStep = {
          ...persistedStep,
          stepCount: persistedStepCount,
          rows: (persistedStep.rows ?? current.stepSequencer.rows).map((row) => {
            const next = emptySteps(persistedStepCount)
            for (let i = 0; i < Math.min(next.length, row.steps.length); i += 1) {
              next[i] = row.steps[i]
            }
            return { ...row, steps: next }
          }),
        }
        const persistedPatterns = (p as { patterns?: DawPattern[] }).patterns
        const patterns =
          persistedPatterns && persistedPatterns.length > 0
            ? persistedPatterns.map((pat) => ({
                ...pat,
                stepSequencer: {
                  ...pat.stepSequencer,
                  stepCount: AVAILABLE_STEP_COUNTS.includes(
                    pat.stepSequencer.stepCount as StepCount
                  )
                    ? pat.stepSequencer.stepCount
                    : persistedStepCount,
                },
              }))
            : current.patterns
        const currentPatternId =
          (p as { currentPatternId?: string }).currentPatternId &&
          patterns.some((x) => x.id === (p as { currentPatternId?: string }).currentPatternId)
            ? (p as { currentPatternId: string }).currentPatternId
            : patterns[0]?.id ?? current.currentPatternId
        return {
          ...current,
          ...p,
          stepSequencer: normalizedStep,
          patterns,
          currentPatternId,
          metronomeEnabled: p.metronomeEnabled ?? current.metronomeEnabled,
          metronomeVolume: p.metronomeVolume ?? current.metronomeVolume,
          dockPanels: mergedDockPanels,
          dockSizes: p.dockSizes ?? current.dockSizes,
          workspaceSizes: p.workspaceSizes ?? current.workspaceSizes,
          clipSnap: p.clipSnap ?? current.clipSnap,
          noteSnap: p.noteSnap ?? current.noteSnap,
          simpleMode: p.simpleMode ?? current.simpleMode,
          tracks: (p.tracks ?? current.tracks).map((t) => ({
            ...t,
            instrument: t.instrument ?? 'lead',
            clips: (t.clips ?? []).map((c) => ({
              ...c,
              clipType: c.clipType ?? (c.audioUrl && !c.notes?.length ? 'audio' : 'midi'),
            })),
          })),
        }
      },
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ssrStorage
      ),
    }
  )
)
