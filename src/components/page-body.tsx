import { db } from '@/lib/db'
import { donationsEnabled } from '@/lib/donations'
import { getCaptcha } from '@/lib/plugins'
import { getSiteSettings } from '@/lib/site'
import { getActiveTheme } from '@/lib/themes'
import { PostRepository } from '@/server'
import type { Page } from '@/core/types'

export async function PageBody({ page }: { page: Page }) {
  const blocks = page.blocks ?? []
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
