"use client"

import { useEffect, useRef } from "react"
import { useDAWStore } from "@/lib/daw-store"
import { audioEngine, tracksToTrackData } from "@/lib/audio-engine"

/**
 * Single place that drives `audioEngine` during playback:
 * - syncs channel strips when the project changes
 * - starts/pauses the transport; passes step sequencer + metronome into `setPlaybackOptions`
 * - debounces rapid track edits while `isPlaying` to avoid re-entrant glitches
 */
export function AudioEngineSync() {
  const tracks = useDAWStore((s) => s.tracks)
  const isPlaying = useDAWStore((s) => s.isPlaying)
  const bpm = useDAWStore((s) => s.bpm)
  const loopEnabled = useDAWStore((s) => s.loopEnabled)
  const loopStart = useDAWStore((s) => s.loopStart)
  const loopEnd = useDAWStore((s) => s.loopEnd)
  const stepSequencer = useDAWStore((s) => s.stepSequencer)
  const metronomeEnabled = useDAWStore((s) => s.metronomeEnabled)
  const metronomeVolume = useDAWStore((s) => s.metronomeVolume)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    audioEngine.setOnBeatChange((beat) => {
      useDAWStore.setState({ currentBeat: beat })
    })
    return () => {
      audioEngine.setOnBeatChange(null)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void audioEngine.syncTracks(tracks)
    }, 40)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [tracks])

  /** Start / pause transport. */
  useEffect(() => {
    if (!isPlaying) {
      audioEngine.pause()
      return
    }
    void (async () => {
      const st = useDAWStore.getState()
      await audioEngine.syncTracks(st.tracks)
      audioEngine.setBPM(st.bpm)
      audioEngine.setMasterVolume(st.masterVolume)
      audioEngine.setLoop(st.loopEnabled, st.loopStart, st.loopEnd)
      audioEngine.setPlaybackOptions({
        stepSequencer: st.stepSequencer,
        metronomeEnabled: st.metronomeEnabled,
        metronomeVolume: st.metronomeVolume,
      })
      await audioEngine.start(tracksToTrackData(st.tracks), st.currentBeat)
    })()
  }, [isPlaying])

  /** Apply transport/runtime option changes without restarting playback. */
  useEffect(() => {
    audioEngine.setBPM(bpm)
    audioEngine.setLoop(loopEnabled, loopStart, loopEnd)
    audioEngine.setPlaybackOptions({
      stepSequencer,
      metronomeEnabled,
      metronomeVolume,
    })
  }, [bpm, loopEnabled, loopStart, loopEnd, stepSequencer, metronomeEnabled, metronomeVolume])

  return null
}
