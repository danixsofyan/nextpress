import type { Block } from '@/core/validators'
import { env } from './env'
import { extractFaq, type FaqItem, htmlToMarkdown } from './markdown'

export const absoluteUrl = (path: string) => `${env.NEXT_PUBLIC_SITE_URL}${path}`

type MarkdownPost = {
  title: string
  slug: string
  excerpt: string | null
  content: string
  publishedAt: Date | null
  updatedAt: Date
}

export function postMarkdown(post: MarkdownPost) {
  const meta = [
    `URL: ${absoluteUrl(`/blog/${post.slug}`)}`,
    post.publishedAt && `Published: ${post.publishedAt.toISOString().slice(0, 10)}`,
    `Updated: ${post.updatedAt.toISOString().slice(0, 10)}`,
  ].filter(Boolean)
  return [
    `# ${post.title}`,
    post.excerpt && `> ${post.excerpt}`,
    meta.join('\n'),
    htmlToMarkdown(post.content),
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function faqSchema(items: FaqItem[]) {
  if (items.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export function pageFaq(content: string, blocks: Block[] | null) {
  const fromBlocks = (blocks ?? []).flatMap((b) => (b.type === 'faq' ? b.items : []))
  return [...fromBlocks, ...extractFaq(content)]
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
