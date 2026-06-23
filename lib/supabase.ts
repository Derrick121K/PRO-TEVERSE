import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/** True only when real env vars are set (placeholders below are for SSG/build when unset). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// createClient throws on empty URL; use placeholders so importing this module never fails at build time.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.build-placeholder'
)

export interface Project {
  id: string
  user_id: string
  name: string
  bpm: number
  time_signature: [number, number]
  tracks: unknown
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string
  updated_at: string
}

export async function saveProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function loadProject(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  
  if (error) throw error
  return data
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function listProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
  
  if (error) throw error
}

export async function uploadAudioFile(userId: string, projectId: string, file: File) {
  const filePath = `${userId}/${projectId}/${file.name}`
  
  const { data, error } = await supabase
    .storage
    .from('audio-files')
    .upload(filePath, file)
  
  if (error) throw error
  return data
}

export function getAudioUrl(path: string) {
  const { data } = supabase.storage.from('audio-files').getPublicUrl(path)
  return data.publicUrl
}

// Realtime collaboration
export function subscribeToProject(projectId: string, callback: (payload: unknown) => void) {
  return supabase
    .channel(`project-${projectId}`)
    .on('broadcast', { event: 'update' }, ({ payload }) => callback(payload))
    .subscribe()
}

export function broadcastProjectUpdate(projectId: string, payload: unknown) {
  supabase.channel(`project-${projectId}`).send({
    type: 'broadcast',
    event: 'update',
    payload
  })
}
