"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import Link from "next/link"
import JSZip from "jszip"
import { ZIP_STUDIO_SESSION_KEY } from "@/lib/zip-studio/types"

type ZipAudioTrack = {
  id: string
  name: string
  path: string
  size: number
  type: string
  url: string
  volume: number
  muted: boolean
  startSeconds: number
  notes: string
}

type ZipProjectMeta = {
  app: "PRO-TEVERSE"
  version: 1
  projectName: string
  sourceZipName: string
  flpFileName: string | null
  bpm: number
  key: string
  updatedAt: string
  tracks: Array<{
    name: string
    path: string
    volume: number
    muted: boolean
    startSeconds: number
    notes: string
  }>
}

const audioExtensions = [".wav", ".mp3", ".ogg", ".m4a", ".aac", ".flac", ".aif", ".aiff"]

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2)
}

function getExtension(name: string) {
  const index = name.lastIndexOf(".")
  return index >= 0 ? name.slice(index).toLowerCase() : ""
}

function isAudioFile(name: string) {
  return audioExtensions.includes(getExtension(name))
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function AudioPreview({ track }: { track: ZipAudioTrack }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioRef.current) return

    audioRef.current.volume = Math.min(1, Math.max(0, track.volume / 100))
    audioRef.current.muted = track.muted
  }, [track.volume, track.muted])

  return (
    <audio
      ref={audioRef}
      controls
      preload="metadata"
      src={track.url}
      className="w-full"
    />
  )
}

