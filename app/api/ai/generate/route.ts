import { NextResponse } from "next/server"
import { generateAIMusic, type AIGenRequest } from "@/lib/ai-engine"
import type { ZipStudioProject } from "@/lib/zip-studio/types"
import { buildZipProjectPrompt } from "@/lib/zip-studio/project-tools"

type AIRequestWithZip = Partial<AIGenRequest> & {
  zipProject?: ZipStudioProject | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AIRequestWithZip

    if (!body.mode) {
      return NextResponse.json({ error: "Missing mode" }, { status: 400 })
    }

    const zipPrompt = body.zipProject ? buildZipProjectPrompt(body.zipProject) : ""
    const prompt = [body.prompt || "", zipPrompt].filter(Boolean).join("\n\n")

    const request: AIGenRequest = {
      ...(body as Partial<AIGenRequest>),
      prompt,
      style:
        body.style ||
        (prompt.toLowerCase().includes("amapiano") || prompt.toLowerCase().includes("log")
          ? "amapiano"
          : undefined),
    } as AIGenRequest

    const result = await generateAIMusic(request)

    return NextResponse.json({
      mode: result.mode,
      source: result.provider,
      notes: result.notes,
      pattern: result.pattern,
      stepPattern: result.stepPattern,
      audioLoopUrl: result.audioLoopUrl,
      title: result.title ?? null,
      matchedZipProject: body.zipProject
        ? {
            projectName: body.zipProject.projectName,
            sourceZipName: body.zipProject.sourceZipName,
            trackCount: body.zipProject.tracks.length,
            activeTrackCount: body.zipProject.tracks.filter((track) => !track.muted).length,
            bpm: body.zipProject.bpm,
            key: body.zipProject.key,
          }
        : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate AI music"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
