import { describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { PostRepository } from './post.repository'
import { TaxonomyRepository } from './taxonomy.repository'

const repo = new PostRepository(db)
const unique = () => Math.random().toString(36).slice(2, 10)

describe('PostRepository', () => {
  it('creates, updates with revisions, and restores a revision', async () => {
    const slug = `post-${unique()}`
    const post = await repo.create({ title: 'First', slug, content: '<p>one</p>', status: 'draft' })
    expect(post.publishedAt).toBeNull()
    await repo.update(post.id, { title: 'Second', content: '<p>two</p>' })
    await repo.update(post.id, { status: 'published' })
    const revisions = await repo.findRevisions(post.id)
    expect(revisions.map((r) => r.title)).toEqual(['First'])
    const restored = await repo.restoreRevision(post.id, revisions[0]!.id)
    expect(restored?.title).toBe('First')
    expect((await repo.findRevisions(post.id)).map((r) => r.title)).toContain('Second')
    expect(await repo.restoreRevision(post.id, '00000000-0000-0000-0000-000000000000')).toBeNull()
  })

  it('sanitizes stored HTML', async () => {
    const post = await repo.create({
      title: 'XSS',
      slug: `xss-${unique()}`,
      content: '<p onclick="x()">hi</p><script>alert(1)</script>',
      status: 'draft',
    })
    expect(post.content).not.toContain('script')
    expect(post.content).not.toContain('onclick')
  })

  it('shows only public, published, past posts with sticky posts first', async () => {
    const tag = unique()
    const future = new Date(Date.now() + 86_400_000).toISOString()
    const visible = await repo.create({
      title: `Visible ${tag}`,
      slug: `v-${tag}`,
      content: '',
      status: 'published',
    })
    const sticky = await repo.create({
      title: `Sticky ${tag}`,
      slug: `s-${tag}`,
      content: '',
      status: 'published',
      isSticky: true,
      publishedAt: new Date(Date.now() - 86_400_000).toISOString(),
    })
    await repo.create({
      title: `Future ${tag}`,
      slug: `f-${tag}`,
      content: '',
      status: 'published',
      publishedAt: future,
    })
    await repo.create({
      title: `Private ${tag}`,
      slug: `p-${tag}`,
      content: '',
      status: 'published',
      visibility: 'private',
    })
    await repo.create({ title: `Draft ${tag}`, slug: `d-${tag}`, content: '', status: 'draft' })

    const ordered = await repo.findPublic({ limit: 100, stickyFirst: true })
    const titles = ordered.map((p) => p.title).filter((t) => t.endsWith(tag))
    expect(titles).toEqual([`Sticky ${tag}`, `Visible ${tag}`])
    expect((await repo.search(tag)).map((p) => p.id).sort()).toEqual([visible.id, sticky.id].sort())
    expect(await repo.search('%')).toEqual([])
    expect((await repo.findScheduled(50)).some((p) => p.title === `Future ${tag}`)).toBe(true)
  })

  it('finds posts by taxonomy and author', async () => {
    const tax = await new TaxonomyRepository(db).create({
      name: 'Cat',
      slug: `cat-${unique()}`,
      type: 'category',
    })
    const post = await repo.create({
      title: 'Tagged',
      slug: `tagged-${unique()}`,
      content: '',
      status: 'published',
      taxonomyIds: [tax.id],
    })
    expect((await repo.findPublishedByTaxonomy(tax.id)).map((p) => p.id)).toEqual([post.id])
    expect(await repo.findAuthor('missing')).toBeNull()
  })

  it('trashes, restores, and purges with slug handling', async () => {
    const slug = `trash-${unique()}`
    const post = await repo.create({ title: 'Trash me', slug, content: '', status: 'published' })
    expect(await repo.delete(post.id)).toBe(true)
    expect(await repo.findBySlug(slug)).toBeNull()
    expect((await repo.findAllSummaries({ trashed: true })).some((p) => p.id === post.id)).toBe(
      true
    )
    expect(await repo.purge(post.id)).toBe(true)
    expect(await repo.findById(post.id, { includeTrashed: true })).toBeNull()

    const again = await repo.create({
      title: 'Back',
      slug: `back-${unique()}`,
      content: '',
      status: 'draft',
    })
    await repo.delete(again.id)
    const restored = await repo.restore(again.id)
    expect(restored?.slug).toBe(again.slug)
    expect(await repo.purge(again.id)).toBe(false)
    expect(await repo.delete('00000000-0000-0000-0000-000000000000')).toBe(false)
  })
})
