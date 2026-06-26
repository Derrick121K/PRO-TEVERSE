"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

const ONBOARDING_KEY = "PRO-TEVERSE-onboarding-v2"

const STEPS = [
  {
    title: "Press Space To Play",
    text: "Hit Space or click Play in the transport. The browser requires one click before audio starts.",
  },
  {
    title: "Patterns And Channel Rack",
    text: "Pick a pattern above the rack, build steps, then use To playlist to place it on the timeline at the playhead.",
  },
  {
    title: "Record Like FL Studio",
    text: "Press R to arm record, then Play to capture a master mixdown clip on Stop. Use the Record tab for vocals.",
  },
  {
    title: "Drag Sounds And Piano Roll",
    text: "Drag from the Browser into the playlist. Select a MIDI clip to open the piano roll; arm a track and record MIDI while R is on.",
  },
]

export function OnboardingOverlay() {
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setOpen(true)
    }
  }, [])

  const step = useMemo(() => STEPS[Math.max(0, Math.min(stepIndex, STEPS.length - 1))], [stepIndex])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-[60] bg-black/55 backdrop-blur-[1px] flex items-start justify-center pt-24 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface-2 shadow-xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-neon-cyan mb-2">
          Quick start
        </p>
        <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{step.text}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {stepIndex + 1} / {STEPS.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
              disabled={stepIndex === 0}
            >
              Back
            </Button>
            {stepIndex < STEPS.length - 1 ? (
              <Button size="sm" className="h-8" onClick={() => setStepIndex((s) => s + 1)}>
                Next
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8"
                onClick={() => {
                  localStorage.setItem(ONBOARDING_KEY, "1")
                  setOpen(false)
                }}
              >
                Start Creating
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                localStorage.setItem(ONBOARDING_KEY, "1")
                setOpen(false)
              }}
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

