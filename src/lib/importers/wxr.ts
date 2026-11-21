import {
  type ImportItem,
  type ImportTerm,
  list,
  parseDate,
  safeDecode,
  slugify,
  stripTags,
  text,
  truncate,
  xmlParser,
} from './shared'

type WxrCategory = { '#text'?: unknown; '@_domain'?: string; '@_nicename'?: string }

function terms(categories: WxrCategory[], domain: string): ImportTerm[] {
  return categories
    .filter((c) => c['@_domain'] === domain)
    .map((c) => {
      const name = truncate(text(c).trim(), 255)
      return {
        name,
        slug: slugify(c['@_nicename'] || name, domain === 'category' ? 'category' : 'tag'),
      }
    })
    .filter((t) => t.name)
}

export function parseWxr(xml: string): ImportItem[] {
  const doc = xmlParser.parse(xml)
  const channel = doc?.rss?.channel
  if (!channel) throw new Error('Not a WordPress export file (missing <rss><channel>)')

  return list<Record<string, unknown>>(channel.item).flatMap((item) => {
    const type = text(item['wp:post_type'])
    if (type !== 'post' && type !== 'page') return []
    const title = truncate(text(item.title).trim() || '(untitled)', 500)
    const categories = list(item.category as WxrCategory | WxrCategory[])
    const excerpt = text(item['excerpt:encoded']).trim()
    return [
      {
        kind: type,
        title,
        slug: slugify(safeDecode(text(item['wp:post_name'])) || title),
        content: text(item['content:encoded']),
        excerpt: truncate(stripTags(excerpt), 1000),
        status: text(item['wp:status']) === 'publish' ? 'published' : 'draft',
        publishedAt: parseDate(text(item['wp:post_date_gmt'])),
        categories: type === 'post' ? terms(categories, 'category') : [],
        tags: type === 'post' ? terms(categories, 'post_tag') : [],
      } satisfies ImportItem,
    ]
  })
}
