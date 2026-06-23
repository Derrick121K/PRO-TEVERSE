"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDAWStore } from "@/lib/daw-store"
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Volume2,
  Waves,
  Radio,
  Monitor,
  AlertCircle
} from "lucide-react"

interface Recording {
  id: string
  name: string
  duration: number
  timestamp: Date
  blob?: Blob
  url?: string
}

interface AudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  inputLevel: number
}

export function VocalRecorder() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    inputLevel: 0
  })
  const [selectedDevice, setSelectedDevice] = useState<string>("default")
  const [monitorEnabled, setMonitorEnabled] = useState(true)
  const [monitorVolume, setMonitorVolume] = useState(50)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)

  const { addTrack, addClip, tracks } = useDAWStore()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`
  }

  const updateInputLevel = useCallback(() => {
    if (analyserRef.current && state.isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      setState(s => ({ ...s, inputLevel: average / 255 }))
      animationRef.current = requestAnimationFrame(updateInputLevel)
    }
  }, [state.isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          deviceId: selectedDevice !== 'default' ? { exact: selectedDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      streamRef.current = stream

      // Set up audio context for monitoring
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Create monitor output if enabled
      if (monitorEnabled && audioContextRef.current) {
        const monitorGain = audioContextRef.current.createGain()
        monitorGain.gain.value = monitorVolume / 100
        source.connect(monitorGain)
        monitorGain.connect(audioContextRef.current.destination)
      }

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const newRecording: Recording = {
          id: `rec-${Date.now()}`,
          name: `Recording ${recordings.length + 1}`,
          duration: state.recordingTime,
          timestamp: new Date(),
          blob,
          url
        }
        setRecordings(prev => [...prev, newRecording])
      }

      mediaRecorderRef.current.start(100)
      
      setState(s => ({ 
        ...s, 
        isRecording: true, 
        isPaused: false, 
        recordingTime: 0 
      }))

      // Start timer
      timerRef.current = setInterval(() => {
        setState(s => ({ ...s, recordingTime: s.recordingTime + 0.1 }))
      }, 100)

      // Start level monitoring
      animationRef.current = requestAnimationFrame(updateInputLevel)

    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop()
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      setState(s => ({ 
        ...s, 
        isRecording: false, 
        isPaused: false,
        inputLevel: 0
      }))
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setState(s => ({ ...s, isPaused: true }))
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setState(s => ({ ...s, recordingTime: s.recordingTime + 0.1 }))
      }, 100)
      setState(s => ({ ...s, isPaused: false }))
    }
  }

  const deleteRecording = (id: string) => {
    setRecordings(prev => {
      const rec = prev.find(r => r.id === id)
      if (rec?.url) URL.revokeObjectURL(rec.url)
      return prev.filter(r => r.id !== id)
    })
  }

  const addRecordingToTrack = (recording: Recording) => {
    const trackName = `Vocals ${tracks.length + 1}`
    addTrack('audio', trackName)
    
    // Get the new track ID
    setTimeout(() => {
      const state = useDAWStore.getState()
      const newTrack = state.tracks.find(t => t.name === trackName)
      if (newTrack) {
        addClip(newTrack.id, {
          trackId: newTrack.id,
          name: recording.name,
          start: 0,
          duration: recording.duration,
          color: '#ec4899',
          notes: [],
          audioUrl: recording.url
        })
      }
    }, 0)
  }

  const downloadRecording = (recording: Recording) => {
    if (recording.blob) {
      const a = document.createElement('a')
      a.href = recording.url!
      a.download = `${recording.name}.webm`
      a.click()
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
      recordings.forEach(r => r.url && URL.revokeObjectURL(r.url))
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-surface-1">
      {/* Header */}
      <div className="h-10 bg-surface-2 border-b border-border flex items-center px-3">
        <Mic className="h-4 w-4 text-neon-pink mr-2" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Vocal Recorder
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Recording Controls */}
        <Card className="bg-surface-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Radio className="h-4 w-4 text-neon-pink" />
              Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input Selection */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Input Device</label>
              <select
                className="w-full h-8 px-2 text-sm bg-surface-1 border border-border rounded text-foreground"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                <option value="default">System Default</option>
                <option value="builtin">Built-in Microphone</option>
              </select>
            </div>

            {/* Monitor */}
            <div className="flex items-center gap-2">
              <Button
                variant={monitorEnabled ? "default" : "outline"}
                size="sm"
                className={monitorEnabled ? "bg-neon-cyan text-background" : ""}
                onClick={() => setMonitorEnabled(!monitorEnabled)}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              {monitorEnabled && (
                <Slider
                  value={[monitorVolume]}
                  onValueChange={([v]) => setMonitorVolume(v)}
                  max={100}
                  className="flex-1"
                />
              )}
            </div>

            {/* Level Meter */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Volume2 className="h-3 w-3 text-muted-foreground" />
                <div className="flex-1 h-2 bg-surface-1 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                    style={{ width: `${state.inputLevel * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Time Display */}
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-foreground">
                {formatTime(state.recordingTime)}
              </div>
              {state.isRecording && (
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-500">
                    {state.isPaused ? 'PAUSED' : 'RECORDING'}
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              {!state.isRecording ? (
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={startRecording}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <>
                  {state.isPaused ? (
                    <Button
                      variant="outline"
                      onClick={resumeRecording}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={pauseRecording}
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={stopRecording}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recordings List */}
        <Card className="bg-surface-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Waves className="h-4 w-4 text-neon-cyan" />
              Recordings ({recordings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recordings.length === 0 ? (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">No recordings yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center gap-2 p-2 bg-surface-1 rounded-lg"
                  >
                    <audio src={rec.url} controls className="h-8 flex-1" />
                    <div className="text-xs text-muted-foreground">
                      {formatTime(rec.duration)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-neon-cyan"
                      onClick={() => addRecordingToTrack(rec)}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-neon-cyan"
                      onClick={() => downloadRecording(rec)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteRecording(rec.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="p-3 bg-surface-2 rounded-lg border border-neon-pink/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-neon-pink" />
            <span className="text-xs font-medium text-foreground">Recording Tips</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Use headphones to avoid feedback. Keep the microphone close for better quality.
            Enable monitoring to hear yourself while recording.
          </p>
        </div>
      </div>
    </div>
  )
}