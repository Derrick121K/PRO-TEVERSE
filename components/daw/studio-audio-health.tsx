"use client"

import { useEffect, useState } from "react"
import { audioEngine } from "@/lib/audio-engine"
import { soundManager } from "@/lib/sound-manager"
import { checkCoreKitHealth } from "@/lib/sound-health"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"

export function StudioAudioHealth() {
  const [dismissed, setDismissed] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [kitOk, setKitOk] = useState(true)
  const [missing, setMissing] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await audioEngine.initialize()
      if (cancelled) return
      setAudioReady(audioEngine.isInitialized())
      const health = await checkCoreKitHealth()
      if (cancelled) return
      setKitOk(health.ok && soundManager.areCoreSoundsLoaded())
      setMissing(health.missing)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (dismissed) return null

  if (!audioReady) {
    return (
      <div
        className="mx-2 mt-1 flex items-center justify-between gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
        role="status"
      >
        <span className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          Click Play or press Space once to enable audio (browser requirement).
        </span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  if (kitOk) return null

  return (
    <div
      className="mx-2 mt-1 flex items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs"
      role="alert"
    >
      <span>
        Drum samples missing. Run <code className="rounded bg-surface-2 px-1">npm run sounds:generate</code> or{" "}
        <code className="rounded bg-surface-2 px-1">npm run engine:build-kit</code>
        {missing.length > 0 ? ` (${missing.length} URL(s) failed)` : ""}.
      </span>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDismissed(true)} aria-label="Dismiss">
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
