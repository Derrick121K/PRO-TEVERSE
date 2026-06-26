"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useDAWStore } from "@/lib/daw-store"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Square,
  SkipBack,
  Circle,
  Repeat,
  Volume2,
  VolumeX,
  Disc3,
  FolderOpen,
  Sparkles,
  Sliders,
  Home,
  Radio,
  PanelTopClose,
  RotateCcw,
} from "lucide-react"
import { MidiInControl } from "@/components/daw/midi-in-control"
import { loadSystemSampleProject } from "@/lib/demo-project"

export function TransportBar() {
  const {
    isPlaying,
    isRecording,
    bpm,
    timeSignature,
    currentBeat,
    loopEnabled,
    masterVolume,
    play,
    pause,
    stop,
    toggleRecord,
    setBpm,
    toggleLoop,
    setMasterVolume,
    dockPanels,
    toggleDock,
    simpleMode,
    setSimpleMode,
    resetStudioLayout,
    newProject,
    metronomeEnabled,
    setMetronomeEnabled,
    metronomeVolume,
    setMetronomeVolume
  } = useDAWStore()

  const playButtonRef = useRef<HTMLButtonElement>(null)

  const formatTime = (beats: number) => {
    const bars = Math.floor(beats / timeSignature[0]) + 1
    const beat = Math.floor(beats % timeSignature[0]) + 1
    const tick = Math.floor((beats % 1) * 100)
    return `${bars}:${beat}:${tick.toString().padStart(2, "0")}`
  }

  // Announce state changes to screen readers
  const playStatusRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (playStatusRef.current) {
      playStatusRef.current.textContent = isPlaying ? 'Playing' : 'Stopped'
    }
  }, [isPlaying])

  return (
    <div 
      className="h-[54px] bg-surface-1 border-b border-border flex items-center px-2 gap-2"
      role="toolbar"
      aria-label="Transport controls"
    >
      {/* Logo */}
      <Link 
        href="/" 
        className="flex items-center gap-1.5 mr-2"
        aria-label="PRO-TEVERSE Home"
      >
        <div className="relative">
          <Disc3 className="h-5 w-5 text-neon-cyan" aria-hidden="true" />
        </div>
        <span className="text-xs font-semibold gradient-text tracking-wide hidden 2xl:block">PRO-TEVERSE</span>
      </Link>

      {/* Panel Toggle Buttons */}
      <div
        className="flex items-center gap-1 rounded-md border border-border/70 bg-surface-2/90 p-1"
        role="group"
        aria-label="Panel toggles"
      >
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 border ${
            dockPanels.browser
              ? "bg-surface-3 text-neon-cyan border-neon-cyan/40"
              : "text-muted-foreground border-border/60 hover:bg-surface-3"
          }`}
          onClick={() => toggleDock("browser")}
          aria-label="Toggle browser panel"
          aria-pressed={dockPanels.browser}
        >
          <FolderOpen className="h-4 w-4" aria-hidden="true" />
        </Button>
        {!simpleMode && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 border ${
                dockPanels.producer
                  ? "bg-surface-3 text-neon-purple border-neon-purple/40"
                  : "text-muted-foreground border-border/60 hover:bg-surface-3"
              }`}
              onClick={() => toggleDock("producer")}
              aria-label="Toggle GossipAI-PROD Producer panel"
              aria-pressed={dockPanels.producer}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 border ${
                dockPanels.mixer
                  ? "bg-surface-3 text-neon-pink border-neon-pink/40"
                  : "text-muted-foreground border-border/60 hover:bg-surface-3"
              }`}
              onClick={() => toggleDock("mixer")}
              aria-label="Toggle mixer panel"
              aria-pressed={dockPanels.mixer}
            >
              <Sliders className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>

      {/* Transport Controls */}
      <div
        className="flex items-center gap-1 rounded-md border border-border/70 bg-surface-2/90 p-1"
        role="group"
        aria-label="Transport"
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 border border-border/60 bg-surface-3 text-muted-foreground hover:text-foreground"
          onClick={stop}
          aria-label="Go to beginning"
        >
          <SkipBack className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 border border-border/60 bg-surface-3 text-muted-foreground hover:text-foreground"
          onClick={stop}
          aria-label="Stop"
        >
          <Square className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          ref={playButtonRef}
          size="sm"
          className={`h-7 w-7 p-0 border ${
            isPlaying
              ? "bg-neon-cyan text-background border-neon-cyan/80 hover:bg-neon-cyan/90"
              : "bg-surface-3 text-foreground border-border/60 hover:bg-surface-3"
          }`}
          onClick={() => (isPlaying ? pause() : play())}
          aria-label={isPlaying ? "Pause" : "Play"}
          aria-pressed={isPlaying}
        >
          {isPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4 ml-0.5" aria-hidden="true" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 border ${
            isRecording
              ? "text-red-500 bg-red-500/20 border-red-500/50"
              : "text-muted-foreground border-border/60 bg-surface-3 hover:text-foreground"
          }`}
          onClick={toggleRecord}
          aria-label="Record"
          aria-pressed={isRecording}
        >
          <Circle className="h-4 w-4" fill={isRecording ? "currentColor" : "none"} aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 border ${
            loopEnabled
              ? "text-neon-cyan bg-neon-cyan/20 border-neon-cyan/50"
              : "text-muted-foreground border-border/60 bg-surface-3 hover:text-foreground"
          }`}
          onClick={toggleLoop}
          aria-label="Toggle loop"
          aria-pressed={loopEnabled}
        >
          <Repeat className="h-4 w-4" aria-hidden="true" />
        </Button>
        {!simpleMode && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 border ${
                metronomeEnabled
                  ? "text-amber-400 bg-amber-500/20 border-amber-500/50"
                  : "text-muted-foreground border-border/60 bg-surface-3 hover:text-foreground"
              }`}
              onClick={() => setMetronomeEnabled(!metronomeEnabled)}
              aria-label="Metronome"
              title="Metronome (quarter click)"
            >
              <Radio className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div className="hidden sm:flex items-center gap-1" aria-label="Metronome level">
              <span className="text-[9px] text-muted-foreground w-4">M</span>
              <Slider
                value={[metronomeVolume * 100]}
                onValueChange={([v]) => setMetronomeVolume(v / 100)}
                max={100}
                step={1}
                className="w-14 h-1"
                disabled={!metronomeEnabled}
              />
            </div>
          </>
        )}
      </div>

      {/* Time Display */}
      <div className="flex items-center gap-2 px-2.5 border-x border-border/80">
        <div 
          className="font-mono text-[15px] text-foreground tabular-nums min-w-[74px] tracking-tight"
          role="timer"
          aria-label={`Position: ${formatTime(currentBeat)}`}
          aria-live="polite"
        >
          {formatTime(currentBeat)}
        </div>
      </div>

      {/* BPM Control */}
      <div className="flex items-center gap-1.5 px-2.5 border-r border-border/80">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground" id="bpm-label">Tempo</span>
        <input
          type="number"
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
          className="w-12 h-7 bg-surface-3 border border-border rounded px-1.5 text-[11px] font-mono text-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan"
          aria-labelledby="bpm-label"
          min="20"
          max="300"
        />
      </div>

      {!simpleMode && (
        <div className="flex items-center gap-1 px-2.5 border-r border-border/80" aria-label={`Time signature: ${timeSignature[0]}/${timeSignature[1]}`}>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Meter</span>
          <span className="font-mono text-xs text-foreground">
            {timeSignature[0]}/{timeSignature[1]}
          </span>
        </div>
      )}

      <MidiInControl />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Master Volume */}
      <div className="flex items-center gap-2" role="group" aria-label="Master volume">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => setMasterVolume(masterVolume > 0 ? 0 : 0.8)}
          aria-label={masterVolume === 0 ? "Unmute" : "Mute"}
        >
          {masterVolume === 0 ? (
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
        <Slider
          value={[masterVolume * 100]}
          onValueChange={([value]) => setMasterVolume(value / 100)}
          max={100}
          step={1}
          className="w-24"
          aria-label="Master volume level"
        />
        <span className="text-xs text-muted-foreground w-8 font-mono" aria-live="polite">
          {Math.round(masterVolume * 100)}%
        </span>
      </div>

      {/* Home Button */}
      <Link href="/pro-studio">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-muted-foreground hover:text-foreground"
          aria-label="Go to Pro Studio"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Link>

      <Button
        variant="ghost"
        size="sm"
        className={`h-8 text-xs px-2 ${
          simpleMode ? "text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20" : "text-muted-foreground"
        }`}
        onClick={() => setSimpleMode(!simpleMode)}
        aria-label={simpleMode ? "Switch to pro mode" : "Switch to simple mode"}
        title={simpleMode ? "Simple mode on" : "Pro mode on"}
      >
        <PanelTopClose className="h-3.5 w-3.5 mr-1" />
        {simpleMode ? "Simple" : "Pro"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground"
        onClick={() => {
          if (typeof window !== "undefined" && window.confirm("Start a new empty project? Unsaved changes are lost.")) {
            newProject()
          }
        }}
        aria-label="New project"
        title="New song"
      >
        New
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground"
        onClick={resetStudioLayout}
        aria-label="Reset studio layout"
        title="Reset FL layout"
      >
        <RotateCcw className="h-3.5 w-3.5 mr-1" />
        Reset
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground"
        onClick={async () => {
          stop()
          await loadSystemSampleProject()
        }}
        aria-label="Load Nkosi sample project"
        title="Load Nkosi sample project"
      >
        <Disc3 className="h-3.5 w-3.5 mr-1" />
        Load Nkosi
      </Button>

      {/* Screen reader announcements */}
      <div ref={playStatusRef} className="sr-only" aria-live="polite" />
      
      {/* Keyboard shortcuts hint */}
      <div className="sr-only">
        Studio shortcuts: Space play/pause, Enter stop, R record, L loop, 1-4 views, Ctrl/Cmd+Z undo
      </div>
    </div>
  )
}

