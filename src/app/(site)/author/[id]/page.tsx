import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { WithSidebar } from '@/components/widget-area'
import { db } from '@/lib/db'
import { getSiteSettings } from '@/lib/site'
import { getActiveTheme } from '@/lib/themes'
import { PostRepository } from '@/server'

export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

interface Props {
  params: Promise<{ id: string }>
}

const getAuthorArchive = cache(async (id: string) => {
  if (!/^[\w-]{1,64}$/.test(id)) return null
  const repo = new PostRepository(db)
  const author = await repo.findAuthor(id)
  if (!author) return null
  const posts = await repo.findPublicByAuthor(id)
  return posts.length > 0 ? { author, posts } : null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const archive = await getAuthorArchive((await params).id)
  if (!archive) return {}
  return {
    title: `Posts by ${archive.author.name}`,
    alternates: { canonical: `/author/${archive.author.id}` },
  }
}

export default async function AuthorPage({ params }: Props) {
  const archive = await getAuthorArchive((await params).id)
  if (!archive) notFound()
  const [site, { theme }] = await Promise.all([getSiteSettings(), getActiveTheme()])
  const { PostList } = theme.slots
  return (
    <WithSidebar>
      <div className="space-y-8">
        <div className="border-b pb-6">
          <p className="text-sm text-muted-foreground">Author</p>
          <h1 className="text-3xl font-bold tracking-tight">{archive.author.name}</h1>
        </div>
        <PostList posts={archive.posts} timeZone={site.timeZone} dateFormat={site.dateFormat} />
      </div>
    </WithSidebar>
  )
}
