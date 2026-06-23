export const BROWSER_DND_MIME = "application/x-proteverse-browser-item"

export type BrowserDnDItem =
  | {
      type: "instrument"
      name: string
      instrumentKey: string
    }
  | {
      type: "sample"
      name: string
      category: string
      sampleType: "oneshot" | "loop" | "wavetable"
    }
  | {
      type: "plugin"
      name: string
      dawEffect:
        | "reverb"
        | "delay"
        | "eq"
        | "compressor"
        | "filter"
        | "distortion"
        | "chorus"
        | "phaser"
        | "tremolo"
    }

export function serializeBrowserDnD(item: BrowserDnDItem): string {
  return JSON.stringify(item)
}

export function parseBrowserDnD(raw: string | null): BrowserDnDItem | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as BrowserDnDItem
    if (!parsed || typeof parsed !== "object" || typeof parsed.type !== "string") return null
    return parsed
  } catch {
    return null
  }
}

