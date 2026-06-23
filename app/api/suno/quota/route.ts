import { NextResponse } from "next/server"
import { getQuota } from "@/lib/suno-client"

export async function GET() {
  const baseUrl = process.env.SUNO_API_URL
  if (!baseUrl) {
    return NextResponse.json(
      { configured: false, error: "SUNO_API_URL is not set" },
      { status: 503 }
    )
  }
  try {
    const quota = await getQuota(baseUrl)
    return NextResponse.json({ configured: true, quota })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch Suno quota"
    return NextResponse.json({ configured: true, error: message }, { status: 502 })
  }
}
