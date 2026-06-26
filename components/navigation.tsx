"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/sound-library", label: "Sound Library" },
    { href: "/zip-studio", label: "ZIP Studio" },
    { href: "/pro-studio", label: "Pro Studio" },
    { href: "/studio", label: "Studio" },
    { href: "/ai-creator", label: "AI Producer" },
  { href: "/export", label: "Export" },
    { href: "/settings", label: "Settings" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="PRO-TEVERSE Logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          <span className="text-xl font-bold gradient-text">PRO-TEVERSE</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Button>
          </Link>
          <Link href="/export">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Export
            </Button>
          </Link>
          <Link href="/pro-studio">
            <Button className="bg-neon-cyan text-background hover:bg-neon-cyan/90 glow-cyan">
              Launch Studio
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-strong border-t border-border">
          <div className="px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="ghost" className="w-full justify-center text-muted-foreground">
                Sign In
              </Button>
              <Link href="/pro-studio" className="w-full">
                <Button className="w-full bg-neon-cyan text-background hover:bg-neon-cyan/90">
                  Launch Studio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

