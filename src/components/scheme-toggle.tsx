'use client'

import { Moon, Sun } from 'lucide-react'

export const SCHEME_STORAGE_KEY = 'np-scheme'

export function SchemeToggle() {
  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    const site = event.currentTarget.closest<HTMLElement>('[data-scheme]')
    if (!site) return
    const next = site.dataset.scheme === 'dark' ? 'light' : 'dark'
    site.dataset.scheme = next
    try {
      localStorage.setItem(SCHEME_STORAGE_KEY, next)
    } catch {
      return
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Sun className="hidden size-4 dark:block" aria-hidden />
      <Moon className="size-4 dark:hidden" aria-hidden />
    </button>
  )
}
