"use client"

import { useEffect, useRef } from "react"

export function WaveformVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const bars = 64
    const barWidth = (canvas.width / window.devicePixelRatio) / bars
    let time = 0

    const animate = () => {
      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth
        
        // Create wave-like movement
        const wave1 = Math.sin(time * 0.02 + i * 0.15) * 0.5 + 0.5
        const wave2 = Math.sin(time * 0.03 + i * 0.1) * 0.3 + 0.3
        const wave3 = Math.sin(time * 0.015 + i * 0.2) * 0.2 + 0.2
        
        const barHeight = (wave1 + wave2 + wave3) * height * 0.6
        const y = (height - barHeight) / 2

        // Gradient for each bar
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
        const hue = 180 + (i / bars) * 60 // Cyan to purple gradient
        gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.8)`)
        gradient.addColorStop(0.5, `hsla(${hue + 30}, 70%, 50%, 1)`)
        gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0.8)`)

        ctx.fillStyle = gradient
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight)

        // Add glow effect
        ctx.shadowColor = `hsla(${hue}, 80%, 50%, 0.5)`
        ctx.shadowBlur = 10
      }

      ctx.shadowBlur = 0
      time++
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="relative rounded-xl overflow-hidden glass p-4">
      <canvas
        ref={canvasRef}
        className="w-full h-32 md:h-40"
        style={{ display: "block" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
    </div>
  )
}
