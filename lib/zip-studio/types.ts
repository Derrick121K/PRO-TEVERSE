export type ZipStudioTrack = {
  name: string
  path: string
  volume: number
  muted: boolean
  startSeconds: number
  notes: string
}

export type ZipStudioProject = {
  app: "PRO-TEVERSE"
  version: 1
  projectName: string
  sourceZipName: string
  flpFileName: string | null
  bpm: number
  key: string
  updatedAt: string
  tracks: ZipStudioTrack[]
}

export const ZIP_STUDIO_SESSION_KEY = "proteverse-zip-project"
