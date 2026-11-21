import { getCurrentSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { JsonLd } from '@/components/json-ld'
import { extractFaq } from '@/lib/markdown'
import { absoluteUrl, breadcrumbSchema, faqSchema } from '@/lib/seo'
import { autoEmbed } from '@/lib/embeds'
import { getSiteSettings } from '@/lib/site'
import { hasRole } from '@/lib/roles'
import { getActiveTheme } from '@/lib/themes'
import { PostRepository, isPostPublic } from '@/server'
import { CommentsSection } from '@/components/comments-section'
import { WithSidebar } from '@/components/widget-area'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'

const getVisiblePost = cache(async (slug: string) => {
  const post = await new PostRepository(db).findBySlug(slug)
  if (!post) return null
  if (isPostPublic(post)) return { post, preview: false }
  if (!(await draftMode()).isEnabled) return null
  const session = await getCurrentSession().catch(() => null)
  return session && hasRole(session.user.role, 'author') ? { post, preview: true } : null
})

export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const visible = await getVisiblePost(slug)
  if (!visible) return {}
  const { post, preview } = visible
  return {
    ...(preview && { robots: { index: false, follow: false } }),
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    alternates: {
      canonical: `/blog/${post.slug}`,
      types: { 'text/markdown': `/blog/${post.slug}.md` },
    },
    openGraph: {
      url: `/blog/${post.slug}`,
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverImage
        ? [{ url: absoluteUrl(post.coverImage) }]
        : [{ url: `/og?title=${encodeURIComponent(post.title)}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const visible = await getVisiblePost(slug)
  if (!visible) notFound()
  const { post, preview } = visible
  const site = await getSiteSettings()

  const author = post.authorId ? await new PostRepository(db).findAuthor(post.authorId) : null
  const url = `${env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    image: post.coverImage
      ? absoluteUrl(post.coverImage)
      : `${env.NEXT_PUBLIC_SITE_URL}/og?title=${encodeURIComponent(post.title)}`,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    url,
    mainEntityOfPage: url,
    publisher: { '@type': 'Organization', name: site.title },
    ...(author && {
      author: {
        '@type': 'Person',
        name: author.name,
        url: `${env.NEXT_PUBLIC_SITE_URL}/author/${author.id}`,
      },
    }),
  }

  const { PostDetail } = (await getActiveTheme()).theme.slots

  return (
    <>
      {preview && (
        <form
          method="post"
          action="/api/admin/appearance/preview"
          className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900"
        >
          <span>Draft preview. Only signed-in staff can see this post until it is published.</span>
          <button type="submit" className="font-medium underline underline-offset-4">
            Exit preview
          </button>
        </form>
      )}
      <JsonLd
        data={[
          jsonLd,
          breadcrumbSchema([
            { name: site.title, path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          ...[faqSchema(extractFaq(post.content))].filter((s) => s !== null),
        ]}
      />
      <WithSidebar>
        <PostDetail
          post={{ ...post, content: autoEmbed(post.content) }}
          timeZone={site.timeZone}
          dateFormat={site.dateFormat}
          {...(author && { author: { name: author.name, href: `/author/${author.id}` } })}
        />
        {!preview && <CommentsSection postId={post.id} />}
      </WithSidebar>
    </>
  )
}
