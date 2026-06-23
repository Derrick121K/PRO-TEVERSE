import * as Tone from 'tone'
import { EQ3 } from 'tone'
import type { Effect } from './daw-store'

/**
 * Instantiates Tone.js nodes for mixer-insert effects (real DSP).
 */
export function createToneNodeForEffect(e: Effect): Tone.ToneAudioNode | null {
  if (!e.enabled) return null
  const p = e.params
  try {
    switch (e.type) {
      case 'reverb': {
        const room = Math.min(0.95, Math.max(0.01, (p.decay ?? 2) / 10))
        const r = new Tone.Freeverb(room)
        r.wet.value = p.mix ?? 0.3
        r.dampening = Math.max(300, Math.min(12000, 4000 * (1 - (p.predelay ?? 0.01) * 5)))
        return r
      }
      case 'delay': {
        const t = p.time ?? 0.25
        const d = new Tone.FeedbackDelay(t, p.feedback ?? 0.4)
        d.wet.value = p.mix ?? 0.3
        return d
      }
      case 'eq': {
        return new EQ3(p.lowGain ?? 0, p.midGain ?? 0, p.highGain ?? 0)
      }
      case 'compressor': {
        const c = new Tone.Compressor(p.threshold ?? -24, p.ratio ?? 4)
        c.attack.value = p.attack ?? 0.003
        c.release.value = p.release ?? 0.25
        return c
      }
      case 'filter': {
        const types = ['lowpass', 'highpass', 'bandpass'] as const
        const ft = types[Math.min(2, Math.max(0, Math.floor(p.type ?? 0)))]
        const f = new Tone.Filter(p.frequency ?? 1000, ft)
        f.Q.value = p.resonance ?? 1
        return f
      }
      case 'distortion': {
        const d = new Tone.Distortion(p.amount ?? 0.4)
        d.wet.value = p.mix ?? 0.5
        return d
      }
      case 'chorus': {
        const c = new Tone.Chorus(p.rate ?? 2, p.delay ?? 2.5, p.depth ?? 0.4)
        c.wet.value = p.mix ?? 0.35
        c.start()
        return c
      }
      case 'phaser': {
        const ph = new Tone.Phaser({
          frequency: p.frequency ?? 0.4,
          octaves: p.octaves ?? 3,
          baseFrequency: p.baseFrequency ?? 500,
        })
        ph.wet.value = p.mix ?? 0.35
        return ph
      }
      case 'tremolo': {
        const tr = new Tone.Tremolo(p.speed ?? 8, p.depth ?? 0.6)
        tr.wet.value = p.mix ?? 0.4
        tr.start()
        return tr
      }
      default:
        return null
    }
  } catch {
    return null
  }
}
