let cachedAccess: MIDIAccess | null = null

export function isWebMidiSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.requestMIDIAccess)
}

export async function requestMIDIAccess(): Promise<MIDIAccess | null> {
  if (!isWebMidiSupported()) return null
  try {
    cachedAccess = await navigator.requestMIDIAccess({ sysex: false })
    return cachedAccess
  } catch {
    return null
  }
}

export function getCachedAccess(): MIDIAccess | null {
  return cachedAccess
}

export function listInputs(): MIDIInput[] {
  if (!cachedAccess) return []
  return Array.from(cachedAccess.inputs.values())
}

export function parseNoteMessage(data: Uint8Array): { type: "on" | "off"; note: number; velocity: number } | null {
  if (data.length < 2) return null
  const status = data[0] & 0xf0
  const d1 = data[1] ?? 0
  const d2 = data[2] ?? 0
  if (status === 0x90) {
    if (d2 > 0) return { type: "on", note: d1, velocity: d2 }
    return { type: "off", note: d1, velocity: 0 }
  }
  if (status === 0x80) {
    return { type: "off", note: d1, velocity: d2 }
  }
  return null
}

export function watchInput(input: MIDIInput, onMessage: (data: Uint8Array) => void) {
  const fn = (ev: MIDIMessageEvent) => {
    if (ev.data) onMessage(ev.data)
  }
  input.addEventListener("midimessage", fn)
  return () => input.removeEventListener("midimessage", fn)
}
