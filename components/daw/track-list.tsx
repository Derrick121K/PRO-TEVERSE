"use client"

import Link from "next/link"
import { useDAWStore } from "@/lib/daw-store"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Volume2,
  VolumeX,
  Plus,
  Music,
  Mic,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const TRACK_HEIGHT = 56 // px (closer to FL-style playlist lane height)

export function TrackList() {
  const {
    tracks,
    selectedTrackId,
    selectTrack,
    toggleMute,
    toggleSolo,
    setTrackVolume,
    addTrack,
    removeTrack,
    setDockOpen,
    addAudioClipFromFile,
  } = useDAWStore()

  return (
    <div className="w-full h-full bg-surface-1 border-r border-border flex flex-col">
      {/* Header */}
      <div className="h-8 bg-surface-2 border-b border-border flex items-center justify-between px-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tracks
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-neon-cyan">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface-2 border-border">
            <DropdownMenuItem
              className="text-foreground hover:bg-surface-3 cursor-pointer"
              onClick={() => addTrack("midi")}
            >
              <Music className="h-4 w-4 mr-2 text-neon-cyan" />
              Add MIDI Track
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-foreground hover:bg-surface-3 cursor-pointer"
              onClick={() => addTrack("audio")}
            >
              <Mic className="h-4 w-4 mr-2 text-neon-pink" />
              Add Audio Track
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {tracks.length === 0 && (
        <div className="p-3 m-2 rounded-lg border border-dashed border-border bg-surface-2/50 text-xs space-y-2">
          <p className="text-muted-foreground font-medium">Empty project</p>
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => {
              addTrack("midi", "MIDI 1", "lead")
              setDockOpen("browser", true)
            }}
          >
            Add MIDI track & open browser
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Drag a .wav / .mp3 onto an audio track row to import.{" "}
            <Link href="/export" className="text-neon-cyan hover:underline">
              Export
            </Link>{" "}
            when ready.
          </p>
        </div>
      )}

      {/* Track List */}
      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`group border-b border-border cursor-pointer transition-colors ${
              selectedTrackId === track.id ? "bg-surface-2" : "hover:bg-surface-2/50"
            }`}
            style={{ height: TRACK_HEIGHT }}
            onClick={() => selectTrack(track.id)}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "copy"
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const f = e.dataTransfer.files?.[0]
              if (!f?.type?.startsWith("audio/")) return
              void addAudioClipFromFile(track.id, f)
            }}
          >
            <div className="h-full p-2 flex flex-col justify-between">
              {/* Track Header */}
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: track.color }}
                />
                <span className="text-sm text-foreground truncate flex-1">
                  {track.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTrack(track.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Track Controls */}
              <div className="flex items-center gap-1">
                {/* Mute/Solo */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-5 w-7 p-0 text-[10px] font-bold ${
                    track.muted
                      ? "bg-destructive/20 text-destructive"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleMute(track.id)
                  }}
                >
                  M
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-5 w-7 p-0 text-[10px] font-bold ${
                    track.solo
                      ? "bg-neon-cyan/20 text-neon-cyan"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSolo(track.id)
                  }}
                >
                  S
                </Button>

                {/* Volume */}
                <div className="flex-1 flex items-center gap-1 ml-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTrackVolume(track.id, track.volume > 0 ? 0 : 0.8)
                    }}
                  >
                    {track.muted || track.volume === 0 ? (
                      <VolumeX className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </Button>
                  <Slider
                    value={[track.volume * 100]}
                    onValueChange={([value]) => setTrackVolume(track.id, value / 100)}
                    max={100}
                    step={1}
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { TRACK_HEIGHT }
