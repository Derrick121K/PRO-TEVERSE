import { FLPFile } from '@holzchopf/flp-file'

/** FLPEventTypeRaw.WordTempo */
const EV_WORD_TEMPO = 66
/** TextTitle */
const EV_TEXT_TITLE = 194
/** TextComment */
const EV_TEXT_COMMENT = 195
/** TextProjectAuthor */
const EV_TEXT_AUTHOR = 204
/** TextGenre */
const EV_TEXT_GENRE = 206

export interface FlpProjectSummary {
  ok: boolean
  error?: string
  formatName: string
  ppq: number
  channelCnt: number
  bpm: number | null
  title: string | null
  author: string | null
  comment: string | null
  genre: string | null
  eventCount: number
}

export interface FlpChannelSampleRef {
  index: number
  channelName: string | null
  sampleFileName: string | null
}

export interface FlpPlaylistHint {
  startBeats: number
  durationBeats: number
}

function tempoFromWord(value: number): number {
  if (value >= 400 && value <= 30000) return Math.round(value / 10) / 10
  if (value >= 40 && value <= 600) return value
  return Math.round(value / 10) / 10
}

export function parseFlpSummary(buffer: ArrayBuffer): FlpProjectSummary {
  try {
    const f = new FLPFile()
    f.setBinary(buffer)

    let bpm: number | null = null
    let title: string | null = null
    let author: string | null = null
    let comment: string | null = null
    let genre: string | null = null

    for (const ev of f.data.events) {
      if (ev.type === EV_WORD_TEMPO && typeof ev.value === 'number') {
        bpm = tempoFromWord(ev.value)
      }
      if (ev.type === EV_TEXT_TITLE && typeof ev.value === 'string') title = ev.value
      if (ev.type === EV_TEXT_AUTHOR && typeof ev.value === 'string') author = ev.value
      if (ev.type === EV_TEXT_COMMENT && typeof ev.value === 'string') comment = ev.value
      if (ev.type === EV_TEXT_GENRE && typeof ev.value === 'string') genre = ev.value
    }

    return {
      ok: true,
      formatName: f.header.formatName,
      ppq: f.header.ppq,
      channelCnt: f.header.channelCnt,
      bpm,
      title,
      author,
      comment,
      genre,
      eventCount: f.data.events.length,
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to parse FLP',
      formatName: 'unknown',
      ppq: 0,
      channelCnt: 0,
      bpm: null,
      title: null,
      author: null,
      comment: null,
      genre: null,
      eventCount: 0,
    }
  }
}

/** FLPEventTypeRaw.WordNewChan */
const EV_WORD_NEW_CHAN = 64
/** FLPEventTypeRaw.TextChanName */
const EV_TEXT_CHAN_NAME = 192
/** FLPEventTypeRaw.TextSampleFileName */
const EV_TEXT_SAMPLE_FILE_NAME = 196

export function parseFlpChannelSampleRefs(buffer: ArrayBuffer): FlpChannelSampleRef[] {
  const f = new FLPFile()
  f.setBinary(buffer)
  const channels: FlpChannelSampleRef[] = []
  let current: FlpChannelSampleRef | null = null

  const pushCurrent = () => {
    if (!current) return
    channels.push(current)
  }

  for (const ev of f.data.events) {
    if (ev.type === EV_WORD_NEW_CHAN) {
      pushCurrent()
      current = {
        index: channels.length,
        channelName: null,
        sampleFileName: null,
      }
      continue
    }
    if (!current) continue
    if (ev.type === EV_TEXT_CHAN_NAME && typeof ev.value === "string") {
      current.channelName = ev.value
      continue
    }
    if (ev.type === EV_TEXT_SAMPLE_FILE_NAME && typeof ev.value === "string") {
      current.sampleFileName = ev.value
      continue
    }
  }
  pushCurrent()
  return channels
}

/** FLPEventTypeRaw.DataPlayListItems */
const EV_DATA_PLAYLIST_ITEMS = 233

/**
 * Best-effort parser for FL Playlist item timing.
 * Format can vary by FL version; this parser is intentionally conservative and
 * only returns plausible beat ranges, otherwise it returns an empty list.
 */
export function parseFlpPlaylistHints(buffer: ArrayBuffer): FlpPlaylistHint[] {
  const f = new FLPFile()
  f.setBinary(buffer)
  const ppq = Math.max(1, f.header.ppq || 96)
  const hints: FlpPlaylistHint[] = []

  const events = f.data.events.filter((ev) => ev.type === EV_DATA_PLAYLIST_ITEMS && ev.value instanceof ArrayBuffer)
  for (const ev of events) {
    const ab = ev.value as ArrayBuffer
    if (ab.byteLength < 24) continue
    const dv = new DataView(ab)
    // Many FL versions store playlist items in fixed records (often 24 bytes).
    const recordSize = 24
    if (ab.byteLength % recordSize !== 0) continue
    for (let off = 0; off < ab.byteLength; off += recordSize) {
      const p0 = dv.getUint32(off + 0, true)
      const p3 = dv.getUint32(off + 12, true)
      const startBeats = p0 / ppq
      const durationBeats = p3 / ppq
      // Filter to plausible values only.
      if (!Number.isFinite(startBeats) || !Number.isFinite(durationBeats)) continue
      if (startBeats < 0 || startBeats > 4096) continue
      if (durationBeats <= 0 || durationBeats > 512) continue
      hints.push({
        startBeats: Math.round(startBeats * 100) / 100,
        durationBeats: Math.max(0.25, Math.round(durationBeats * 100) / 100),
      })
    }
  }

  // Deduplicate and sort for stable downstream mapping.
  const seen = new Set<string>()
  return hints
    .filter((h) => {
      const key = `${h.startBeats}:${h.durationBeats}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.startBeats - b.startBeats)
}

const FLP_INDEX_KEY = 'PRO-TEVERSE-flp-library'

export interface SavedFlpEntry {
  id: string
  fileName: string
  addedAt: string
  summary: FlpProjectSummary
}

export function loadFlpLibrary(): SavedFlpEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(FLP_INDEX_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedFlpEntry[]
  } catch {
    return []
  }
}

export function saveFlpToLibrary(fileName: string, summary: FlpProjectSummary): SavedFlpEntry {
  const entry: SavedFlpEntry = {
    id: `flp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    fileName,
    addedAt: new Date().toISOString(),
    summary,
  }
  const list = [entry, ...loadFlpLibrary()].slice(0, 50)
  localStorage.setItem(FLP_INDEX_KEY, JSON.stringify(list))
  return entry
}

export function clearFlpLibrary() {
  localStorage.removeItem(FLP_INDEX_KEY)
}

