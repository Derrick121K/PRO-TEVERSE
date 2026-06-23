"use client"

import { useRef, useState, useCallback, useMemo, useEffect } from "react"
import { useDAWStore, Note } from "@/lib/daw-store"
import { audioEngine } from "@/lib/audio-engine"
import { midiNoteToName } from "@/lib/midi-utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { 
  X, Pencil, MousePointer2, Eraser, Grid3x3, 
  Copy, Scissors, Trash2, ZoomIn, ZoomOut,
  ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  Undo, Redo, Volume2, Split
} from "lucide-react"

const NOTE_HEIGHT = 16
const BEAT_WIDTH = 40
const OCTAVES = 4
const NOTES_PER_OCTAVE = 12
const TOTAL_NOTES = OCTAVES * NOTES_PER_OCTAVE
const START_NOTE = 48 // C3

type Tool = 'select' | 'draw' | 'erase' | 'split'
type DraftNote = Pick<Note, "start" | "duration" | "pitch">
type NoteDragState = {
  mode: "move" | "resize"
  noteIds: string[]
  originById: Record<string, DraftNote>
  startClientX: number
  startClientY: number
}
type MarqueeRect = {
  startX: number
  startY: number
  endX: number
  endY: number
}

export function PianoRoll() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const pianoKeysRef = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<Tool>('draw')
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ beat: number; pitch: number } | null>(null)
  const [previewNote, setPreviewNote] = useState<{ beat: number; pitch: number; duration: number } | null>(null)
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [velocity, setVelocity] = useState(100)
  const [clipboard, setClipboard] = useState<Note[]>([])
  const [noteDrag, setNoteDrag] = useState<NoteDragState | null>(null)
  const [noteDrafts, setNoteDrafts] = useState<Record<string, DraftNote>>({})
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null)

  const {
    pianoRollClipId,
    tracks,
    closePianoRoll,
    addNote,
    removeNote,
    updateNote,
    updateNotesBatch,
    zoom: storeZoom,
    setZoom: setStoreZoom,
    noteSnap,
    setNoteSnap,
  } = useDAWStore()

  const beatWidth = BEAT_WIDTH * storeZoom
  const minSnap = noteSnap > 0 ? noteSnap : 0.125
  const clampPitch = (pitch: number) => Math.max(0, Math.min(127, pitch))
  const noteAt = (note: Note): DraftNote => noteDrafts[note.id] ?? note

  // Find the clip
  const clip = useMemo(() => {
    for (const track of tracks) {
      const foundClip = track.clips.find(c => c.id === pianoRollClipId)
      if (foundClip) return { clip: foundClip, track }
    }
    return null
  }, [tracks, pianoRollClipId])

  const clipData = clip?.clip
  const trackData = clip?.track

  // Snap value to grid
  const snapValue = useCallback((value: number, gridSize: number = noteSnap) => {
    if (!snapToGrid) return value
    if (gridSize <= 0) return value
    return Math.round(value / gridSize) * gridSize
  }, [noteSnap, snapToGrid])

  // Play note preview with instrument-specific sounds
  const playNotePreview = useCallback((pitch: number, velocity: number = 100) => {
    if (trackData) {
      audioEngine.initialize()
      // Use different synths based on track content for better sound
      const synthType = trackData.type === 'audio' ? 'pluck' : 'lead'
      audioEngine.playNote(trackData.id, pitch, 0.3, velocity, undefined, undefined, synthType)
    }
  }, [trackData])

  // Keyboard shortcuts for editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pianoRollClipId || !clipData) return
      
      if (e.target instanceof HTMLInputElement) return
      
      const isMod = e.ctrlKey || e.metaKey
      
      // Copy: Ctrl+C
      if (isMod && e.key === 'c') {
        const copied = clipData.notes.filter(n => selectedNotes.has(n.id))
        if (copied.length > 0) setClipboard(copied)
      }
      
      // Cut: Ctrl+X
      if (isMod && e.key === 'x') {
        const copied = clipData.notes.filter(n => selectedNotes.has(n.id))
        if (copied.length > 0) {
          setClipboard(copied)
          selectedNotes.forEach(id => removeNote(pianoRollClipId, id))
          setSelectedNotes(new Set())
        }
      }
      
      // Paste: Ctrl+V
      if (isMod && e.key === 'v' && clipboard.length > 0) {
        clipboard.forEach(note => {
          addNote(pianoRollClipId, {
            pitch: note.pitch,
            start: note.start + 4,
            duration: note.duration,
            velocity: note.velocity
          })
        })
      }
      
      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNotes.size > 0) {
        selectedNotes.forEach(id => removeNote(pianoRollClipId, id))
        setSelectedNotes(new Set())
      }
      
      // Select all: Ctrl+A
      if (isMod && e.key === 'a') {
        e.preventDefault()
        setSelectedNotes(new Set(clipData.notes.map(n => n.id)))
      }
      
      // Deselect: Escape
      if (e.key === 'Escape') {
        setSelectedNotes(new Set())
      }
      
      // Quantize: Q
      if (e.key === 'q' && selectedNotes.size > 0) {
        const q = noteSnap > 0 ? noteSnap : 0.25
        clipData.notes.forEach(note => {
          if (selectedNotes.has(note.id)) {
            const quantized = Math.round(note.start / q) * q
            updateNote(pianoRollClipId, note.id, { start: quantized })
          }
        })
      }
      
      // Arrow keys to move notes
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') && selectedNotes.size > 0) {
        e.preventDefault()
        const step = e.shiftKey ? 1 : 0.25
        const pitchStep = 1
        
        clipData.notes.forEach(note => {
          if (selectedNotes.has(note.id)) {
            if (e.key === 'ArrowUp') {
              updateNote(pianoRollClipId, note.id, { pitch: Math.min(127, note.pitch + pitchStep) })
            } else if (e.key === 'ArrowDown') {
              updateNote(pianoRollClipId, note.id, { pitch: Math.max(0, note.pitch - pitchStep) })
            } else if (e.key === 'ArrowLeft') {
              updateNote(pianoRollClipId, note.id, { start: Math.max(0, note.start - step) })
            } else if (e.key === 'ArrowRight') {
              updateNote(pianoRollClipId, note.id, { start: note.start + step })
            }
          }
        })
      }
      
      // Alt+Space: preview middle C (Space alone = transport play/pause)
      if (e.code === 'Space' && e.altKey && selectedNotes.size === 0) {
        e.preventDefault()
        playNotePreview(60, velocity)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clipData, noteSnap, pianoRollClipId, selectedNotes, clipboard, addNote, removeNote, updateNote, playNotePreview, velocity])

  // Handle mouse down on grid
  const handleGridMouseDown = useCallback((e: React.MouseEvent) => {
    if (!gridRef.current || !clipData) return

    const rect = gridRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + (gridRef.current.scrollLeft || 0)
    const y = e.clientY - rect.top + (gridRef.current.scrollTop || 0)

    const beat = snapValue(x / beatWidth)
    const pitch = START_NOTE + TOTAL_NOTES - 1 - Math.floor(y / NOTE_HEIGHT)

    if (tool === 'draw') {
      setIsDrawing(true)
      setDrawStart({ beat, pitch })
      setPreviewNote({ beat, pitch, duration: 0.25 })
      playNotePreview(pitch)
    } else if (tool === 'select') {
      setMarquee({ startX: x, startY: y, endX: x, endY: y })
      if (!e.shiftKey) {
        setSelectedNotes(new Set())
      }
    } else if (tool === 'erase') {
      // Find and remove note at position
      const noteToRemove = clipData.notes.find(n =>
        n.pitch === pitch && beat >= n.start && beat < n.start + n.duration
      )
      if (noteToRemove && pianoRollClipId) {
        removeNote(pianoRollClipId, noteToRemove.id)
      }
    }
  }, [clipData, beatWidth, snapValue, tool, playNotePreview, pianoRollClipId, removeNote])

  // Handle mouse move on grid
  const handleGridMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gridRef.current) return

    if (noteDrag && clipData) {
      const dx = (e.clientX - noteDrag.startClientX) / beatWidth
      const dyNotes = Math.round((noteDrag.startClientY - e.clientY) / NOTE_HEIGHT)
      const snapDx = snapValue(dx)
      const nextDrafts: Record<string, DraftNote> = {}
      for (const id of noteDrag.noteIds) {
        const origin = noteDrag.originById[id]
        if (!origin) continue
        if (noteDrag.mode === "resize") {
          nextDrafts[id] = {
            ...origin,
            duration: Math.max(minSnap, origin.duration + snapDx),
          }
        } else {
          nextDrafts[id] = {
            ...origin,
            start: Math.max(0, origin.start + snapDx),
            pitch: clampPitch(origin.pitch + dyNotes),
          }
        }
      }
      setNoteDrafts(nextDrafts)
      return
    }

    if (marquee) {
      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + (gridRef.current.scrollLeft || 0)
      const y = e.clientY - rect.top + (gridRef.current.scrollTop || 0)
      setMarquee({ ...marquee, endX: x, endY: y })
      return
    }

    if (!isDrawing || !drawStart) return

    const rect = gridRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + (gridRef.current.scrollLeft || 0)
    const currentBeat = snapValue(x / beatWidth)

    const duration = Math.max(0.25, currentBeat - drawStart.beat)
    setPreviewNote({ ...drawStart, duration })
  }, [noteDrag, clipData, beatWidth, snapValue, minSnap, marquee, isDrawing, drawStart])

  // Handle mouse up on grid
  const handleGridMouseUp = useCallback(() => {
    if (noteDrag && pianoRollClipId) {
      const updates = Object.entries(noteDrafts).map(([noteId, draft]) => ({
        noteId,
        updates: draft,
      }))
      if (updates.length > 0) {
        updateNotesBatch(pianoRollClipId, updates)
      }
      setNoteDrag(null)
      setNoteDrafts({})
    }

    if (marquee && clipData) {
      const left = Math.min(marquee.startX, marquee.endX)
      const right = Math.max(marquee.startX, marquee.endX)
      const top = Math.min(marquee.startY, marquee.endY)
      const bottom = Math.max(marquee.startY, marquee.endY)
      const selected = clipData.notes
        .filter((n) => {
          const view = noteDrafts[n.id] ?? n
          const x = view.start * beatWidth
          const y = (START_NOTE + TOTAL_NOTES - 1 - view.pitch) * NOTE_HEIGHT
          const w = Math.max(2, view.duration * beatWidth)
          const h = NOTE_HEIGHT
          const hitX = x < right && x + w > left
          const hitY = y < bottom && y + h > top
          return hitX && hitY
        })
        .map((n) => n.id)
      setSelectedNotes(new Set(selected))
      setMarquee(null)
    }

    if (isDrawing && drawStart && previewNote && pianoRollClipId) {
      // Add the note
      addNote(pianoRollClipId, {
        pitch: previewNote.pitch,
        start: previewNote.beat,
        duration: Math.max(0.25, previewNote.duration),
        velocity: velocity
      })
    }

    setIsDrawing(false)
    setDrawStart(null)
    setPreviewNote(null)
  }, [
    noteDrag,
    clipData,
    pianoRollClipId,
    noteDrafts,
    updateNotesBatch,
    marquee,
    beatWidth,
    isDrawing,
    drawStart,
    previewNote,
    addNote,
    velocity,
  ])

  const handleNoteMouseDown = useCallback((e: React.MouseEvent, note: Note) => {
    e.stopPropagation()
    if (tool === 'erase' && pianoRollClipId) {
      removeNote(pianoRollClipId, note.id)
      return
    }
    if (tool !== 'select') return
    if (e.shiftKey) {
      const newSelected = new Set(selectedNotes)
      if (newSelected.has(note.id)) newSelected.delete(note.id)
      else newSelected.add(note.id)
      setSelectedNotes(newSelected)
      return
    }
    const selectedNow = selectedNotes.has(note.id) ? Array.from(selectedNotes) : [note.id]
    if (!selectedNotes.has(note.id)) {
      setSelectedNotes(new Set([note.id]))
    }
    const el = e.currentTarget as HTMLDivElement
    const r = el.getBoundingClientRect()
    const edge = e.clientX - r.left > r.width - 6
    const mode: NoteDragState["mode"] = edge && selectedNow.length === 1 ? "resize" : "move"
    const originById: Record<string, DraftNote> = {}
    for (const n of clipData?.notes ?? []) {
      if (selectedNow.includes(n.id)) {
        originById[n.id] = { start: n.start, duration: n.duration, pitch: n.pitch }
      }
    }
    setNoteDrag({
      mode,
      noteIds: selectedNow,
      originById,
      startClientX: e.clientX,
      startClientY: e.clientY,
    })
    playNotePreview(note.pitch)
  }, [clipData?.notes, pianoRollClipId, playNotePreview, removeNote, selectedNotes, tool])

  // Handle note click
  const handleNoteClick = useCallback((e: React.MouseEvent, note: Note) => {
    e.stopPropagation()
    if (tool !== 'select') {
      playNotePreview(note.pitch)
    }
  }, [tool, playNotePreview])

  // Handle piano key click
  const handleKeyClick = useCallback((pitch: number) => {
    playNotePreview(pitch)
  }, [playNotePreview])

  const handleGridScroll = useCallback(() => {
    if (!gridRef.current || !pianoKeysRef.current) return
    pianoKeysRef.current.scrollTop = gridRef.current.scrollTop
  }, [])

  if (!clipData || !trackData) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-1">
        <span className="text-muted-foreground">No clip selected</span>
      </div>
    )
  }

  const totalBeats = clipData.duration

  return (
    <div className="h-full flex flex-col bg-surface-1 border-t border-border">
      {/* Header */}
      <div className="h-8 bg-surface-2 border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Piano Roll
          </span>
          <span className="text-xs text-foreground">- {clipData.name}</span>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1" role="toolbar" aria-label="Piano roll tools">
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${tool === 'select' ? 'bg-surface-3 text-neon-cyan' : 'text-muted-foreground'}`}
            onClick={() => setTool('select')}
            aria-label="Select tool"
            aria-pressed={tool === 'select'}
          >
            <MousePointer2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${tool === 'draw' ? 'bg-surface-3 text-neon-cyan' : 'text-muted-foreground'}`}
            onClick={() => setTool('draw')}
            aria-label="Draw tool"
            aria-pressed={tool === 'draw'}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${tool === 'erase' ? 'bg-surface-3 text-destructive' : 'text-muted-foreground'}`}
            onClick={() => setTool('erase')}
            aria-label="Erase tool"
            aria-pressed={tool === 'erase'}
          >
            <Eraser className="h-3 w-3" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Snap to Grid */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${snapToGrid ? 'bg-surface-3 text-neon-cyan' : 'text-muted-foreground'}`}
            onClick={() => setSnapToGrid(!snapToGrid)}
            aria-label="Snap to grid"
            aria-pressed={snapToGrid}
            title="Snap to Grid (G)"
          >
            <Grid3x3 className="h-3 w-3" />
          </Button>
          <select
            value={String(noteSnap)}
            onChange={(e) => setNoteSnap(Number(e.target.value))}
            className="h-6 bg-surface-1 border border-border rounded px-1 text-[10px] text-foreground"
            title="Note snap grid"
          >
            <option value="0">Off</option>
            <option value="1">1/4</option>
            <option value="0.5">1/8</option>
            <option value="0.25">1/16</option>
            <option value="0.125">1/32</option>
          </select>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Velocity */}
          <div className="flex items-center gap-1" title="Default velocity">
            <Volume2 className="h-3 w-3 text-muted-foreground" />
            <input
              type="range"
              min="1"
              max="127"
              value={velocity}
              onChange={(e) => setVelocity(parseInt(e.target.value))}
              className="w-16 h-1"
              aria-label="Default velocity"
            />
            <span className="text-[10px] text-muted-foreground w-5">{velocity}</span>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
              onClick={() => setStoreZoom(storeZoom - 0.25)}
              disabled={storeZoom <= 0.25}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-muted-foreground w-10 text-center">
              {Math.round(storeZoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
              onClick={() => setStoreZoom(storeZoom + 0.25)}
              disabled={storeZoom >= 4}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={closePianoRoll}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Piano Roll Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Piano Keys */}
        <div ref={pianoKeysRef} className="w-12 flex-shrink-0 bg-surface-2 border-r border-border overflow-y-auto">
          {Array.from({ length: TOTAL_NOTES }).map((_, i) => {
            const pitch = START_NOTE + TOTAL_NOTES - 1 - i
            const noteName = midiNoteToName(pitch)
            const isBlackKey = noteName.includes('#')

            return (
              <div
                key={pitch}
                className={`h-4 flex items-center justify-end pr-1 cursor-pointer transition-colors ${
                  isBlackKey
                    ? 'bg-surface-3 text-muted-foreground hover:bg-surface-3/80'
                    : 'bg-foreground/90 text-background hover:bg-foreground/80'
                }`}
                style={{ height: NOTE_HEIGHT }}
                onClick={() => handleKeyClick(pitch)}
              >
                <span className="text-[9px] font-mono">
                  {noteName.replace('#', '')}
                </span>
              </div>
            )
          })}
        </div>

        {/* Note Grid */}
        <div
          ref={gridRef}
          className="flex-1 overflow-auto relative"
          onScroll={handleGridScroll}
          onMouseDown={handleGridMouseDown}
          onMouseMove={handleGridMouseMove}
          onMouseUp={handleGridMouseUp}
          onMouseLeave={handleGridMouseUp}
        >
          <div
            className="relative"
            style={{
              width: totalBeats * beatWidth,
              height: TOTAL_NOTES * NOTE_HEIGHT
            }}
          >
            {/* Grid Lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={totalBeats * beatWidth}
              height={TOTAL_NOTES * NOTE_HEIGHT}
            >
              {/* Vertical lines (beats) */}
              {Array.from({ length: Math.ceil(totalBeats) + 1 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * beatWidth}
                  y1={0}
                  x2={i * beatWidth}
                  y2={TOTAL_NOTES * NOTE_HEIGHT}
                  stroke={i % 4 === 0 ? 'var(--border)' : 'var(--border)'}
                  strokeWidth={i % 4 === 0 ? 1 : 0.5}
                  opacity={i % 4 === 0 ? 1 : 0.3}
                />
              ))}
              {/* Horizontal lines (notes) */}
              {Array.from({ length: TOTAL_NOTES + 1 }).map((_, i) => {
                const pitch = START_NOTE + TOTAL_NOTES - i
                const noteName = midiNoteToName(pitch)
                const isC = noteName.startsWith('C') && !noteName.includes('#')

                return (
                  <line
                    key={`h-${i}`}
                    x1={0}
                    y1={i * NOTE_HEIGHT}
                    x2={totalBeats * beatWidth}
                    y2={i * NOTE_HEIGHT}
                    stroke="var(--border)"
                    strokeWidth={isC ? 1 : 0.5}
                    opacity={isC ? 1 : 0.3}
                  />
                )
              })}
            </svg>

            {/* Black key rows (darker background) */}
            {Array.from({ length: TOTAL_NOTES }).map((_, i) => {
              const pitch = START_NOTE + TOTAL_NOTES - 1 - i
              const noteName = midiNoteToName(pitch)
              const isBlackKey = noteName.includes('#')

              if (!isBlackKey) return null

              return (
                <div
                  key={`row-${pitch}`}
                  className="absolute left-0 right-0 bg-black/20 pointer-events-none"
                  style={{
                    top: i * NOTE_HEIGHT,
                    height: NOTE_HEIGHT
                  }}
                />
              )
            })}

            {/* Notes */}
            {clipData.notes.map((note) => {
              const view = noteAt(note)
              const y = (START_NOTE + TOTAL_NOTES - 1 - view.pitch) * NOTE_HEIGHT
              const x = view.start * beatWidth
              const width = view.duration * beatWidth
              const isSelected = selectedNotes.has(note.id)

              return (
                <div
                  key={note.id}
                  className={`absolute rounded-sm cursor-pointer transition-all ${
                    isSelected ? 'ring-1 ring-white' : ''
                  }`}
                  style={{
                    left: x,
                    top: y + 1,
                    width: width - 1,
                    height: NOTE_HEIGHT - 2,
                    backgroundColor: trackData.color,
                    opacity: note.velocity / 127
                  }}
                  onMouseDown={(e) => handleNoteMouseDown(e, note)}
                  onClick={(e) => handleNoteClick(e, note)}
                >
                  {/* Velocity indicator */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-black/30"
                    style={{
                      height: `${100 - (note.velocity / 127) * 100}%`
                    }}
                  />
                </div>
              )
            })}

            {marquee && (
              <div
                className="absolute border border-neon-cyan/80 bg-neon-cyan/10 pointer-events-none"
                style={{
                  left: Math.min(marquee.startX, marquee.endX),
                  top: Math.min(marquee.startY, marquee.endY),
                  width: Math.abs(marquee.endX - marquee.startX),
                  height: Math.abs(marquee.endY - marquee.startY),
                }}
              />
            )}

            {/* Preview Note (while drawing) */}
            {previewNote && (
              <div
                className="absolute rounded-sm pointer-events-none opacity-60"
                style={{
                  left: previewNote.beat * beatWidth,
                  top: (START_NOTE + TOTAL_NOTES - 1 - previewNote.pitch) * NOTE_HEIGHT + 1,
                  width: previewNote.duration * beatWidth - 1,
                  height: NOTE_HEIGHT - 2,
                  backgroundColor: trackData.color,
                  border: `1px dashed ${trackData.color}`
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Velocity Editor */}
      <div className="h-16 bg-surface-2 border-t border-border flex">
        <div className="w-12 flex-shrink-0 flex items-center justify-center text-[10px] text-muted-foreground">
          VEL
        </div>
        <div className="flex-1 relative overflow-hidden">
          {clipData.notes.map((note) => {
            const x = (note.start / totalBeats) * 100
            const width = (note.duration / totalBeats) * 100
            const height = (note.velocity / 127) * 100

            return (
              <div
                key={note.id}
                className="absolute bottom-0 rounded-t-sm"
                style={{
                  left: `${x}%`,
                  width: `${Math.max(width, 0.5)}%`,
                  height: `${height}%`,
                  backgroundColor: trackData.color,
                  opacity: 0.8
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
