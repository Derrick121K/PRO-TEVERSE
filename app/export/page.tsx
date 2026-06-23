"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useDAWStore } from "@/lib/daw-store"
import { audioEngine } from "@/lib/audio-engine"
import { downloadMidiBlob } from "@/lib/midi-export"
import { getProjectDurationBeats } from "@/lib/project-duration"
import { clipIsAudio } from "@/lib/audio-engine"
import {
  Download,
  Music,
  FileJson,
  Loader2,
  Check,
  Layers,
  Cloud,
  CloudOff,
  RefreshCw,
} from "lucide-react"
import {
  isCloudProjectConfigured,
  saveCurrentDawToCloud,
  listMyCloudDawProjects,
  loadDawFromCloudById,
} from "@/lib/cloud-daw-project"
import type { Project as DbProject } from "@/lib/supabase"

export default function ExportPage() {
  const { tracks, bpm } = useDAWStore()
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)
  const [projectInfo, setProjectInfo] = useState({
    title: "My Track",
    artist: "Producer",
    genre: "Electronic",
    bpm: bpm,
    description: "",
  })

  const durationBeats = getProjectDurationBeats(tracks)
  const safeTitle = (projectInfo.title || "track").replace(/[/\\?%*:|"<>]/g, "-")
  const hasTimelineAudio = tracks.some((t) => t.clips.some((c) => clipIsAudio(c)))

  const [cloudName, setCloudName] = useState("My Project")
  const [cloudBusy, setCloudBusy] = useState(false)
  const [cloudMessage, setCloudMessage] = useState<string | null>(null)
  const [cloudRows, setCloudRows] = useState<DbProject[]>([])

  const refreshCloudList = useCallback(async () => {
    if (!isCloudProjectConfigured()) return
    const res = await listMyCloudDawProjects()
    if (res.success && res.rows) setCloudRows(res.rows)
    else if (!res.success && "error" in res) setCloudMessage(res.error ?? null)
  }, [])

  useEffect(() => {
    void refreshCloudList()
  }, [refreshCloudList])

  const handleSaveToCloud = async () => {
    setCloudBusy(true)
    setCloudMessage(null)
    const res = await saveCurrentDawToCloud(cloudName.trim() || "Untitled")
    setCloudBusy(false)
    if (res.success) {
      setCloudMessage("Saved to cloud.")
      void refreshCloudList()
    } else {
      setCloudMessage(res.error ?? "Save failed")
    }
  }

  const handleLoadFromCloud = async (id: string) => {
    setCloudBusy(true)
    setCloudMessage(null)
    const res = await loadDawFromCloudById(id)
    setCloudBusy(false)
    if (res.success) {
      setCloudMessage("Project loaded into the studio. Open Studio to continue editing.")
    } else {
      setCloudMessage(res.error ?? "Load failed")
    }
  }

  const runExport = async (mode: "mixdown" | "stems" | "midi") => {
    setIsExporting(true)
    setExportProgress(0)
    setExportComplete(false)

    try {
      if (mode === "midi") {
        setExportProgress(30)
        await audioEngine.initialize()
        downloadMidiBlob(tracks, bpm, safeTitle)
        setExportProgress(100)
        setExportComplete(true)
        setIsExporting(false)
        return
      }

      setExportProgress(15)
      await audioEngine.initialize()

      if (mode === "mixdown") {
        setExportProgress(40)
        const wavBlob = await audioEngine.exportToWav(tracks, bpm, durationBeats)
        setExportProgress(85)
        const url = URL.createObjectURL(wavBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${safeTitle}.wav`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        const list = tracks.filter((t) => !t.muted)
        const total = Math.max(1, list.length)
        let i = 0
        for (const t of list) {
          const blob = await audioEngine.exportToWav(tracks, bpm, durationBeats, {
            singleTrackId: t.id,
          })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          const stemName = `${safeTitle}-${(t.name || `track-${i}`).replace(/[/\\?%*:|"<>]/g, "-")}.wav`
          a.download = stemName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          i += 1
          setExportProgress(Math.round(20 + (80 * i) / total))
          await new Promise((r) => setTimeout(r, 150))
        }
      }

      setExportProgress(100)
      setExportComplete(true)
    } catch (e) {
      console.error("Export failed:", e)
    }

    setIsExporting(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface-1">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <Download className="h-6 w-6 text-background" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Export</h1>
                <p className="text-[10px] text-muted-foreground">
                  In-browser: WAV mixdown & stems (MIDI notes), Standard MIDI file
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="export" className="space-y-6">
          <TabsList className="bg-surface-1 border border-border">
            <TabsTrigger value="export" className="data-[state=active]:bg-surface-2">
              <Download className="h-4 w-4 mr-2" />
              Audio / MIDI
            </TabsTrigger>
            <TabsTrigger value="project" className="data-[state=active]:bg-surface-2">
              <FileJson className="h-4 w-4 mr-2" />
              Project
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg">Project title</CardTitle>
                <CardDescription>Used for downloaded filenames</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={projectInfo.title}
                  onChange={(e) => setProjectInfo({ ...projectInfo, title: e.target.value })}
                  className="bg-surface-2 border-border max-w-md"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {tracks.length} tracks · {bpm} BPM · ~{durationBeats.toFixed(0)} beats
                </p>
              </CardContent>
            </Card>

            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg">Audio (WAV)</CardTitle>
                <CardDescription>
                  Renders MIDI synth notes and timeline audio clips. Mixer inserts are not applied
                  in offline render.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  MP3, FLAC, and OGG are not available in the browser build (no encoder bundled).
                  {hasTimelineAudio
                    ? " Timeline audio clips are included in WAV export."
                    : " Add audio clips on the playlist for a fuller mixdown."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-neon-cyan text-background"
                    disabled={isExporting}
                    onClick={() => runExport("mixdown")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download mixdown (.wav)
                  </Button>
                  <Button variant="secondary" disabled={isExporting} onClick={() => runExport("stems")}>
                    <Layers className="h-4 w-4 mr-2" />
                    Download stems (one .wav per unmuted track)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg">MIDI</CardTitle>
                <CardDescription>Standard MIDI file — one file track per DAW track that has notes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled={isExporting} onClick={() => runExport("midi")}>
                  <Music className="h-4 w-4 mr-2" />
                  Download .mid
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-surface-1 border-border">
              <CardContent className="p-6">
                {isExporting ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 text-neon-cyan animate-spin" />
                      <span className="text-foreground">Exporting…</span>
                    </div>
                    <Progress value={exportProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">{exportProgress}%</p>
                  </div>
                ) : exportComplete ? (
                  <div className="flex items-center gap-3 text-green-500">
                    <Check className="h-6 w-6" />
                    <span className="font-medium">Done</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="project" className="space-y-6">
            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {isCloudProjectConfigured() ? (
                    <Cloud className="h-5 w-5 text-neon-cyan" />
                  ) : (
                    <CloudOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  Cloud (Supabase)
                </CardTitle>
                <CardDescription>
                  Requires <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                  <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, a <code className="text-xs">projects</code>{" "}
                  table, and a signed-in user. Full DAW v2 state is stored in the <code className="text-xs">tracks</code> JSON
                  column as <code className="text-xs">{"{ v: 2, ... }"}</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isCloudProjectConfigured() ? (
                  <p className="text-sm text-muted-foreground">
                    Supabase env vars are not set. Use local JSON via{" "}
                    <Link href="/dashboard" className="text-neon-cyan underline">
                      dashboard
                    </Link>{" "}
                    or download from your own backup flow.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="cloud-name">Project name</Label>
                        <Input
                          id="cloud-name"
                          value={cloudName}
                          onChange={(e) => setCloudName(e.target.value)}
                          className="w-56"
                          disabled={cloudBusy}
                        />
                      </div>
                      <Button onClick={() => void handleSaveToCloud()} disabled={cloudBusy}>
                        {cloudBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Save current to cloud
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => void refreshCloudList()} disabled={cloudBusy} title="Refresh list">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    {cloudMessage ? (
                      <p className={`text-sm ${cloudMessage.includes("failed") || cloudMessage.includes("Not") ? "text-amber-500" : "text-green-500"}`}>
                        {cloudMessage}
                      </p>
                    ) : null}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Your cloud projects</p>
                      {cloudRows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No rows yet, or not signed in.</p>
                      ) : (
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                          {cloudRows.map((p) => (
                            <li
                              key={p.id}
                              className="flex items-center justify-between gap-2 text-sm border border-border rounded-md px-3 py-2 bg-surface-2/50"
                            >
                              <span className="truncate font-medium">{p.name}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {p.bpm} BPM
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={cloudBusy}
                                onClick={() => void handleLoadFromCloud(p.id)}
                              >
                                Load
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-surface-1 border-border">
              <CardHeader>
                <CardTitle className="text-lg">Local JSON</CardTitle>
                <CardDescription>File export still works from the dashboard project list and code paths.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Open the{" "}
                  <Link href="/studio" className="text-neon-cyan underline">
                    studio
                  </Link>{" "}
                  to work; use the &quot;Audio / MIDI&quot; tab here for .mid and .wav.
                </p>
                <div className="p-3 rounded-lg bg-surface-2 text-xs text-muted-foreground">
                  MIDI: use the Audio / MIDI tab. Mixdown: WAV (browser offline render, no MP3 in-app).
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
