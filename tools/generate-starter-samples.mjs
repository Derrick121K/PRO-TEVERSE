import fs from "node:fs"
import path from "node:path"

const sampleRate = 44100

function clamp(sample) {
  return Math.max(-1, Math.min(1, sample))
}

function writeWav(filePath, samples) {
  const channels = 1
  const bytesPerSample = 2
  const blockAlign = channels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write("RIFF", 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write("WAVE", 8)
  buffer.write("fmt ", 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write("data", 36)
  buffer.writeUInt32LE(dataSize, 40)

  let offset = 44

  for (const sample of samples) {
    const value = clamp(sample)
    buffer.writeInt16LE(value < 0 ? value * 0x8000 : value * 0x7fff, offset)
    offset += 2
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, buffer)
}

function makeKick() {
  const duration = 0.45
  const length = Math.floor(sampleRate * duration)
  const samples = []

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate
    const env = Math.exp(-t * 12)
    const freq = 120 * Math.exp(-t * 18) + 42
    samples.push(Math.sin(2 * Math.PI * freq * t) * env * 0.95)
  }

  return samples
}

function makeClap() {
  const duration = 0.32
  const length = Math.floor(sampleRate * duration)
  const samples = []

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate
    const burst =
      Math.exp(-Math.pow((t - 0.02) * 90, 2)) +
      Math.exp(-Math.pow((t - 0.055) * 80, 2)) +
      Math.exp(-Math.pow((t - 0.09) * 70, 2))
    const tail = Math.exp(-t * 10)
    samples.push((Math.random() * 2 - 1) * (burst + tail * 0.35) * 0.45)
  }

  return samples
}

function makeHat() {
  const duration = 0.12
  const length = Math.floor(sampleRate * duration)
  const samples = []

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate
    const env = Math.exp(-t * 55)
    samples.push((Math.random() * 2 - 1) * env * 0.32)
  }

  return samples
}

function makeLogDrum() {
  const duration = 0.7
  const length = Math.floor(sampleRate * duration)
  const samples = []

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate
    const env = Math.exp(-t * 5)
    const pitchDrop = 95 * Math.exp(-t * 8) + 48
    const tone = Math.sin(2 * Math.PI * pitchDrop * t)
    const click = i < 140 ? (Math.random() * 2 - 1) * 0.22 : 0
    samples.push((tone * 0.85 + click) * env)
  }

  return samples
}

function makeChordStab() {
  const duration = 1.2
  const length = Math.floor(sampleRate * duration)
  const samples = []
  const freqs = [261.63, 311.13, 392.0]

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate
    const env = Math.exp(-t * 2.6)
    const tone = freqs.reduce((sum, freq) => sum + Math.sin(2 * Math.PI * freq * t), 0) / freqs.length
    samples.push(tone * env * 0.42)
  }

  return samples
}

function makeRiser() {
  const duration = 1.5
  const length = Math.floor(sampleRate * duration)
  const samples = []

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate
    const progress = t / duration
    const freq = 220 + progress * 900
    const env = Math.min(1, progress * 2) * (1 - progress * 0.25)
    samples.push((Math.sin(2 * Math.PI * freq * t) * 0.25 + (Math.random() * 2 - 1) * 0.05) * env)
  }

  return samples
}

const outputs = [
  ["public/sound-library/drums/proteverse-kick.wav", makeKick()],
  ["public/sound-library/drums/proteverse-clap.wav", makeClap()],
  ["public/sound-library/drums/proteverse-hat.wav", makeHat()],
  ["public/sound-library/bass/proteverse-log-drum.wav", makeLogDrum()],
  ["public/sound-library/keys/proteverse-chord-stab.wav", makeChordStab()],
  ["public/sound-library/fx/proteverse-riser.wav", makeRiser()],
]

for (const [filePath, samples] of outputs) {
  writeWav(filePath, samples)
  console.log(`Generated ${filePath}`)
}
