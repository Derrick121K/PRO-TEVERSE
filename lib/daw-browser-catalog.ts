/**
 * Built-in browser lists (instruments, kits, effects) for the DAW UI.
 * Project tracks/ clips come from the store and localStorage only.
 */

import type { EffectType } from './daw-store'

export const instrumentPresets = [
  { id: 'sine-wave', name: 'Sine Wave', category: 'Basic', color: '#FF6B6B', engineKey: 'sine' as const },
  { id: 'square-wave', name: 'Square Wave', category: 'Basic', color: '#FF6B6B', engineKey: 'square' as const },
  { id: 'sawtooth', name: 'Sawtooth', category: 'Basic', color: '#FF6B6B', engineKey: 'sawtooth' as const },
  { id: 'triangle', name: 'Triangle', category: 'Basic', color: '#FF6B6B', engineKey: 'triangle' as const },
  { id: 'sub-bass', name: 'Sub Bass', category: 'Bass', color: '#4ECDC4', engineKey: 'subBass' as const },
  { id: 'wobble-bass', name: 'Wobble Bass', category: 'Bass', color: '#4ECDC4', engineKey: 'synthBass' as const },
  { id: 'bright-lead', name: 'Bright Lead', category: 'Lead', color: '#FFD93D', engineKey: 'lead' as const },
  { id: 'soft-lead', name: 'Soft Lead', category: 'Lead', color: '#FFD93D', engineKey: 'pluck' as const },
  { id: 'warm-pad', name: 'Warm Pad', category: 'Pads', color: '#A78BFA', engineKey: 'pad' as const },
  { id: 'string-pad', name: 'String Pad', category: 'Pads', color: '#A78BFA', engineKey: 'strings' as const },
]

export const drumKits = [
  { id: 'kit-acoustic', name: 'Acoustic Kit', engineKey: 'kick' as const },
  { id: 'kit-electronic', name: 'Electronic Kit', engineKey: 'kick' as const },
  { id: 'kit-trap', name: 'Trap Kit', engineKey: 'kick' as const },
  { id: 'kit-808', name: '808 Kit', engineKey: 'kick' as const },
  { id: 'kit-lo-fi', name: 'Lo-Fi Kit', engineKey: 'kick' as const },
]

export interface Plugin {
  id: string
  name: string
  description: string
  type: string
  category: string
  icon: string
  color: string
  /** Maps browser row to a real insert effect on the selected mixer track. */
  dawEffect: EffectType
}

export const pluginCategories = [
  'All',
  'Reverb',
  'Delay',
  'Modulation',
  'Distortion',
  'EQ',
  'Compression',
]

export const plugins: Plugin[] = [
  {
    id: 'plugin-reverb-hall',
    name: 'Hall Reverb',
    description: 'Large hall reverb (Freeverb)',
    type: 'Reverb',
    category: 'Reverb',
    icon: '🔄',
    color: '#FF6B6B',
    dawEffect: 'reverb',
  },
  {
    id: 'plugin-reverb-room',
    name: 'Room Reverb',
    description: 'Tighter room (Freeverb)',
    type: 'Reverb',
    category: 'Reverb',
    icon: '🔄',
    color: '#FF6B6B',
    dawEffect: 'reverb',
  },
  {
    id: 'plugin-delay-tempo',
    name: 'Tempo Delay',
    description: 'Feedback delay line',
    type: 'Delay',
    category: 'Delay',
    icon: '⏱️',
    color: '#4ECDC4',
    dawEffect: 'delay',
  },
  {
    id: 'plugin-delay-pingpong',
    name: 'Ping Pong Delay',
    description: 'Stereo delay',
    type: 'Delay',
    category: 'Delay',
    icon: '⏱️',
    color: '#4ECDC4',
    dawEffect: 'delay',
  },
  {
    id: 'plugin-eq-3band',
    name: '3-Band EQ',
    description: 'Tone.js EQ3',
    type: 'EQ',
    category: 'EQ',
    icon: '🎚️',
    color: '#FFD93D',
    dawEffect: 'eq',
  },
  {
    id: 'plugin-eq-10band',
    name: '10-Band EQ',
    description: '3-band (same engine)',
    type: 'EQ',
    category: 'EQ',
    icon: '🎚️',
    color: '#FFD93D',
    dawEffect: 'eq',
  },
  {
    id: 'plugin-compressor',
    name: 'Compressor',
    description: 'Dynamics',
    type: 'Compressor',
    category: 'Compression',
    icon: '📊',
    color: '#A78BFA',
    dawEffect: 'compressor',
  },
  {
    id: 'plugin-distortion',
    name: 'Distortion',
    description: 'Waveshaping',
    type: 'Distortion',
    category: 'Distortion',
    icon: '🔊',
    color: '#FB7185',
    dawEffect: 'distortion',
  },
  {
    id: 'plugin-bitcrusher',
    name: 'Bit Crusher',
    description: 'Mapped to distortion',
    type: 'Distortion',
    category: 'Distortion',
    icon: '🔊',
    color: '#FB7185',
    dawEffect: 'distortion',
  },
  {
    id: 'plugin-chorus',
    name: 'Chorus',
    description: 'Stereo chorus',
    type: 'Modulation',
    category: 'Modulation',
    icon: '〰️',
    color: '#34D399',
    dawEffect: 'chorus',
  },
  {
    id: 'plugin-phaser',
    name: 'Phaser',
    description: 'Phase shifting',
    type: 'Modulation',
    category: 'Modulation',
    icon: '〰️',
    color: '#34D399',
    dawEffect: 'phaser',
  },
  {
    id: 'plugin-flanger',
    name: 'Flanger',
    description: 'Similar to chorus',
    type: 'Modulation',
    category: 'Modulation',
    icon: '〰️',
    color: '#34D399',
    dawEffect: 'chorus',
  },
  {
    id: 'plugin-tremolo',
    name: 'Tremolo',
    description: 'Amplitude modulation',
    type: 'Modulation',
    category: 'Modulation',
    icon: '〰️',
    color: '#34D399',
    dawEffect: 'tremolo',
  },
]
