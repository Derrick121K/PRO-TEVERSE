"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDAWStore } from "@/lib/daw-store"
import { useProjectManager } from "@/lib/project-manager"
import {
  Plus,
  Music,
  Clock,
  Heart,
  Trash2,
  Play,
  MoreVertical,
  FolderOpen,
  Settings,
  Upload,
  Download,
  Share2,
  Sparkles,
  Mic,
  Drum,
  Piano,
  Radio,
  Wand2,
  FileAudio,
  Headphones,
} from "lucide-react"

interface Project {
  id: string
  name: string
  createdAt: string
  modifiedAt: string
  duration: number
  tracks: number
  bpm: number
  thumbnail?: string
  favorite: boolean
}

const quickStartTemplates = [
  { id: 'trap', name: 'Trap Beat', description: 'Heavy 808s and hi-hats', icon: Drum, color: '#ec4899', bpm: 140 },
  { id: 'lofi', name: 'Lo-Fi Beat', description: 'Chill vibes and dusty drums', icon: Music, color: '#8b5cf6', bpm: 85 },
  { id: 'house', name: 'House Track', description: 'Four on the floor energy', icon: Radio, color: '#10b981', bpm: 128 },
  { id: 'ambient', name: 'Ambient Pad', description: 'Atmospheric textures', icon: Piano, color: '#00d4ff', bpm: 70 },
  { id: 'hiphop', name: 'Boom Bap', description: 'Classic hip hop drums', icon: Mic, color: '#f59e0b', bpm: 90 },
  { id: 'ai', name: 'GossipAI-PROD Song', description: 'Let GossipAI-PROD create your track', icon: Wand2, color: '#9b59b6', bpm: 120 },
]

const STORAGE_KEY = 'PRO-TEVERSE-projects'

export default function DashboardPage() {
  const { tracks } = useDAWStore()
  const { getProjectList } = useProjectManager()
  const [activeTab, setActiveTab] = useState('projects')
  const [recentProjects, setRecentProjects] = useState<Project[]>([])

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) {
      const projects = JSON.parse(existing)
      setRecentProjects(projects.map((p: any, idx: number) => ({
        id: `project-${idx}`,
        name: p.name || 'Untitled',
        createdAt: p.createdAt || new Date().toISOString(),
        modifiedAt: p.modifiedAt || new Date().toISOString(),
        duration: 0,
        tracks: p.tracks?.length || 0,
        bpm: p.bpm || 120,
        favorite: false
      })))
    }
  }, [])

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface-1">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <Music className="h-6 w-6 text-background" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">PRO-TEVERSE</h1>
              <p className="text-[10px] text-muted-foreground">GossipAI-PROD Music Production</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Link href="/fl-studio">
              <Button variant="outline" size="sm" className="border-border">
                <FileAudio className="h-4 w-4 mr-2" />
                View FL projects
              </Button>
            </Link>
            <Link href="/studio">
              <Button className="bg-neon-cyan text-background hover:bg-neon-cyan/90">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-surface-1 border border-border mb-6">
            <TabsTrigger value="projects" className="data-[state=active]:bg-surface-2">
              <FolderOpen className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-surface-2">
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-surface-2">
              <Share2 className="h-4 w-4 mr-2" />
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <Link href="/studio?panel=ai" className="block group">
              <Card className="border border-neon-purple/30 bg-gradient-to-r from-neon-purple/15 to-neon-cyan/10 hover:border-neon-purple/50 transition-colors">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-neon-purple/25 flex items-center justify-center shrink-0">
                      <Headphones className="h-8 w-8 text-neon-purple" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">AI Producer</h2>
                      <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                        Open the studio with the GossipAI-PROD panel: session beats with drums, melody & bass, plus text-to-music and more.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-neon-purple text-background group-hover:bg-neon-purple/90 shrink-0 w-full sm:w-auto text-center">
                    Open in Studio
                  </span>
                </CardContent>
              </Card>
            </Link>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-surface-1 border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                    <Music className="h-6 w-6 text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{recentProjects.length}</p>
                    <p className="text-xs text-muted-foreground">Total Projects</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-1 border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-neon-purple" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{Math.floor(recentProjects.length * 0.3)}</p>
                    <p className="text-xs text-muted-foreground">GossipAI-PROD</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-1 border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-neon-pink/20 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-neon-pink" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{recentProjects.filter(p => p.favorite).length}</p>
                    <p className="text-xs text-muted-foreground">Favorites</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-1 border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {recentProjects.length > 0 
                        ? (recentProjects.reduce((sum, p) => sum + (p.duration || 0), 0) / 60).toFixed(1) + 'h'
                        : '0h'}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Time</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project List */}
            <Card className="bg-surface-1 border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg">Recent Projects</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center gap-4 p-4 hover:bg-surface-2/50 transition-colors cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-surface-2 to-surface-3 flex items-center justify-center">
                        <Music className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{project.name}</h3>
                          {project.favorite && <Heart className="h-4 w-4 text-neon-pink fill-neon-pink" />}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{formatDuration(project.duration)}</span>
                          <span>{project.tracks} tracks</span>
                          <span>{project.bpm} BPM</span>
                          <span>Modified {project.modifiedAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Start Creating</h2>
              <p className="text-muted-foreground">Choose a template or start from scratch</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* New Blank */}
              <Link href="/studio">
                <Card className="bg-surface-1 border-border hover:border-neon-cyan transition-colors cursor-pointer group">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4 group-hover:bg-neon-cyan/20 transition-colors">
                      <Plus className="h-8 w-8 text-muted-foreground group-hover:text-neon-cyan" />
                    </div>
                    <h3 className="font-medium text-foreground">Blank Project</h3>
                    <p className="text-xs text-muted-foreground mt-1">Start from scratch</p>
                  </CardContent>
                </Card>
              </Link>

              {/* Templates */}
              {quickStartTemplates.map((template) => (
                <Link key={template.id} href={template.id === 'ai' ? '/ai-creator' : `/studio?template=${template.id}`}>
                  <Card className="bg-surface-1 border-border hover:border-neon-cyan transition-colors cursor-pointer group">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${template.color}20` }}
                      >
                        <template.icon className="h-8 w-8" style={{ color: template.color }} />
                      </div>
                      <h3 className="font-medium text-foreground">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                      <span className="text-xs text-muted-foreground mt-2">{template.bpm} BPM</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Import */}
            <Card className="bg-surface-1 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Import Project</h3>
                    <p className="text-xs text-muted-foreground">Open FL Studio, Ableton, or MIDI files</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card className="bg-surface-1 border-border">
              <CardContent className="p-6 text-center">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Share Your Music</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join the PRO-TEVERSE community, share your tracks, and discover new music.
                </p>
                <Button className="bg-neon-cyan text-background">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Track
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
