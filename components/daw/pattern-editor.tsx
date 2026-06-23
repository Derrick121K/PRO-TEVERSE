"use client"

import { useState, useMemo } from "react"
import { useDAWStore, Note } from "@/lib/daw-store"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Layers,
  Zap,
  Music,
  Drum
} from "lucide-react"

interface PatternData {
  name: string
  notes: Note[]
  color: string
}

interface Pattern {
  id: string
  name: string
  length: number
  tracks: PatternTrack[]
}

interface PatternTrack {
  name: string
  type: 'melody' | 'drums' | 'bass' | 'chords'
  color: string
  steps: boolean[]
  velocities: number[]
}

const PATTERN_LENGTHS = [4, 8, 16, 32, 64]

export function PatternEditor() {
  const { tracks, addTrack, addClip, isPlaying, play, pause } = useDAWStore()
  
  const [patterns, setPatterns] = useState<Pattern[]>([
    {
      id: 'pattern-1',
      name: 'Init',
      length: 16,
      tracks: [
        { name: 'Drums', type: 'drums', color: '#00d4ff', steps: Array(16).fill(false).map((_, i) => i % 4 === 0), velocities: Array(16).fill(100) },
        { name: 'Bass', type: 'bass', color: '#8b5cf6', steps: Array(16).fill(false).map((_, i) => i % 8 === 0), velocities: Array(16).fill(90) },
        { name: 'Lead', type: 'melody', color: '#ec4899', steps: Array(16).fill(false), velocities: Array(16).fill(80) },
      ]
    }
  ])
  
  const [selectedPatternId, setSelectedPatternId] = useState('pattern-1')
  const [selectedTrack, setSelectedTrack] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [copyData, setCopyData] = useState<boolean[] | null>(null)

  const selectedPattern = useMemo(() => {
    return patterns.find(p => p.id === selectedPatternId) || patterns[0]
  }, [patterns, selectedPatternId])

  const currentTrack = selectedPattern?.tracks[selectedTrack]

  const toggleStep = (stepIndex: number) => {
    setPatterns(prev => prev.map(pattern => {
      if (pattern.id !== selectedPatternId) return pattern
      
      return {
        ...pattern,
        tracks: pattern.tracks.map((track, tIdx) => {
          if (tIdx !== selectedTrack) return track
          
          const newSteps = [...track.steps]
          newSteps[stepIndex] = !newSteps[stepIndex]
          
          return { ...track, steps: newSteps }
        })
      }
    }))
  }

  const setStepVelocity = (stepIndex: number, velocity: number) => {
    setPatterns(prev => prev.map(pattern => {
      if (pattern.id !== selectedPatternId) return pattern
      
      return {
        ...pattern,
        tracks: pattern.tracks.map((track, tIdx) => {
          if (tIdx !== selectedTrack) return track
          
          const newVelocities = [...track.velocities]
          newVelocities[stepIndex] = velocity
          
          return { ...track, velocities: newVelocities }
        })
      }
    }))
  }

  const addNewPattern = () => {
    const newPattern: Pattern = {
      id: `pattern-${Date.now()}`,
      name: `Pattern ${patterns.length + 1}`,
      length: 16,
      tracks: [
        { name: 'Drums', type: 'drums', color: '#00d4ff', steps: Array(16).fill(false), velocities: Array(16).fill(100) },
        { name: 'Bass', type: 'bass', color: '#8b5cf6', steps: Array(16).fill(false), velocities: Array(16).fill(90) },
        { name: 'Lead', type: 'melody', color: '#ec4899', steps: Array(16).fill(false), velocities: Array(16).fill(80) },
      ]
    }
    
    setPatterns(prev => [...prev, newPattern])
    setSelectedPatternId(newPattern.id)
  }

  const deletePattern = (id: string) => {
    if (patterns.length <= 1) return
    setPatterns(prev => prev.filter(p => p.id !== id))
    if (selectedPatternId === id) {
      setSelectedPatternId(patterns[0].id)
    }
  }

  const duplicatePattern = () => {
    const copy = { ...selectedPattern, id: `pattern-${Date.now()}`, name: `${selectedPattern.name} (copy)` }
    setPatterns(prev => [...prev, copy])
  }

  const copyTrack = () => {
    if (currentTrack) {
      setCopyData([...currentTrack.steps])
    }
  }

  const pasteTrack = () => {
    if (!copyData || !currentTrack) return
    
    setPatterns(prev => prev.map(pattern => {
      if (pattern.id !== selectedPatternId) return pattern
      
      return {
        ...pattern,
        tracks: pattern.tracks.map((track, tIdx) => {
          if (tIdx !== selectedTrack) return track
          
          return { ...track, steps: [...copyData] }
        })
      }
    }))
  }

  const randomizeTrack = () => {
    setPatterns(prev => prev.map(pattern => {
      if (pattern.id !== selectedPatternId) return pattern
      
      return {
        ...pattern,
        tracks: pattern.tracks.map((track, tIdx) => {
          if (tIdx !== selectedTrack) return track
          
          const newSteps = track.steps.map(() => Math.random() > 0.5)
          const newVelocities = track.velocities.map(() => 60 + Math.floor(Math.random() * 60))
          
          return { ...track, steps: newSteps, velocities: newVelocities }
        })
      }
    }))
  }

  const clearTrack = () => {
    setPatterns(prev => prev.map(pattern => {
      if (pattern.id !== selectedPatternId) return pattern
      
      return {
        ...pattern,
        tracks: pattern.tracks.map((track, tIdx) => {
          if (tIdx !== selectedTrack) return track
          
          return { ...track, steps: track.steps.map(() => false) }
        })
      }
    }))
  }

  const shiftTrack = (direction: 'left' | 'right') => {
    setPatterns(prev => prev.map(pattern => {
      if (pattern.id !== selectedPatternId) return pattern
      
      return {
        ...pattern,
        tracks: pattern.tracks.map((track, tIdx) => {
          if (tIdx !== selectedTrack) return track
          
          const steps = [...track.steps]
          const velocities = [...track.velocities]
          
          if (direction === 'right') {
            const last = steps.pop()!
            const lastVel = velocities.pop()!
            steps.unshift(last)
            velocities.unshift(lastVel)
          } else {
            const first = steps.shift()!
            const firstVel = velocities.shift()!
            steps.push(first)
            velocities.push(firstVel)
          }
          
          return { ...track, steps, velocities }
        })
      }
    }))
  }

  const applyPatternToTrack = () => {
    const trackName = `${selectedPattern.name}`
    addTrack('midi', trackName)
    
    setTimeout(() => {
      const state = useDAWStore.getState()
      const newTrack = state.tracks.find(t => t.name === trackName)
      
      if (newTrack) {
        let currentBeat = 0
        
        selectedPattern.tracks.forEach(patternTrack => {
          const notes: Note[] = []
          
          patternTrack.steps.forEach((active, stepIdx) => {
            if (active) {
              const midiNote = patternTrack.type === 'drums' 
                ? [36, 38, 42][stepIdx % 3] 
                : 60 + stepIdx
              
              notes.push({
                id: `pattern-note-${stepIdx}-${Math.random()}`,
                pitch: midiNote,
                start: currentBeat + stepIdx,
                duration: 0.5,
                velocity: patternTrack.velocities[stepIdx]
              })
            }
          })
          
           if (notes.length > 0) {
             addClip(newTrack.id, {
               trackId: newTrack.id,
               name: patternTrack.name,
               start: currentBeat,
               duration: selectedPattern.length,
               color: patternTrack.color,
               notes
             })
           }
        })
      }
    }, 0)
  }

  return (
    <div className="h-full flex flex-col bg-surface-1">
      {/* Header */}
      <div className="h-10 bg-surface-2 border-b border-border flex items-center px-3">
        <Zap className="h-4 w-4 text-neon-cyan mr-2" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex-1">
          Pattern Editor
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={addNewPattern}
        >
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Pattern Selector */}
        <div className="p-2 border-b border-border">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {patterns.map((pattern) => (
              <button
                key={pattern.id}
                className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
                  selectedPatternId === pattern.id
                    ? 'bg-neon-cyan text-background'
                    : 'bg-surface-2 text-muted-foreground hover:bg-surface-3'
                }`}
                onClick={() => setSelectedPatternId(pattern.id)}
              >
                {pattern.name}
              </button>
            ))}
          </div>
          
          {/* Pattern Actions */}
          <div className="flex items-center gap-1 mt-2">
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={duplicatePattern}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => deletePattern(selectedPatternId)}>
              <Trash2 className="h-3 w-3" />
            </Button>
            <div className="flex-1" />
            <Select
              value={String(selectedPattern.length)}
              onValueChange={(v) => {
                setPatterns(prev => prev.map(p => 
                  p.id === selectedPatternId 
                    ? { ...p, length: parseInt(v), tracks: p.tracks.map(t => ({ ...t, steps: Array(parseInt(v)).fill(false), velocities: Array(parseInt(v)).fill(80) })) }
                    : p
                ))
              }}
            >
              <SelectTrigger className="h-6 w-20 bg-surface-2 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PATTERN_LENGTHS.map(len => (
                  <SelectItem key={len} value={String(len)}>{len} steps</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Track Selector */}
        <div className="p-2 border-b border-border">
          <div className="flex items-center gap-1">
            {selectedPattern.tracks.map((track, idx) => (
              <button
                key={idx}
                className={`flex-1 py-1 rounded text-[10px] ${
                  selectedTrack === idx
                    ? 'text-background'
                    : 'text-muted-foreground bg-surface-2'
                }`}
                style={{ backgroundColor: selectedTrack === idx ? track.color : undefined }}
                onClick={() => setSelectedTrack(idx)}
              >
                {track.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step Grid */}
        <div className="flex-1 p-2 overflow-auto">
          <div className="space-y-1">
            {selectedPattern.tracks.map((track, trackIdx) => (
              <div key={trackIdx} className={`flex items-center gap-1 ${trackIdx === selectedTrack ? '' : 'opacity-40'}`}>
                <div 
                  className="w-8 h-6 rounded text-[8px] flex items-center justify-center text-background font-bold"
                  style={{ backgroundColor: track.color }}
                >
                  {track.name.charAt(0)}
                </div>
                <div className="flex-1 flex gap-px">
                  {track.steps.map((active, stepIdx) => {
                    const beatNumber = stepIdx + 1
                    const isDownbeat = beatNumber % 4 === 1
                    
                    return (
                      <button
                        key={stepIdx}
                        className={`flex-1 h-8 rounded-sm transition-all ${
                          active 
                            ? track.color 
                            : isDownbeat 
                              ? 'bg-surface-3' 
                              : 'bg-surface-2'
                        }`}
                        style={{ 
                          opacity: active ? track.velocities[stepIdx] / 127 : 1,
                          borderTop: isDownbeat ? '1px solid var(--border)' : 'none'
                        }}
                        onClick={() => trackIdx === selectedTrack && toggleStep(stepIdx)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-2 border-t border-border">
          <div className="grid grid-cols-4 gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copyTrack}>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={pasteTrack} disabled={!copyData}>
              <Clipboard className="h-3 w-3 mr-1" />
              Paste
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={randomizeTrack}>
              <Shuffle className="h-3 w-3 mr-1" />
              Random
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={clearTrack}>
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-1 mt-1">
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => shiftTrack('left')}>
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => shiftTrack('right')}>
              <ArrowRight className="h-3 w-3" />
            </Button>
            <Button size="sm" className="h-7 text-[10px] bg-neon-cyan" onClick={applyPatternToTrack}>
              <Music className="h-3 w-3 mr-1" />
              Apply
            </Button>
          </div>
        </div>

        {/* FL Studio Mode Info */}
        <div className="p-2 border-t border-border bg-orange-500/5">
          <p className="text-[10px] text-muted-foreground text-center">
            FL Studio Pattern Mode - Click steps to toggle, drag to draw
          </p>
        </div>
      </div>
    </div>
  )
}