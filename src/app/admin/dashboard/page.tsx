import Link from 'next/link'
import { FileText, File, Image, Tag, Plus, PenSquare } from 'lucide-react'
import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { getCurrentSession } from '@/lib/auth'
import { getDashboardStats } from '@/lib/dashboard'
import { db } from '@/lib/db'
import { hasRole } from '@/lib/roles'
import { CommentRepository, PostRepository } from '@/server'
import { QuickDraft } from './quick-draft'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await getCurrentSession()
  const posts = new PostRepository(db)
  const canModerate = Boolean(session && hasRole(session.user.role, 'editor'))
  const [stats, published, scheduled, drafts, comments] = await Promise.all([
    getDashboardStats(),
    posts.findPublic({ limit: 5 }),
    posts.findScheduled(5),
    session ? posts.findRecentDrafts(session.user.id) : Promise.resolve([]),
    canModerate ? new CommentRepository(db).findRecent(5) : Promise.resolve([]),
  ])
  const when = (d: Date | null) =>
    d
      ? d.toLocaleString('en', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : ''

  const kpiCards = [
    {
      label: 'Total Posts',
      icon: FileText,
      value: stats.totalPosts,
      href: '/admin/posts',
      sub: `${stats.publishedPosts} published`,
    },
    {
      label: 'Pages',
      icon: File,
      value: stats.totalPages,
      href: '/admin/pages',
      sub: 'static pages',
    },
    {
      label: 'Media Files',
      icon: Image,
      value: stats.totalMedia,
      href: '/admin/media',
      sub: 'uploaded files',
    },
    {
      label: 'Taxonomies',
      icon: Tag,
      value: stats.totalTaxonomies,
      href: '/admin/taxonomies',
      sub: 'categories & tags',
    },
  ]

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome to NextPress Admin</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(({ label, icon: Icon, value, href, sub }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Icon className="size-4" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Activity</h2>
          {scheduled.length > 0 && (
            <div className="mb-5">
              <h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                Publishing soon
              </h3>
              <ul className="space-y-1.5 text-sm">
                {scheduled.map((p) => (
                  <li key={p.id} className="flex gap-3">
                    <span className="w-32 shrink-0 text-muted-foreground">
                      {when(p.publishedAt)}
                    </span>
                    <Link
                      href={`/admin/posts/${p.id}`}
                      className="truncate text-primary hover:underline"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mb-5">
            <h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
              Recently published
            </h3>
            {published.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing published yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {published.map((p) => (
                  <li key={p.id} className="flex gap-3">
                    <span className="w-32 shrink-0 text-muted-foreground">
                      {when(p.publishedAt)}
                    </span>
                    <Link
                      href={`/admin/posts/${p.id}`}
                      className="truncate text-primary hover:underline"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {canModerate && (
            <div>
              <h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                Recent comments
              </h3>
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {comments.map((c) => (
                    <li key={c.id}>
                      <p>
                        <span className="font-medium">{c.authorName}</span>
                        <span className="text-muted-foreground"> on </span>
                        <a
                          href={`/blog/${c.postSlug}#comments`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {c.postTitle}
                        </a>
                        {c.status === 'pending' && (
                          <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                            Pending
                          </span>
                        )}
                      </p>
                      <p className="line-clamp-2 text-muted-foreground">{c.content}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/admin/comments"
                className="mt-3 inline-block text-xs text-primary hover:underline"
              >
                Manage comments
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Quick Draft</h2>
          <QuickDraft />
          {drafts.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                Your recent drafts
              </h3>
              <ul className="space-y-2 text-sm">
                {drafts.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/admin/posts/${d.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {d.title}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">{when(d.updatedAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Quick Actions</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: 'New Post', href: '/admin/posts/new', icon: PenSquare },
              { label: 'New Page', href: '/admin/pages/new', icon: Plus },
              { label: 'Upload Media', href: '/admin/media', icon: Image },
              { label: 'Settings', href: '/admin/settings', icon: Tag },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-muted"
              >
                <Icon className="size-4 text-primary" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Getting Started</h2>
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/admin/settings" className="text-primary hover:underline">
                Configure site settings
              </Link>
            </li>
            <li>
              <Link href="/admin/taxonomies" className="text-primary hover:underline">
                Create categories and tags
              </Link>
            </li>
            <li>
              <Link href="/admin/posts/new" className="text-primary hover:underline">
                Write your first post
              </Link>
            </li>
            <li>
              <Link href="/admin/media" className="text-primary hover:underline">
                Upload media files
              </Link>
            </li>
            <li>
              <Link href="/admin/menus" className="text-primary hover:underline">
                Set up navigation menus
              </Link>
            </li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  )
}
