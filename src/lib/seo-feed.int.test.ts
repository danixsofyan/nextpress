import { describe, expect, it } from 'vitest'
import { parseFeed } from './importers/feed'
import { absoluteUrl, breadcrumbSchema, faqSchema, pageFaq, postMarkdown } from './seo'

describe('SEO helpers', () => {
  it('builds absolute URLs, Markdown copies, and JSON-LD', () => {
    expect(absoluteUrl('/blog')).toBe('https://example.test/blog')
    expect(absoluteUrl('https://cdn.test/a.png')).toBe('https://cdn.test/a.png')
    const markdown = postMarkdown({
      title: 'Hello',
      slug: 'hello',
      excerpt: 'Short',
      content: '<h2>Intro</h2><p>Body <strong>bold</strong></p>',
      publishedAt: new Date('2026-01-02T00:00:00Z'),
      updatedAt: new Date('2026-01-03T00:00:00Z'),
    })
    expect(markdown).toContain('# Hello')
    expect(markdown).toContain('Published: 2026-01-02')
    expect(markdown).toContain('## Intro')
    expect(breadcrumbSchema([{ name: 'Blog', path: '/blog' }])).toMatchObject({
      '@type': 'BreadcrumbList',
    })
    const faq = pageFaq('', [{ type: 'faq', items: [{ question: 'Q?', answer: 'A.' }] }])
    expect(faq).toHaveLength(1)
    expect(faqSchema(faq)).toMatchObject({ '@type': 'FAQPage' })
    expect(faqSchema([])).toBeNull()
  })
})

describe('parseFeed', () => {
  it('reads RSS and Atom feeds', () => {
    const rss = parseFeed(`<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>
      <item><title>One</title><link>https://blog.test/one</link><description><![CDATA[<p>Hi</p>]]></description><pubDate>Mon, 05 Jan 2026 10:00:00 GMT</pubDate><category>News</category></item>
    </channel></rss>`)
    expect(rss[0]).toMatchObject({ title: 'One', slug: 'one', status: 'published' })
    const atom =
      parseFeed(`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>A</title>
      <entry><title>Two</title><link href="https://blog.test/two"/><content type="html">&lt;p&gt;Yo&lt;/p&gt;</content><updated>2026-01-06T00:00:00Z</updated></entry>
    </feed>`)
    expect(atom[0]).toMatchObject({ title: 'Two' })
    expect(() => parseFeed('<html></html>')).toThrow()
  })
})
