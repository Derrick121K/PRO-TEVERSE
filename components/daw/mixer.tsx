"use client"

import { useState, useEffect, useRef } from "react"
import { useDAWStore, type EffectType, type TrackEnvelope } from "@/lib/daw-store"
import { audioEngine } from "@/lib/audio-engine"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, Plus, X, Power, ChevronUp, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
const EFFECT_TYPES = [
  { type: 'reverb' as const, name: 'Reverb', color: '#00d4ff' },
  { type: 'delay' as const, name: 'Delay', color: '#8b5cf6' },
  { type: 'eq' as const, name: 'EQ', color: '#10b981' },
  { type: 'compressor' as const, name: 'Compressor', color: '#f59e0b' },
  { type: 'filter' as const, name: 'Filter', color: '#ec4899' },
  { type: 'distortion' as const, name: 'Distortion', color: '#ef4444' },
  { type: 'chorus' as const, name: 'Chorus', color: '#22c55e' },
  { type: 'phaser' as const, name: 'Phaser', color: '#a3e635' },
  { type: 'tremolo' as const, name: 'Tremolo', color: '#f472b6' },
] as const

export function Mixer() {
  const {
    tracks,
    masterVolume,
    setTrackVolume,
    setTrackPan,
    toggleMute,
    toggleSolo,
    setMasterVolume,
    setTrackEnvelope,
    addEffect,
    removeEffect,
    toggleEffect,
    updateEffectParam,
    reorderTrackEffects,
    selectedTrackId,
    selectTrack
  } = useDAWStore()

  return (
    <div className="h-full flex flex-col bg-surface-1 border-l border-border">
      {/* Mute: channel silent. Solo: if any S is on, only solo tracks (and master) are heard â€” see `audio-engine` rebuild. */}
      <div className="h-8 bg-surface-2 border-b border-border flex items-center px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Mixer
        </span>
      </div>

      {/* Mixer Content */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full min-w-max p-2 gap-1.5">
          {/* Track Channels */}
          {tracks.map((track, trackIndex) => (
            <ChannelStrip
              key={track.id}
              track={track}
              index={trackIndex + 1}
              isSelected={selectedTrackId === track.id}
              onSelect={() => selectTrack(track.id)}
              onVolumeChange={(v) => setTrackVolume(track.id, v)}
              onPanChange={(p) => setTrackPan(track.id, p)}
              onMuteToggle={() => toggleMute(track.id)}
              onSoloToggle={() => toggleSolo(track.id)}
              onAddEffect={(type) => addEffect(track.id, type)}
              onRemoveEffect={(effectId) => removeEffect(track.id, effectId)}
              onToggleEffect={(effectId) => toggleEffect(track.id, effectId)}
              onUpdateEffectParam={(effectId, param, value) => 
                updateEffectParam(track.id, effectId, param, value)
              }
              onMoveEffect={(from, to) => reorderTrackEffects(track.id, from, to)}
              onEnvelopeChange={(e) => setTrackEnvelope(track.id, e)}
              envelope={track.envelope}
            />
          ))}

          {/* Master Channel */}
          <div className="w-[4.6rem] flex-shrink-0 bg-surface-2 rounded-md p-1.5 flex flex-col border border-neon-cyan/30">
            <div className="text-xs font-medium text-neon-cyan text-center mb-2 uppercase">
              Master
            </div>

            {/* Level Meter */}
            <div className="flex-1 flex justify-center gap-1 mb-2">
              <LevelMeter level={masterVolume * 0.8} color="#00d4ff" />
              <LevelMeter level={masterVolume * 0.75} color="#00d4ff" />
            </div>

            {/* Volume Fader */}
            <div className="flex flex-col items-center gap-1">
              <div className="h-32 flex items-center">
                <Slider
                  orientation="vertical"
                  value={[masterVolume * 100]}
                  onValueChange={([v]) => setMasterVolume(v / 100)}
                  max={100}
                  step={1}
                  className="h-40"
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ChannelStripProps {
  index: number
  track: {
    id: string
    name: string
    color: string
    type: "midi" | "audio"
    volume: number
    pan: number
    muted: boolean
    solo: boolean
    effects: Array<{
      id: string
      type: string
      enabled: boolean
      params: Record<string, number>
    }>
  }
  isSelected: boolean
  onSelect: () => void
  onVolumeChange: (volume: number) => void
  onPanChange: (pan: number) => void
  onMuteToggle: () => void
  onSoloToggle: () => void
  onAddEffect: (type: EffectType) => void
  onRemoveEffect: (effectId: string) => void
  onToggleEffect: (effectId: string) => void
  onUpdateEffectParam: (effectId: string, param: string, value: number) => void
  onMoveEffect: (fromIndex: number, toIndex: number) => void
  onEnvelopeChange: (e: TrackEnvelope) => void
  envelope?: TrackEnvelope
}

function ChannelStrip({
  index,
  track,
  isSelected,
  onSelect,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onAddEffect,
  onRemoveEffect,
  onToggleEffect,
  onUpdateEffectParam,
  onMoveEffect,
  onEnvelopeChange,
  envelope
}: ChannelStripProps) {
  const env: TrackEnvelope = envelope ?? { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.3 }

  return (
    <div
      className={`w-[4.6rem] flex-shrink-0 bg-surface-2 rounded-md p-1.5 flex flex-col cursor-pointer transition-all border border-border/70 ${
        isSelected ? 'ring-1 ring-neon-cyan' : ''
      }`}
      onClick={onSelect}
    >
      {/* Track Color & Name */}
      <div className="mb-1 text-[9px] text-muted-foreground font-mono uppercase tracking-wide">
        Insert {index.toString().padStart(2, "0")}
      </div>
      <div className="flex items-center gap-1 mb-2">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: track.color }}
        />
        <span className="text-[11px] text-foreground truncate font-medium">{track.name}</span>
      </div>

      {/* Effects Slots */}
      <div className="space-y-1 mb-2">
        <div className="text-[8px] font-mono uppercase tracking-wide text-muted-foreground/80 px-0.5">
          FX Slots
        </div>
        <div className="max-h-28 overflow-y-auto space-y-1">
        {track.effects.map((effect, fxIndex) => {
          const effectInfo = EFFECT_TYPES.find(e => e.type === effect.type)
          return (
            <div
              key={effect.id}
              className={`flex items-center justify-between px-1 py-0.5 rounded text-[9px] ${
                effect.enabled ? 'bg-surface-3' : 'bg-surface-3/50 opacity-50'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-0">
                <button
                  type="button"
                  className="p-0 leading-none text-muted-foreground hover:text-foreground"
                  onClick={() => onMoveEffect(fxIndex, Math.max(0, fxIndex - 1))}
                >
                  <ChevronUp className="h-2.5 w-2.5" />
                </button>
                <button
                  type="button"
                  className="p-0 leading-none text-muted-foreground hover:text-foreground"
                  onClick={() => onMoveEffect(fxIndex, Math.min(track.effects.length - 1, fxIndex + 1))}
                >
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </div>
              <span className="flex-1 text-center" style={{ color: effectInfo?.color }}>{effectInfo?.name}</span>
              <div className="flex items-center gap-0.5">
                <button
                  className="p-0.5 hover:bg-surface-1 rounded"
                  onClick={() => onToggleEffect(effect.id)}
                >
                  <Power className={`h-2.5 w-2.5 ${effect.enabled ? 'text-neon-cyan' : 'text-muted-foreground'}`} />
                </button>
                <button
                  className="p-0.5 hover:bg-surface-1 rounded"
                  onClick={() => onRemoveEffect(effect.id)}
                >
                  <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>
          )
        })}
        </div>

        {/* Add Effect */}
        {track.effects.length < 6 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-full flex items-center justify-center gap-1 px-1 py-0.5 rounded text-[9px] text-muted-foreground hover:bg-surface-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-2.5 w-2.5" />
                FX
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-surface-2 border-border">
              {EFFECT_TYPES.map((effect) => (
                <DropdownMenuItem
                  key={effect.type}
                  className="text-foreground hover:bg-surface-3 cursor-pointer text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddEffect(effect.type)
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: effect.color }}
                  />
                  {effect.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Level Meter */}
      <div className="flex-1 flex justify-center gap-1 mb-2 min-h-[96px]">
        <LevelMeter level={track.muted ? 0 : track.volume * 0.8} color={track.color} />
        <LevelMeter level={track.muted ? 0 : track.volume * 0.75} color={track.color} />
      </div>

      {track.type === "midi" && (
        <div
          className="mb-2 space-y-0.5 text-[8px] text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[7px] uppercase text-center text-neon-cyan/80">ADSR</div>
          {(["attack", "decay", "sustain", "release"] as const).map((k) => (
            <div key={k} className="flex items-center gap-0.5">
              <span className="w-3">{k[0]}</span>
              <input
                type="range"
                min={k === "sustain" ? "0" : "0.001"}
                max={k === "sustain" ? "1" : "2"}
                step="0.01"
                value={env[k]}
                onChange={(e) => onEnvelopeChange({ ...env, [k]: parseFloat(e.target.value) || 0 })}
                className="flex-1 h-1 min-w-0 accent-neon-cyan"
              />
            </div>
          ))}
        </div>
      )}

      {/* Pan Knob */}
      <div className="flex flex-col items-center mb-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-[9px] text-muted-foreground mb-1">Pan</span>
        <input
          type="range"
          min="-100"
          max="100"
          value={track.pan * 100}
          onChange={(e) => onPanChange(parseInt(e.target.value) / 100)}
          className="w-full h-1 accent-[var(--neon-cyan)]"
        />
        <span className="text-[9px] text-muted-foreground">
          {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(Math.round(track.pan * 100))}` : `R${Math.round(track.pan * 100)}`}
        </span>
      </div>

      {/* Volume Fader */}
      <div className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <div className="h-40 flex items-center">
          <Slider
            orientation="vertical"
            value={[track.volume * 100]}
            onValueChange={([v]) => onVolumeChange(v / 100)}
            max={100}
            step={1}
            className="h-40"
          />
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">
          {Math.round(track.volume * 100)}%
        </span>
      </div>

      {/* Mute/Solo */}
      <div className="flex justify-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          className={`h-5 w-7 p-0 text-[9px] font-bold ${
            track.muted ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={onMuteToggle}
        >
          M
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-5 w-7 p-0 text-[9px] font-bold ${
            track.solo ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={onSoloToggle}
        >
          S
        </Button>
      </div>
    </div>
  )
}

function LevelMeter({ level }: { level: number; color: string }) {
  const [displayLevel, setDisplayLevel] = useState(0)

  useEffect(() => {
    // Animate towards target level
    const targetLevel = Math.max(0, Math.min(1, level))
    const interval = setInterval(() => {
      setDisplayLevel((prev) => {
        const diff = targetLevel - prev
        if (Math.abs(diff) < 0.01) return targetLevel
        return prev + diff * 0.2
      })
    }, 50)

    return () => clearInterval(interval)
  }, [level])

  const segments = 20
  const activeSegments = Math.round(displayLevel * segments)

  return (
    <div className="w-2 h-full bg-surface-3 rounded-sm overflow-hidden flex flex-col-reverse">
      {Array.from({ length: segments }).map((_, i) => {
        const isActive = i < activeSegments
        const isRed = i >= segments - 3
        const isYellow = i >= segments - 8 && i < segments - 3

        let segmentColor = '#8fe85b'
        if (isRed) segmentColor = '#ff5f5f'
        else if (isYellow) segmentColor = '#f5c24d'

        return (
          <div
            key={i}
            className="flex-1 mx-px my-px rounded-sm transition-colors duration-75"
            style={{
              backgroundColor: isActive ? segmentColor : 'transparent',
              opacity: isActive ? 1 : 0.2
            }}
          />
        )
      })}
    </div>
  )
}
