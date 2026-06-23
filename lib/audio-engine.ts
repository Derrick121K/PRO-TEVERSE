// PRO-TEEVERSE DAW — Tone.js (Web Audio API) engine: per-track buses, insert FX, FL-style instruments.
// Single shared AudioContext via Tone; interactive latency hint reduces input/scheduler lag.

import * as Tone from 'tone'
import type { Track, Clip, TrackEnvelope } from './daw-store'
import { createToneNodeForEffect } from './tone-daw-effects'
import type { StepSequencerState } from './daw-step-sequencer-defaults'
import { soundManager, type CoreDrumId } from './sound-manager'

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'pulse'

export interface TrackData {
  id: string
  name: string
  /** Engine instrument (channel strip). */
  instrument?: string
  muted: boolean
  clips: {
    id?: string
    start: number
    duration: number
    notes: {
      pitch: number
      start: number
      duration: number
      velocity: number
    }[]
    audioUrl?: string
    clipType?: 'midi' | 'audio'
    trimStart?: number
  }[]
}

/** Shared mapping from DAW store tracks to engine playback data (timeline + transport). */
export function clipIsAudio(clip: Clip): boolean {
  if (clip.clipType === 'audio') return true
  if (clip.audioUrl && (clip.notes?.length ?? 0) === 0) return true
  return false
}

/** Options for pattern + metronome when `start()` runs (from Zustand via `setPlaybackOptions`). */
export type PlaybackOptions = {
  stepSequencer: StepSequencerState
  metronomeEnabled: boolean
  metronomeVolume: number
}

/** Convert quarter-note beats to Tone transport position (bars:beats:sixteenths). */
export function beatsToTransportPosition(beats: number): string {
  const safe = Math.max(0, beats)
  const bars = Math.floor(safe / 4)
  const beat = Math.floor(safe % 4)
  const sixteenths = Math.min(3, Math.round((safe % 1) * 4))
  return `${bars}:${beat}:${sixteenths}`
}

export function transportPositionToBeats(position: string | number): number {
  if (typeof position === 'number') return position
  const parts = String(position).split(':').map((p) => parseFloat(p) || 0)
  const [bars = 0, beats = 0, sixteenths = 0] = parts
  return bars * 4 + beats + sixteenths / 4
}

export function tracksToTrackData(tracks: Track[]): TrackData[] {
  return tracks.map((track) => ({
    id: track.id,
    name: track.name,
    instrument: track.instrument,
    muted: track.muted,
    clips: track.clips.map((clip) => ({
      id: clip.id,
      start: clip.start,
      duration: clip.duration,
      notes: clip.notes.map((note) => ({
        pitch: note.pitch,
        start: note.start,
        duration: note.duration,
        velocity: note.velocity,
      })),
      audioUrl: clip.audioUrl,
      clipType: clip.clipType,
      trimStart: clip.trimStart,
    })),
  }))
}


type ToneTrackInstrument =
  | Tone.MembraneSynth
  | Tone.NoiseSynth
  | Tone.MetalSynth
  | Tone.MonoSynth
  | Tone.PolySynth
  | Tone.PluckSynth

const TONE_SYNTHS: Record<string, () => ToneTrackInstrument> = {
  kick: () =>
    new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
    }),
  snare: () =>
    new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
    }),
  hihat: () =>
    new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.05 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }),
  subBass: () =>
    new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
      filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 1, baseFrequency: 50, octaves: 2 },
    }),
  synthBass: () =>
    new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 },
      filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.7, baseFrequency: 200, octaves: 3 },
    }),
  wobble: () =>
    new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.2 },
      filterEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.4, baseFrequency: 200, octaves: 4 },
    }),
  electricPiano: () =>
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.5, sustain: 0.3, release: 0.8 },
    }),
  organ: () =>
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 1, release: 0.1 },
    }),
  lead: () =>
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.3 },
    }),
  sawtooth: () =>
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.75, release: 0.25 },
    }),
  pad: () =>
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 },
    }),
  pluck: () =>
    new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 4000,
      resonance: 0.5,
    }),
  strings: () =>
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.4, decay: 0.2, sustain: 0.9, release: 1 },
    }),
  sine: () =>
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 },
    }),
  square: () =>
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.3 },
    }),
  triangle: () =>
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.65, release: 0.35 },
    }),
}

