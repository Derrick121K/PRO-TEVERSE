"use client"

import { useEffect, useState, useCallback } from "react"
import { useDAWStore } from "@/lib/daw-store"
import { audioEngine } from "@/lib/audio-engine"
import {
  isWebMidiSupported,
  requestMIDIAccess,
  listInputs,
  parseNoteMessage,
  watchInput,
} from "@/lib/web-midi"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Cable } from "lucide-react"

export function MidiInControl() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [inputId, setInputId] = useState<string>("")
  const [inputs, setInputs] = useState<MIDIInput[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const refresh = useCallback(async () => {
    if (!isWebMidiSupported()) return
    await requestMIDIAccess()
    const ins = listInputs()
    setInputs(ins)
    if (!inputId && ins[0]) setInputId(ins[0].id)
  }, [inputId])

  useEffect(() => {
    if (!open) return
    void refresh()
  }, [open, refresh])

  useEffect(() => {
    if (!open || !inputId) return
    const inp = inputs.find((i) => i.id === inputId)
    if (!inp) return
    const off = watchInput(inp, (data) => {
      const msg = parseNoteMessage(data)
      if (!msg || msg.type !== "on") return
      void audioEngine.initialize()
      const state = useDAWStore.getState()
      const tid = state.selectedTrackId ?? state.tracks[0]?.id
      if (!tid) return
      const track = state.tracks.find((t) => t.id === tid)
      if (!track) return

      if (
        state.isRecording &&
        state.pianoRollOpen &&
        state.pianoRollClipId
      ) {
        const clip = track.clips.find((c) => c.id === state.pianoRollClipId)
        if (clip) {
          const rel = Math.max(0, state.currentBeat - clip.start)
          state.addNote(state.pianoRollClipId, {
            pitch: msg.note,
            start: rel,
            duration: 0.25,
            velocity: msg.velocity,
          })
          return
        }
      }
      audioEngine.playNote(
        tid,
        msg.note,
        0.18,
        msg.velocity,
        undefined,
        undefined,
        track.instrument
      )
    })
    return off
  }, [open, inputId, inputs])

  // SSR / first paint: `navigator` is missing on the server; render a stable shell (no isWebMidiSupported yet).
  if (!mounted) {
    return (
      <div
        className="flex h-8 min-w-8 items-center border-r border-border pr-3 mr-1 shrink-0"
        aria-hidden
      />
    )
  }

  if (!isWebMidiSupported()) {
    return (
      <span className="text-[10px] text-muted-foreground hidden lg:inline max-w-[120px] truncate">
        MIDI in: not supported
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1 border-r border-border pr-3 mr-1">
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 px-2 ${open ? "bg-surface-2 text-neon-cyan" : "text-muted-foreground"}`}
        onClick={() => setOpen(!open)}
        title="Web MIDI input"
      >
        <Cable className="h-4 w-4" />
      </Button>
      {open && (
        <Select value={inputId} onValueChange={setInputId}>
          <SelectTrigger className="h-7 w-[130px] text-[10px] bg-surface-2 border-border">
            <SelectValue placeholder="Device" />
          </SelectTrigger>
          <SelectContent>
            {inputs.map((i) => (
              <SelectItem key={i.id} value={i.id} className="text-xs">
                {i.name || i.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
