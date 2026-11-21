import { PostRepository } from '@/server'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { getSiteSettings } from '@/lib/site'

export const revalidate = 3600

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const cdata = (value: string) => `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

export async function GET() {
  const site = await getSiteSettings()
  const base = env.NEXT_PUBLIC_SITE_URL
  const posts = await new PostRepository(db).findMany({
    status: 'published',
    limit: site.feedCount,
    offset: 0,
  })

  const items = posts
    .map((post) => {
      const url = `${base}/blog/${post.slug}`
      const body = site.feedFullText ? post.content : (post.excerpt ?? '')
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        post.publishedAt ? `      <pubDate>${post.publishedAt.toUTCString()}</pubDate>` : '',
        `      <description>${cdata(body)}</description>`,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${base}</link>
    <description>${escapeXml(site.tagline || site.description)}</description>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
