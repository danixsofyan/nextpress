export type ExportTerm = { name: string; slug: string; type: 'category' | 'tag' }

export type ExportItem = {
  kind: 'post' | 'page'
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  status: 'published' | 'draft'
  publishedAt: Date | null
  author: string | null
  terms: ExportTerm[]
}

const cdata = (value: string) => `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

const attr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const gmt = (date: Date | null) =>
  date ? date.toISOString().replace('T', ' ').slice(0, 19) : '0000-00-00 00:00:00'

function item(entry: ExportItem, siteUrl: string) {
  const path = entry.kind === 'post' ? `/blog/${entry.slug}` : `/${entry.slug}`
  const terms = entry.terms
    .map((t) => {
      const domain = t.type === 'category' ? 'category' : 'post_tag'
      return `      <category domain="${domain}" nicename="${attr(t.slug)}">${cdata(t.name)}</category>`
    })
    .join('\n')
  return `    <item>
      <title>${cdata(entry.title)}</title>
      <link>${attr(siteUrl + path)}</link>
      <dc:creator>${cdata(entry.author ?? '')}</dc:creator>
      <guid isPermaLink="false">${attr(entry.id)}</guid>
      <content:encoded>${cdata(entry.content)}</content:encoded>
      <excerpt:encoded>${cdata(entry.excerpt ?? '')}</excerpt:encoded>
      <wp:post_name>${cdata(entry.slug)}</wp:post_name>
      <wp:post_date_gmt>${cdata(gmt(entry.publishedAt))}</wp:post_date_gmt>
      <wp:status>${cdata(entry.status === 'published' ? 'publish' : 'draft')}</wp:status>
      <wp:post_type>${cdata(entry.kind)}</wp:post_type>
${terms}
    </item>`
}

export function buildWxr(
  site: { title: string; url: string; description: string },
  items: ExportItem[]
) {
  const terms = new Map<string, ExportTerm>()
  for (const entry of items) for (const t of entry.terms) terms.set(`${t.type}:${t.slug}`, t)
  const termXml = [...terms.values()]
    .map((t) =>
      t.type === 'category'
        ? `    <wp:category><wp:category_nicename>${cdata(t.slug)}</wp:category_nicename><wp:cat_name>${cdata(t.name)}</wp:cat_name></wp:category>`
        : `    <wp:tag><wp:tag_slug>${cdata(t.slug)}</wp:tag_slug><wp:tag_name>${cdata(t.name)}</wp:tag_name></wp:tag>`
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/">
  <channel>
    <title>${cdata(site.title)}</title>
    <link>${attr(site.url)}</link>
    <description>${cdata(site.description)}</description>
    <generator>NextPress</generator>
    <wp:wxr_version>1.2</wp:wxr_version>
    <wp:base_site_url>${attr(site.url)}</wp:base_site_url>
${termXml}
${items.map((entry) => item(entry, site.url)).join('\n')}
  </channel>
</rss>
`
}
