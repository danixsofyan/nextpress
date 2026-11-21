import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { docsEditUrl, getDoc, getDocList, isDocSlug, isDocsEnabled } from '@/lib/docs'

export const revalidate = 3600

export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!isDocsEnabled() || !isDocSlug(slug)) return {}
  const doc = await getDoc(slug)
  return {
    title: `${doc.title} · Docs`,
    description: doc.description,
    alternates: { canonical: `/docs/${slug}` },
  }
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params
  if (!isDocsEnabled() || !isDocSlug(slug)) notFound()
  const [doc, list] = await Promise.all([getDoc(slug), getDocList()])

  return (
    <div className="grid gap-10 md:grid-cols-[12rem_1fr]">
      <nav aria-label="Documentation" className="md:sticky md:top-6 md:self-start">
        <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Documentation
        </p>
        <ul className="space-y-1 text-sm">
          {list.map((d) => (
            <li key={d.slug}>
              <a
                href={`/docs/${d.slug}`}
                aria-current={d.slug === slug ? 'page' : undefined}
                className={`block rounded-md px-2 py-1.5 transition-colors hover:bg-accent ${
                  d.slug === slug ? 'bg-accent font-medium' : 'text-muted-foreground'
                }`}
              >
                {d.title}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/api/docs"
              prefetch={false}
              className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent"
            >
              Interactive API ↗
            </Link>
          </li>
        </ul>
      </nav>
      <article className="min-w-0">
        <header className="mb-8 space-y-2 border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
          {doc.description && <p className="text-muted-foreground">{doc.description}</p>}
        </header>
        <div
          className="prose max-w-none prose-neutral prose-code:before:content-none prose-code:after:content-none prose-pre:overflow-x-auto prose-table:block prose-table:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
        <p className="mt-12 border-t border-border pt-4 text-sm">
          <a href={docsEditUrl(slug)} className="text-muted-foreground hover:text-foreground">
            Edit this page on GitHub
          </a>
        </p>
      </article>
    </div>
  )
}