export default function ZipStudioPage() {
  const [projectName, setProjectName] = useState("Untitled ZIP Project")
  const [sourceZipName, setSourceZipName] = useState("")
  const [bpm, setBpm] = useState(112)
  const [projectKey, setProjectKey] = useState("C minor")
  const [flpFileName, setFlpFileName] = useState<string | null>(null)
  const [tracks, setTracks] = useState<ZipAudioTrack[]>([])
  const [originalZip, setOriginalZip] = useState<JSZip | null>(null)
  const [status, setStatus] = useState("Open a ZIP project to begin.")
  const [isExporting, setIsExporting] = useState(false)

  const activeTracks = useMemo(() => tracks.filter((track) => !track.muted), [tracks])
  const totalSize = useMemo(() => tracks.reduce((sum, track) => sum + track.size, 0), [tracks])

  async function openZip(file: File) {
    setStatus("Reading ZIP project...")
    setSourceZipName(file.name)

    const zip = await JSZip.loadAsync(file)
    setOriginalZip(zip)

    const entries = Object.values(zip.files).filter((entry) => !entry.dir)
    const flp = entries.find((entry) => getExtension(entry.name) === ".flp")
    setFlpFileName(flp?.name ?? null)

    const savedMetaFile = zip.file("proteverse-project.json")
    let savedMeta: Partial<ZipProjectMeta> | null = null

    if (savedMetaFile) {
      try {
        savedMeta = JSON.parse(await savedMetaFile.async("text")) as Partial<ZipProjectMeta>
      } catch {
        savedMeta = null
      }
    }

    const loadedTracks: ZipAudioTrack[] = []

    for (const entry of entries) {
      if (!isAudioFile(entry.name)) continue

      const blob = await entry.async("blob")
      const previous = savedMeta?.tracks?.find((item) => item.path === entry.name)

      loadedTracks.push({
        id: createId(),
        name: entry.name.split("/").pop() || entry.name,
        path: entry.name,
        size: blob.size,
        type: blob.type || `audio/${getExtension(entry.name).replace(".", "")}`,
        url: URL.createObjectURL(blob),
        volume: previous?.volume ?? 100,
        muted: previous?.muted ?? false,
        startSeconds: previous?.startSeconds ?? 0,
        notes: previous?.notes ?? "",
      })
    }

    setProjectName(savedMeta?.projectName || file.name.replace(/\.zip$/i, ""))
    setBpm(savedMeta?.bpm || 112)
    setProjectKey(savedMeta?.key || "C minor")
    setTracks(loadedTracks)

    setStatus(
      `Loaded ${loadedTracks.length} audio files${flp ? ` and preserved ${flp.name}` : ""}.`
    )
  }

  function updateTrack(id: string, updates: Partial<ZipAudioTrack>) {
    setTracks((current) =>
      current.map((track) => (track.id === id ? { ...track, ...updates } : track))
    )
  }

  function saveToBrowserStudio() {
    const meta = buildMeta()

    sessionStorage.setItem(ZIP_STUDIO_SESSION_KEY, JSON.stringify(meta))
    localStorage.setItem(ZIP_STUDIO_SESSION_KEY, JSON.stringify(meta))
    setStatus("Saved editable ZIP project layer to this browser session.")
  }

  function buildMeta(): ZipProjectMeta {
    return {
      app: "PRO-TEVERSE",
      version: 1,
      projectName,
      sourceZipName,
      flpFileName,
      bpm,
      key: projectKey,
      updatedAt: new Date().toISOString(),
      tracks: tracks.map((track) => ({
        name: track.name,
        path: track.path,
        volume: track.volume,
        muted: track.muted,
        startSeconds: track.startSeconds,
        notes: track.notes,
      })),
    }
  }

  async function exportModifiedZip() {
    if (!originalZip) {
      setStatus("Open a ZIP project first.")
      return
    }

    setIsExporting(true)
    setStatus("Building modified ZIP...")

    try {
      const output = new JSZip()

      for (const entry of Object.values(originalZip.files)) {
        if (entry.dir) {
          output.folder(entry.name)
          continue
        }

        const data = await entry.async("arraybuffer")
        output.file(entry.name, data)
      }

      const meta = buildMeta()

      output.file("proteverse-project.json", JSON.stringify(meta, null, 2))
      output.file(
        "README-PRO-TEVERSE.txt",
        [
          "This ZIP was edited with PRO-TEVERSE ZIP Studio.",
          "",
          "The original FLP and audio files were preserved.",
          "Editable project settings are stored in proteverse-project.json.",
          "",
          "Open this ZIP again in PRO-TEVERSE ZIP Studio to continue editing.",
        ].join("\n")
      )

      const blob = await output.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = `${projectName || "proteverse-project"}-modified.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(url)
      setStatus("Modified ZIP exported successfully.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export ZIP."
      setStatus(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">PRO-TEVERSE</p>
              <h1 className="text-3xl font-bold">ZIP Studio</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Open ZIP music projects, preserve FLP files, preview real WAV/MP3 samples,
                edit track settings, and export a modified ZIP project.
              </p>
            </div>

            <Link
              href="/studio"
              className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-400/10"
            >
              Open Main Studio
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void openZip(file)
              }}
              className="block w-full cursor-pointer rounded-xl border border-white/10 bg-slate-900 p-3 text-sm"
            />
            <p className="mt-3 text-sm text-slate-300">{status}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 lg:col-span-1">
            <h2 className="text-xl font-semibold">Project</h2>

            <label className="mt-4 block text-sm text-slate-300">Project name</label>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
            />

            <label className="mt-4 block text-sm text-slate-300">BPM</label>
            <input
              type="number"
              min={60}
              max={220}
              value={bpm}
              onChange={(event) => setBpm(Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
            />

            <label className="mt-4 block text-sm text-slate-300">Key</label>
            <input
              value={projectKey}
              onChange={(event) => setProjectKey(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
            />

            <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
              <p>ZIP: {sourceZipName || "None"}</p>
              <p>FLP: {flpFileName || "No FLP found"}</p>
              <p>Audio tracks: {tracks.length}</p>
              <p>Active tracks: {activeTracks.length}</p>
              <p>Audio size: {formatBytes(totalSize)}</p>
            </div>

            <button
              onClick={saveToBrowserStudio}
              disabled={!tracks.length}
              className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Editable Layer
            </button>

            <button
              onClick={() => void exportModifiedZip()}
              disabled={!tracks.length || isExporting}
              className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? "Exporting..." : "Export Modified ZIP"}
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Audio Files From ZIP</h2>
              <p className="text-sm text-slate-400">These are the real sounds inside the ZIP.</p>
            </div>

            {!tracks.length ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/20 p-8 text-center text-slate-400">
                Upload `nkosi.zip` or another music ZIP to see and edit its audio files.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {tracks.map((track, index) => (
                  <article
                    key={track.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                          Track {index + 1}
                        </p>
                        <h3 className="break-all text-lg font-semibold">{track.name}</h3>
                        <p className="break-all text-xs text-slate-400">
                          {track.path} Ã‚Â· {formatBytes(track.size)}
                        </p>
                      </div>

                      <label className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={track.muted}
                          onChange={(event) => updateTrack(track.id, { muted: event.target.checked })}
                        />
                        Muted
                      </label>
                    </div>

                    <div className="mt-4">
                      <AudioPreview track={track} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <label className="text-sm text-slate-300">
                        Volume: {track.volume}%
                        <input
                          type="range"
                          min={0}
                          max={150}
                          value={track.volume}
                          onChange={(event) =>
                            updateTrack(track.id, { volume: Number(event.target.value) })
                          }
                          className="mt-2 w-full"
                        />
                      </label>

                      <label className="text-sm text-slate-300">
                        Start time seconds
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={track.startSeconds}
                          onChange={(event) =>
                            updateTrack(track.id, { startSeconds: Number(event.target.value) })
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
                        />
                      </label>

                      <label className="text-sm text-slate-300">
                        Notes / edit instruction
                        <input
                          value={track.notes}
                          onChange={(event) => updateTrack(track.id, { notes: event.target.value })}
                          placeholder="Example: make louder, cut intro, use as hook"
                          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
