"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useDAWStore, type Track, type Clip, type Note } from "@/lib/daw-store"
import {
  Music,
  Sparkles,
  Play,
  Pause,
  Download,
  Plus,
  Trash2,
  Wand2,
  Layers,
  Drum,
  Piano,
  Guitar,
  Mic,
  Save,
  RefreshCw,
  CheckCircle,
  Loader2,
  Headphones,
  Volume2
} from "lucide-react"

interface SongSection {
  name: string
  duration: number // in beats
  tracks: SectionTrack[]
}

interface SectionTrack {
  name: string
  notes: Note[]
  color: string
  type: 'drums' | 'bass' | 'melody' | 'chords'
}

interface GeneratedSong {
  name: string
  bpm: number
  timeSignature: [number, number]
  sections: SongSection[]
  totalDuration: number
}

const GENRES = [
  'Electronic', 'Hip Hop', 'Pop', 'Rock', 'Lo-Fi', 'Ambient', 
  'House', 'Techno', 'Trap', 'R&B', 'Jazz', 'Classical'
]

const MOODS = [
  'Energetic', 'Chill', 'Melancholic', 'Happy', 'Dark', 'Dreamy', 'Aggressive', 'Romantic'
]

const SONG_STRUCTURES = [
  { name: 'Simple', sections: ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Outro'] },
  { name: 'Classic', sections: ['Intro', 'Verse 1', 'Chorus 1', 'Verse 2', 'Chorus 2', 'Bridge', 'Chorus', 'Outro'] },
  { name: 'AABA', sections: ['Intro', 'A1', 'B', 'A2', 'Bridge', 'A3', 'Outro'] },
  { name: 'Drop', sections: ['Intro', 'Build', 'Drop 1', 'Break', 'Drop 2', 'Outro'] },
  { name: 'Minimal', sections: ['Intro', 'Loop', 'Variation', 'Outro'] },
  { name: 'Epic', sections: ['Intro', 'Verse 1', 'Pre-Chorus', 'Chorus 1', 'Verse 2', 'Pre-Chorus', 'Chorus 2', 'Bridge', 'Final Chorus', 'Outro'] }
]

// Generate drum pattern for a section
function generateDrumPattern(sectionDuration: number, intensity: number, style: string): Note[] {
  const notes: Note[] = []
  const beatCount = Math.floor(sectionDuration)
  
  for (let i = 0; i < beatCount; i++) {
    // Kick on 1 and 3 for most styles
    if (i % 4 === 0 || i % 4 === 2) {
      if (Math.random() < 0.9 - (intensity * 0.3)) {
        notes.push({
          id: `kick-${i}`,
          pitch: 36,
          start: i,
          duration: 0.25,
          velocity: 90 + Math.random() * 30
        })
      }
    }
    
    // Snare on 2 and 4
    if (i % 4 === 1 || i % 4 === 3) {
      if (Math.random() < 0.8 - (intensity * 0.2)) {
        notes.push({
          id: `snare-${i}`,
          pitch: 38,
          start: i,
          duration: 0.25,
          velocity: 85 + Math.random() * 30
        })
      }
    }
    
    // Hi-hats
    if (style === 'trap' || style === 'hiphop') {
      if (i % 2 === 1) {
        notes.push({
          id: `hat-${i}`,
          pitch: 42,
          start: i + 0.5,
          duration: 0.125,
          velocity: 50 + Math.random() * 30
        })
      }
    } else {
      notes.push({
        id: `hat-${i}`,
        pitch: 42,
        start: i + 0.5,
        duration: 0.125,
        velocity: 40 + Math.random() * 25
      })
    }
    
    // Additional percussion based on style
    if (Math.random() < intensity * 0.3) {
      notes.push({
        id: `perc-${i}`,
        pitch: 39,
        start: i + 0.25,
        duration: 0.125,
        velocity: 60 + Math.random() * 20
      })
    }
  }
  
  return notes
}

// Generate bass pattern
function generateBassPattern(sectionDuration: number, intensity: number, genre: string): Note[] {
  const notes: Note[] = []
  const beatCount = Math.floor(sectionDuration)
  
  const bassNotes: Record<string, number[]> = {
    'electronic': [36, 38, 41, 43],
    'hiphop': [28, 31, 33, 36],
    'pop': [40, 43, 45, 47],
    'rock': [40, 43, 45, 48],
    'lofi': [36, 38, 41, 43],
    'ambient': [24, 28, 31, 36]
  }
  
  const noteSet = bassNotes[genre.toLowerCase()] || bassNotes['electronic']
  
  for (let i = 0; i < beatCount; i += 2) {
    const noteIdx = Math.floor(Math.random() * noteSet.length)
    const duration = genre === 'lofi' ? 2 : (Math.random() > 0.5 ? 1 : 0.5)
    
    notes.push({
      id: `bass-${i}`,
      pitch: noteSet[noteIdx],
      start: i,
      duration,
      velocity: 70 + intensity * 25
    })
  }
  
  return notes
}

// Generate melody
function generateMelody(sectionDuration: number, intensity: number, scale: number[]): Note[] {
  const notes: Note[] = []
  const noteCount = Math.floor(sectionDuration / 2) * intensity
  
  const rootNote = scale[0] + 60
  const pattern = scale.slice(0, 5)
  
  for (let i = 0; i < noteCount; i++) {
    const scaleIdx = Math.floor(Math.random() * pattern.length)
    const pitch = rootNote + pattern[scaleIdx]
    const duration = 0.5 + Math.random() * 1.5
    
    notes.push({
      id: `melody-${i}`,
      pitch,
      start: i * 2,
      duration,
      velocity: 60 + Math.random() * 35
    })
  }
  
  return notes
}

// Generate chord progression
function generateChords(sectionDuration: number, intensity: number): Note[] {
  const notes: Note[] = []
  const chordChanges = Math.floor(sectionDuration / 4)
  
  const chordRoots = [60, 64, 67, 72, 65, 69] // C, E, G, C', A, D
  
  for (let i = 0; i < chordChanges; i++) {
    const root = chordRoots[i % chordRoots.length]
    const duration = 4
    
    // Root
    notes.push({
      id: `chord-root-${i}`,
      pitch: root,
      start: i * 4,
      duration,
      velocity: 60
    })
    // Third
    notes.push({
      id: `chord-third-${i}`,
      pitch: root + 4,
      start: i * 4,
      duration,
      velocity: 55
    })
    // Fifth
    notes.push({
      id: `chord-fifth-${i}`,
      pitch: root + 7,
      start: i * 4,
      duration,
      velocity: 50
    })
  }
  
  return notes
}

export default function AICreatorPage() {
  const { addTrack, addClip, tracks, play, pause, isPlaying } = useDAWStore()
  
  const [songName, setSongName] = useState('My GossipAI-PROD Song')
  const [genre, setGenre] = useState('Electronic')
  const [mood, setMood] = useState('Chill')
  const [bpm, setBpm] = useState(120)
  const [duration, setDuration] = useState(16) // bars
  const [structure, setStructure] = useState('Classic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSong, setGeneratedSong] = useState<GeneratedSong | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)

  const generateSong = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    
    // Simulate generation with progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 150))
      setGenerationProgress(i)
    }
    
    const structureData = SONG_STRUCTURES.find(s => s.name === structure) || SONG_STRUCTURES[1]
    const barsPerSection = Math.floor(duration / structureData.sections.length)
    const intensity = mood === 'Aggressive' || mood === 'Energetic' ? 1 : mood === 'Dark' ? 0.6 : 0.4
    
    // Scales for different moods
    const scales: Record<string, number[]> = {
      'Major': [0, 2, 4, 5, 7, 9, 11],
      'Minor': [0, 2, 3, 5, 7, 8, 10],
      'Dorian': [0, 2, 3, 5, 7, 9, 10],
      'Mixolydian': [0, 2, 4, 5, 7, 9, 10]
    }
    const scale = mood === 'Happy' ? scales['Major'] : scales['Minor']
    
    const sections: SongSection[] = structureData.sections.map((sectionName, idx) => {
      const isChorus = sectionName.toLowerCase().includes('chorus') || sectionName.toLowerCase().includes('drop')
      const isIntro = sectionName.toLowerCase().includes('intro')
      const sectionIntensity = isChorus ? intensity + 0.2 : isIntro ? intensity - 0.1 : intensity
      
      const sectionDuration = barsPerSection * 4 // beats
      
      return {
        name: sectionName,
        duration: sectionDuration,
        tracks: [
          {
            name: 'Drums',
            type: 'drums',
            color: '#00d4ff',
            notes: generateDrumPattern(sectionDuration, sectionIntensity, genre.toLowerCase())
          },
          {
            name: 'Bass',
            type: 'bass',
            color: '#8b5cf6',
            notes: generateBassPattern(sectionDuration, sectionIntensity, genre.toLowerCase())
          },
          {
            name: 'Melody',
            type: 'melody',
            color: '#ec4899',
            notes: generateMelody(sectionDuration, sectionIntensity, scale)
          },
          {
            name: 'Chords',
            type: 'chords',
            color: '#10b981',
            notes: generateChords(sectionDuration, sectionIntensity)
          }
        ]
      }
    })
    
    const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0)
    
    setGeneratedSong({
      name: songName,
      bpm,
      timeSignature: [4, 4],
      sections,
      totalDuration
    })
    
    setIsGenerating(false)
  }

  const applyToProject = () => {
    if (!generatedSong) return
    
    // Add each section's tracks
    let currentBeat = 0
    
    generatedSong.sections.forEach(section => {
      section.tracks.forEach(trackData => {
        // Check if track already exists
        const existingTrack = tracks.find(t => t.name === trackData.name)
        const trackId = existingTrack?.id || `ai-${trackData.name.toLowerCase()}-${Date.now()}`
        
        if (!existingTrack) {
          addTrack('midi', trackData.name)
        }
        
        // Add clip for this section
        setTimeout(() => {
          const state = useDAWStore.getState()
          const newTrack = state.tracks.find(t => t.name === trackData.name)
          if (newTrack) {
            const clip: Clip = {
              id: `clip-${section.name.toLowerCase()}-${trackData.name.toLowerCase()}`,
              trackId: newTrack.id,
              name: `${section.name} ${trackData.name}`,
              start: currentBeat,
              duration: section.duration,
              color: trackData.color,
              notes: trackData.notes
            }
            addClip(newTrack.id, clip)
          }
        }, 0)
      })
      
      currentBeat += section.duration
    })
    
    play()
  }

  const previewSong = () => {
    applyToProject()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface-1">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-background" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">GossipAI-PROD Song Creator</h1>
                <p className="text-[10px] text-muted-foreground">Generate complete songs with GossipAI-PROD</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Controls */}
          <div className="col-span-2 space-y-6">
            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-neon-purple" />
                  Song Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-foreground">Song Name</Label>
                  <Input
                    value={songName}
                    onChange={(e) => setSongName(e.target.value)}
                    className="bg-surface-2 border-border"
                    placeholder="Enter song name"
                  />
                </div>

                {/* Genre & Mood */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Genre</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger className="bg-surface-2 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Mood</Label>
                    <Select value={mood} onValueChange={setMood}>
                      <SelectTrigger className="bg-surface-2 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOODS.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* BPM & Duration */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">BPM: {bpm}</Label>
                    <Slider
                      value={[bpm]}
                      onValueChange={([v]) => setBpm(v)}
                      min={60}
                      max={200}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Bars: {duration}</Label>
                    <Slider
                      value={[duration]}
                      onValueChange={([v]) => setDuration(v)}
                      min={8}
                      max={64}
                      step={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Structure</Label>
                    <Select value={structure} onValueChange={setStructure}>
                      <SelectTrigger className="bg-surface-2 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SONG_STRUCTURES.map(s => (
                          <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-background"
                  onClick={generateSong}
                  disabled={isGenerating}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Song... {generationProgress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Song with GossipAI-PROD
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <Progress value={generationProgress} className="h-2" />
                )}
              </CardContent>
            </Card>

            {/* Generated Song Preview */}
            {generatedSong && (
              <Card className="bg-surface-1 border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Music className="h-5 w-5 text-neon-cyan" />
                    {generatedSong.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Song Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>BPM: {generatedSong.bpm}</span>
                    <span>•</span>
                    <span>{generatedSong.timeSignature[0]}/{generatedSong.timeSignature[1]}</span>
                    <span>•</span>
                    <span>{generatedSong.sections.length} sections</span>
                  </div>

                  {/* Sections */}
                  <div className="space-y-2">
                    {generatedSong.sections.map((section, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg"
                      >
                        <div className="w-24 text-sm font-medium text-foreground">{section.name}</div>
                        <div className="flex-1 flex items-center gap-1">
                          {section.tracks.map((track, tidx) => (
                            <div
                              key={tidx}
                              className="flex-1 h-2 rounded-full"
                              style={{ backgroundColor: track.color, opacity: track.notes.length > 0 ? 1 : 0.3 }}
                              title={`${track.name}: ${track.notes.length} notes`}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground w-16">
                          {Math.round(section.duration / 4)} bars
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-neon-cyan text-background"
                      onClick={applyToProject}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Add to Project
                    </Button>
                    <Button
                      variant="outline"
                      onClick={generateSong}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <Card className="bg-surface-1 border-border">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-neon-purple" />
                  How it works
                </h3>
                <p className="text-sm text-muted-foreground">
                  GossipAI-PROD analyzes your selected genre and mood to generate a complete song structure with multiple sections, each containing drums, bass, melody, and chord tracks.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Select genre for style-specific patterns</li>
                  <li>• Mood affects intensity and note density</li>
                  <li>• Choose structure for section arrangement</li>
                  <li>• Generated songs are fully editable</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-surface-1 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs"
                  onClick={() => { setGenre('Trap'); setMood('Aggressive'); setBpm(140); setStructure('Drop') }}
                >
                  <Drum className="h-3 w-3 mr-2" />
                  Trap Banger
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs"
                  onClick={() => { setGenre('Lo-Fi'); setMood('Chill'); setBpm(85); setStructure('Simple') }}
                >
                  <Piano className="h-3 w-3 mr-2" />
                  Lo-Fi Chill
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs"
                  onClick={() => { setGenre('House'); setMood('Energetic'); setBpm(128); setStructure('Classic') }}
                >
                  <Music className="h-3 w-3 mr-2" />
                  House Track
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs"
                  onClick={() => { setGenre('Ambient'); setMood('Dreamy'); setBpm(70); setStructure('Minimal') }}
                >
                  <Headphones className="h-3 w-3 mr-2" />
                  Ambient Dreams
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}