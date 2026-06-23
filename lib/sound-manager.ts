import * as Tone from "tone"
import systemEngineManifest from "@/lib/system-engine-manifest.json"

export type CoreDrumId = "kick" | "snare" | "hihat" | "clap"

const CORE_KIT_DEFAULT_URLS: Record<CoreDrumId, string> = {
  kick: "/sounds/kick.wav",
  snare: "/sounds/snare.wav",
  hihat: "/sounds/hihat.wav",
  clap: "/sounds/clap.wav",
}

const MANIFEST_URLS: Record<CoreDrumId, string> = {
  kick: systemEngineManifest?.coreKit?.kick?.url || CORE_KIT_DEFAULT_URLS.kick,
  snare: systemEngineManifest?.coreKit?.snare?.url || CORE_KIT_DEFAULT_URLS.snare,
  hihat: systemEngineManifest?.coreKit?.hihat?.url || CORE_KIT_DEFAULT_URLS.hihat,
  clap: systemEngineManifest?.coreKit?.clap?.url || CORE_KIT_DEFAULT_URLS.clap,
}

const URL_CANDIDATES: Record<CoreDrumId, string[]> = {
  kick: [MANIFEST_URLS.kick, CORE_KIT_DEFAULT_URLS.kick],
  snare: [MANIFEST_URLS.snare, CORE_KIT_DEFAULT_URLS.snare],
  hihat: [MANIFEST_URLS.hihat, CORE_KIT_DEFAULT_URLS.hihat],
  clap: [MANIFEST_URLS.clap, CORE_KIT_DEFAULT_URLS.clap],
}

const CORE_IDS: CoreDrumId[] = ["kick", "snare", "hihat", "clap"]

class SoundManager {
  private players = new Map<CoreDrumId, Tone.Player>()
  private destination: Tone.ToneAudioNode | null = null
  private loaded = false
  private loadingPromise: Promise<void> | null = null
  private lastLoadError: string | null = null

  getLastLoadError(): string | null {
    return this.lastLoadError
  }

  dispose(): void {
    for (const p of this.players.values()) {
      try {
        p.disconnect()
        p.dispose()
      } catch {
        /* */
      }
    }
    this.players.clear()
    this.destination = null
    this.loaded = false
    this.loadingPromise = null
  }

  private async loadOneDrum(
    id: CoreDrumId,
    destination: Tone.ToneAudioNode
  ): Promise<Tone.Player | null> {
    const seen = new Set<string>()
    for (const url of URL_CANDIDATES[id]) {
      if (seen.has(url)) continue
      seen.add(url)
      try {
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) continue
        const ab = await res.arrayBuffer()
        const ctx = Tone.getContext().rawContext as AudioContext
        const audioBuf = await ctx.decodeAudioData(ab.slice(0))
        const player = new Tone.Player(audioBuf).connect(destination)
        player.volume.value = Tone.gainToDb(0.9)
        await Tone.loaded()
        if (player.loaded) return player
        player.dispose()
      } catch {
        /* try next */
      }
    }
    return null
  }

  async preloadCoreKit(destination: Tone.ToneAudioNode): Promise<void> {
    if (this.loaded && this.destination === destination && this.players.size > 0) return
    if (this.loadingPromise) return this.loadingPromise

    this.loadingPromise = (async () => {
      this.dispose()
      this.destination = destination
      this.lastLoadError = null
      const missing: CoreDrumId[] = []

      for (const id of CORE_IDS) {
        const player = await this.loadOneDrum(id, destination)
        if (player) this.players.set(id, player)
        else missing.push(id)
      }

      if (this.players.size === 0) {
        this.lastLoadError = "No drum samples found. Run: npm run sounds:generate"
        console.warn("[sound-manager]", this.lastLoadError)
        return
      }

      if (missing.length > 0) {
        this.lastLoadError = `Some drums missing: ${missing.join(", ")}`
        console.warn("[sound-manager]", this.lastLoadError)
      }

      this.loaded = true
    })()

    await this.loadingPromise
    this.loadingPromise = null
  }

  triggerCoreDrum(id: CoreDrumId, when?: number, velocity: number = 1): boolean {
    const player = this.players.get(id)
    if (!player?.loaded) return false
    try {
      player.volume.value = Tone.gainToDb(Math.max(0.05, Math.min(1, velocity)))
      const t = when ?? Tone.now()
      player.start(t)
      return true
    } catch {
      return false
    }
  }

  async cacheExternalSample(url: string): Promise<string> {
    return url
  }

  areCoreSoundsLoaded(): boolean {
    return this.loaded && this.players.size > 0
  }
}

export const soundManager = new SoundManager()
export const CORE_KIT_URLS: Record<CoreDrumId, string> = MANIFEST_URLS
export const SYSTEM_ENGINE_CORE_KIT_SOURCE = systemEngineManifest?.coreKit ?? null
