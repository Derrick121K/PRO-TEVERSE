"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Music, ExternalLink, Loader2, AlertCircle } from "lucide-react"
import type { SunoQuota } from "@/lib/suno-client"

type QuotaResponse = {
  configured: boolean
  quota?: SunoQuota
  error?: string
}

export function SunoQuotaCard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<QuotaResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/suno/quota")
        const json = (await res.json()) as QuotaResponse
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setData({ configured: false, error: "Could not reach quota API" })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card className="bg-surface-1 border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Music className="h-5 w-5 text-neon-purple" />
          PRO-TEEVERSE Suno
        </CardTitle>
        <CardDescription>
          Bundled service in <code className="text-xs">services/suno-api</code>. Run{" "}
          <code className="text-xs">npm run suno:dev</code> — see{" "}
          <code className="text-xs">docs/SUNO_DEPLOY.md</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking PRO-TEEVERSE Suno…
          </p>
        )}
        {!loading && data && !data.configured && (
          <div className="flex gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <p>
              <code className="text-xs bg-surface-2 px-1 rounded">SUNO_API_URL</code> is not set on the server.
              Add it in <code className="text-xs bg-surface-2 px-1 rounded">.env.local</code> and run{" "}
              <code className="text-xs bg-surface-2 px-1 rounded">npm run suno:dev</code> (see{" "}
              <code className="text-xs bg-surface-2 px-1 rounded">docs/SUNO_DEPLOY.md</code>). Text to
              Music uses offline MIDI until configured.
            </p>
          </div>
        )}
        {!loading && data?.configured && data.quota && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <dt className="text-muted-foreground">Credits left</dt>
            <dd className="font-medium text-neon-cyan">{data.quota.credits_left}</dd>
            <dt className="text-muted-foreground">Period</dt>
            <dd>{data.quota.period}</dd>
            <dt className="text-muted-foreground">Monthly usage</dt>
            <dd>
              {data.quota.monthly_usage} / {data.quota.monthly_limit}
            </dd>
          </dl>
        )}
        {!loading && data?.configured && data.error && (
          <p className="text-amber-300/90 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {data.error}
          </p>
        )}
        <a
          href="https://suno.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline"
        >
          suno.com account
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  )
}
