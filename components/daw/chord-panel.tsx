"use client"

import { useState, useMemo, useCallback } from "react"
import { useDAWStore, Note } from "@/lib/daw-store"
import { audioEngine } from "@/lib/audio-engine"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Trash2,
  Play,
  Volume2,
  Music,
  Guitar,
  Piano,
  ChevronDown,
  ChevronRight,
  Layers
} from "lucide-react"

const CHORD_TYPES = [
  { name: 'Major', intervals: [0, 4, 7], symbol: '' },
  { name: 'Minor', intervals: [0, 3, 7], symbol: 'm' },
  { name: 'Diminished', intervals: [0, 3, 6], symbol: 'dim' },
  { name: 'Augmented', intervals: [0, 4, 8], symbol: 'aug' },
  { name: 'Major 7th', intervals: [0, 4, 7, 11], symbol: 'maj7' },
  { name: 'Minor 7th', intervals: [0, 3, 7, 10], symbol: 'm7' },
  { name: 'Dominant 7th', intervals: [0, 4, 7, 10], symbol: '7' },
  { name: 'Sus2', intervals: [0, 2, 7], symbol: 'sus2' },
  { name: 'Sus4', intervals: [0, 5, 7], symbol: 'sus4' },
  { name: 'Add9', intervals: [0, 4, 7, 14], symbol: 'add9' },
]

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const KEY_SIGNATURES = [
  { name: 'C Major', root: 0, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'G Major', root: 7, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'D Major', root: 2, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'A Major', root: 9, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'E Major', root: 4, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'B Major', root: 11, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'F Major', root: 5, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Bb Major', root: 10, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'A Minor', root: 9, scale: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'E Minor', root: 4, scale: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'B Minor', root: 11, scale: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'F# Minor', root: 6, scale: [0, 2, 3, 5, 7, 8, 10] },
]

interface Chord {
  id: string
  root: number
  type: number
  octave: number
  duration: number
  velocity: number
  inversion: number
}

export function ChordPanel() {
  const { pianoRollClipId, tracks, addNote } = useDAWStore()
  
  const [chords, setChords] = useState<Chord[]>([])
  const [selectedRoot, setSelectedRoot] = useState(0)
  const [selectedChordType, setSelectedChordType] = useState(0)
  const [selectedOctave, setSelectedOctave] = useState(4)
  const [chordDuration, setChordDuration] = useState(4)
  const [chordVelocity, setChordVelocity] = useState(80)
  const [keySignature, setKeySignature] = useState('C Major')
  const [playChordsOnAdd, setPlayChordsOnAdd] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>('chords')

  const selectedKey = useMemo(() => {
    return KEY_SIGNATURES.find(k => k.name === keySignature) || KEY_SIGNATURES[0]
  }, [keySignature])

  const getChordNotes = useCallback((chord: Chord): number[] => {
    const chordType = CHORD_TYPES[chord.type]
    const baseNote = chord.root + (chord.octave * 12)
    
    let notes = chordType.intervals.map(interval => baseNote + interval)
    
    // Apply inversion
    if (chord.inversion > 0) {
      for (let i = 0; i < chord.inversion; i++) {
        const note = notes.shift()!
        notes.push(note + 12)
      }
    }
    
    return notes
  }, [])

  const addChord = (startBeat: number) => {
    const newChord: Chord = {
      id: `chord-${Date.now()}`,
      root: selectedRoot,
      type: selectedChordType,
      octave: selectedOctave,
      duration: chordDuration,
      velocity: chordVelocity,
      inversion: 0
    }

    setChords(prev => [...prev, newChord])

     // Add notes to track if clip selected
     if (pianoRollClipId) {
       const notes = getChordNotes(newChord)
       notes.forEach((pitch, idx) => {
         addNote(pianoRollClipId, {
           pitch,
           start: startBeat,
           duration: chordDuration,
           velocity: chordVelocity
         })
       })
     }
  }

  const removeChord = (id: string) => {
    setChords(prev => prev.filter(c => c.id !== id))
  }

  const clearAllChords = () => {
    setChords([])
  }

  const previewChord = () => {
    const tempChord: Chord = {
      id: 'preview',
      root: selectedRoot,
      type: selectedChordType,
      octave: selectedOctave,
      duration: 1,
      velocity: chordVelocity,
      inversion: 0
    }
    const notes = getChordNotes(tempChord)
    
    audioEngine.initialize()
    notes.forEach((pitch, idx) => {
      setTimeout(() => {
        audioEngine.playNote(`chord-${idx}`, pitch, 0.5, chordVelocity, undefined, undefined, 'pad')
      }, idx * 30)
    })
  }

  const getChordName = (chord: Chord): string => {
    const rootName = NOTE_NAMES[chord.root]
    const chordType = CHORD_TYPES[chord.type]
    return `${rootName}${chordType.symbol}`
  }

  // Generate chord progression suggestions based on key
  const suggestedProgressions = useMemo(() => {
    const progressions = [
      { name: 'I-IV-V-I', degrees: [0, 3, 4, 0] },
      { name: 'I-V-vi-IV', degrees: [0, 4, 5, 3] },
      { name: 'ii-V-I', degrees: [1, 4, 0] },
      { name: 'I-vi-IV-V', degrees: [0, 5, 3, 4] },
      { name: 'vi-IV-I-V', degrees: [5, 3, 0, 4] },
    ]
    
    return progressions.map(prog => ({
      name: prog.name,
      chords: prog.degrees.map((deg, idx) => {
        const scaleNote = selectedKey.scale[deg] || 0
        return {
          root: scaleNote % 12,
          type: deg % 7 === 1 || deg % 7 === 4 ? 0 : 1, // Major for I, IV, V; Minor for ii, iii, vi
          duration: 4
        }
      })
    }))
  }, [selectedKey])

  const applyProgression = (progression: typeof suggestedProgressions[0]) => {
    let currentBeat = 0
    const newChords: Chord[] = []
    
    progression.chords.forEach((chordData, idx) => {
      const chord: Chord = {
        id: `prog-${Date.now()}-${idx}`,
        root: chordData.root,
        type: chordData.type,
        octave: selectedOctave,
        duration: chordData.duration,
        velocity: chordVelocity,
        inversion: 0
      }
      newChords.push(chord)
      
       if (pianoRollClipId) {
         const notes = getChordNotes(chord)
         notes.forEach((pitch, noteIdx) => {
           addNote(pianoRollClipId, {
             pitch,
             start: currentBeat,
             duration: chordData.duration,
             velocity: chordVelocity
           })
         })
       }
      
      currentBeat += chordData.duration
    })
    
    setChords(prev => [...prev, ...newChords])
  }

  return (
    <div className="h-full flex flex-col bg-surface-1">
      {/* Header */}
      <div className="h-10 bg-surface-2 border-b border-border flex items-center px-3">
        <Guitar className="h-4 w-4 text-neon-purple mr-2" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex-1">
          Chord Builder
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Root Note Selection */}
        <div className="space-y-2">
          <Label className="text-[10px] text-muted-foreground uppercase">Root Note</Label>
          <div className="grid grid-cols-4 gap-1">
            {NOTE_NAMES.map((note, idx) => (
              <button
                key={note}
                className={`h-7 rounded text-xs font-medium transition-colors ${
                  selectedRoot === idx
                    ? 'bg-neon-purple text-background'
                    : 'bg-surface-2 text-muted-foreground hover:bg-surface-3'
                }`}
                onClick={() => setSelectedRoot(idx)}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* Chord Type Selection */}
        <div className="space-y-2">
          <Label className="text-[10px] text-muted-foreground uppercase">Chord Type</Label>
          <select
            className="w-full h-8 bg-surface-2 border border-border rounded px-2 text-xs text-foreground"
            value={selectedChordType}
            onChange={(e) => setSelectedChordType(parseInt(e.target.value))}
          >
            {CHORD_TYPES.map((type, idx) => (
              <option key={idx} value={idx}>
                {NOTE_NAMES[selectedRoot]}{type.symbol} - {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Octave and Duration */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Octave: {selectedOctave}</Label>
            <Slider
              value={[selectedOctave]}
              onValueChange={([v]) => setSelectedOctave(v)}
              min={2}
              max={7}
              step={1}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Duration: {chordDuration}</Label>
            <Slider
              value={[chordDuration]}
              onValueChange={([v]) => setChordDuration(v)}
              min={1}
              max={16}
              step={1}
            />
          </div>
        </div>

        {/* Velocity */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Velocity: {chordVelocity}</Label>
          <Slider
            value={[chordVelocity]}
            onValueChange={([v]) => setChordVelocity(v)}
            min={30}
            max={127}
            step={1}
          />
        </div>

        {/* Preview and Add Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={previewChord}
          >
            <Play className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 bg-neon-purple"
            onClick={() => addChord(0)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Chord
          </Button>
        </div>

        {/* Key Signature */}
        <div className="space-y-2">
          <Label className="text-[10px] text-muted-foreground uppercase">Key Signature</Label>
          <select
            className="w-full h-8 bg-surface-2 border border-border rounded px-2 text-xs text-foreground"
            value={keySignature}
            onChange={(e) => setKeySignature(e.target.value)}
          >
            {KEY_SIGNATURES.map((key) => (
              <option key={key.name} value={key.name}>{key.name}</option>
            ))}
          </select>
        </div>

        {/* Chord Progressions */}
        <div className="space-y-2">
          <Label className="text-[10px] text-muted-foreground uppercase">Progressions</Label>
          <div className="space-y-1">
            {suggestedProgressions.map((prog) => (
              <button
                key={prog.name}
                className="w-full flex items-center justify-between px-2 py-1.5 bg-surface-2 rounded text-xs hover:bg-surface-3"
                onClick={() => applyProgression(prog)}
              >
                <span className="text-foreground">{prog.name}</span>
                <span className="text-muted-foreground">
                  {prog.chords.map(c => NOTE_NAMES[c.root] + (c.type === 1 ? 'm' : '')).join('-')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Chords */}
        {chords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground uppercase">Chords ({chords.length})</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-xs text-destructive"
                onClick={clearAllChords}
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-1">
              {chords.map((chord, idx) => (
                <div
                  key={chord.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-surface-2 rounded"
                >
                  <span className="text-xs font-mono text-neon-purple w-8">{idx + 1}</span>
                  <span className="text-xs font-medium text-foreground flex-1">{getChordName(chord)}</span>
                  <span className="text-[10px] text-muted-foreground">{chord.duration} beats</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeChord(chord.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FL Studio Style Chord Button */}
        <Button
          variant="outline"
          className="w-full h-10 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
          onClick={() => addChord(0)}
        >
          <Layers className="h-4 w-4 mr-2 text-orange-500" />
          <span className="text-xs">Piano Roll (FL Style)</span>
        </Button>
      </div>
    </div>
  )
}