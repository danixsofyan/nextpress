'use client'

import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Monitor,
  Moon,
  PanelLeft,
  Search,
  Sun,
  UserRound,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { useAdminUser } from './admin-session'
import Link from 'next/link'
import { isRole, ROLE_LABELS } from '@/lib/roles'

function ThemeDropdown() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="size-9" />

  const icon =
    theme === 'dark' ? (
      <Moon className="size-5" />
    ) : theme === 'light' ? (
      <Sun className="size-5" />
    ) : (
      <Monitor className="size-5" />
    )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        aria-label="Toggle theme"
      >
        {icon}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            role="presentation"
          />
          <div className="absolute right-0 z-20 mt-2 w-32 rounded-lg border border-border bg-background shadow-lg">
            {[
              { key: 'light', icon: <Sun className="size-4" />, label: 'Light' },
              { key: 'system', icon: <Monitor className="size-4" />, label: 'System' },
              { key: 'dark', icon: <Moon className="size-4" />, label: 'Dark' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTheme(key)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-muted ${theme === key ? 'font-medium text-primary' : 'text-foreground'}`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function UserDropdown() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const user = useAdminUser()
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="size-8 w-24 animate-pulse rounded-lg bg-muted" />

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg p-0.5 transition-colors hover:bg-muted"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {(user?.name ?? '?').charAt(0).toUpperCase()}
        </div>
        <div className="hidden flex-col items-start px-1 md:flex">
          <span className="text-xs leading-none font-bold">{user?.name}</span>
          <span className="mt-1 text-[10px] leading-none text-muted-foreground">
            {isRole(user?.role) ? ROLE_LABELS[user.role] : ''}
          </span>
        </div>
        <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            role="presentation"
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border bg-background shadow-lg">
            <div className="border-b border-border px-3 py-2">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="p-1">
              <Link
                href="/admin/profile"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <UserRound className="size-4" /> Profile
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PostSearch() {
  const [query, setQuery] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        window.location.assign(
          `/admin/posts${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`
        )
      }}
      className="relative hidden lg:block"
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts…"
        aria-label="Search posts"
        className="w-64 rounded-lg border-none bg-muted py-2 pr-4 pl-9 text-sm transition-shadow outline-none focus:ring-2 focus:ring-ring"
      />
    </form>
  )
}

type HeaderProps = { onToggleSidebar: () => void }

export function DashboardHeader({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PanelLeft className="size-5" />
        </button>
        <span className="text-sm font-bold tracking-tight md:hidden">NextPress</span>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1 md:gap-3">
        <PostSearch />
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          aria-label="Visit site"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-4" />
          <span className="hidden sm:inline">Visit site</span>
        </a>
        <ThemeDropdown />
        <UserDropdown />
      </div>
    </header>
  )
}
