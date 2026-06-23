"use client"

/**
 * FL-style channel rack: each row is a drum/instrument lane; 16 steps share the main transport BPM.
 * State lives in Zustand (`stepSequencer`); audio fires from `audio-engine` when transport is playing.
 */

import { useMemo, useCallback } from "react"
import { pushHistory } from "@/lib/daw-undo"
import { useDAWStore } from "@/lib/daw-store"
import { audioEngine } from "@/lib/audio-engine"
import { STEP_PRESET_PATTERNS } from "@/lib/daw-step-sequencer-defaults"
import { syncPatternSnapshot } from "@/lib/daw-patterns"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drum, RefreshCw, Plus, Copy, ListPlus } from "lucide-react"

type Props = { compact?: boolean }

export function StepSequencer({ compact = false }: Props) {
  const {
    isPlaying,
    bpm,
    currentBeat,
    stepSequencer,
    setBpm,
    setStepCell,
    clearStepRow,
    toggleStepRowMute,
    setStepSwing,
    loadStepPreset,
    setStepSequencerEnabled,
    setStepCount,
    patterns,
    currentPatternId,
    selectPattern,
    addPattern,
    duplicatePattern,
    sendPatternToPlaylist,
  } = useDAWStore()

  const currentStep = useMemo(() => {
    if (!isPlaying) return -1
    return Math.floor((currentBeat * 4) % stepSequencer.stepCount)
  }, [isPlaying, currentBeat, stepSequencer.stepCount])

  const padToDrum = useCallback(
    (id: string): "kick" | "snare" | "hihat" | "clap" | "tom" => {
      const map: Record<string, "kick" | "snare" | "hihat" | "clap" | "tom"> = {
        kick: "kick",
        snare: "snare",
        hihat: "hihat",
        clap: "clap",
        tom1: "tom",
        tom2: "tom",
        perc1: "kick",
        perc2: "snare",
      }
      return map[id] ?? "kick"
    },
    []
  )

  const randomize = useCallback(() => {
    pushHistory(useDAWStore.getState)
    useDAWStore.setState((s) => {
      const stepSequencer = {
        ...s.stepSequencer,
        rows: s.stepSequencer.rows.map((row) => ({
          ...row,
          steps: row.steps.map(() => ({
            active: Math.random() > 0.6,
            velocity: Math.floor(70 + Math.random() * 30),
          })),
        })),
      }
      return {
        stepSequencer,
        patterns: syncPatternSnapshot(s.patterns, s.currentPatternId, stepSequencer),
      }
    })
  }, [])

  const pad = compact ? "p-2" : "p-4 space-y-4"
  const headerH = compact ? "h-8" : "h-10"

  return (
    <div className="h-full flex flex-col bg-surface-1 overflow-hidden min-h-0">
      <div
        className={`${headerH} bg-surface-2 border-b border-border flex items-center px-3 shrink-0`}
      >
        <Drum className="h-4 w-4 text-neon-cyan mr-2" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex-1">
          Channel rack / steps
        </span>
        <label className="flex items-center gap-1.5 mr-2 text-[10px] text-muted-foreground">
          <input
            type="checkbox"
            checked={stepSequencer.enabled}
            onChange={() => setStepSequencerEnabled(!stepSequencer.enabled)}
            className="rounded border-border"
          />
          In mix
        </label>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => sendPatternToPlaylist(1)}>
          <ListPlus className="h-3 w-3 mr-1" />
          To playlist
        </Button>
      </div>

      <div className={`flex-1 overflow-y-auto ${pad}`}>
        <div className={compact ? "space-y-2" : "space-y-3"}>
          <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-border/50">
            {patterns.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPattern(p.id)}
                className={`h-7 px-2.5 text-[10px] rounded border ${
                  p.id === currentPatternId
                    ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.name}
              </button>
            ))}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => addPattern()} title="New pattern">
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => duplicatePattern(currentPatternId)}
              title="Duplicate pattern"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">BPM</span>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Math.max(30, Math.min(300, parseInt(e.target.value, 10) || 120)))}
                className="w-14 h-7 bg-surface-1 border border-border rounded px-2 text-sm font-mono text-neon-cyan"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Swing</span>
              <Slider
                value={[stepSequencer.swing]}
                onValueChange={([v]) => setStepSwing(v)}
                max={50}
                className="w-20"
              />
            </div>
            <Select
              value={stepSequencer.selectedPreset}
              onValueChange={(v) => loadStepPreset(v)}
            >
              <SelectTrigger className="w-28 h-8 bg-surface-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STEP_PRESET_PATTERNS.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="h-8" onClick={randomize}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface-1 p-0.5">
              {[16, 32].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`h-6 px-2 text-[10px] rounded ${
                    stepSequencer.stepCount === count ? "bg-neon-cyan text-background" : "text-muted-foreground"
                  }`}
                  onClick={() => setStepCount(count as 16 | 32)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-2/60 border border-border/60 rounded-md p-2">
            <div className="flex mb-1.5 ml-[5.5rem]">
              {Array(stepSequencer.stepCount)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 text-center text-[9px] ${
                      [0, 4, 8, 12].includes(i) ? "text-foreground font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
            </div>
            {stepSequencer.rows.map((row) => (
              <div key={row.id} className="flex items-center mb-1.5 last:mb-0">
                <div className="w-[5.25rem] flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className={`h-6 w-6 text-xs ${row.muted ? "opacity-40" : ""}`}
                    onClick={() => toggleStepRowMute(row.id)}
                  >
                    {row.icon}
                  </button>
                  <span className="text-[10px] text-foreground truncate">{row.name}</span>
                </div>
                <div className="flex-1 flex gap-0.5 min-w-0">
                  {row.steps.map((step, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`flex-1 min-w-0 h-7 rounded-sm transition-all ${
                        step.active ? "ring-1 ring-white/30" : "bg-surface-1 hover:bg-surface-3"
                      } ${currentStep === i && isPlaying ? "ring-2 ring-neon-cyan/60" : ""}`}
                      style={{
                        backgroundColor: step.active ? row.color : undefined,
                        opacity: step.active ? step.velocity / 127 : 1,
                      }}
                      onClick={() =>
                        setStepCell(row.id, i, !step.active, step.velocity)
                      }
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-0.5 text-muted-foreground hover:text-destructive"
                  onClick={() => clearStepRow(row.id)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

          {!compact && (
            <div className="grid grid-cols-4 gap-2">
              {stepSequencer.rows.slice(0, 8).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="aspect-square rounded-lg text-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: `${row.color}30` }}
                  onClick={() => {
                    void audioEngine.initialize()
                    audioEngine.playDrum("quickplay", padToDrum(row.id), 100)
                  }}
                >
                  {row.icon}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
