"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/studio", label: "Studio" },
  { href: "/pro-studio", label: "Pro Studio" },
  { href: "/zip-studio", label: "ZIP Studio" },
  { href: "/sound-library", label: "Sound Library" },
  { href: "/ai-creator", label: "AI Producer" },
  { href: "/export", label: "Export" },
  { href: "/settings", label: "Settings" },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-background/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="PRO-TEVERSE Logo"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="text-lg font-black tracking-wide gradient-text md:text-xl">
            PRO-TEVERSE
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-4 xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground 2xl:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <Link href="/pro-studio">
            <Button className="bg-neon-cyan px-5 text-background hover:bg-neon-cyan/90 glow-cyan">
              Launch Studio
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-xl border border-white/10 p-2 text-muted-foreground hover:text-foreground xl:hidden"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-background/95 px-6 py-4 backdrop-blur-xl xl:hidden">
          <div className="grid gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <Link href="/pro-studio" onClick={() => setMobileMenuOpen(false)}>
              <Button className="mt-3 w-full bg-neon-cyan text-background hover:bg-neon-cyan/90">
                Launch Studio
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
