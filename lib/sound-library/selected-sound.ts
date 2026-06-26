import type { SoundLibraryItem } from "@/lib/sound-library/manifest"

export const SOUND_LIBRARY_SELECTED_KEY = "proteverse-selected-sound"

export type SelectedSound = SoundLibraryItem & {
  source: "sound-library"
  selectedAt: string
}

export function canPreviewSoundPath(path: string) {
  return /\.(wav|mp3|ogg|m4a|aac|flac)$/i.test(path)
}

export function createSelectedSound(item: SoundLibraryItem): SelectedSound {
  return {
    ...item,
    source: "sound-library",
    selectedAt: new Date().toISOString(),
  }
}
