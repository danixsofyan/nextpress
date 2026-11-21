import { db } from '@/lib/db'
import { getDocList, isDocsEnabled } from '@/lib/docs'
import { getSiteSettings } from '@/lib/site'
import { PageRepository, PostRepository } from '@/server'
import { absoluteUrl, postMarkdown } from './seo'

export async function getLlmsContent() {
  const [site, posts, pages, docs] = await Promise.all([
    getSiteSettings(),
    new PostRepository(db).findPublic({ limit: 200 }),
    new PageRepository(db).findMany(),
    isDocsEnabled() ? getDocList() : Promise.resolve([]),
  ])
  return { site, posts, pages: pages.filter((p) => p.status === 'published'), docs }
}

const textResponse = (body: string) =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })

export async function llmsTxt() {
  const { site, posts, pages, docs } = await getLlmsContent()
  const line = (title: string, path: string, note?: string | null) =>
    `- [${title}](${absoluteUrl(path)})${note ? `: ${note}` : ''}`
  const sections = [
    `# ${site.title}`,
    (site.tagline || site.description) && `> ${site.tagline || site.description}`,
    posts.length > 0 &&
      `## Posts\n\nEach post is also available as Markdown at the same URL with .md appended.\n\n${posts
        .map((p) => line(p.title, `/blog/${p.slug}`, p.metaDescription ?? p.excerpt))
        .join('\n')}`,
    pages.length > 0 &&
      `## Pages\n\n${pages.map((p) => line(p.title, `/${p.slug}`, p.metaDescription)).join('\n')}`,
    docs.length > 0 &&
      `## Docs\n\n${docs.map((d) => line(d.title, `/docs/${d.slug}`, d.description)).join('\n')}`,
    `## Optional\n\n${[
      line('Full text of every post', '/llms-full.txt'),
      line('RSS feed', '/feed.xml'),
      line('Sitemap', '/sitemap.xml'),
      line('REST API reference', '/api/docs'),
    ].join('\n')}`,
  ]
  return textResponse(`${sections.filter(Boolean).join('\n\n')}\n`)
}

export async function llmsFullTxt() {
  const { site, posts } = await getLlmsContent()
  const header = [
    `# ${site.title}`,
    (site.tagline || site.description) && `> ${site.tagline || site.description}`,
  ]
  return textResponse(
    `${[...header.filter(Boolean), ...posts.map((p) => postMarkdown(p))].join('\n\n---\n\n')}\n`
  )
}
