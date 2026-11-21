import {
  type ImportItem,
  list,
  parseDate,
  safeDecode,
  slugify,
  stripTags,
  text,
  truncate,
  xmlParser,
} from './shared'

type AtomLink = { '@_href'?: string; '@_rel'?: string }

function slugFromLink(link: string, title: string): string {
  try {
    const segment = new URL(link).pathname.split('/').filter(Boolean).pop()
    if (segment) return slugify(safeDecode(segment).replace(/\.[a-z0-9]+$/i, ''))
  } catch {}
  return slugify(title)
}

function item(
  title: string,
  link: string,
  content: string,
  summary: string,
  date: string
): ImportItem {
  const cleanTitle = truncate(title.trim() || '(untitled)', 500)
  const body = content || summary
  return {
    kind: 'post',
    title: cleanTitle,
    slug: slugFromLink(link, cleanTitle),
    content: body,
    excerpt: content && summary ? truncate(stripTags(summary), 1000) : '',
    status: 'published',
    publishedAt: parseDate(date),
    categories: [],
    tags: [],
  }
}

export function parseFeed(xml: string): ImportItem[] {
  const doc = xmlParser.parse(xml)

  if (doc?.rss?.channel) {
    return list<Record<string, unknown>>(doc.rss.channel.item).map((i) =>
      item(
        text(i.title),
        text(i.link) || text(i.guid),
        text(i['content:encoded']),
        text(i.description),
        text(i.pubDate) || text(i['dc:date'])
      )
    )
  }

  if (doc?.feed) {
    return list<Record<string, unknown>>(doc.feed.entry).map((e) => {
      const links = list(e.link as AtomLink | AtomLink[])
      const href =
        links.find((l) => !l['@_rel'] || l['@_rel'] === 'alternate')?.['@_href'] ??
        links[0]?.['@_href'] ??
        ''
      return item(
        text(e.title),
        href,
        text(e.content),
        text(e.summary),
        text(e.published) || text(e.updated)
      )
    })
  }

  throw new Error('Not an RSS or Atom feed')
}
