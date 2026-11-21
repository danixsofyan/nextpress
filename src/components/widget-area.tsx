import Link from 'next/link'
import type { Widget } from '@/core/validators'
import { db } from '@/lib/db'
import { getWidgetAreas } from '@/lib/widgets'
import { PostRepository, TaxonomyRepository } from '@/server'

const heading = 'mb-3 text-sm font-semibold tracking-wide text-foreground uppercase'
const linkClass = 'text-muted-foreground transition-colors hover:text-foreground'

async function WidgetView({ widget, id }: { widget: Widget; id: string }) {
  switch (widget.type) {
    case 'search':
      return (
        <form action="/search" role="search" className="flex gap-2">
          <label htmlFor={id} className="sr-only">
            Search posts
          </label>
          <input
            id={id}
            name="q"
            type="search"
            placeholder="Search…"
            className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Search
          </button>
        </form>
      )
    case 'recentPosts': {
      const posts = await new PostRepository(db).findPublic({ limit: widget.count })
      return (
        <ul className="space-y-2 text-sm">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/blog/${post.slug}`} className={linkClass}>
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      )
    }
    case 'categories':
    case 'tags': {
      const terms = await new TaxonomyRepository(db).findPublishedWithCounts(
        widget.type === 'categories' ? 'category' : 'tag'
      )
      if (terms.length === 0) return null
      const base = widget.type === 'categories' ? '/category' : '/tag'
      return widget.type === 'categories' ? (
        <ul className="space-y-2 text-sm">
          {terms.map((t) => (
            <li key={t.slug}>
              <Link href={`${base}/${t.slug}`} className={linkClass}>
                {t.name}
              </Link>
              {widget.showCounts && <span className="text-muted-foreground"> ({t.count})</span>}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-wrap gap-2 text-sm">
          {terms.map((t) => (
            <li key={t.slug}>
              <Link
                href={`${base}/${t.slug}`}
                className="inline-block rounded-full border px-3 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                #{t.name}
              </Link>
            </li>
          ))}
        </ul>
      )
    }
    case 'text':
      return <p className="text-sm whitespace-pre-line text-muted-foreground">{widget.text}</p>
    case 'links':
      return (
        <ul className="space-y-2 text-sm">
          {widget.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={linkClass}
                {...(/^https?:\/\//.test(link.href) && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                })}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )
  }
}

export async function WidgetArea({
  area,
  className,
}: {
  area: 'sidebar' | 'footer'
  className?: string
}) {
  const widgets = (await getWidgetAreas())[area]
  if (widgets.length === 0) return null
  return (
    <div className={className} aria-label={area === 'sidebar' ? 'Sidebar' : 'Footer widgets'}>
      {widgets.map((widget, index) => (
        <section key={`${widget.type}-${index}`}>
          {widget.title && <h2 className={heading}>{widget.title}</h2>}
          <WidgetView widget={widget} id={`${area}-widget-${index}`} />
        </section>
      ))}
    </div>
  )
}

export async function FooterWidgets() {
  const { footer } = await getWidgetAreas()
  if (footer.length === 0) return null
  return (
    <div className="border-t">
      <WidgetArea
        area="footer"
        className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4"
      />
    </div>
  )
}

export async function WithSidebar({ children }: { children: React.ReactNode }) {
  const { sidebar } = await getWidgetAreas()
  if (sidebar.length === 0) return children
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">{children}</div>
      <aside>
        <WidgetArea area="sidebar" className="space-y-8 lg:sticky lg:top-24" />
      </aside>
    </div>
  )
}