type TrackRackState = {
  busIn: Tone.Gain
  effectNodes: Tone.ToneAudioNode[]
  pan: Tone.Panner
  vol: Tone.Volume
  voiceSynths: Map<string, ToneTrackInstrument>
  audioPlayers: Map<string, Tone.Player>
  dispose: () => void
}

class AudioEngine {
  private initialized: boolean = false
  private masterEffect: Tone.ToneAudioNode | null = null
  private analyser: Tone.Analyser | null = null
  private trackRacks = new Map<string, TrackRackState>()
  private previewSynths = new Map<string, { synth: ToneTrackInstrument; vol: Tone.Volume }>()
  private recorder: Tone.Recorder | null = null
  private masterRecordingActive = false
  private bpm: number = 120
  private onBeatChange: ((beat: number) => void) | null = null
  private playbackOptions: PlaybackOptions | null = null
  private beatRaf: number | null = null
  private stepLoop: Tone.Loop | null = null
  private metroLoop: Tone.Loop | null = null
  private metronomeVoice: Tone.MetalSynth | null = null
  private trackEnvelopes = new Map<string, TrackEnvelope>()
  private lastDrumTriggerAt = new Map<string, number>()
  private lastScheduleTime = 0
  private scheduledEventIds: number[] = []
  private initPromise: Promise<void> | null = null

  /** Master bus must belong to the same context as newly created track nodes. */
  private masterMatchesContext(): boolean {
    if (!this.masterEffect) return false
    try {
      return this.masterEffect.context === Tone.getContext()
    } catch {
      return false
    }
  }

  private disposeMasterGraph() {
    this.stop()
    this.clearPatternTransport()
    for (const rack of this.trackRacks.values()) rack.dispose()
    this.trackRacks.clear()
    for (const p of this.previewSynths.values()) {
      try {
        p.synth.dispose()
        p.vol.dispose()
      } catch {
        /* */
      }
    }
    this.previewSynths.clear()
    try {
      this.metronomeVoice?.dispose()
    } catch {
      /* */
    }
    this.metronomeVoice = null
    try {
      this.recorder?.dispose()
    } catch {
      /* */
    }
    this.recorder = null
    try {
      this.masterEffect?.dispose()
    } catch {
      /* */
    }
    this.masterEffect = null
    try {
      this.analyser?.dispose()
    } catch {
      /* */
    }
    this.analyser = null
    soundManager.dispose()
    this.initialized = false
    this.initPromise = null
  }

