"use client"

import { useRef, useState } from "react"
import { FileAudio, FolderOpen, PlusCircle, ShieldCheck } from "lucide-react"
import { useDAWStore } from "@/lib/daw-store"

const supportedAudioTypes = [
  "audio/wav",
  "audio/mpeg",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/flac",
  "audio/x-wav",
]

function isSupportedAudio(file: File) {
  const nameOk = /\.(wav|mp3|ogg|m4a|aac|flac)$/i.test(file.name)
  const typeOk = !file.type || supportedAudioTypes.includes(file.type)
  return nameOk && typeOk
}

function cleanTrackName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Imported Audio"
}

export function LocalAudioImportCard() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState("Import a legal local audio file from your PC into Pro Studio.")
  const [busy, setBusy] = useState(false)

  async function importFile(file: File) {
    if (!isSupportedAudio(file)) {
      setMessage("Unsupported file. Use .wav, .mp3, .ogg, .m4a, .aac, or .flac.")
      return
    }

    setBusy(true)
    setMessage(`Importing ${file.name}...`)

    try {
      const store = useDAWStore.getState()
      const trackName = cleanTrackName(file.name)

      store.addTrack("audio", trackName, "lead")

      const nextState = useDAWStore.getState()
      const newTrack = nextState.tracks[nextState.tracks.length - 1]

      if (!newTrack) {
        setMessage("Could not create an audio track.")
        return
      }

      await nextState.addAudioClipFromFile(newTrack.id, file)
      useDAWStore.getState().selectTrack(newTrack.id)

      setSelectedFile(file)
      setMessage(`${file.name} imported as an audio clip.`)
    } catch {
      setMessage("Import failed. Try a smaller WAV/MP3 file.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-fuchsia-100">
        <FileAudio className="h-4 w-4" />
        Local Audio Import
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        Add your own legal audio files directly from your PC. This is the proper offline workflow for
        samples, loops, vocals, drums, and exported stems.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".wav,.mp3,.ogg,.m4a,.aac,.flac,audio/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void importFile(file)
          event.currentTarget.value = ""
        }}
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-fuchsia-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusCircle className="h-4 w-4" />
          {busy ? "Importing..." : "Choose Audio File"}
        </button>

        {selectedFile && (
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-300">
            <FolderOpen className="h-4 w-4 text-slate-500" />
            <span className="truncate">{selectedFile.name}</span>
          </div>
        )}
      </div>

      <p className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
        {message}
      </p>

      <p className="mt-3 flex items-center gap-2 text-xs text-emerald-200">
        <ShieldCheck className="h-4 w-4" />
        Use your own recordings, exported stems, or legal free sample packs only.
      </p>
    </div>
  )
}
