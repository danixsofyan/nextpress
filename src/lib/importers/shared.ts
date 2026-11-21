import { XMLParser } from 'fast-xml-parser'

export type ImportTerm = { name: string; slug: string }

export type ImportItem = {
  kind: 'post' | 'page'
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'published' | 'draft'
  publishedAt: Date | null
  categories: ImportTerm[]
  tags: ImportTerm[]
}

export const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
  htmlEntities: true,
})

export function text(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return text(value[0])
  if (typeof value === 'object' && '#text' in value)
    return text((value as { '#text': unknown })['#text'])
  return ''
}

export function list<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

export function slugify(value: string, fallback = 'item'): string {
  const slug = value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)
    .replace(/-+$/g, '')
  return slug || fallback
}

export function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value
}

export function parseDate(value: string): Date | null {
  if (!value || value.startsWith('0000')) return null
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(' ', 'T')}Z`
    : value
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
