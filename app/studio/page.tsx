"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useDAWStore } from "@/lib/daw-store"
import { audioEngine } from "@/lib/audio-engine"
import { TransportBar } from "@/components/daw/transport-bar"
import { StudioWorkspace } from "@/components/daw/studio-workspace"
import { Browser } from "@/components/daw/browser"
import { AudioEngineSync } from "@/components/daw/audio-engine-sync"
import { StudioAudioHealth } from "@/components/daw/studio-audio-health"
import { loadFlpImportFromSession, clearFlpImportSession } from "@/lib/flp-import"
import { AIPanel } from "@/components/daw/ai-panel"
import { Mixer } from "@/components/daw/mixer"
import { VocalRecorder } from "@/components/daw/vocal-recorder"
import { ChordPanel } from "@/components/daw/chord-panel"
import { PatternEditor } from "@/components/daw/pattern-editor"
import { OnboardingOverlay } from "@/components/daw/onboarding-overlay"
import { seedDemoProjectIfNeeded } from "@/lib/demo-project"
import { useProjectManager } from "@/lib/project-manager"
import { autoSaveCurrentDawToCloud, isCloudProjectConfigured } from "@/lib/cloud-daw-project"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Guitar, Zap, Layout } from "lucide-react"

type ToolView = "studio" | "chords" | "pattern" | "record"

/** Must stay in sync with `quickStartTemplates` on the dashboard (BPM for `/studio?template=Ã¢â‚¬Â¦`). */
const TEMPLATE_BPM: Record<string, number> = {
  trap: 140,
  lofi: 85,
  house: 128,
  ambient: 70,
  hiphop: 90,
}

