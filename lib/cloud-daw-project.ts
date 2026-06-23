/**
 * Supabase: save / load the full DAW v2 state (tracks, step sequencer, metronome, transport defaults).
 * Expects a `projects` table with: id, user_id, name, bpm, time_signature, tracks (jsonb), created_at, updated_at.
 * The `tracks` column stores either legacy `Track[]` or a v2 blob `{ v: 2, ... }`.
 */

import { supabase, isSupabaseConfigured, type Project as DbProject } from '@/lib/supabase'
import { useDAWStore, type Track } from '@/lib/daw-store'
import type { StepSequencerState } from '@/lib/daw-step-sequencer-defaults'
import { normalizeTracks } from '@/lib/project-manager'

export const CLOUD_DAW_V = 2 as const

export type CloudDawPayloadV2 = {
  v: typeof CLOUD_DAW_V
  tracks: Track[]
  bpm: number
  timeSignature: [number, number]
  masterVolume: number
  stepSequencer: StepSequencerState
  metronomeEnabled: boolean
  metronomeVolume: number
}

function snapshotToPayload(): CloudDawPayloadV2 {
  const s = useDAWStore.getState()
  return {
    v: CLOUD_DAW_V,
    tracks: JSON.parse(JSON.stringify(s.tracks)) as Track[],
    bpm: s.bpm,
    timeSignature: [s.timeSignature[0], s.timeSignature[1]] as [number, number],
    masterVolume: s.masterVolume,
    stepSequencer: JSON.parse(JSON.stringify(s.stepSequencer)) as StepSequencerState,
    metronomeEnabled: s.metronomeEnabled,
    metronomeVolume: s.metronomeVolume,
  }
}

export function applyCloudDawPayload(payload: CloudDawPayloadV2) {
  useDAWStore.setState({
    tracks: normalizeTracks(payload.tracks),
    bpm: payload.bpm,
    timeSignature: payload.timeSignature,
    masterVolume: payload.masterVolume,
    stepSequencer: payload.stepSequencer,
    metronomeEnabled: payload.metronomeEnabled,
    metronomeVolume: payload.metronomeVolume,
  })
}

function isV2Row(raw: unknown): raw is CloudDawPayloadV2 {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    (raw as { v?: number }).v === CLOUD_DAW_V &&
    Array.isArray((raw as CloudDawPayloadV2).tracks)
  )
}

export function applyFromProjectsTableTracks(
  bpm: number,
  timeSignature: [number, number],
  rawTracks: unknown
) {
  if (isV2Row(rawTracks)) {
    applyCloudDawPayload(rawTracks)
    return
  }
  if (Array.isArray(rawTracks)) {
    useDAWStore.setState({
      tracks: normalizeTracks(rawTracks as Track[]),
      bpm,
      timeSignature: [timeSignature[0], timeSignature[1]] as [number, number],
    })
  }
}

export function isCloudProjectConfigured() {
  return isSupabaseConfigured
}

export async function saveCurrentDawToCloud(name: string) {
  if (!isSupabaseConfigured) {
    return { success: false as const, error: 'Supabase is not configured (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).' }
  }
  const { data: u, error: userErr } = await supabase.auth.getUser()
  if (userErr) return { success: false as const, error: userErr.message }
  const user = u.user
  if (!user) {
    return { success: false as const, error: 'Sign in to save projects to the cloud.' }
  }
  const payload = snapshotToPayload()
  const insert: Omit<DbProject, 'id' | 'created_at' | 'updated_at'> = {
    user_id: user.id,
    name: name || `Project ${new Date().toLocaleString()}`,
    bpm: payload.bpm,
    time_signature: payload.timeSignature,
    tracks: payload as unknown as DbProject['tracks'],
  }
  const { data, error } = await supabase.from('projects').insert(insert).select().single()
  if (error) return { success: false as const, error: error.message }
  return { success: true as const, data }
}

export async function autoSaveCurrentDawToCloud(name = "Autosave") {
  if (!isSupabaseConfigured) {
    return { success: false as const, error: "Supabase is not configured." }
  }
  const { data: u, error: userErr } = await supabase.auth.getUser()
  if (userErr) return { success: false as const, error: userErr.message }
  const user = u.user
  if (!user) {
    return { success: false as const, error: "Sign in to enable cloud autosave." }
  }
  const payload = snapshotToPayload()
  const { data: existing, error: lookupError } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", name)
    .maybeSingle()
  if (lookupError) return { success: false as const, error: lookupError.message }

  if (existing?.id) {
    const { data, error } = await supabase
      .from("projects")
      .update({
        bpm: payload.bpm,
        time_signature: payload.timeSignature,
        tracks: payload as unknown as DbProject["tracks"],
      })
      .eq("id", existing.id)
      .select()
      .single()
    if (error) return { success: false as const, error: error.message }
    return { success: true as const, data }
  }

  const insert: Omit<DbProject, "id" | "created_at" | "updated_at"> = {
    user_id: user.id,
    name,
    bpm: payload.bpm,
    time_signature: payload.timeSignature,
    tracks: payload as unknown as DbProject["tracks"],
  }
  const { data, error } = await supabase.from("projects").insert(insert).select().single()
  if (error) return { success: false as const, error: error.message }
  return { success: true as const, data }
}

export async function listMyCloudDawProjects() {
  if (!isSupabaseConfigured) {
    return { success: false as const, error: 'Not configured', rows: [] as DbProject[] }
  }
  const { data: u, error: userErr } = await supabase.auth.getUser()
  if (userErr) return { success: false as const, error: userErr.message, rows: [] as DbProject[] }
  if (!u.user) return { success: false as const, error: 'Not signed in', rows: [] as DbProject[] }
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', u.user.id)
    .order('updated_at', { ascending: false })
  if (error) return { success: false as const, error: error.message, rows: [] as DbProject[] }
  return { success: true as const, error: null as string | null, rows: (data ?? []) as DbProject[] }
}

export async function loadDawFromCloudById(projectId: string) {
  if (!isSupabaseConfigured) {
    return { success: false as const, error: 'Not configured' }
  }
  const { data: row, error } = await supabase.from('projects').select('*').eq('id', projectId).single()
  if (error) return { success: false as const, error: error.message }
  if (!row) return { success: false as const, error: 'Not found' }
  applyFromProjectsTableTracks(
    row.bpm,
    row.time_signature as [number, number],
    row.tracks
  )
  return { success: true as const, error: null as string | null }
}
