'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type SessionUser = { name: string; email: string }

const linkClass = 'flex h-full items-center px-3 transition-colors hover:bg-white/10'

export function AdminBar({ previewTheme }: { previewTheme?: string }) {
  const pathname = usePathname()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [editHref, setEditHref] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/get-session')
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setUser(s?.user ?? null))
      .catch(() => setUser(null))
  }, [])

  const slug = pathname.match(/^\/blog\/([^/]+)$/)?.[1]

  useEffect(() => {
    setEditHref(null)
    if (!user || !slug) return
    fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((post) => setEditHref(post?.id ? `/admin/posts/${post.id}` : null))
      .catch(() => setEditHref(null))
  }, [user, slug])

  if (!user) return null

  async function signOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.reload()
  }

  return (
    <div className="h-8 bg-neutral-900 text-[13px] text-neutral-100">
      <div className="flex h-full items-center justify-between">
        <nav className="flex h-full items-center">
          <Link href="/admin/dashboard" className={`${linkClass} font-semibold`}>
            NextPress
          </Link>
          <Link href="/admin/dashboard" className={`${linkClass} hidden sm:flex`}>
            Dashboard
          </Link>
          <Link href="/admin/posts/new" className={linkClass}>
            + New
          </Link>
          {editHref && (
            <Link href={editHref} className={linkClass}>
              Edit Post
            </Link>
          )}
        </nav>
        <div className="flex h-full items-center">
          {previewTheme && (
            <form
              method="post"
              action="/api/admin/appearance/preview"
              className="flex h-full items-center"
            >
              <span className="px-3 text-amber-300">Previewing {previewTheme}</span>
              <button type="submit" className={linkClass}>
                Exit preview
              </button>
            </form>
          )}
          <span className="hidden px-3 text-neutral-400 sm:inline">Howdy, {user.name}</span>
          <button type="button" onClick={signOut} className={linkClass}>
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