export default function StudioPage() {
  const router = useRouter()
  const pathname = usePathname()
  const {
    tracks,
    bpm,
    isPlaying,
    currentBeat,
    dockPanels,
    dockSizes,
    setDockSize,
    simpleMode,
    stepSequencer,
  } = useDAWStore()
  const { quickSave } = useProjectManager()
  const [toolView, setToolView] = useState<ToolView>("studio")

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable
    ) {
      return
    }
    const state = useDAWStore.getState()
    const isMod = e.ctrlKey || e.metaKey
    if (e.code === "Space" && !isMod) {
      e.preventDefault()
      state.isPlaying ? state.pause() : state.play()
      return
    }
    if (e.key === "Enter" && !isMod) {
      e.preventDefault()
      state.stop()
      return
    }
    if (e.key.toLowerCase() === "r" && !isMod) {
      e.preventDefault()
      state.toggleRecord()
      return
    }
    if (e.key.toLowerCase() === "l" && !isMod) {
      e.preventDefault()
      state.toggleLoop()
      return
    }
    if (e.key === "1" && !isMod) {
      e.preventDefault()
      setToolView("studio")
    } else if (!simpleMode && e.key === "2" && !isMod) {
      e.preventDefault()
      setToolView("chords")
    } else if (!simpleMode && e.key === "3" && !isMod) {
      e.preventDefault()
      setToolView("pattern")
    } else if (!simpleMode && e.key === "4" && !isMod) {
      e.preventDefault()
      setToolView("record")
    }
    if (isMod && e.key === "z" && !e.shiftKey) {
      e.preventDefault()
      state.undo()
    } else if (isMod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault()
      state.redo()
    }
  }, [simpleMode])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    void audioEngine.initialize()
    seedDemoProjectIfNeeded()
    const flp = loadFlpImportFromSession()
    if (flp?.tracks?.length) {
      useDAWStore.getState().applyFlpImport(flp.tracks, flp.bpm)
      clearFlpImportSession()
    }
    return () => {
      audioEngine.stop()
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const sp = new URLSearchParams(window.location.search)
    let changed = false
    const t = sp.get("template")
    if (t) {
      const bpm = TEMPLATE_BPM[t]
      if (bpm != null) {
        useDAWStore.getState().setBpm(bpm)
      }
      sp.delete("template")
      changed = true
    }
    if (sp.get("panel") === "ai") {
      useDAWStore.getState().setDockOpen("producer", true)
      sp.delete("panel")
      changed = true
    }
    if (!changed) return
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname])

  useEffect(() => {
    if (simpleMode && toolView !== "studio") {
      setToolView("studio")
    }
  }, [simpleMode, toolView])

  useEffect(() => {
    const timeout = setTimeout(() => {
      quickSave()
      if (isCloudProjectConfigured()) {
        void autoSaveCurrentDawToCloud("Autosave")
      }
    }, 1500)
    return () => clearTimeout(timeout)
  }, [tracks, bpm, stepSequencer, quickSave])

  const formatPosition = (beats: number) => {
    const bars = Math.floor(beats / 4) + 1
    const beat = Math.floor(beats % 4) + 1
    const tick = Math.floor((beats % 1) * 100)
    return `${bars.toString().padStart(3, "0")}:${beat}:${tick.toString().padStart(2, "0")}`
  }

  const formatTime = (beats: number, tBpm: number) => {
    const seconds = (beats / tBpm) * 60
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
  }

  const leftOpen = dockPanels.browser
  const producerVisible = !simpleMode && dockPanels.producer && toolView === "studio"
  const mixerVisible = !simpleMode && dockPanels.mixer
  const rightOpen = producerVisible || mixerVisible
  const leftSize = leftOpen ? dockSizes.browser : 0
  const rightSize = rightOpen
    ? producerVisible && mixerVisible
      ? Math.max(dockSizes.producer, dockSizes.mixer)
      : producerVisible
        ? dockSizes.producer
        : dockSizes.mixer
    : 0
  const mainSize = Math.max(40, 100 - leftSize - rightSize)

  const handleHorizontalLayout = useCallback(
    (sizes: number[]) => {
      let i = 0
      if (leftOpen) {
        setDockSize("browser", sizes[i] ?? dockSizes.browser)
        i += 1
      }
      i += 1 // main
      if (rightOpen) {
        const right = sizes[i]
        if (right != null) {
          if (producerVisible) setDockSize("producer", right)
          if (mixerVisible) setDockSize("mixer", right)
        }
      }
    },
    [dockSizes.browser, leftOpen, mixerVisible, producerVisible, rightOpen, setDockSize]
  )

  return (
    <div className="fl20-shell relative h-screen flex flex-col bg-background overflow-hidden">
      <AudioEngineSync />
      <OnboardingOverlay />
      <TransportBar />
      <StudioAudioHealth />

      <div className="h-11 bg-[oklch(0.12_0.02_260)] border-b border-border/90 flex items-center justify-between px-3 shrink-0">
        {simpleMode ? (
          <div className="h-8 px-3 flex items-center rounded border border-border/80 bg-surface-1/90">
            <Layout className="h-3.5 w-3.5 mr-1 text-neon-cyan" />
            <span className="text-[11px] text-foreground">Studio (Simple)</span>
          </div>
        ) : (
          <Tabs
            value={toolView}
            onValueChange={(v) => setToolView(v as ToolView)}
            className="h-full w-auto"
          >
            <TabsList className="h-8 bg-surface-1/90 border border-border/80 p-0.5">
              <TabsTrigger
                value="studio"
                className="text-[10px] h-7 px-2.5 data-[state=active]:bg-surface-3 data-[state=active]:text-neon-cyan"
              >
                <Layout className="h-3.5 w-3.5 mr-1" />
                Studio
              </TabsTrigger>
              <TabsTrigger
                value="chords"
                className="text-[10px] h-7 px-2.5 data-[state=active]:bg-surface-3"
              >
                <Guitar className="h-3.5 w-3.5 mr-1" />
                Chords
              </TabsTrigger>
              <TabsTrigger
                value="pattern"
                className="text-[10px] h-7 px-2.5 data-[state=active]:bg-surface-3"
              >
                <Zap className="h-3.5 w-3.5 mr-1" />
                Pattern
              </TabsTrigger>
              <TabsTrigger
                value="record"
                className="text-[10px] h-7 px-2.5 data-[state=active]:bg-surface-3"
              >
                <Mic className="h-3.5 w-3.5 mr-1" />
                Record
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-mono text-neon-cyan/90">{bpm} BPM</span>
          {!simpleMode && (
            <>
              <span className="w-px h-3 bg-border" />
              <span className="font-mono text-foreground/90 tabular-nums">
                {formatPosition(currentBeat)}
              </span>
              <span className="text-muted-foreground/80 tabular-nums text-[10px]">
                {formatTime(currentBeat, bpm)}
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="text-[10px]">
                {tracks.length} tr Ã‚Â· {tracks.reduce((a, t) => a + t.clips.length, 0)} clips
              </span>
            </>
          )}
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded ${
              isPlaying ? "bg-neon-cyan/15 text-neon-cyan" : "bg-surface-2"
            }`}
          >
            {isPlaying ? "PLAY" : "STOP"}
          </span>
        </div>
      </div>

      {toolView === "record" ? (
        <div className="flex-1 overflow-hidden min-h-0">
          <VocalRecorder />
        </div>
      ) : toolView === "chords" ? (
        <div className="flex-1 flex overflow-hidden min-h-0">
          <ResizablePanelGroup direction="horizontal" className="flex-1" onLayout={handleHorizontalLayout}>
            {leftOpen && (
              <>
                <ResizablePanel
                  id="chords-browser"
                  order={1}
                  defaultSize={leftSize}
                  minSize={12}
                  maxSize={32}
                >
                  <Browser />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}
            <ResizablePanel
              id="chords-main"
              order={leftOpen ? 2 : 1}
              defaultSize={mainSize}
              minSize={50}
            >
              <ChordPanel />
            </ResizablePanel>
            {mixerVisible && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  id="chords-mixer"
                  order={leftOpen ? 3 : 2}
                  defaultSize={rightSize}
                  minSize={16}
                  maxSize={40}
                >
                  <Mixer />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      ) : toolView === "pattern" ? (
        <div className="flex-1 flex overflow-hidden min-h-0">
          <ResizablePanelGroup direction="horizontal" className="flex-1" onLayout={handleHorizontalLayout}>
            {leftOpen && (
              <>
                <ResizablePanel
                  id="pattern-browser"
                  order={1}
                  defaultSize={leftSize}
                  minSize={12}
                  maxSize={32}
                >
                  <Browser />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}
            <ResizablePanel
              id="pattern-main"
              order={leftOpen ? 2 : 1}
              defaultSize={mainSize}
              minSize={50}
            >
              <PatternEditor />
            </ResizablePanel>
            {mixerVisible && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  id="pattern-mixer"
                  order={leftOpen ? 3 : 2}
                  defaultSize={rightSize}
                  minSize={16}
                  maxSize={40}
                >
                  <Mixer />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          <ResizablePanelGroup direction="horizontal" className="flex-1" onLayout={handleHorizontalLayout}>
            {leftOpen && (
              <>
                <ResizablePanel
                  id="fl-browser"
                  order={1}
                  defaultSize={leftSize}
                  minSize={12}
                  maxSize={32}
                >
                  <Browser />
                </ResizablePanel>
                <ResizableHandle withHandle className="w-1 bg-border/80" />
              </>
            )}
            <ResizablePanel
              id="fl-main"
              order={leftOpen ? 2 : 1}
              defaultSize={mainSize}
              minSize={40}
            >
              <StudioWorkspace />
            </ResizablePanel>
            {rightOpen && (
              <>
                <ResizableHandle withHandle className="w-1 bg-border/80" />
                <ResizablePanel
                  id="fl-right"
                  order={leftOpen ? 3 : 2}
                  defaultSize={rightSize}
                  minSize={16}
                  maxSize={40}
                >
                  {producerVisible && mixerVisible ? (
                    <ResizablePanelGroup direction="vertical">
                      <ResizablePanel id="fl-ai" order={1} defaultSize={55} minSize={20}>
                        <AIPanel />
                      </ResizablePanel>
                      <ResizableHandle withHandle className="h-1 bg-border/80" />
                      <ResizablePanel id="fl-mixer" order={2} defaultSize={45} minSize={20}>
                        <Mixer />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : producerVisible ? (
                    <AIPanel />
                  ) : (
                    <Mixer />
                  )}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      )}

      <div className="lg:hidden shrink-0 border-t border-border/60 bg-surface-2/90 px-3 py-2 text-center text-[10px] text-muted-foreground leading-snug">
        Tip: widen your window for the full grid layout. The DAW works on this screen size; a mouse helps for fine edits.
      </div>
    </div>
  )
}
