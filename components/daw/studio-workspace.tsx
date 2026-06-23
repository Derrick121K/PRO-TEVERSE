"use client"

/**
 * FL-style center: playlist (tracks + timeline) above channel rack; piano roll docked below when open.
 */

import { TrackList } from "@/components/daw/track-list"
import { Timeline } from "@/components/daw/timeline"
import { StepSequencer } from "@/components/daw/step-sequencer"
import { PianoRoll } from "@/components/daw/piano-roll"
import { useDAWStore } from "@/lib/daw-store"
import { clipIsAudio } from "@/lib/audio-engine"
import { Piano } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useCallback, useMemo } from "react"

export function StudioWorkspace() {
  const { pianoRollOpen, pianoRollClipId, openPianoRoll, workspaceSizes, setWorkspaceSize } = useDAWStore()
  const selectedClipId = useDAWStore((s) => s.selectedClipId)
  const tracks = useDAWStore((s) => s.tracks)
  const selectedClip = tracks.flatMap((t) => t.clips).find((c) => c.id === selectedClipId)
  const hasPiano = Boolean(pianoRollOpen && pianoRollClipId)

  const twoPanelSizes = useMemo(() => {
    const p = Math.max(24, Math.min(86, workspaceSizes.playlist))
    const r = Math.max(14, Math.min(42, workspaceSizes.rack))
    const total = p + r
    if (Math.abs(total - 100) < 0.5) return { playlist: p, rack: r }
    const scale = 100 / Math.max(1, total)
    const nextPlaylist = Math.max(24, Math.min(86, Number((p * scale).toFixed(1))))
    const nextRack = Number((100 - nextPlaylist).toFixed(1))
    return { playlist: nextPlaylist, rack: Math.max(14, Math.min(42, nextRack)) }
  }, [workspaceSizes.playlist, workspaceSizes.rack])

  const threePanelSizes = useMemo(() => {
    const p = Math.max(24, Math.min(70, workspaceSizes.playlist))
    const r = Math.max(14, Math.min(42, workspaceSizes.rack))
    const pn = Math.max(14, Math.min(55, workspaceSizes.piano))
    const total = p + r + pn
    if (Math.abs(total - 100) < 0.5) return { playlist: p, rack: r, piano: pn }
    const scale = 100 / Math.max(1, total)
    const np = Number((p * scale).toFixed(1))
    const nr = Number((r * scale).toFixed(1))
    const npi = Number((100 - np - nr).toFixed(1))
    return {
      playlist: Math.max(24, Math.min(70, np)),
      rack: Math.max(14, Math.min(42, nr)),
      piano: Math.max(14, Math.min(55, npi)),
    }
  }, [workspaceSizes.piano, workspaceSizes.playlist, workspaceSizes.rack])

  const onVerticalLayout = useCallback(
    (sizes: number[]) => {
      if (hasPiano) {
        setWorkspaceSize("playlist", sizes[0] ?? workspaceSizes.playlist)
        setWorkspaceSize("rack", sizes[1] ?? workspaceSizes.rack)
        setWorkspaceSize("piano", sizes[2] ?? workspaceSizes.piano)
      } else {
        setWorkspaceSize("playlist", sizes[0] ?? workspaceSizes.playlist)
        setWorkspaceSize("rack", sizes[1] ?? workspaceSizes.rack)
      }
    },
    [hasPiano, setWorkspaceSize, workspaceSizes.piano, workspaceSizes.playlist, workspaceSizes.rack]
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0" onLayout={onVerticalLayout}>
        <ResizablePanel
          id="workspace-playlist"
          order={1}
          defaultSize={hasPiano ? threePanelSizes.playlist : twoPanelSizes.playlist}
          minSize={24}
        >
          <div className="h-full min-h-[120px] flex overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="flex-1">
              <ResizablePanel id="playlist-tracks" order={1} defaultSize={18} minSize={12} maxSize={32}>
                <TrackList />
              </ResizablePanel>
              <ResizableHandle withHandle className="w-1 bg-border/90" />
              <ResizablePanel id="playlist-timeline" order={2} defaultSize={82} minSize={52}>
                <Timeline />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="h-1 bg-border/90" />
        <ResizablePanel
          id="workspace-rack"
          order={2}
          defaultSize={hasPiano ? threePanelSizes.rack : twoPanelSizes.rack}
          minSize={14}
          maxSize={42}
        >
          <div className="h-full min-h-[96px] border-t border-border/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <StepSequencer compact />
          </div>
        </ResizablePanel>
        {hasPiano ? (
          <>
            <ResizableHandle withHandle className="h-1 bg-border/90" />
            <ResizablePanel
              id="workspace-piano"
              order={3}
              defaultSize={threePanelSizes.piano}
              minSize={14}
              maxSize={55}
            >
              <div className="h-full min-h-[120px] border-t border-border/80 min-h-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                <PianoRoll />
              </div>
            </ResizablePanel>
          </>
        ) : (
          <div className="h-9 shrink-0 border-t border-border bg-surface-2/90 flex items-center justify-between px-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Piano roll</span>
            {selectedClip && !clipIsAudio(selectedClip) ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => openPianoRoll(selectedClip.id)}
              >
                <Piano className="h-3 w-3 mr-1" />
                Open: {selectedClip.name}
              </Button>
            ) : selectedClip && clipIsAudio(selectedClip) ? (
              <span className="text-[10px] text-muted-foreground">Audio clip: trim in properties</span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Select a MIDI clip to edit</span>
            )}
            <span className="w-6" />
          </div>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
