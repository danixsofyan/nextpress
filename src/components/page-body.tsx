import { db } from '@/lib/db'
import { donationsEnabled } from '@/lib/donations'
import { getCaptcha } from '@/lib/plugins'
import { getSiteSettings } from '@/lib/site'
import { getActiveTheme } from '@/lib/themes'
import { PageRepository, PostRepository } from '@/server'
import type { Block } from '@/core/validators'
import type { Page } from '@/core/types'

async function expandPatterns(blocks: Block[], ownSlug: string): Promise<Block[]> {
  if (!blocks.some((b) => b.type === 'pattern')) return blocks
  const repo = new PageRepository(db)
  const expanded = await Promise.all(
    blocks.map(async (block) => {
      if (block.type !== 'pattern') return [block]
      if (block.slug === ownSlug) return []
      const source = await repo.findBySlug(block.slug)
      return (source?.blocks ?? []).filter((b) => b.type !== 'pattern')
    })
  )
  return expanded.flat()
}

export async function PageBody({ page }: { page: Page }) {
  const blocks = await expandPatterns(page.blocks ?? [], page.slug)
  if (blocks.length === 0) {
    return (
      <article className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
        <div
          className="prose max-w-none prose-neutral dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    )
  }

  const site = await getSiteSettings()
  const { Blocks } = (await getActiveTheme()).theme.slots
  const postCount = Math.max(0, ...blocks.map((b) => (b.type === 'posts' ? b.count : 0)))
  const posts = postCount > 0 ? await new PostRepository(db).findPublic({ limit: postCount }) : []

  return (
    <Blocks
      blocks={blocks}
      posts={posts}
      timeZone={site.timeZone}
      dateFormat={site.dateFormat}
      donations={donationsEnabled()}
      captcha={await getCaptcha()}
    />
  )
}
