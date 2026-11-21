import { db } from '@/lib/db'
import { absoluteUrl, postMarkdown } from '@/lib/seo'
import { PostRepository, isPostPublic } from '@/server'

export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const post = await new PostRepository(db).findBySlug((await params).slug)
  if (!post || !isPostPublic(post)) return new Response('Not found', { status: 404 })
  return new Response(`${postMarkdown(post)}\n`, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${absoluteUrl(`/blog/${post.slug}`)}>; rel="canonical"`,
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
