"use client"

import { useRef, useCallback, useState, useMemo } from "react"
import { useDAWStore, type Clip } from "@/lib/daw-store"
import { pushHistory } from "@/lib/daw-undo"
import { audioEngine, tracksToTrackData } from "@/lib/audio-engine"
import { TRACK_HEIGHT } from "./track-list"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut } from "lucide-react"
import { BROWSER_DND_MIME, parseBrowserDnD } from "@/lib/browser-dnd"

const BEAT_WIDTH = 40 // pixels per beat at zoom 1
const TOTAL_BARS = 32
const BEATS_PER_BAR = 4
const RULER_HEIGHT = 24
const EDGE_PX = 6
const SNAP = 0.25

type ClipDrag = {
  mode: "move" | "resize-left" | "resize-right"
  clipId: string
  trackId: string
  origStart: number
  origDuration: number
  startClientX: number
  startClientY: number
  initialTrackId: string
}

type ClipDragPreview = {
  clipId: string
  trackId: string
  start: number
  duration: number
  mode: ClipDrag["mode"]
}

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    tracks,
    currentBeat,
    setCurrentBeat,
    isPlaying,
    bpm,
    zoom,
    setZoom,
    clipSnap,
    setClipSnap,
    loopEnabled,
    loopStart,
    loopEnd,
    openPianoRoll,
    selectClip,
    selectedClipId,
    updateClip,
    moveClip,
    addTrack,
    addClip,
    addEffect,
    selectTrack,
  } = useDAWStore()

  const dragRef = useRef<ClipDrag | null>(null)
  const [dragPreview, setDragPreview] = useState<ClipDragPreview | null>(null)

  const beatWidth = BEAT_WIDTH * zoom
  const totalBeats = TOTAL_BARS * BEATS_PER_BAR
  const totalWidth = totalBeats * beatWidth

  const playheadX = useMemo(() => currentBeat * beatWidth, [currentBeat, beatWidth])

  // Handle click on timeline to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const scrollLeft = containerRef.current.scrollLeft
    const x = e.clientX - rect.left + scrollLeft
    const beat = Math.max(0, x / beatWidth)

    setCurrentBeat(beat)

    if (isPlaying) {
      const s = useDAWStore.getState()
      audioEngine.setPlaybackOptions({
        stepSequencer: s.stepSequencer,
        metronomeEnabled: s.metronomeEnabled,
        metronomeVolume: s.metronomeVolume,
      })
      const trackData = tracksToTrackData(s.tracks)
      audioEngine.stop()
      audioEngine.start(trackData, beat)
    }
  }, [beatWidth, isPlaying, setCurrentBeat, tracks])

  // Handle clip click
  const handleClipClick = useCallback((e: React.MouseEvent, clipId: string) => {
    e.stopPropagation()
    selectClip(clipId)
  }, [selectClip])

  // Handle clip double-click to open piano roll
  const handleClipDoubleClick = useCallback((e: React.MouseEvent, clipId: string) => {
    e.stopPropagation()
    openPianoRoll(clipId)
  }, [openPianoRoll])

  const handleClipPointerDown = useCallback(
    (e: React.PointerEvent, track: { id: string }, clip: Clip) => {
      e.stopPropagation()
      e.preventDefault()
      const el = e.currentTarget as HTMLElement
      const r = el.getBoundingClientRect()
      const xIn = e.clientX - r.left
      const w = r.width
      let mode: ClipDrag["mode"] = "move"
      if (xIn < EDGE_PX) mode = "resize-left"
      else if (xIn > w - EDGE_PX) mode = "resize-right"
      if (mode === "move") (el as HTMLElement).style.cursor = "grabbing"
      if (mode === "resize-left" || mode === "resize-right")
        (el as HTMLElement).style.cursor = "ew-resize"
      document.body.style.cursor = mode === "move" ? "grabbing" : "ew-resize"
      pushHistory(useDAWStore.getState)
      dragRef.current = {
        mode,
        clipId: clip.id,
        trackId: track.id,
        origStart: clip.start,
        origDuration: clip.duration,
        startClientX: e.clientX,
        startClientY: e.clientY,
        initialTrackId: track.id,
      }
      setDragPreview({
        clipId: clip.id,
        trackId: track.id,
        start: clip.start,
        duration: clip.duration,
        mode,
      })
      el.setPointerCapture(e.pointerId)
    },
    []
  )

  const handleClipPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current
      if (!d || !containerRef.current) return
      const dx = e.clientX - d.startClientX
      const dBeats = dx / beatWidth
      const snapUnit = e.altKey || clipSnap <= 0 ? 0 : clipSnap
      const snap = (b: number) =>
        Math.max(0, snapUnit > 0 ? Math.round(b / snapUnit) * snapUnit : b)

      const rect = containerRef.current.getBoundingClientRect()
      const sc = containerRef.current.scrollTop
      const relY = e.clientY - rect.top + sc - RULER_HEIGHT
      const tIdx = Math.max(0, Math.min(tracks.length - 1, Math.floor(relY / TRACK_HEIGHT)))

      const t = useDAWStore.getState().tracks
      const newTrackId = t[tIdx]?.id ?? d.initialTrackId

      if (d.mode === "move") {
        const newStart = snap(d.origStart + dBeats)
        setDragPreview({
          clipId: d.clipId,
          trackId: newTrackId,
          start: newStart,
          duration: d.origDuration,
          mode: d.mode,
        })
        return
      }
      if (d.mode === "resize-right") {
        const nd = d.origDuration + dBeats
        const minDur = snapUnit > 0 ? snapUnit : SNAP
        const newDur = Math.max(minDur, snapUnit > 0 ? Math.round(nd / snapUnit) * snapUnit : nd)
        setDragPreview({
          clipId: d.clipId,
          trackId: d.trackId,
          start: d.origStart,
          duration: newDur,
          mode: d.mode,
        })
        return
      }
      const newStart = snap(d.origStart + dBeats)
      const minDur = snapUnit > 0 ? snapUnit : SNAP
      const newDur = Math.max(minDur, d.origDuration - (newStart - d.origStart))
      setDragPreview({
        clipId: d.clipId,
        trackId: d.trackId,
        start: newStart,
        duration: newDur,
        mode: d.mode,
      })
    },
    [beatWidth, clipSnap, tracks.length]
  )

  const endClipPointer = useCallback(() => {
    const d = dragRef.current
    const preview = dragPreview
    if (d && preview && preview.clipId === d.clipId) {
      const curTid = useDAWStore
        .getState()
        .tracks.find((tr) => tr.clips.some((c) => c.id === d.clipId))?.id
      if (d.mode === "move") {
        if (preview.trackId !== curTid) {
          moveClip(d.clipId, preview.trackId, preview.start, { recordHistory: false })
        } else {
          updateClip(d.clipId, { start: preview.start }, { recordHistory: false })
        }
      } else if (d.mode === "resize-right") {
        updateClip(d.clipId, { duration: preview.duration }, { recordHistory: false })
      } else {
        const clip = useDAWStore
          .getState()
          .tracks.flatMap((tr) => tr.clips)
          .find((c) => c.id === d.clipId)
        const trim = preview.start - d.origStart
        const nextNotes = clip
          ? clip.notes
              .map((n) => ({ ...n, start: n.start - trim }))
              .filter((n) => n.start + n.duration > 0.001)
          : undefined
        updateClip(
          d.clipId,
          {
            start: preview.start,
            duration: preview.duration,
            ...(nextNotes ? { notes: nextNotes } : {}),
          },
          { recordHistory: false }
        )
      }
    }
    dragRef.current = null
    setDragPreview(null)
    document.body.style.cursor = ""
  }, [dragPreview, moveClip, updateClip])

  const getDropPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { beat: 0, trackIndex: 0 }
      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left + containerRef.current.scrollLeft
      const y = clientY - rect.top + containerRef.current.scrollTop - RULER_HEIGHT
      const beat = Math.max(0, x / beatWidth)
      const trackIndex = Math.max(0, Math.min(tracks.length - 1, Math.floor(y / TRACK_HEIGHT)))
      return { beat, trackIndex }
    },
    [beatWidth, tracks.length]
  )

  const handleTimelineDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(BROWSER_DND_MIME)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleTimelineDrop = useCallback(
    (e: React.DragEvent) => {
      const payload = parseBrowserDnD(e.dataTransfer.getData(BROWSER_DND_MIME))
      if (!payload) return
      e.preventDefault()
      e.stopPropagation()
      const { beat, trackIndex } = getDropPosition(e.clientX, e.clientY)
      const dropBeat = clipSnap > 0 ? Math.round(beat / clipSnap) * clipSnap : beat

      if (payload.type === "plugin") {
        const targetId = tracks[trackIndex]?.id
        if (targetId) {
          addEffect(targetId, payload.dawEffect)
          selectTrack(targetId)
        }
        return
      }

      const instrumentKey =
        payload.type === "instrument"
          ? payload.instrumentKey
          : payload.category.toLowerCase().includes("drum")
            ? "kick"
            : "lead"
      const color = payload.type === "instrument" ? "#8b5cf6" : "#ec4899"
      addTrack("midi", payload.name, instrumentKey)
      const st = useDAWStore.getState()
      const newTrackId = st.tracks[st.tracks.length - 1]?.id
      if (!newTrackId) return
      const isLoop = payload.type === "sample" && payload.sampleType === "loop"
      const pitch =
        payload.type === "sample" && payload.category.toLowerCase().includes("bass") ? 36 : 60
      addClip(newTrackId, {
        trackId: newTrackId,
        name: payload.name,
        start: dropBeat,
        duration: isLoop ? 4 : 1,
        color,
        notes: [{ id: `seed-${Date.now()}`, pitch, start: 0, duration: isLoop ? 4 : 0.5, velocity: 100 }],
      })
      selectTrack(newTrackId)
    },
    [addClip, addEffect, addTrack, clipSnap, getDropPosition, selectTrack, tracks]
  )

  return (
    <div className="flex-1 flex flex-col bg-surface-1 overflow-hidden">
      {/* Zoom Controls */}
      <div className="h-8 bg-surface-2 border-b border-border flex items-center justify-between px-3">
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Playlist</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Hold Alt while dragging to temporarily bypass snap">
            Snap
            <select
              value={String(clipSnap)}
              onChange={(e) => setClipSnap(Number(e.target.value))}
              className="h-6 bg-surface-1 border border-border rounded px-1 text-[10px] text-foreground"
            >
              <option value="0">Off</option>
              <option value="1">1/4</option>
              <option value="0.5">1/8</option>
              <option value="0.25">1/16</option>
              <option value="0.125">1/32</option>
            </select>
          </label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setZoom(zoom - 0.25)}
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setZoom(zoom + 0.25)}
            disabled={zoom >= 4}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative"
        onClick={handleTimelineClick}
        onDragOver={handleTimelineDragOver}
        onDrop={handleTimelineDrop}
      >
        {/* Time Ruler */}
        <div
          className="h-6 bg-surface-2 border-b border-border sticky top-0 z-10 flex"
          style={{ width: totalWidth }}
        >
          {Array.from({ length: TOTAL_BARS }).map((_, barIndex) => (
            <div
              key={barIndex}
              className="flex border-r border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.06))]"
              style={{ width: beatWidth * BEATS_PER_BAR }}
            >
              <div className="px-1.5 text-[9px] text-muted-foreground flex items-center font-mono tracking-wide">
                {barIndex + 1}
              </div>
              {/* Beat markers */}
              {Array.from({ length: BEATS_PER_BAR }).map((_, beatIndex) => (
                <div
                  key={beatIndex}
                  className={`flex-1 border-r ${
                    beatIndex === 0 ? "border-border/70" : "border-border/25"
                  }`}
                  style={{ width: beatWidth }}
                />
              ))}
            </div>
          ))}

          {/* Loop Region */}
          {loopEnabled && (
            <div
              className="absolute top-0 h-full bg-neon-cyan/20 border-x border-neon-cyan/50"
              style={{
                left: loopStart * beatWidth,
                width: (loopEnd - loopStart) * beatWidth
              }}
            />
          )}
        </div>

        {/* Track Lanes */}
        <div style={{ width: totalWidth }}>
          {tracks.map((track, trackIndex) => (
            <div
              key={track.id}
              className={`border-b border-border relative ${
                trackIndex % 2 === 0 ? "bg-surface-1" : "bg-surface-1/80"
              }`}
              style={{ height: TRACK_HEIGHT }}
            >
              {/* Grid Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: totalBeats }).map((_, i) => (
                  <div
                    key={i}
                    className={`border-r ${
                      i % BEATS_PER_BAR === 0 ? "border-border/70" : "border-border/20"
                    }`}
                    style={{ width: beatWidth }}
                  />
                ))}
              </div>

              {/* Clips */}
              {track.clips.map((clip) => {
                const preview = dragPreview?.clipId === clip.id ? dragPreview : null
                const laneTrackId = preview?.trackId ?? track.id
                if (laneTrackId !== track.id) return null
                const isAudio =
                  clip.clipType === 'audio' ||
                  (Boolean(clip.audioUrl) && (clip.notes?.length ?? 0) === 0)
                return (
                <div
                  key={clip.id}
                  className={`absolute top-0.5 bottom-0.5 rounded-sm touch-none select-none group transition-all hover:brightness-110 ${
                    selectedClipId === clip.id ? 'ring-2 ring-white/50' : ''
                  } ${isAudio ? 'bg-gradient-to-b from-white/5 to-white/10' : 'cursor-grab'}`}
                  style={{
                    left: (preview?.start ?? clip.start) * beatWidth,
                    width: Math.max(4, (preview?.duration ?? clip.duration) * beatWidth - 2),
                    backgroundColor: isAudio
                      ? `${clip.color}25`
                      : `${clip.color}30`,
                    borderColor: `${clip.color}80`,
                    borderWidth: 1,
                    backgroundImage: isAudio
                      ? 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)'
                      : undefined,
                    opacity: preview ? 0.78 : 1,
                  }}
                  onClick={(e) => handleClipClick(e, clip.id)}
                  onDoubleClick={(e) => handleClipDoubleClick(e, clip.id)}
                  onPointerDown={(e) => handleClipPointerDown(e, { id: track.id }, clip)}
                  onPointerMove={handleClipPointerMove}
                  onPointerUp={endClipPointer}
                  onPointerCancel={endClipPointer}
                >
                  {/* Clip Header */}
                  <div
                    className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide truncate font-mono"
                    style={{ color: clip.color }}
                  >
                    {isAudio ? 'â™ª ' : ''}{clip.name}
                  </div>

                  {/* Mini Note Preview */}
                  {!isAudio && (
                  <div className="absolute inset-x-0 top-5 bottom-1 overflow-hidden px-1">
                    {clip.notes.slice(0, 50).map((note, idx) => {
                      const visDur = preview?.duration ?? clip.duration
                      const noteLeft = (note.start / visDur) * 100
                      const noteWidth = (note.duration / visDur) * 100
                      const noteTop = 100 - ((note.pitch - 36) / 48) * 100

                      return (
                        <div
                          key={note.id || `note-${idx}`}
                          className="absolute h-1 rounded-sm opacity-70"
                          style={{
                            left: `${noteLeft}%`,
                            width: `${Math.max(noteWidth, 1)}%`,
                            top: `${Math.max(0, Math.min(95, noteTop))}%`,
                            backgroundColor: clip.color
                          }}
                        />
                      )
                    })}
                  </div>
                  )}
                </div>
              )
              })}
            </div>
          ))}

          {/* Empty State */}
          {tracks.length === 0 && (
            <div
              className="flex items-center justify-center text-muted-foreground"
              style={{ height: TRACK_HEIGHT * 3 }}
            >
              <span className="text-sm">Add tracks to start creating</span>
            </div>
          )}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-neon-cyan z-20 pointer-events-none"
          style={{
            boxShadow: '0 0 8px rgba(0, 212, 255, 0.5)',
            transform: `translateX(${playheadX}px)`
          }}
        >
          {/* Playhead handle */}
          <div
            className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-neon-cyan"
            style={{
              clipPath: 'polygon(50% 100%, 0 0, 100% 0)'
            }}
          />
        </div>
      </div>
    </div>
  )
}
