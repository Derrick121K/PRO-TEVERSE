// Audio Effects for PRO-TEVERSE DAW

// Create impulse response for reverb
export function createReverbImpulse(
  context: AudioContext,
  duration: number = 2,
  decay: number = 2
): AudioBuffer {
  const sampleRate = context.sampleRate
  const length = sampleRate * duration
  const impulse = context.createBuffer(2, length, sampleRate)
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  
  return impulse
}

// Create reverb effect
export function createReverb(
  context: AudioContext,
  params: { mix: number; decay: number; predelay: number }
): { input: GainNode; output: GainNode; wetGain: GainNode; dryGain: GainNode; convolver: ConvolverNode } {
  const input = context.createGain()
  const output = context.createGain()
  const wetGain = context.createGain()
  const dryGain = context.createGain()
  const convolver = context.createConvolver()
  const predelay = context.createDelay(0.5)
  
  // Set parameters
  predelay.delayTime.value = params.predelay
  wetGain.gain.value = params.mix
  dryGain.gain.value = 1 - params.mix
  
  // Create impulse response
  convolver.buffer = createReverbImpulse(context, params.decay, 2)
  
  // Connect
  input.connect(dryGain)
  dryGain.connect(output)
  
  input.connect(predelay)
  predelay.connect(convolver)
  convolver.connect(wetGain)
  wetGain.connect(output)
  
  return { input, output, wetGain, dryGain, convolver }
}

// Create delay effect
export function createDelay(
  context: AudioContext,
  params: { mix: number; time: number; feedback: number }
): { input: GainNode; output: GainNode; delay: DelayNode; feedbackGain: GainNode; wetGain: GainNode; dryGain: GainNode } {
  const input = context.createGain()
  const output = context.createGain()
  const delay = context.createDelay(2)
  const feedbackGain = context.createGain()
  const wetGain = context.createGain()
  const dryGain = context.createGain()
  
  // Set parameters
  delay.delayTime.value = params.time
  feedbackGain.gain.value = params.feedback
  wetGain.gain.value = params.mix
  dryGain.gain.value = 1 - params.mix
  
  // Connect dry path
  input.connect(dryGain)
  dryGain.connect(output)
  
  // Connect wet path with feedback
  input.connect(delay)
  delay.connect(wetGain)
  delay.connect(feedbackGain)
  feedbackGain.connect(delay)
  wetGain.connect(output)
  
  return { input, output, delay, feedbackGain, wetGain, dryGain }
}

// Create 3-band EQ
export function createEQ(
  context: AudioContext,
  params: { lowGain: number; midGain: number; highGain: number }
): { input: GainNode; output: GainNode; low: BiquadFilterNode; mid: BiquadFilterNode; high: BiquadFilterNode } {
  const input = context.createGain()
  const output = context.createGain()
  
  // Low shelf filter
  const low = context.createBiquadFilter()
  low.type = 'lowshelf'
  low.frequency.value = 320
  low.gain.value = params.lowGain
  
  // Mid peaking filter
  const mid = context.createBiquadFilter()
  mid.type = 'peaking'
  mid.frequency.value = 1000
  mid.Q.value = 0.5
  mid.gain.value = params.midGain
  
  // High shelf filter
  const high = context.createBiquadFilter()
  high.type = 'highshelf'
  high.frequency.value = 3200
  high.gain.value = params.highGain
  
  // Connect in series
  input.connect(low)
  low.connect(mid)
  mid.connect(high)
  high.connect(output)
  
  return { input, output, low, mid, high }
}

// Create compressor
export function createCompressor(
  context: AudioContext,
  params: { threshold: number; ratio: number; attack: number; release: number }
): { input: GainNode; output: GainNode; compressor: DynamicsCompressorNode } {
  const input = context.createGain()
  const output = context.createGain()
  const compressor = context.createDynamicsCompressor()
  
  // Set parameters
  compressor.threshold.value = params.threshold
  compressor.ratio.value = params.ratio
  compressor.attack.value = params.attack
  compressor.release.value = params.release
  compressor.knee.value = 6
  
  // Connect
  input.connect(compressor)
  compressor.connect(output)
  
  return { input, output, compressor }
}

