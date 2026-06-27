"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Music2 } from "lucide-react"

const navItems = [
  { label: "Home", href: "/" },
  { label: "Studio", href: "/studio" },
  { label: "Settings", href: "/settings" },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
            <Music2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-wide text-white">PRO-TEVERSE</p>
            <p className="text-xs text-slate-400">One Offline Studio</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  active
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <Link
          href="/studio"
          className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-300"
        >
          Launch Studio
        </Link>
      </nav>
    </header>
  )
}
