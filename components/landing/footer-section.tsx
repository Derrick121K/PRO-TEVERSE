"use client"

import Link from "next/link"
import Image from "next/image"
import { Twitter, Youtube, Instagram, Github, Disc3 } from "lucide-react"
import { Button } from "@/components/ui/button"

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Studio", href: "/studio" },
    { label: "Download", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Tutorials", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Community", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookies", href: "#" },
    { label: "Licenses", href: "#" },
  ],
}

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Github, href: "#", label: "GitHub" },
]

export function FooterSection() {
  return (
    <footer className="border-t border-border bg-surface-1">
      {/* Newsletter Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 border-b border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Stay in the loop</h3>
            <p className="text-muted-foreground">Get updates on new features, tips, and exclusive content.</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-64 px-4 py-2 rounded-lg bg-surface-2 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            />
            <Button className="bg-neon-cyan text-background hover:bg-neon-cyan/90">
              Subscribe
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Disc3 className="h-8 w-8 text-neon-cyan" />
                <div className="absolute inset-0 blur-md bg-neon-cyan/30 rounded-full" />
              </div>
              <span className="text-lg font-bold gradient-text">PRO-TEVERSE</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              The future of music production is here.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-lg bg-surface-2 text-muted-foreground hover:text-neon-cyan hover:bg-surface-3 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PRO-TEVERSE. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with passion for music creators everywhere.
          </p>
        </div>
      </div>
    </footer>
  )
}

