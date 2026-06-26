"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, FolderOpen, Pause, Play, ShieldCheck, Trash2 } from "lucide-react"
import {
  canPreviewSoundPath,
  SOUND_LIBRARY_SELECTED_KEY,
  type SelectedSound,
} from "@/lib/sound-library/selected-sound"

export function ImportedSoundCard() {
  const [sound, setSound] = useState<SelectedSound | null>(null)
  const [playing, setPlaying] = useState(false)
  const [message, setMessage] = useState("Send a sound from the Sound Library to prepare it here.")
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const saved =
      localStorage.getItem(SOUND_LIBRARY_SELECTED_KEY) ||
      sessionStorage.getItem(SOUND_LIBRARY_SELECTED_KEY)

    if (!saved) return

    try {
      setSound(JSON.parse(saved) as SelectedSound)
      setMessage("Sound Library sample connected.")
    } catch {
      setMessage("Could not read the selected sound.")
    }
  }, [])

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setPlaying(false)
  }

  async function previewSound() {
    if (!sound) return

    if (!canPreviewSoundPath(sound.path)) {
      setMessage("This selected sound is a placeholder. Add a real audio file first.")
      return
    }

    if (playing) {
      stopPreview()
      return
    }

    stopPreview()

    const audio = new Audio(sound.path)
    audioRef.current = audio
    setPlaying(true)
    setMessage(`Previewing ${sound.name}`)

    audio.onended = () => {
      setPlaying(false)
      setMessage("Preview ended.")
    }

    try {
      await audio.play()
    } catch {
      setPlaying(false)
      setMessage("Preview failed. Confirm the file exists inside public/sound-library.")
    }
  }

  function clearSound() {
    stopPreview()
    localStorage.removeItem(SOUND_LIBRARY_SELECTED_KEY)
    sessionStorage.removeItem(SOUND_LIBRARY_SELECTED_KEY)
    setSound(null)
    setMessage("Selected sound cleared.")
  }

  return (
    <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-cyan-100">
        <ShieldCheck className="h-4 w-4" />
        Sound Library Import
      </p>

      {sound ? (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-lg font-bold text-white">{sound.name}</p>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
              {sound.category} / {sound.role} / {sound.license}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-300">
            <FolderOpen className="h-4 w-4 text-slate-500" />
            <span className="truncate">{sound.path}</span>
          </div>

          <p className="text-xs text-slate-300">{message}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => void previewSound()}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? "Stop" : "Preview"}
            </button>

            <button
              onClick={clearSound}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          </div>

          <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
            Next step: convert this selected sound into a real sampler/audio track inside the DAW store.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm leading-6 text-slate-300">{message}</p>
          <Link
            href="/sound-library"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
          >
            Open Sound Library
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
