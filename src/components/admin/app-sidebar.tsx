'use client'

import { type Role, hasRole } from '@/lib/roles'
import { useAdminUser } from './admin-session'
import {
  BookOpen,
  ChevronDown,
  File,
  FileText,
  HandHeart,
  Image,
  LayoutDashboard,
  Menu,
  Palette,
  Plug,
  Settings,
  Tag,
  Upload,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type NavItem = { href: string; icon: typeof File; label: string; min: Role }
type NavGroup = { key: string; label: string | null; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    key: 'main',
    label: null,
    items: [{ href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', min: 'author' }],
  },
  {
    key: 'content',
    label: 'Content',
    items: [
      { href: '/admin/posts', icon: FileText, label: 'Posts', min: 'author' },
      { href: '/admin/pages', icon: File, label: 'Pages', min: 'editor' },
      { href: '/admin/media', icon: Image, label: 'Media', min: 'author' },
    ],
  },
  {
    key: 'structure',
    label: 'Structure',
    items: [
      { href: '/admin/taxonomies', icon: Tag, label: 'Taxonomies', min: 'editor' },
      { href: '/admin/menus', icon: Menu, label: 'Menus', min: 'editor' },
      { href: '/admin/appearance', icon: Palette, label: 'Appearance', min: 'administrator' },
      { href: '/admin/plugins', icon: Plug, label: 'Plugins', min: 'administrator' },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    items: [
      { href: '/admin/users', icon: Users, label: 'Users', min: 'administrator' },
      { href: '/admin/donations', icon: HandHeart, label: 'Donations', min: 'administrator' },
      { href: '/admin/tools/import', icon: Upload, label: 'Import', min: 'administrator' },
      { href: '/admin/settings', icon: Settings, label: 'Settings', min: 'administrator' },
    ],
  },
  {
    key: 'account',
    label: 'Account',
    items: [{ href: '/admin/profile', icon: UserRound, label: 'Profile', min: 'author' }],
  },
]

const GROUPS_KEY = 'nextpress.sidebar.groups'
let cachedClosedGroups: string[] | null = null

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const role = useAdminUser()?.role ?? ''
  const [closed, setClosed] = useState<string[]>(cachedClosedGroups ?? [])

  useEffect(() => {
    if (cachedClosedGroups === null) {
      try {
        const parsed = JSON.parse(localStorage.getItem(GROUPS_KEY) ?? '[]')
        cachedClosedGroups = Array.isArray(parsed)
          ? parsed.filter((x) => typeof x === 'string')
          : []
      } catch {
        cachedClosedGroups = []
      }
      setClosed(cachedClosedGroups)
    }
  }, [])

  function toggleGroup(key: string) {
    setClosed((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      cachedClosedGroups = next
      try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const groups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => hasRole(role, i.min)) }))
    .filter((g) => g.items.length > 0)

  return (
    <nav className="flex flex-col gap-6" aria-label="Admin">
      {groups.map((group) => {
        const hasActive = group.items.some((i) => isActive(pathname, i.href))
        const open = collapsed || !group.label || !closed.includes(group.key) || hasActive
        const listId = `nav-group-${group.key}`
        return (
          <div key={group.key} className="px-3">
            {group.label && !collapsed && (
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                aria-expanded={open}
                aria-controls={listId}
                className="mb-2 flex w-full items-center justify-between px-3 text-[10px] font-bold tracking-[0.15em] text-muted-foreground/60 uppercase transition-colors hover:text-muted-foreground"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={`size-3.5 transition-transform ${open ? '' : '-rotate-90'}`}
                />
              </button>
            )}
            {open && (
              <ul id={listId} className="space-y-1">
                {group.items.map(({ href, icon: Icon, label }) => {
                  const active = isActive(pathname, href)
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        title={collapsed ? label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm transition-all ${
                          active
                            ? 'bg-primary/10 font-bold text-primary'
                            : 'font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        } ${collapsed ? 'justify-center' : ''}`}
                      >
                        <Icon
                          className={`size-[18px] shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted-foreground/80 group-hover:text-foreground'}`}
                        />
                        {collapsed ? (
                          <span className="sr-only">{label}</span>
                        ) : (
                          <span>{label}</span>
                        )}
                        {active && !collapsed && (
                          <span className="absolute top-1/2 -right-3 h-5 w-[3px] -translate-y-1/2 rounded-l-full bg-primary" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/admin/dashboard"
      className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BookOpen className="size-4" />
      </span>
      {!collapsed && <span className="text-base font-bold tracking-tight">NextPress</span>}
    </Link>
  )
}

type Props = { collapsed: boolean; mobileOpen: boolean; onCloseMobile: () => void }

export function AppSidebar({ collapsed, mobileOpen, onCloseMobile }: Props) {
  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex ${collapsed ? 'w-[72px]' : 'w-64'}`}
      >
        <div
          className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center px-3' : 'px-6'}`}
        >
          <Brand collapsed={collapsed} />
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <SidebarNav collapsed={collapsed} />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/50"
          />
          <aside
            aria-label="Admin menu"
            className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-6">
              <Brand collapsed={false} />
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6">
              <SidebarNav collapsed={false} />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
