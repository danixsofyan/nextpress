import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { marked } from 'marked'
import { cache } from 'react'
import { env } from './env'

export const isDocsEnabled = () => env.NEXTPRESS_DOCS === 'true'

export const DOCS = ['getting-started', 'api', 'theme-development'] as const
export type DocSlug = (typeof DOCS)[number]

export const isDocSlug = (value: string): value is DocSlug =>
  (DOCS as readonly string[]).includes(value)

export const docsEditUrl = (slug: DocSlug) =>
  `https://github.com/danixsofyan/nextpress/blob/main/docs/${slug}.md`

export const getDoc = cache(async (slug: DocSlug) => {
  const raw = await readFile(join(process.cwd(), 'docs', `${slug}.md`), 'utf8')
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/)
  const meta = Object.fromEntries(
    (match?.[1] ?? '').split('\n').map((line) => {
      const i = line.indexOf(':')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    })
  )
  const body = raw
    .slice(match?.[0].length ?? 0)
    .replace(/\]\((?:\.\/)?([a-z-]+)\.md(#[^)]*)?\)/g, '](/docs/$1$2)')
  return {
    slug,
    title: meta.title ?? slug,
    description: meta.description ?? '',
    markdown: body,
    html: await marked.parse(body),
  }
})

export const getDocList = cache(() =>
  Promise.all(
    DOCS.map(async (slug) => {
      const { title, description } = await getDoc(slug)
      return { slug, title, description }
    })
  )
)