// Create filter (lowpass, highpass, bandpass)
export function createFilter(
  context: AudioContext,
  params: { frequency: number; resonance: number; type: number }
): { input: GainNode; output: GainNode; filter: BiquadFilterNode } {
  const input = context.createGain()
  const output = context.createGain()
  const filter = context.createBiquadFilter()
  
  // Set type based on param (0=lowpass, 1=highpass, 2=bandpass)
  const types: BiquadFilterType[] = ['lowpass', 'highpass', 'bandpass']
  filter.type = types[Math.floor(params.type) % 3]
  filter.frequency.value = params.frequency
  filter.Q.value = params.resonance
  
  // Connect
  input.connect(filter)
  filter.connect(output)
  
  return { input, output, filter }
}

// Create distortion waveshaper curve
function makeDistortionCurve(amount: number): Float32Array {
  const samples = 44100
  const curve = new Float32Array(samples)
  const deg = Math.PI / 180
  
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = ((3 + amount * 10) * x * 20 * deg) / (Math.PI + amount * 10 * Math.abs(x))
  }
  
  return curve
}

// Create distortion effect
export function createDistortion(
  context: AudioContext,
  params: { amount: number; mix: number }
): { input: GainNode; output: GainNode; waveshaper: WaveShaperNode; wetGain: GainNode; dryGain: GainNode } {
  const input = context.createGain()
  const output = context.createGain()
  const waveshaper = context.createWaveShaper()
  const wetGain = context.createGain()
  const dryGain = context.createGain()
  
  // Set parameters
  waveshaper.curve = makeDistortionCurve(params.amount)
  waveshaper.oversample = '4x'
  wetGain.gain.value = params.mix
  dryGain.gain.value = 1 - params.mix
  
  // Connect dry path
  input.connect(dryGain)
  dryGain.connect(output)
  
  // Connect wet path
  input.connect(waveshaper)
  waveshaper.connect(wetGain)
  wetGain.connect(output)
  
  return { input, output, waveshaper, wetGain, dryGain }
}

// Effect parameter ranges for UI
export const effectParamRanges = {
  reverb: {
    mix: { min: 0, max: 1, step: 0.01, default: 0.3 },
    decay: { min: 0.1, max: 10, step: 0.1, default: 2 },
    predelay: { min: 0, max: 0.1, step: 0.001, default: 0.01 }
  },
  delay: {
    mix: { min: 0, max: 1, step: 0.01, default: 0.3 },
    time: { min: 0.01, max: 2, step: 0.01, default: 0.25 },
    feedback: { min: 0, max: 0.95, step: 0.01, default: 0.4 }
  },
  eq: {
    lowGain: { min: -12, max: 12, step: 0.5, default: 0 },
    midGain: { min: -12, max: 12, step: 0.5, default: 0 },
    highGain: { min: -12, max: 12, step: 0.5, default: 0 }
  },
  compressor: {
    threshold: { min: -60, max: 0, step: 1, default: -24 },
    ratio: { min: 1, max: 20, step: 0.5, default: 4 },
    attack: { min: 0.001, max: 0.5, step: 0.001, default: 0.003 },
    release: { min: 0.01, max: 1, step: 0.01, default: 0.25 }
  },
  filter: {
    frequency: { min: 20, max: 20000, step: 1, default: 1000 },
    resonance: { min: 0.1, max: 20, step: 0.1, default: 1 },
    type: { min: 0, max: 2, step: 1, default: 0 }
  },
  distortion: {
    amount: { min: 0, max: 1, step: 0.01, default: 0.5 },
    mix: { min: 0, max: 1, step: 0.01, default: 0.5 }
  },
  chorus: {
    mix: { min: 0, max: 1, step: 0.01, default: 0.35 },
    rate: { min: 0.1, max: 8, step: 0.1, default: 2 },
    delay: { min: 0.5, max: 10, step: 0.1, default: 2.5 },
    depth: { min: 0, max: 1, step: 0.01, default: 0.4 }
  },
  phaser: {
    mix: { min: 0, max: 1, step: 0.01, default: 0.35 },
    frequency: { min: 0.1, max: 10, step: 0.1, default: 0.4 },
    baseFrequency: { min: 100, max: 4000, step: 10, default: 500 },
    octaves: { min: 1, max: 8, step: 1, default: 3 }
  },
  tremolo: {
    mix: { min: 0, max: 1, step: 0.01, default: 0.4 },
    speed: { min: 0.5, max: 24, step: 0.5, default: 8 },
    depth: { min: 0, max: 1, step: 0.01, default: 0.6 }
  }
}

