// Advanced Music Theory Library for PRO-TEVERSE

// Note frequencies (A4 = 440Hz)
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83, 'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.26, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Chord intervals (semitones from root)
export const CHORD_INTERVALS: Record<string, number[]> = {
  // Triads
  '': [0, 4, 7],           // Major
  'm': [0, 3, 7],          // Minor
  'dim': [0, 3, 6],        // Diminished
  'aug': [0, 4, 8],        // Augmented
  'sus2': [0, 2, 7],       // Suspended 2nd
  'sus4': [0, 5, 7],       // Suspended 4th
  
  // Seventh chords
  'maj7': [0, 4, 7, 11],   // Major 7th
  '7': [0, 4, 7, 10],     // Dominant 7th
  'm7': [0, 3, 7, 10],    // Minor 7th
  'mmaj7': [0, 3, 7, 11],  // Minor Major 7th
  'dim7': [0, 3, 6, 9],   // Diminished 7th
  'm7b5': [0, 3, 6, 10],  // Half-diminished
  
  // Extended chords
  '9': [0, 4, 7, 10, 14],      // 9th
  'maj9': [0, 4, 7, 11, 14],  // Major 9th
  'm9': [0, 3, 7, 10, 14],     // Minor 9th
  '11': [0, 4, 7, 10, 14, 17], // 11th
  '13': [0, 4, 7, 10, 14, 17, 21], // 13th
  
  // Altered chords
  'add9': [0, 4, 7, 14],      // Add 9
  '6': [0, 4, 7, 9],          // Major 6th
  'm6': [0, 3, 7, 9],        // Minor 6th
}

// Scale degrees (semitones from root)
export const SCALES: Record<string, number[]> = {
  // Major modes
  'major': [0, 2, 4, 5, 7, 9, 11],
  'ionian': [0, 2, 4, 5, 7, 9, 11],
  
  // Minor modes
  'natural minor': [0, 2, 3, 5, 7, 8, 10],
  'aeolian': [0, 2, 3, 5, 7, 8, 10],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],
  
  // Pentatonic
  'major pentatonic': [0, 2, 4, 7, 9],
  'minor pentatonic': [0, 3, 5, 7, 10],
  
  // Exotic
  'blues': [0, 3, 5, 6, 7, 10],
  'whole tone': [0, 2, 4, 6, 8, 10],
  'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}

