"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Music,
  Upload,
  FileAudio,
  ChevronLeft,
  Table2,
  AlertCircle,
  Trash2,
  ExternalLink,
} from "lucide-react"
import {
  parseFlpSummary,
  loadFlpLibrary,
  saveFlpToLibrary,
  clearFlpLibrary,
  type FlpProjectSummary,
  type SavedFlpEntry,
} from "@/lib/flp-view"
import {
  buildTracksFromFlp,
  buildSampleMapFromFiles,
  saveFlpImportToSession,
} from "@/lib/flp-import"

export default function FlStudioPage() {
  const router = useRouter()
  const [fileName, setFileName] = useState<string | null>(null)
  const [summary, setSummary] = useState<FlpProjectSummary | null>(null)
  const [flpBuffer, setFlpBuffer] = useState<ArrayBuffer | null>(null)
  const [library, setLibrary] = useState<SavedFlpEntry[]>(() => loadFlpLibrary())
  const [busy, setBusy] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const processFile = useCallback((file: File) => {
    setBusy(true)
    setImportError(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer
      setFlpBuffer(buf)
      const s = parseFlpSummary(buf)
      setSummary(s)
      if (s.ok) {
        const entry = saveFlpToLibrary(file.name, s)
        setLibrary((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, 50))
      }
      setBusy(false)
    }
    reader.onerror = () => {
      setFlpBuffer(null)
      setSummary({
        ok: false,
        error: "Could not read file",
        formatName: "unknown",
        ppq: 0,
        channelCnt: 0,
        bpm: null,
        title: null,
        author: null,
        comment: null,
        genre: null,
        eventCount: 0,
      })
      setBusy(false)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const openInStudio = useCallback(
    (sampleFiles: File[]) => {
      if (!flpBuffer || !summary?.ok) return
      setImportError(null)
      const sampleMap = buildSampleMapFromFiles(sampleFiles)
      const result = buildTracksFromFlp(flpBuffer, sampleMap, fileName ?? "project.flp")
      if ("error" in result) {
        setImportError(result.error)
        return
      }
      saveFlpImportToSession(result)
      router.push("/studio")
    },
    [flpBuffer, summary, fileName, router]
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface-1">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/pro-studio"
            className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to hub
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileAudio className="h-4 w-4" />
            .flp import
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Table2 className="h-7 w-7 text-neon-cyan" />
            FL Studio projects
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Load a <code className="text-xs bg-surface-2 px-1 rounded">.flp</code> file, attach matching WAV
            samples, then open in the studio. VST/plugin state is not imported (browser DAW only).
          </p>
        </div>

        <Card className="bg-surface-1 border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Load .flp
            </CardTitle>
            <CardDescription>Files stay in your browser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept=".flp,application/octet-stream"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) processFile(f)
                e.target.value = ""
              }}
            />
            {busy && <p className="text-xs text-muted-foreground">Readingâ€¦</p>}
          </CardContent>
        </Card>

        {summary && (
          <Card className="bg-surface-1 border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {summary.ok ? (
                  <Music className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
                {fileName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!summary.ok && <p className="text-amber-300/90">{summary.error}</p>}
              {summary.ok && (
                <>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                    <div className="text-muted-foreground">Format</div>
                    <div>{summary.formatName}</div>
                    <div className="text-muted-foreground">PPQ</div>
                    <div>{summary.ppq}</div>
                    <div className="text-muted-foreground">Channels</div>
                    <div>{summary.channelCnt}</div>
                    <div className="text-muted-foreground">Tempo (BPM)</div>
                    <div>{summary.bpm != null ? summary.bpm : "â€”"}</div>
                    <div className="text-muted-foreground">Title</div>
                    <div>{summary.title || "â€”"}</div>
                  </dl>
                  <div className="pt-3 border-t border-border/60 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Upload WAV files whose names match channel samples in the FLP (multi-select).
                    </p>
                    <Input
                      type="file"
                      accept=".wav,audio/wav"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? [])
                        if (files.length > 0) openInStudio(files)
                        e.target.value = ""
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => openInStudio([])} variant="secondary">
                        Open in Studio (samples only if built-in kit matches)
                      </Button>
                      <Link href="/studio">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Studio
                        </Button>
                      </Link>
                    </div>
                    {importError && (
                      <p className="text-xs text-amber-300/90">{importError}</p>
                    )}
                  </div>
                </>
              )}
              {summary.comment && (
                <p className="pt-2 border-t border-border/60 text-muted-foreground text-xs whitespace-pre-wrap">
                  {summary.comment}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-surface-1 border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent FL Studio files</CardTitle>
            {library.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => {
                  clearFlpLibrary()
                  setLibrary([])
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear list
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {library.length === 0 ? (
              <p className="text-sm text-muted-foreground">No FLP files opened yet.</p>
            ) : (
              <ul className="space-y-2">
                {library.map((e) => (
                  <li
                    key={e.id}
                    className="text-sm border border-border rounded-md p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                  >
                    <span className="font-medium truncate">{e.fileName}</span>
                    <span className="text-xs text-muted-foreground">
                      {e.summary.bpm != null ? `${e.summary.bpm} BPM` : "BPM n/a"} Â·{" "}
                      {e.summary.channelCnt} ch Â· {new Date(e.addedAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