  async initialize() {
    if (this.initialized && this.masterMatchesContext()) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      if (this.initialized && !this.masterMatchesContext()) {
        this.disposeMasterGraph()
      }

      await Tone.start()
      const ctx = Tone.getContext()
      if ('latencyHint' in ctx) {
        try {
          ;(ctx as Tone.BaseContext & { latencyHint?: string }).latencyHint = 'interactive'
        } catch {
          /* read-only in some builds */
        }
      }

      Tone.getTransport().bpm.value = this.bpm
      this.analyser = new Tone.Analyser('waveform', 1024)
      this.masterEffect = new Tone.Gain(0.8)
      this.masterEffect.connect(this.analyser)
      this.analyser.toDestination()
      this.recorder = new Tone.Recorder()
      this.masterEffect.connect(this.recorder)
      this.metronomeVoice = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.02, release: 0.01 },
        harmonicity: 3.1,
        modulationIndex: 8,
      }).connect(this.masterEffect)
      this.metronomeVoice.volume.value = Tone.gainToDb(0.5)
      await soundManager.preloadCoreKit(this.masterEffect)
      this.initialized = true
    })()

    try {
      await this.initPromise
    } catch (e) {
      this.disposeMasterGraph()
      throw e
    } finally {
      this.initPromise = null
    }
  }

  private linearToDb(v: number, muted: boolean): number {
    if (muted) return -100
    if (v <= 0.0001) return -100
    return Tone.gainToDb(Math.min(1, Math.max(0, v)))
  }

  /** Rebuilds channel strips from project tracks (insert FX, pan, fader to master). */
  async syncTracks(tracks: Track[]) {
    await this.initialize()
    if (!this.masterEffect || !this.masterMatchesContext()) return
    const keep = new Set(tracks.map((t) => t.id))
    for (const [id, rack] of this.trackRacks) {
      if (!keep.has(id)) {
        rack.dispose()
        this.trackRacks.delete(id)
      }
    }
    for (const t of tracks) {
      this.rebuildRack(t, tracks)
    }
  }

  /** Called before each transport `start` so step/metro patterns match the Zustand snapshot. */
  setPlaybackOptions(opts: PlaybackOptions) {
    this.playbackOptions = opts
  }

  private static padToDrum(
    id: string
  ): 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' {
    const map: Record<string, 'kick' | 'snare' | 'hihat' | 'clap' | 'tom'> = {
      kick: 'kick',
      snare: 'snare',
      hihat: 'hihat',
      clap: 'clap',
      tom1: 'tom',
      tom2: 'tom',
      perc1: 'kick',
      perc2: 'snare',
    }
    return map[id] ?? 'kick'
  }

  private static midiPitchToDrum(
    pitch: number
  ): 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' | null {
    if (pitch === 35 || pitch === 36) return 'kick'
    if (pitch === 37 || pitch === 38 || pitch === 40) return 'snare'
    if (pitch === 42 || pitch === 44 || pitch === 46) return 'hihat'
    if (pitch === 39) return 'clap'
    if (pitch === 41 || pitch === 43 || pitch === 45 || pitch === 47 || pitch === 48 || pitch === 50) return 'tom'
    return null
  }

  private clearScheduledEvents() {
    const transport = Tone.getTransport()
    for (const id of this.scheduledEventIds) {
      try {
        transport.clear(id)
      } catch {
        /* */
      }
    }
    this.scheduledEventIds = []
  }

  private clearPatternTransport() {
    this.clearScheduledEvents()
    if (this.stepLoop) {
      this.stepLoop.stop()
      this.stepLoop.dispose()
      this.stepLoop = null
    }
    if (this.metroLoop) {
      this.metroLoop.stop()
      this.metroLoop.dispose()
      this.metroLoop = null
    }
  }

  private startBeatRaf() {
    this.stopBeatRaf()
    const tick = () => {
      const t = Tone.getTransport()
      if (t.state === 'started' && this.onBeatChange) {
        const beat = transportPositionToBeats(t.position as string)
        this.onBeatChange(beat)
      }
      this.beatRaf = requestAnimationFrame(tick)
    }
    this.beatRaf = requestAnimationFrame(tick)
  }

  private stopBeatRaf() {
    if (this.beatRaf != null) {
      cancelAnimationFrame(this.beatRaf)
      this.beatRaf = null
    }
  }

  private applyEnvelopeIfAny(s: ToneTrackInstrument, trackId: string) {
    const e = this.trackEnvelopes.get(trackId)
    if (!e) return
    if (s instanceof Tone.PolySynth) {
      try {
        s.set({
          envelope: {
            attack: e.attack,
            decay: e.decay,
            sustain: e.sustain,
            release: e.release,
          },
        } as object)
      } catch {
        /* */
      }
    } else if (s instanceof Tone.MonoSynth) {
      try {
        s.set({ envelope: { ...e } } as object)
      } catch {
        /* */
      }
    }
  }

  private rebuildRack(track: Track, allTracks: Track[]) {
    if (!this.masterEffect || !this.masterMatchesContext()) return
    if (track.envelope) {
      this.trackEnvelopes.set(track.id, track.envelope)
    } else {
      this.trackEnvelopes.delete(track.id)
    }
    const anySolo = allTracks.some((t) => t.solo)
    const existing = this.trackRacks.get(track.id)
    if (existing) existing.dispose()

    const busIn = new Tone.Gain(1)
    const effectNodes: Tone.ToneAudioNode[] = []
    for (const eff of track.effects) {
      const n = createToneNodeForEffect(eff)
      if (n) effectNodes.push(n)
    }
    let chain: Tone.ToneAudioNode = busIn
    for (const n of effectNodes) {
      chain.connect(n)
      chain = n
    }
    const pan = new Tone.Panner(track.pan ?? 0)
    const effectiveMuted = track.muted || (anySolo && !track.solo)
    const vol = new Tone.Volume(this.linearToDb(track.volume ?? 0.8, effectiveMuted))
    chain.connect(pan)
    pan.connect(vol)
    vol.connect(this.masterEffect)

    const voiceSynths = new Map<string, ToneTrackInstrument>()
    const audioPlayers = new Map<string, Tone.Player>()

    for (const c of track.clips) {
      if (!c.audioUrl || !clipIsAudio(c)) continue
      const pl = new Tone.Player(c.audioUrl)
      pl.connect(busIn)
      pl.volume.value = Tone.gainToDb(0.95)
      audioPlayers.set(c.id, pl)
    }

    const rack: TrackRackState = {
      busIn,
      effectNodes,
      pan,
      vol,
      voiceSynths,
      audioPlayers,
      dispose: () => {
        try {
          for (const s of voiceSynths.values()) {
            try {
              s.dispose()
            } catch {
              /* */
            }
          }
          voiceSynths.clear()
          for (const p of audioPlayers.values()) {
            try {
              p.stop()
              p.dispose()
            } catch {
              /* */
            }
          }
          audioPlayers.clear()
          for (const n of effectNodes) n.dispose()
          busIn.dispose()
          pan.dispose()
          vol.dispose()
        } catch {
          /* */
        }
      },
    }
    this.trackRacks.set(track.id, rack)
  }

  private isPreviewId(id: string) {
    return id === 'preview' || id.startsWith('chord-') || id.startsWith('sequencer-') || id.startsWith('quickplay')
  }

  private getOrCreateVoice(trackId: string, instrument: string): ToneTrackInstrument {
    if (this.isPreviewId(trackId)) {
      return this.getPreviewSynth(instrument)
    }
    const rack = this.trackRacks.get(trackId)
    if (!rack) {
      if (!this.initialized) void this.initialize()
      const create = TONE_SYNTHS[instrument] || TONE_SYNTHS.lead
      const s = create()
      const v = new Tone.Volume(0)
      s.connect(v)
      v.connect(this.masterEffect!)
      return s
    }
    const key = instrument
    let s = rack.voiceSynths.get(key)
    if (s) return s
    const create = TONE_SYNTHS[instrument] || TONE_SYNTHS.lead
    s = create()
    s.connect(rack.busIn)
    this.applyEnvelopeIfAny(s, trackId)
    rack.voiceSynths.set(key, s)
    return s
  }

  private getPreviewSynth(instrument: string): ToneTrackInstrument {
    const k = 'preview__' + (instrument || 'lead')
    let entry = this.previewSynths.get(k)
    if (entry) return entry.synth
    const create = TONE_SYNTHS[instrument || 'lead'] || TONE_SYNTHS.lead
    const synth = create()
    const vol = new Tone.Volume(0)
    synth.connect(vol)
    vol.connect(this.masterEffect!)
    this.previewSynths.set(k, { synth, vol })
    return synth
  }

  /**
   * Tone synth voices can throw when two trigger calls happen at an equal/earlier timestamp.
   * Keep per-voice drum trigger times strictly increasing by a tiny epsilon.
   */
  /** Avoid Tone "start time must be strictly greater" when many voices fire on one step. */
  private allocateScheduleTime(when: number): number {
    const base = Math.max(when, Tone.now())
    const safe = Math.max(base, this.lastScheduleTime + 0.001)
    this.lastScheduleTime = safe
    return safe
  }

  private safeTrigger(
    synth: ToneTrackInstrument,
    note: string | number,
    duration: number | string,
    time: number,
    velocity: number
  ) {
    try {
      synth.triggerAttackRelease(
        note as Parameters<Tone.MembraneSynth['triggerAttackRelease']>[0],
        duration,
        time,
        velocity
      )
    } catch {
      /* scheduler collision — skip */
    }
  }

  setOnBeatChange(callback: ((beat: number) => void) | null) {
    this.onBeatChange = callback
  }

  setLoop(enabled: boolean, start: number, end: number) {
    const transport = Tone.getTransport()
    transport.loop = enabled
    if (!enabled) return
    const safeStart = Math.max(0, start)
    const safeEnd = Math.max(safeStart + 0.25, end)
    const toTransportPos = (beats: number) => {
      const bars = Math.floor(beats / 4)
      const beat = Math.floor(beats % 4)
      const sixteenths = Math.floor((beats % 1) * 4)
      return `${bars}:${beat}:${sixteenths}`
    }
    transport.loopStart = toTransportPos(safeStart)
    transport.loopEnd = toTransportPos(safeEnd)
  }

  setBPM(bpm: number) {
    this.bpm = Math.max(20, Math.min(300, bpm))
    Tone.getTransport().bpm.value = this.bpm
  }

  getBPM(): number {
    return this.bpm
  }

  setTrackVolume(trackId: string, volume: number) {
    if (this.isPreviewId(trackId)) return
    const rack = this.trackRacks.get(trackId)
    if (rack) {
      const db = volume <= 0.0001 ? -100 : Tone.gainToDb(Math.min(1, Math.max(0, volume)))
      rack.vol.volume.rampTo(db, 0.05)
    }
  }

  setTrackPan(trackId: string, pan: number) {
    const rack = this.trackRacks.get(trackId)
    if (rack) {
      rack.pan.pan.rampTo(pan, 0.05)
    }
  }

  setTrackMuted(trackId: string, muted: boolean, volumeLinear: number) {
    if (this.isPreviewId(trackId)) return
    const rack = this.trackRacks.get(trackId)
    if (rack) {
      const db = this.linearToDb(muted ? 0.0001 : volumeLinear, muted)
      rack.vol.volume.rampTo(db, 0.05)
    }
  }

  setMasterVolume(volume: number) {
    if (this.masterEffect) {
      ;(this.masterEffect as Tone.Gain).gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  playNote(
    trackId: string,
    pitch: number,
    duration: number,
    velocity: number = 100,
    startTime?: number,
    _waveform?: OscillatorType,
    instrument = 'lead'
  ): string {
    if (!this.initialized) {
      void this.initialize()
    }
    const noteName = midiToNoteName(Math.max(0, Math.min(127, Math.round(pitch))))
    const vel = Math.max(0.1, Math.min(1, velocity / 127))
    const dur = `${Math.max(0.1, Math.min(10, duration))}n`
    const s = this.getOrCreateVoice(trackId, instrument)
    s.triggerAttackRelease(noteName, dur, startTime, vel)
    return `n-${Date.now()}`
  }

  playDrum(
    trackId: string,
    type: 'kick' | 'snare' | 'hihat' | 'clap' | 'tom',
    velocity: number = 100,
    when?: number
  ): string {
    if (!this.initialized) {
      void this.initialize()
    }
    const vel = Math.max(0.1, Math.min(1, velocity / 127))
    const t = this.allocateScheduleTime(when ?? Tone.now())
    const mappedType: CoreDrumId = type === 'tom' ? 'kick' : type
    if (soundManager.triggerCoreDrum(mappedType, t, vel)) {
      return `d-${type}-${Date.now()}`
    }
    const kick = this.getOrCreateVoice(trackId, 'kick')
    const snare = this.getOrCreateVoice(trackId, 'snare')
    const hihat = this.getOrCreateVoice(trackId, 'hihat')
    switch (type) {
      case 'kick':
        this.safeTrigger(kick, 'C1', '8n', t, vel)
        break
      case 'snare':
        try {
          snare.triggerAttackRelease('8n', t, vel)
        } catch {
          /* */
        }
        break
      case 'hihat':
        try {
          hihat.triggerAttackRelease('32n', t, vel)
        } catch {
          /* */
        }
        break
      case 'clap':
        try {
          snare.triggerAttackRelease('16n', t, vel)
        } catch {
          /* */
        }
        break
      case 'tom':
        this.safeTrigger(kick, 'D2', '8n', t, vel)
        break
    }
    return `d-${type}-${Date.now()}`
  }

  playChord(
    trackId: string,
    rootPitch: number,
    chordType: number[],
    duration: number,
    velocity: number = 100
  ): string {
    if (!this.initialized) {
      void this.initialize()
    }
    const notes = chordType.map((i) => midiToNoteName(rootPitch + i))
    const dur = `${Math.max(0.1, Math.min(10, duration))}n`
    const vel = Math.max(0.1, Math.min(1, velocity / 127))
    const s = this.getOrCreateVoice(trackId, 'pad') as Tone.PolySynth
    s.triggerAttackRelease(
      notes as Parameters<Tone.PolySynth['triggerAttackRelease']>[0],
      dur,
      Tone.now(),
      vel
    )
    return `chord-${Date.now()}`
  }

  stop() {
    this.clearPatternTransport()
    this.stopBeatRaf()
    Tone.getTransport().stop()
    for (const rack of this.trackRacks.values()) {
      for (const p of rack.audioPlayers.values()) {
        try {
          p.stop()
        } catch {
          /* */
        }
      }
      for (const s of rack.voiceSynths.values()) {
        try {
          if (s instanceof Tone.PolySynth) s.releaseAll()
          else s.triggerRelease(Tone.now())
        } catch {
          /* */
        }
      }
    }
    for (const p of this.previewSynths.values()) {
      try {
        if (p.synth instanceof Tone.PolySynth) p.synth.releaseAll()
        else p.synth.triggerRelease(Tone.now())
      } catch {
        /* */
      }
    }
    if (this.onBeatChange) this.onBeatChange(0)
  }

  pause() {
    this.clearPatternTransport()
    this.stopBeatRaf()
    Tone.getTransport().pause()
  }

  resume() {
    Tone.getTransport().start()
  }

  async start(trackData: TrackData[], startBeat: number = 0) {
    await this.initialize()
    this.clearPatternTransport()
    this.lastScheduleTime = 0
    this.lastDrumTriggerAt.clear()

    const transport = Tone.getTransport()
    transport.position = beatsToTransportPosition(startBeat)
    transport.start()
    this.startBeatRaf()

    const opts = this.playbackOptions
    if (opts?.stepSequencer?.enabled) {
      const rows = opts.stepSequencer.rows
      const stepCount = Math.max(1, opts.stepSequencer.stepCount || 16)
      let stepIdx = Math.floor((startBeat * 4) % stepCount) % stepCount
      this.stepLoop = new Tone.Loop((time) => {
        let lane = 0
        for (const row of rows) {
          if (row.muted) continue
          const cell = row.steps[stepIdx % stepCount]
          if (cell?.active) {
            const drum = AudioEngine.padToDrum(row.id)
            this.playDrum(
              `sequencer-${row.id}`,
              drum,
              cell.velocity,
              time + lane * 0.0001
            )
            lane += 1
          }
        }
        stepIdx = (stepIdx + 1) % stepCount
      }, '16n')
      this.stepLoop.start(0)
    }
    if (opts?.metronomeEnabled && this.metronomeVoice) {
      const mv = Math.max(0, Math.min(1, opts.metronomeVolume))
      this.metroLoop = new Tone.Loop((time) => {
        try {
          this.metronomeVoice?.triggerAttackRelease('C6', '32n', time, 0.2 + mv * 0.8)
        } catch {
          /* */
        }
      }, '4n')
      this.metroLoop.start(0)
    }
    const beatsPerSecond = this.bpm / 60

    for (const track of trackData) {
      if (track.muted) continue
      const base = track.instrument || 'lead'
      const nameLower = track.name.toLowerCase()
      const drumLike =
        base === 'kick' ||
        base === 'snare' ||
        base === 'hihat' ||
        base === 'clap' ||
        nameLower.includes('drum') ||
        nameLower.includes('perc')
      const rack = this.trackRacks.get(track.id)
      for (const clip of track.clips) {
        for (const note of clip.notes) {
          const absBeat = clip.start + note.start
          if (absBeat < startBeat) continue
          const noteName = midiToNoteName(note.pitch)
          const durSec = Math.max(0.02, note.duration / beatsPerSecond)
          const vel = note.velocity / 127
          const eventId = transport.schedule((time) => {
            if (drumLike) {
              const drum = AudioEngine.midiPitchToDrum(note.pitch)
              if (drum) {
                this.playDrum(track.id, drum, note.velocity, time)
                return
              }
            }
            const s = this.getOrCreateVoice(track.id, base)
            this.safeTrigger(s, noteName, durSec, time, vel)
          }, beatsToTransportPosition(absBeat))
          this.scheduledEventIds.push(eventId)
        }
        if (rack && clip.id && clip.audioUrl) {
          const isAud =
            clip.clipType === 'audio' || (clip.notes?.length ?? 0) === 0
          if (!isAud) continue
          const pl = rack.audioPlayers.get(clip.id)
          if (!pl) continue
          if (clip.start + clip.duration < startBeat) continue
          const off = clip.trimStart ?? 0
          const playDur = Math.max(0.05, (clip.duration / this.bpm) * 60 - off)
          const clipBeat = clip.start
          const scheduleClip = (time: number) => {
            if (!pl.loaded) return
            try {
              pl.start(time, off, playDur)
            } catch {
              /* */
            }
          }
          const clipEventId = transport.schedule(
            (time) => scheduleClip(time),
            beatsToTransportPosition(clipBeat)
          )
          this.scheduledEventIds.push(clipEventId)
          if (!pl.loaded) {
            void (async () => {
              for (let i = 0; i < 80 && !pl.loaded; i += 1) {
                await new Promise((r) => setTimeout(r, 25))
              }
              if (!pl.loaded) return
              const lateId = transport.schedule(
                (time) => scheduleClip(time),
                beatsToTransportPosition(clipBeat)
              )
              this.scheduledEventIds.push(lateId)
            })()
          }
        }
      }
    }
  }

  getAnalyserData(): Float32Array {
    if (!this.analyser) return new Float32Array(0)
    return this.analyser.getValue() as Float32Array
  }

  midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12)
  }

  getSynthPresets(): { id: string; name: string }[] {
    return Object.keys(TONE_SYNTHS).map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1'),
    }))
  }

  async startRecording(): Promise<void> {
    if (!this.recorder) await this.initialize()
    if (!this.recorder) return
    await this.recorder.start()
    this.masterRecordingActive = true
  }

  async stopRecording(): Promise<Blob> {
    if (!this.recorder) throw new Error('Recorder not initialized')
    this.masterRecordingActive = false
    return this.recorder.stop()
  }

  isMasterRecordingActive(): boolean {
    return this.masterRecordingActive
  }

  async exportToWav(
    tracks: Track[],
    bpm: number,
    durationBeats: number,
    options?: { singleTrackId?: string }
  ): Promise<Blob> {
    const durationSeconds = (durationBeats / bpm) * 60
    const beatsPerSecond = bpm / 60
    const filtered =
      options?.singleTrackId != null
        ? tracks.filter((t) => t.id === options.singleTrackId)
        : tracks

    const toneBuffer = await Tone.Offline(
      async () => {
        const voice = new Map<string, ToneTrackInstrument>()
        const getVoice = (trackId: string, inst: string, trackVol: number) => {
          const k = `${trackId}:${inst}`
          let s = voice.get(k)
          if (s) return s
          const create = TONE_SYNTHS[inst] || TONE_SYNTHS.lead
          s = create()
          const g = new Tone.Volume(Tone.gainToDb(trackVol))
          s.connect(g)
          g.toDestination()
          voice.set(k, s)
          return s
        }

        for (const track of filtered) {
          if (track.muted) continue
          const base = track.instrument || 'lead'
          const vol = track.volume ?? 0.8
          const nameLower = track.name.toLowerCase()
          for (const clip of track.clips) {
            if (clipIsAudio(clip) && clip.audioUrl) {
              try {
                const res = await fetch(clip.audioUrl)
                const ab = await res.arrayBuffer()
                const audioBuf = await Tone.getContext().decodeAudioData(ab)
                const player = new Tone.Player(audioBuf).toDestination()
                player.volume.value = Tone.gainToDb(vol)
                const absStart = (clip.start / bpm) * 60
                const off = clip.trimStart ?? 0
                const durSec = Math.max(0.05, clip.duration / beatsPerSecond)
                player.start(absStart, off, Math.min(durSec, audioBuf.duration - off))
              } catch {
                /* skip unloadable clip */
              }
              continue
            }
            for (const note of clip.notes) {
              const absStartBeats = clip.start + note.start
              const startTime = (absStartBeats / bpm) * 60
              const noteDurSec = Math.max(0.02, note.duration / beatsPerSecond)
              const vel = note.velocity / 127
              const noteName = midiToNoteName(note.pitch)
              let inst = base
              if (base === 'kick' || nameLower.includes('drum')) {
                if (note.pitch === 36 || note.pitch === 35) inst = 'kick'
                else if (note.pitch === 38 || note.pitch === 37) inst = 'snare'
                else if (note.pitch === 42 || note.pitch === 44 || note.pitch === 46) inst = 'hihat'
                else inst = 'kick'
              }
              const s = getVoice(track.id, inst, vol)
              s.triggerAttackRelease(noteName, noteDurSec, startTime, vel)
            }
          }
        }
      },
      durationSeconds,
      2
    )
    const ab = toneBuffer.get()
    if (!ab) throw new Error('Offline render produced no buffer')
    return audioBufferToWav(ab)
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getContext(): AudioContext | null {
    return Tone.getContext().rawContext as AudioContext
  }
}

function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(midi / 12) - 1
  return `${noteNames[midi % 12]}${octave}`
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const dataLength = buffer.length * blockAlign
  const bufferLength = 44 + dataLength
  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)
  writeWavString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeWavString(view, 8, 'WAVE')
  writeWavString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeWavString(view, 36, 'data')
  view.setUint32(40, dataLength, true)
  const offset = 44
  const chData = Array.from({ length: numChannels }, (_, i) => buffer.getChannelData(i))
  let pos = offset
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, chData[ch][i]))
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      pos += 2
    }
  }
  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeWavString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}

export const audioEngine = new AudioEngine()

export type { OscillatorType }
