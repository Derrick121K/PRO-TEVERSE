/**
 * Client for gcui-art/suno-api (deployed separately).
 * @see docs/SUNO_DEPLOY.md
 */

export type SunoClip = {
  id: string
  status: string
  audio_url?: string
  title?: string
  duration?: number
}

export type SunoQuota = {
  credits_left: number
  period: string
  monthly_limit: number
  monthly_usage: number
}

export type SunoGeneratePayload = {
  prompt: string
  make_instrumental?: boolean
  wait_audio?: boolean
  model?: string
}

const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 60

function normalizeBaseUrl(base: string): string {
  return base.replace(/\/+$/, "")
}

/** Optional headers when suno-api is behind Vercel Deployment Protection. */
export function sunoRequestHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = { ...extra }
  const bypass = process.env.SUNO_VERCEL_BYPASS
  if (bypass) {
    headers["x-vercel-protection-bypass"] = bypass
  }
  return headers
}

function isReadyClip(clip: SunoClip): boolean {
  const status = (clip.status ?? "").toLowerCase()
  return (
    Boolean(clip.audio_url) &&
    (status === "streaming" || status === "complete" || status === "completed")
  )
}

export async function generateFromPrompt(
  baseUrl: string,
  payload: SunoGeneratePayload
): Promise<SunoClip[]> {
  const url = `${normalizeBaseUrl(baseUrl)}/api/generate`
  const res = await fetch(url, {
    method: "POST",
    headers: sunoRequestHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      make_instrumental: false,
      wait_audio: false,
      ...payload,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Suno generate failed (${res.status}): ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Suno generate returned no clips")
  }
  return data as SunoClip[]
}

export async function getClips(baseUrl: string, ids: string[]): Promise<SunoClip[]> {
  const idParam = ids.join(",")
  const url = `${normalizeBaseUrl(baseUrl)}/api/get?ids=${encodeURIComponent(idParam)}`
  const res = await fetch(url, { method: "GET", headers: sunoRequestHeaders() })
  if (!res.ok) {
    throw new Error(`Suno get failed (${res.status})`)
  }
  const data = await res.json()
  return Array.isArray(data) ? (data as SunoClip[]) : []
}

export async function pollUntilAudioUrl(
  baseUrl: string,
  clipIds: string[]
): Promise<{ audioUrl: string; clip: SunoClip }> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const clips = await getClips(baseUrl, clipIds)
    const ready = clips.find(isReadyClip)
    if (ready?.audio_url) {
      return { audioUrl: ready.audio_url, clip: ready }
    }
    if (attempt < MAX_POLL_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
  }
  throw new Error("Suno generation timed out waiting for audio_url")
}

export async function getQuota(baseUrl: string): Promise<SunoQuota> {
  const url = `${normalizeBaseUrl(baseUrl)}/api/get_limit`
  const res = await fetch(url, { method: "GET", headers: sunoRequestHeaders() })
  if (!res.ok) {
    throw new Error(`Suno quota failed (${res.status})`)
  }
  return res.json() as Promise<SunoQuota>
}

export function buildSunoPrompt(req: {
  prompt?: string
  style?: string
  bpm?: number
}): string {
  const parts: string[] = []
  if (req.prompt?.trim()) parts.push(req.prompt.trim())
  if (req.style?.trim()) parts.push(`Style: ${req.style.trim()}`)
  if (req.bpm) parts.push(`Tempo around ${req.bpm} BPM`)
  return parts.join(". ") || "Ambient electronic instrumental"
}

export function shouldMakeInstrumental(prompt: string): boolean {
  const p = prompt.toLowerCase()
  return (
    p.includes("instrumental") ||
    p.includes("beat only") ||
    p.includes("no vocals") ||
    p.includes("without vocals")
  )
}

/** Generate from prompt and poll until the first clip has a playable URL. */
export async function generateSunoAudio(
  baseUrl: string,
  req: { prompt?: string; style?: string; bpm?: number }
): Promise<{ audioUrl: string; title?: string }> {
  const prompt = buildSunoPrompt(req)
  const clips = await generateFromPrompt(baseUrl, {
    prompt,
    make_instrumental: shouldMakeInstrumental(prompt),
    wait_audio: false,
  })
  const ids = clips.map((c) => c.id).filter(Boolean)
  if (ids.length === 0) throw new Error("Suno returned clips without ids")
  const { audioUrl, clip } = await pollUntilAudioUrl(baseUrl, ids)
  return { audioUrl, title: clip.title }
}