// Key signatures with sharps/flats
export const KEY_SIGNATURES: Record<string, { root: number; scale: number[]; sharps: string[]; flats: string[] }> = {
  'C Major': { root: 0, scale: SCALES.major, sharps: [], flats: [] },
  'G Major': { root: 7, scale: SCALES.major, sharps: ['F#'], flats: [] },
  'D Major': { root: 2, scale: SCALES.major, sharps: ['F#', 'C#'], flats: [] },
  'A Major': { root: 9, scale: SCALES.major, sharps: ['F#', 'C#', 'G#'], flats: [] },
  'E Major': { root: 4, scale: SCALES.major, sharps: ['F#', 'C#', 'G#', 'D#'], flats: [] },
  'B Major': { root: 11, scale: SCALES.major, sharps: ['F#', 'C#', 'G#', 'D#', 'A#'], flats: [] },
  'F Major': { root: 5, scale: SCALES.major, sharps: [], flats: ['Bb'] },
  'Bb Major': { root: 10, scale: SCALES.major, sharps: [], flats: ['Bb', 'Eb'] },
  'Eb Major': { root: 3, scale: SCALES.major, sharps: [], flats: ['Bb', 'Eb', 'Ab'] },
  'Ab Major': { root: 8, scale: SCALES.major, sharps: [], flats: ['Bb', 'Eb', 'Ab', 'Db'] },
  'Db Major': { root: 1, scale: SCALES.major, sharps: [], flats: ['Bb', 'Eb', 'Ab', 'Db', 'Gb'] },
  'F# Major': { root: 6, scale: SCALES.major, sharps: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'], flats: [] },
  
  // Minor keys
  'A Minor': { root: 9, scale: SCALES['natural minor'], sharps: [], flats: [] },
  'E Minor': { root: 4, scale: SCALES['natural minor'], sharps: ['F#'], flats: [] },
  'B Minor': { root: 11, scale: SCALES['natural minor'], sharps: ['F#', 'C#'], flats: [] },
  'F# Minor': { root: 6, scale: SCALES['natural minor'], sharps: ['F#', 'C#', 'G#'], flats: [] },
  'C# Minor': { root: 1, scale: SCALES['natural minor'], sharps: ['F#', 'C#', 'G#', 'D#'], flats: [] },
  'G# Minor': { root: 8, scale: SCALES['natural minor'], sharps: ['F#', 'C#', 'G#', 'D#', 'A#'], flats: [] },
  'D Minor': { root: 2, scale: SCALES['natural minor'], sharps: [], flats: ['Bb'] },
  'G Minor': { root: 7, scale: SCALES['natural minor'], sharps: [], flats: ['Bb', 'Eb'] },
  'C Minor': { root: 0, scale: SCALES['natural minor'], sharps: [], flats: ['Bb', 'Eb', 'Ab'] },
}

// Chord progressions (degree numbers in scale)
export const CHORD_PROGRESSIONS: Record<string, { name: string; degrees: number[]; roman: string[] }> = {
  // Pop
  'I-IV-V-I': { name: 'Classic', degrees: [0, 3, 4, 0], roman: ['I', 'IV', 'V', 'I'] },
  'I-V-vi-IV': { name: 'Pop/Pipeline', degrees: [0, 4, 5, 3], roman: ['I', 'V', 'vi', 'IV'] },
  'I-vi-IV-V': { name: '50s', degrees: [0, 5, 3, 4], roman: ['I', 'vi', 'IV', 'V'] },
  'vi-IV-I-V': { name: 'Sensitive', degrees: [5, 3, 0, 4], roman: ['vi', 'IV', 'I', 'V'] },
  'IV-I-V-vi': { name: 'Canon', degrees: [3, 0, 4, 5], roman: ['IV', 'I', 'V', 'vi'] },
  
  // Jazz
  'ii-V-I': { name: 'Jazz Basic', degrees: [1, 4, 0], roman: ['ii', 'V', 'I'] },
  'I-vi-ii-V': { name: 'Circle', degrees: [0, 5, 1, 4], roman: ['I', 'vi', 'ii', 'V'] },
  'I-IV-vi-V': { name: 'Andalusian', degrees: [0, 3, 5, 4], roman: ['I', 'IV', 'vi', 'V'] },
  'IV-viiÂ°-iii-vi': { name: 'Jazz Minor', degrees: [3, 6, 2, 5], roman: ['IV', 'viiÂ°', 'iii', 'vi'] },
  
  // Minor
  'i-iv-v-i': { name: 'Minor Basic', degrees: [0, 3, 4, 0], roman: ['i', 'iv', 'V', 'i'] },
  'i-VI-III-VII': { name: 'Rock Minor', degrees: [0, 5, 2, 6], roman: ['i', 'VI', 'III', 'VII'] },
  'i-vi-iv-v': { name: 'Latin Minor', degrees: [0, 5, 3, 4], roman: ['i', 'vi', 'iv', 'V'] },
  'i-iv-viiÂ°-III': { name: 'Dark Minor', degrees: [0, 3, 6, 2], roman: ['i', 'iv', 'viiÂ°', 'III'] },
  
  // Hip Hop/R&B
  'I-vi-IV-V-rnb': { name: 'R&B', degrees: [0, 5, 3, 4], roman: ['I', 'vi', 'IV', 'V'] },
  'I-IV-I-V': { name: 'Trap', degrees: [0, 3, 0, 4], roman: ['I', 'IV', 'I', 'V'] },
  'i-bVII-IV-i': { name: 'Modern Minor', degrees: [0, 6, 3, 0], roman: ['i', 'bVII', 'IV', 'i'] },
  
  // Electronic
  'I-bVII-IV-I': { name: 'House', degrees: [0, 6, 3, 0], roman: ['I', 'bVII', 'IV', 'I'] },
  'i-bVII-bVI-V': { name: 'Drop', degrees: [0, 6, 5, 4], roman: ['i', 'bVII', 'bVI', 'V'] },
}

// Helper to get chord notes from root and type
export function getChordNotes(root: number, chordType: string, octave: number = 4): number[] {
  const intervals = CHORD_INTERVALS[chordType] || CHORD_INTERVALS['']
  const baseNote = (octave + 1) * 12 // C in the given octave
  
  return intervals.map(interval => baseNote + root + interval)
}

// Helper to get scale notes for a key
export function getScaleNotes(key: string): number[] {
  const keyData = KEY_SIGNATURES[key]
  if (!keyData) return []
  
  const rootOffset = keyData.root
  const scale = keyData.scale
  
  // Generate 2 octaves of scale notes
  const notes: number[] = []
  for (let octave = 3; octave <= 5; octave++) {
    scale.forEach(degree => {
      notes.push(rootOffset + degree + (octave * 12))
    })
  }
  
  return notes
}

// Generate melodic pattern from scale
export function generateMelody(
  scale: number[],
  root: number,
  length: number = 8,
  density: number = 0.7,
  direction: 'up' | 'down' | 'random' = 'random'
): { pitch: number; duration: number; velocity: number }[] {
  const notes: { pitch: number; duration: number; velocity: number }[] = []
  
  let currentPitch = root + 60 // Start around middle C
  const range = Math.max(...scale) - Math.min(...scale)
  const minPitch = root + 48
  const maxPitch = root + 84
  
  for (let i = 0; i < length; i++) {
    if (Math.random() < density) {
      // Add a note
      const scaleDegree = Math.floor(Math.random() * scale.length)
      const pitch = root + scale[scaleDegree] + Math.floor(currentPitch / 12) * 12
      
      // Clamp to range
      const clampedPitch = Math.max(minPitch, Math.min(maxPitch, pitch))
      
      notes.push({
        pitch: clampedPitch,
        duration: 0.5 + Math.random() * 1.5,
        velocity: 70 + Math.random() * 40
      })
      
      // Move in direction
      if (direction === 'up') {
        currentPitch = Math.min(maxPitch, currentPitch + Math.floor(Math.random() * 4 + 1) * 12 / scale.length)
      } else if (direction === 'down') {
        currentPitch = Math.max(minPitch, currentPitch - Math.floor(Math.random() * 4 + 1) * 12 / scale.length)
      } else {
        currentPitch += (Math.random() > 0.5 ? 1 : -1) * scale[Math.floor(Math.random() * scale.length)]
      }
    }
  }
  
  return notes
}

// Generate bass line from chord progression
export function generateBassLine(
  progression: { degrees: number[] },
  keyData: { root: number; scale: number[] },
  length: number = 4
): { pitch: number; duration: number; velocity: number }[] {
  const notes: { pitch: number; duration: number; velocity: number }[] = []
  
  progression.degrees.forEach((degree, idx) => {
    const scaleNote = keyData.scale[degree % 7]
    const rootPitch = keyData.root + scaleNote + 24 // One octave below middle
    
    // Root on beat 1, maybe some movement
    notes.push({
      pitch: rootPitch,
      duration: length / progression.degrees.length,
      velocity: 90
    })
    
    // Add octave jump for rhythm
    if (Math.random() > 0.5) {
      notes.push({
        pitch: rootPitch + 12,
        duration: (length / progression.degrees.length) / 2,
        velocity: 60
      })
    }
  })
  
  return notes
}

// Generate drum pattern
export function generateDrumPattern(
  style: 'trap' | 'house' | 'hiphop' | 'techno',
  length: number = 16,
  intensity: number = 0.7
): { pitch: number; start: number; duration: number; velocity: number }[] {
  const notes: { pitch: number; start: number; duration: number; velocity: number }[] = []
  
  const kick = 36
  const snare = 38
  const hihat = 42
  const clap = 39
  const openHat = 46
  
  for (let i = 0; i < length; i++) {
    const beat = i % 4
    const subBeat = i % 8
    
    if (style === 'trap') {
      // Kick on 1, and offbeat 808s
      if (beat === 0 || i === 7) {
        notes.push({ pitch: kick, start: i, duration: 0.1, velocity: 100 + Math.random() * 20 })
      }
      if (i % 2 === 1) {
        notes.push({ pitch: kick + 5, start: i, duration: 0.1, velocity: 80 }) // 808
      }
      
      // Snare on 2 and 4 with rolls
      if (beat === 2 || (intensity > 0.5 && Math.random() > 0.7)) {
        notes.push({ pitch: snare, start: i, duration: 0.1, velocity: 90 + Math.random() * 20 })
      }
      
      // Hi-hats every half beat with variations
      notes.push({ pitch: hihat, start: i + 0.5, duration: 0.05, velocity: 60 + Math.random() * 20 })
      if (intensity > 0.3) {
        notes.push({ pitch: hihat, start: i, duration: 0.05, velocity: 40 })
      }
      
    } else if (style === 'house') {
      // Four on the floor kick
      if (beat === 0) {
        notes.push({ pitch: kick, start: i, duration: 0.1, velocity: 100 })
      }
      
      // Hat on every 8th
      notes.push({ pitch: hihat, start: i + 0.5, duration: 0.05, velocity: 70 })
      if (i % 2 === 0) {
        notes.push({ pitch: hihat, start: i, duration: 0.05, velocity: 50 })
      }
      
      // Snare on 2 and 4
      if (beat === 2) {
        notes.push({ pitch: snare, start: i, duration: 0.1, velocity: 95 })
      }
      
      // Offbeat hats
      if (subBeat === 3 || subBeat === 7) {
        notes.push({ pitch: openHat, start: i + 0.75, duration: 0.15, velocity: 60 })
      }
      
    } else if (style === 'hiphop') {
      // Kick on 1 and 3
      if (beat === 0 || beat === 2) {
        notes.push({ pitch: kick, start: i, duration: 0.15, velocity: 100 + Math.random() * 20 })
      }
      
      // Snare on 2 with swing
      if (beat === 1) {
        notes.push({ pitch: snare, start: i + 0.1, duration: 0.1, velocity: 90 })
      }
      if (intensity > 0.5 && Math.random() > 0.6) {
        notes.push({ pitch: snare, start: i - 0.1, duration: 0.05, velocity: 70 }) // Ghost note
      }
      
      // Hi-hats with swing
      notes.push({ pitch: hihat, start: i + 0.25, duration: 0.05, velocity: 60 + Math.random() * 20 })
      notes.push({ pitch: hihat, start: i + 0.75, duration: 0.05, velocity: 50 + Math.random() * 15 })
      
    } else { // techno
      // Straight four on the floor
      notes.push({ pitch: kick, start: i, duration: 0.05, velocity: 110 })
      
      // Hat on every beat
      notes.push({ pitch: hihat, start: i + 0.5, duration: 0.03, velocity: 70 })
      
      // No snare, just kicks and hats for energy
      if (intensity > 0.5 && i % 4 === 2) {
        notes.push({ pitch: kick, start: i + 0.5, duration: 0.05, velocity: 80 })
      }
    }
  }
  
  return notes
}

// Calculate key from BPM for optimal settings
export function getOptimalSettings(bpm: number): {
  noteLength: number
  quantize: number
  swing: number
} {
  return {
    noteLength: Math.round(960 / bpm), // MIDI ticks
    quantize: bpm > 140 ? 0.125 : bpm > 100 ? 0.25 : 0.5,
    swing: bpm > 150 ? 10 : bpm > 120 ? 5 : 0
  }
}
