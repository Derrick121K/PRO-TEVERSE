import { NextResponse } from "next/server"
import { getQuota } from "@/lib/suno-client"

export async function GET() {
  const baseUrl = process.env.SUNO_API_URL?.trim()

  if (!baseUrl) {
    return NextResponse.json({
      configured: false,
      available: false,
      quota: null,
      error: "SUNO_API_URL is not set. Suno integration is optional and currently disabled.",
    })
  }

  try {
    const quota = await getQuota(baseUrl)

    return NextResponse.json({
      configured: true,
      available: true,
      quota,
      error: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch Suno quota"

    return NextResponse.json({
      configured: true,
      available: false,
      quota: null,
      error: `Suno service is configured but not reachable: ${message}`,
    })
  }
}
