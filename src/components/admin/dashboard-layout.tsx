'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppSidebar } from './app-sidebar'
import { DashboardHeader } from './dashboard-header'

const COLLAPSED_KEY = 'nextpress.sidebar.collapsed'
let cachedCollapsed: boolean | null = null

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(() => cachedCollapsed ?? false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (cachedCollapsed !== null) return
    try {
      cachedCollapsed = localStorage.getItem(COLLAPSED_KEY) === '1'
    } catch {
      cachedCollapsed = false
    }
    setCollapsed(cachedCollapsed)
  }, [])

  useEffect(() => {
    if (pathname) setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  function toggleSidebar() {
    if (!window.matchMedia('(min-width: 768px)').matches) {
      setMobileOpen((open) => !open)
      return
    }
    setCollapsed((prev) => {
      const next = !prev
      cachedCollapsed = next
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0')
      } catch {}
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
