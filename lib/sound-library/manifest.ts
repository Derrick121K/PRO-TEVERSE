export type SoundLibraryItem = {
  id: string
  name: string
  category: "drums" | "bass" | "keys" | "vocals" | "fx" | "loops"
  role: "kick" | "snare" | "hat" | "perc" | "bass" | "chord" | "melody" | "vocal" | "fx" | "loop"
  path: string
  license: "own" | "cc0" | "public-domain" | "redistributable"
  bpm?: number
  key?: string
}

export const soundLibraryManifest: SoundLibraryItem[] = [
  {
    id: "placeholder-kick",
    name: "Placeholder Kick",
    category: "drums",
    role: "kick",
    path: "/sound-library/drums/README.txt",
    license: "own"
  },
  {
    id: "placeholder-log-drum",
    name: "Placeholder Log Drum",
    category: "bass",
    role: "bass",
    path: "/sound-library/bass/README.txt",
    license: "own",
    key: "C minor"
  }
]

export const soundLibraryCategories = [
  "drums",
  "bass",
  "keys",
  "vocals",
  "fx",
  "loops"
] as const
