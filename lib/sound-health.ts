import { CORE_KIT_URLS, type CoreDrumId } from "./sound-manager"

export type SoundHealthResult = {
  ok: boolean
  missing: string[]
  checkedAt: number
}

const CORE_IDS: CoreDrumId[] = ["kick", "snare", "hihat", "clap"]

const FALLBACK_URLS: Record<CoreDrumId, string> = {
  kick: "/sounds/kick.wav",
  snare: "/sounds/snare.wav",
  hihat: "/sounds/hihat.wav",
  clap: "/sounds/clap.wav",
}

/** HEAD-check core kit URLs (browser only). OK if manifest OR fallback exists per drum. */
export async function checkCoreKitHealth(): Promise<SoundHealthResult> {
  if (typeof window === "undefined") {
    return { ok: true, missing: [], checkedAt: Date.now() }
  }
  const missing: string[] = []
  await Promise.all(
    CORE_IDS.map(async (id) => {
      const candidates = [CORE_KIT_URLS[id], FALLBACK_URLS[id]]
      let anyOk = false
      for (const url of candidates) {
        try {
          const res = await fetch(url, { method: "HEAD", cache: "no-store" })
          if (res.ok) {
            anyOk = true
            break
          }
        } catch {
          /* */
        }
      }
      if (!anyOk) missing.push(candidates[0])
    })
  )
  return { ok: missing.length === 0, missing, checkedAt: Date.now() }
}
