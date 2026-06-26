"use client"

import { useCallback } from 'react'
import { useDAWStore, type Track } from './daw-store'
import { createDefaultStepSequencerState, type StepSequencerState } from './daw-step-sequencer-defaults'
import { createInitialPatterns, type DawPattern } from './daw-patterns'

export function normalizeTracks(tracks: Track[]): Track[] {
  return tracks.map((t) => ({
    ...t,
    instrument: t.instrument ?? 'lead',
    clips: (t.clips ?? []).map((c) => ({
      ...c,
      clipType: c.clipType ?? (c.audioUrl && !(c.notes?.length ?? 0) ? 'audio' : 'midi'),
    })),
  }))
}

interface ProjectData {
  version: string
  name: string
  bpm: number
  timeSignature: [number, number]
  tracks: Track[]
  masterVolume: number
  createdAt: string
  modifiedAt: string
  stepSequencer?: StepSequencerState
  patterns?: DawPattern[]
  currentPatternId?: string
  metronomeEnabled?: boolean
  metronomeVolume?: number
}

const STORAGE_KEY = 'PRO-TEVERSE-projects'
const CURRENT_PROJECT_KEY = 'PRO-TEVERSE-current'

export function useProjectManager() {
  // Save current project to localStorage
  const saveProject = useCallback((name?: string) => {
    const projectName = name || `Project ${new Date().toLocaleDateString()}`
    const s = useDAWStore.getState()
    const { bpm, timeSignature, tracks, masterVolume, stepSequencer, patterns, currentPatternId, metronomeEnabled, metronomeVolume } = s
    const projectData: ProjectData = {
      version: '2.1',
      name: projectName,
      bpm,
      timeSignature,
      tracks,
      masterVolume,
      stepSequencer: JSON.parse(JSON.stringify(stepSequencer)) as StepSequencerState,
      patterns: JSON.parse(JSON.stringify(patterns)) as DawPattern[],
      currentPatternId,
      metronomeEnabled,
      metronomeVolume,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    }

    // Save to current project
    localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(projectData))

    // Also save to projects list
    const existing = localStorage.getItem(STORAGE_KEY)
    const projects: ProjectData[] = existing ? JSON.parse(existing) : []
    
    // Update or add project
    const existingIdx = projects.findIndex(p => p.name === projectName)
    if (existingIdx >= 0) {
      projects[existingIdx] = projectData
    } else {
      projects.push(projectData)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    
    return { success: true, name: projectName }
  }, [])

  // Load project from localStorage
  const loadProject = useCallback((name: string) => {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (!existing) return { success: false, error: 'No projects found' }
    
    const projects: ProjectData[] = JSON.parse(existing)
    const project = projects.find(p => p.name === name)
    
    if (!project) return { success: false, error: 'Project not found' }
    
    const initial = createInitialPatterns()
    useDAWStore.setState({
      tracks: normalizeTracks(project.tracks),
      bpm: project.bpm,
      masterVolume: project.masterVolume,
      timeSignature: project.timeSignature,
      patterns: project.patterns ?? initial.patterns,
      currentPatternId: project.currentPatternId ?? initial.currentPatternId,
      stepSequencer: project.stepSequencer ?? createDefaultStepSequencerState(),
      metronomeEnabled: project.metronomeEnabled ?? false,
      metronomeVolume: project.metronomeVolume ?? 0.65,
    })
    
    return { success: true, data: project }
  }, [])

  // Quick save (auto-save)
  const quickSave = useCallback(() => {
    return saveProject()
  }, [saveProject])

  // Export project as JSON file
  const exportProject = useCallback(() => {
    const s = useDAWStore.getState()
    const { bpm, timeSignature, tracks, masterVolume, stepSequencer, patterns, currentPatternId, metronomeEnabled, metronomeVolume } = s
    const projectData: ProjectData = {
      version: '2.1',
      name: 'Exported Project',
      bpm,
      timeSignature,
      tracks,
      masterVolume,
      stepSequencer: JSON.parse(JSON.stringify(stepSequencer)) as StepSequencerState,
      patterns: JSON.parse(JSON.stringify(patterns)) as DawPattern[],
      currentPatternId,
      metronomeEnabled,
      metronomeVolume,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PRO-TEVERSE-project-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    return { success: true }
  }, [])

  // Import project from JSON file
  const importProject = useCallback((file: File): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as ProjectData
          
          if (!data.version || !data.tracks) {
            resolve({ success: false, error: 'Invalid project file' })
            return
          }

          useDAWStore.setState({
            tracks: normalizeTracks(data.tracks as Track[]),
            bpm: data.bpm || 120,
            masterVolume: data.masterVolume ?? 0.8,
            timeSignature: data.timeSignature || [4, 4],
            stepSequencer: (data as ProjectData).stepSequencer ?? createDefaultStepSequencerState(),
            metronomeEnabled: (data as ProjectData).metronomeEnabled ?? false,
            metronomeVolume: (data as ProjectData).metronomeVolume ?? 0.65,
          })

          resolve({ success: true })
        } catch {
          resolve({ success: false, error: 'Failed to parse project file' })
        }
      }
      reader.readAsText(file)
    })
  }, [])

  // Get list of saved projects
  const getProjectList = useCallback((): { name: string; modifiedAt: string; tracks: number }[] => {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (!existing) return []
    
    const projects: ProjectData[] = JSON.parse(existing)
    return projects.map(p => ({
      name: p.name,
      modifiedAt: p.modifiedAt,
      tracks: p.tracks?.length || 0
    }))
  }, [])

  // Delete a project
  const deleteProject = useCallback((name: string) => {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (!existing) return

    const projects: ProjectData[] = JSON.parse(existing)
    const filtered = projects.filter(p => p.name !== name)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  }, [])

  // Clear current project
  const clearProject = useCallback(() => {
    useDAWStore.setState({
      tracks: [],
      bpm: 120,
      masterVolume: 0.8,
      currentBeat: 0,
      isPlaying: false,
    })
    localStorage.removeItem(CURRENT_PROJECT_KEY)
  }, [])

  return {
    saveProject,
    loadProject,
    quickSave,
    exportProject,
    importProject,
    getProjectList,
    deleteProject,
    clearProject
  }
}

// Audio recording helper
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16
  
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  
  const dataLength = buffer.length * blockAlign
  const bufferLength = 44 + dataLength
  
  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)
  
  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)
  
  // Interleave channel data
  const offset = 44
  const channelData = Array.from({ length: numChannels }, (_, i) => buffer.getChannelData(i))
  
  let pos = offset
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]))
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      pos += 2
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

