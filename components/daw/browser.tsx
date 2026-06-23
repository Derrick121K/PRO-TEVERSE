"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useDAWStore } from "@/lib/daw-store"
import { audioEngine } from "@/lib/audio-engine"
import { sampleLibrary, type Sample } from "@/lib/sample-library"
import { soundManager } from "@/lib/sound-manager"
import { instrumentPresets, drumKits, plugins, pluginCategories, type Plugin } from "@/lib/daw-browser-catalog"
import { BROWSER_DND_MIME, serializeBrowserDnD } from "@/lib/browser-dnd"
import {
  Piano,
  Drum,
  Wand2,
  Volume2,
  Play,
  ChevronRight,
  ChevronDown,
  Music,
  Waves,
  Sliders,
  Plug,
  Search,
  Cloud,
  Loader2
} from "lucide-react"

export function Browser() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Basic', 'Drums']))
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [sampleSearchQuery, setSampleSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Sample[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [sampleView, setSampleView] = useState<'local' | 'search'>('local')
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const { addTrack, addClip, addEffect, selectedTrackId, tracks, selectTrack, bpm } = useDAWStore()

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const previewSound = (pitch: number = 60, instrument?: string) => {
    audioEngine.initialize()
    audioEngine.playNote('preview', pitch, 0.5, 100, undefined, undefined, instrument || 'lead')
  }

  const previewKick = () => {
    audioEngine.initialize()
    audioEngine.playDrum('preview', 'kick', 100)
  }

  const previewSnare = () => {
    audioEngine.initialize()
    audioEngine.playDrum('preview', 'snare', 100)
  }

  const previewHihat = () => {
    audioEngine.initialize()
    audioEngine.playDrum('preview', 'hihat', 100)
  }

  const previewClap = () => {
    audioEngine.initialize()
    audioEngine.playDrum('preview', 'clap', 100)
  }

  const previewSample = (sample: Sample) => {
    const src = sample.previewUrl ?? sample.sourceUrl
    if (!src) return
    try {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
      }
      const audio = new Audio(src)
      audio.currentTime = 0
      audio.volume = 0.85
      previewAudioRef.current = audio
      void audio.play()
    } catch {
      // Keep browser responsive even when preview fetch fails.
    }
  }

  const handleInstrumentDoubleClick = (preset: (typeof instrumentPresets)[0]) => {
    addTrack('midi', preset.name, preset.engineKey)
  }

  const handleSampleDoubleClick = async (sample: Sample) => {
    const sourceUrl = sample.sourceUrl ?? sample.previewUrl
    if (!sourceUrl) {
      addTrack("midi", sample.name, sample.category.toLowerCase() === "bass" ? "subBass" : "lead")
      setTimeout(() => {
        const state = useDAWStore.getState()
        const track = state.tracks.at(-1)
        if (!track) return
        addClip(track.id, {
          trackId: track.id,
          name: sample.name,
          start: 0,
          duration: 4,
          color: "#a78bfa",
          notes: [
            {
              id: `sample-seed-${Date.now()}`,
              pitch: sample.category.toLowerCase() === "bass" ? 36 : 60,
              start: 0,
              duration: 1,
              velocity: 96,
            },
          ],
          clipType: "midi",
        })
        selectTrack(track.id)
      }, 0)
      return
    }

    const cached = sourceUrl.startsWith("http")
      ? await soundManager.cacheExternalSample(sourceUrl)
      : sourceUrl
    const clipDuration = Math.max(1, Math.round((sample.duration * bpm) / 60))
    addTrack("audio", sample.name)
    setTimeout(() => {
      const state = useDAWStore.getState()
      const track = state.tracks.at(-1)
      if (!track) return
      addClip(track.id, {
        trackId: track.id,
        name: sample.name,
        start: 0,
        duration: clipDuration,
        color: "#a78bfa",
        notes: [],
        audioUrl: cached,
        clipType: "audio",
      })
      selectTrack(track.id)
    }, 0)
  }

  const handlePluginDoubleClick = (plugin: Plugin) => {
    const id = selectedTrackId ?? tracks[0]?.id
    if (id) {
      addEffect(id, plugin.dawEffect)
      if (selectedTrackId !== id) selectTrack(id)
    } else {
      addTrack('midi', 'MIDI 1', 'lead')
      const t = useDAWStore.getState().tracks.at(-1)
      if (t) {
        addEffect(t.id, plugin.dawEffect)
        selectTrack(t.id)
      }
    }
  }

  const startBrowserDrag = (e: React.DragEvent, payload: string) => {
    e.dataTransfer.effectAllowed = "copy"
    e.dataTransfer.setData(BROWSER_DND_MIME, payload)
  }

  // Group instruments by category
  const instrumentsByCategory = instrumentPresets.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = []
    acc[preset.category].push(preset)
    return acc
  }, {} as Record<string, typeof instrumentPresets>)

  // Group samples by category from new library
  const samplesByCategory = sampleLibrary.getCategories()
    .filter(c => c !== 'All')
    .reduce((acc, category) => {
      acc[category] = sampleLibrary.getByCategory(category)
      return acc
    }, {} as Record<string, Sample[]>)

  // Filter plugins by category
  const filteredPlugins = selectedCategory === 'All' 
    ? plugins 
    : plugins.filter(p => p.category === selectedCategory)

  return (
    <div className="h-full flex flex-col bg-surface-1 border-r border-border">
      {/* Header */}
      <div className="h-8 bg-surface-2 border-b border-border flex items-center px-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Browser
        </span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="instruments" className="flex-1 flex flex-col">
        <TabsList className="h-9 bg-surface-2 border-b border-border rounded-none justify-start px-2 gap-1">
          <TabsTrigger value="instruments" className="text-xs data-[state=active]:bg-surface-3 data-[state=active]:text-neon-cyan">
            <Piano className="h-3 w-3 mr-1" />
            Instruments
          </TabsTrigger>
          <TabsTrigger value="samples" className="text-xs data-[state=active]:bg-surface-3 data-[state=active]:text-neon-cyan">
            <Drum className="h-3 w-3 mr-1" />
            Samples
          </TabsTrigger>
          <TabsTrigger value="plugins" className="text-xs data-[state=active]:bg-surface-3 data-[state=active]:text-neon-cyan">
            <Plug className="h-3 w-3 mr-1" />
            Plugins
          </TabsTrigger>
        </TabsList>

        {/* Instruments Tab */}
        <TabsContent value="instruments" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {Object.entries(instrumentsByCategory).map(([category, presets]) => (
                <div key={category}>
                  {/* Category Header */}
                  <button
                    className="w-full flex items-center gap-1 px-2 py-1.5 rounded hover:bg-surface-2 text-sm text-muted-foreground"
                    onClick={() => toggleCategory(category)}
                  >
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <Waves className="h-3 w-3 text-neon-cyan" />
                    <span>{category}</span>
                    <span className="ml-auto text-xs text-muted-foreground/50">
                      {presets.length}
                    </span>
                  </button>

                    {/* Presets */}
                  {expandedCategories.has(category) && (
                    <div className="ml-4 space-y-0.5">
                      {presets.map((preset) => (
                        <div
                          key={preset.id}
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-2 cursor-pointer group"
                          onDoubleClick={() => handleInstrumentDoubleClick(preset)}
                          draggable
                          onDragStart={(e) =>
                            startBrowserDrag(
                              e,
                              serializeBrowserDnD({
                                type: "instrument",
                                name: preset.name,
                                instrumentKey: preset.engineKey,
                              })
                            )
                          }
                        >
                          <Music className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-foreground flex-1">{preset.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-neon-cyan"
                            onClick={(e) => {
                              e.stopPropagation()
                              previewSound(60, preset.engineKey)
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                    ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Drum Kits */}
              <div>
                <button
                  className="w-full flex items-center gap-1 px-2 py-1.5 rounded hover:bg-surface-2 text-sm text-muted-foreground"
                  onClick={() => toggleCategory('Drum Kits')}
                >
                  {expandedCategories.has('Drum Kits') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Drum className="h-3 w-3 text-neon-purple" />
                  <span>Drum Kits</span>
                  <span className="ml-auto text-xs text-muted-foreground/50">
                    {drumKits.length}
                  </span>
                </button>

                {expandedCategories.has('Drum Kits') && (
                  <div className="ml-4 space-y-0.5">
                    {drumKits.map((kit) => (
                      <div
                        key={kit.id}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-2 cursor-pointer group"
                        onDoubleClick={() => addTrack('midi', kit.name, kit.engineKey)}
                        draggable
                        onDragStart={(e) =>
                          startBrowserDrag(
                            e,
                            serializeBrowserDnD({
                              type: "instrument",
                              name: kit.name,
                              instrumentKey: kit.engineKey,
                            })
                          )
                        }
                      >
                        <Drum className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-foreground flex-1">{kit.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-neon-cyan"
                            onClick={(e) => {
                              e.stopPropagation()
                              previewKick()
                            }}
                            title="Kick"
                          >
                            <span className="text-[8px] font-bold">K</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-neon-cyan"
                            onClick={(e) => {
                              e.stopPropagation()
                              previewSnare()
                            }}
                            title="Snare"
                          >
                            <span className="text-[8px] font-bold">S</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-neon-cyan"
                            onClick={(e) => {
                              e.stopPropagation()
                              previewHihat()
                            }}
                            title="Hi-Hat"
                          >
                            <span className="text-[8px] font-bold">H</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Samples Tab */}
        <TabsContent value="samples" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search samples..."
                  value={sampleSearchQuery}
                  onChange={(e) => setSampleSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && sampleSearchQuery) {
                      setIsSearching(true)
                      sampleLibrary.searchFreesound(sampleSearchQuery).then(results => {
                        setSearchResults(results.samples)
                        setIsSearching(false)
                        setSampleView('search')
                      })
                    }
                  }}
                  className="h-7 pl-7 text-xs bg-surface-2 border-border"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full h-7 text-[10px]"
                disabled={!sampleSearchQuery.trim() || isSearching}
                onClick={() => {
                  if (!sampleSearchQuery.trim()) return
                  setIsSearching(true)
                  sampleLibrary.searchFreesound(sampleSearchQuery.trim()).then(results => {
                    setSearchResults(results.samples)
                    setIsSearching(false)
                    setSampleView('search')
                  })
                }}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-1" />
                    Search Free/Local
                  </>
                )}
              </Button>

              {/* View Toggle */}
              <div className="flex gap-1">
                <Button
                  variant={sampleView === 'local' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="text-[10px] h-6 flex-1"
                  onClick={() => setSampleView('local')}
                >
                  <Drum className="h-3 w-3 mr-1" />
                  Local
                </Button>
                <Button
                  variant={sampleView === 'search' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="text-[10px] h-6 flex-1"
                  onClick={() => setSampleView('search')}
                >
                  <Cloud className="h-3 w-3 mr-1" />
                  Online
                </Button>
              </div>

              {/* API Key Hint */}
              {!sampleLibrary.hasApiKey() && sampleView === 'search' && (
                <p className="text-[10px] text-muted-foreground px-2">
                  Get a free API key from freesound.org for online search
                </p>
              )}

              {sampleView === 'local' ? (
                // Local samples view
                Object.entries(samplesByCategory).map(([category, samples]) => (
                  <div key={category}>
                    <button
                      className="w-full flex items-center gap-1 px-2 py-1.5 rounded hover:bg-surface-2 text-sm text-muted-foreground"
                      onClick={() => toggleCategory(category)}
                    >
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <Volume2 className="h-3 w-3 text-neon-pink" />
                      <span>{category}</span>
                      <span className="ml-auto text-xs text-muted-foreground/50">
                        {samples.length}
                      </span>
                    </button>

                    {expandedCategories.has(category) && (
                      <div className="ml-4 space-y-0.5">
                        {samples.map((sample) => {
                          const getSampleSound = () => {
                            if (sample.id.includes('kick')) previewKick()
                            else if (sample.id.includes('snare')) previewSnare()
                            else if (sample.id.includes('hihat') || sample.id.includes('hat')) previewHihat()
                            else if (sample.id.includes('clap')) previewClap()
                            else previewSound(60, sample.category.toLowerCase() === 'bass' ? 'subBass' : 'lead')
                          }
                          return (
                          <div
                            key={sample.id}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-2 cursor-pointer group"
                            onDoubleClick={() => handleSampleDoubleClick(sample)}
                            draggable
                            onDragStart={(e) =>
                              startBrowserDrag(
                                e,
                                serializeBrowserDnD({
                                  type: "sample",
                                  name: sample.name,
                                  category: sample.category,
                                  sampleType: sample.type,
                                })
                              )
                            }
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${sample.type === 'loop' ? 'bg-neon-cyan' : 'bg-neon-pink'}`} />
                            <span className="text-xs text-foreground flex-1">{sample.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-neon-cyan"
                              onClick={(e) => {
                                e.stopPropagation()
                                getSampleSound()
                              }}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                ))) : (
                // Search results view
                <div className="space-y-1">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 text-neon-cyan animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((sample) => (
                      <div
                        key={sample.id}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-2 cursor-pointer group"
                        onDoubleClick={() => handleSampleDoubleClick(sample)}
                        draggable
                        onDragStart={(e) =>
                          startBrowserDrag(
                            e,
                            serializeBrowserDnD({
                              type: "sample",
                              name: sample.name,
                              category: sample.category,
                              sampleType: sample.type,
                            })
                          )
                        }
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${sample.type === 'loop' ? 'bg-neon-cyan' : 'bg-neon-pink'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-foreground truncate">{sample.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            by {sample.username}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {sample.duration.toFixed(1)}s
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-neon-cyan"
                            onClick={(e) => {
                              e.stopPropagation()
                              previewSample(sample)
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : sampleSearchQuery ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No results found
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Plugins Tab */}
        <TabsContent value="plugins" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-1 mb-2">
                {pluginCategories.map((category) => (
                  <button
                    key={category}
                    className={`px-2 py-1 rounded text-[10px] transition-colors ${
                      selectedCategory === category
                        ? 'bg-neon-cyan text-background'
                        : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Plugin List */}
              <div className="space-y-1">
                {filteredPlugins.map((plugin) => (
                  <div
                    key={plugin.id}
                    className="flex items-center gap-2 px-2 py-2 rounded hover:bg-surface-2 cursor-pointer group"
                    onDoubleClick={() => handlePluginDoubleClick(plugin)}
                    draggable
                    onDragStart={(e) =>
                      startBrowserDrag(
                        e,
                        serializeBrowserDnD({
                          type: "plugin",
                          name: plugin.name,
                          dawEffect: plugin.dawEffect,
                        })
                      )
                    }
                  >
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${plugin.color}20` }}
                    >
                      {plugin.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground">{plugin.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{plugin.description}</div>
                    </div>
                    <div
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${plugin.color}30`, color: plugin.color }}
                    >
                      {plugin.type}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-neon-cyan"
                      onClick={(e) => {
                        e.stopPropagation()
                        previewSound(60, 'sine')
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer hint */}
      <div className="p-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          Double-click to add, or drag to timeline
        </p>
      </div>
    </div>
  )
}
