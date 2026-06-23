import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const shortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === e.key.toLowerCase()
      const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
      const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey
      const altMatch = s.alt ? e.altKey : !e.altKey
      return keyMatch && ctrlMatch && shiftMatch && altMatch
    })

    if (shortcut) {
      e.preventDefault()
      shortcut.action()
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function useFocusTrap(active: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!active) return

    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    firstFocusable?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus()
          e.preventDefault()
        }
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape()
      }
    }

    document.addEventListener('keydown', handleTab)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleTab)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [active, onEscape])
}

export function AnnounceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  useEffect(() => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    announcement.textContent = message
    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [message, priority])
}

export function useRovingTabIndex<Item>(
  items: Item[],
  initialIndex: number = 0
): [number, (index: number) => void, (direction: 1 | -1) => void] {
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const setIndex = useCallback((index: number) => {
    setActiveIndex(Math.max(0, Math.min(items.length - 1, index)))
  }, [items.length])

  const move = useCallback((direction: 1 | -1) => {
    setActiveIndex(prev => {
      const next = prev + direction
      if (next < 0) return items.length - 1
      if (next >= items.length) return 0
      return next
    })
  }, [items.length])

  return [activeIndex, setIndex, move]
}

import { useState } from 'react'