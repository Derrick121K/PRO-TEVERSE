import { NextResponse } from "next/server"
import { generateAIMusic, type AIGenRequest } from "@/lib/ai-engine"

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<AIGenRequest>
  if (!body.mode) {
    return NextResponse.json({ error: "Missing mode" }, { status: 400 })
  }
  const result = await generateAIMusic(body as AIGenRequest)
  return NextResponse.json({
    mode: result.mode,
    source: result.provider,
    notes: result.notes,
    pattern: result.pattern,
    stepPattern: result.stepPattern,
    audioLoopUrl: result.audioLoopUrl,
    title: result.title ?? null,
  })
}
