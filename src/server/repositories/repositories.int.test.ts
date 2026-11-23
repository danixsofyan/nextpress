import { describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { createUser, unique } from '../../../tests/fixtures'
import { ApiKeyRepository } from './api-key.repository'
import { CommentRepository } from './comment.repository'
import { DonationRepository } from './donation.repository'
import { MediaRepository } from './media.repository'
import { MenuRepository } from './menu.repository'
import { PageRepository } from './page.repository'
import { PostRepository } from './post.repository'
import { SettingsRepository } from './settings.repository'
import { TaxonomyRepository } from './taxonomy.repository'

describe('PageRepository', () => {
  const repo = new PageRepository(db)

  it('keeps revisions, trashes, restores, and purges', async () => {
    const page = await repo.create({
      title: 'About',
      slug: `about-${unique()}`,
      content: '',
      status: 'published',
      blocks: [{ type: 'hero', heading: 'One' }],
    })
    await repo.update(page.id, { blocks: [{ type: 'hero', heading: 'Two' }] })
    await repo.update(page.id, { metaTitle: 'No revision for meta' })
    const revisions = await repo.findRevisions(page.id)
    expect(revisions).toHaveLength(1)
    const restored = await repo.restoreRevision(page.id, revisions[0]!.id)
    expect(restored?.blocks?.[0]).toMatchObject({ heading: 'One' })
    expect((await repo.findMany()).some((p) => p.id === page.id)).toBe(true)
    expect(await repo.delete(page.id)).toBe(true)
    expect((await repo.findSummaries({ trashed: true })).some((p) => p.id === page.id)).toBe(true)
    expect((await repo.restore(page.id))?.slug).toBe(page.slug)
    await repo.delete(page.id)
    expect(await repo.purge(page.id)).toBe(true)
    expect(await repo.update(page.id, { title: 'gone' })).toBeNull()
  })
})

describe('TaxonomyRepository', () => {
  it('counts only public posts', async () => {
    const taxonomies = new TaxonomyRepository(db)
    const posts = new PostRepository(db)
    const tag = await taxonomies.create({
      name: 'Counted',
      slug: `counted-${unique()}`,
      type: 'tag',
    })
    await posts.create({
      title: 'a',
      slug: `a-${unique()}`,
      content: '',
      status: 'published',
      taxonomyIds: [tag.id],
    })
    await posts.create({
      title: 'b',
      slug: `b-${unique()}`,
      content: '',
      status: 'draft',
      taxonomyIds: [tag.id],
    })
    const counts = await taxonomies.findPublishedWithCounts('tag')
    expect(counts.find((t) => t.slug === tag.slug)?.count).toBe(1)
    expect((await taxonomies.findManyWithCounts('tag')).find((t) => t.id === tag.id)?.count).toBe(2)
    expect((await taxonomies.update(tag.id, { name: 'Renamed' }))?.name).toBe('Renamed')
    expect((await taxonomies.findBySlug(tag.slug))?.id).toBe(tag.id)
    expect((await taxonomies.findMany('tag')).length).toBeGreaterThan(0)
    await taxonomies.delete(tag.id)
    expect(await taxonomies.findById(tag.id)).toBeNull()
  })
})

describe('CommentRepository', () => {
  it('moderates comments', async () => {
    const posts = new PostRepository(db)
    const repo = new CommentRepository(db)
    const post = await posts.create({
      title: 'c',
      slug: `c-${unique()}`,
      content: '',
      status: 'published',
    })
    const pending = await repo.create(
      { postId: post.id, authorName: 'Ani', content: 'Hi' },
      'pending'
    )
    expect(await repo.findApprovedForPost(post.id)).toEqual([])
    expect(await repo.countPending()).toBeGreaterThan(0)
    await repo.setStatus(pending.id, 'approved')
    expect(await repo.findApprovedForPost(post.id)).toHaveLength(1)
    expect((await repo.findRecent(50)).some((c) => c.id === pending.id)).toBe(true)
    expect((await repo.findAll()).some((c) => c.id === pending.id)).toBe(true)
    expect(await repo.delete(pending.id)).toBe(false)
    await repo.setStatus(pending.id, 'spam')
    expect(await repo.delete(pending.id)).toBe(true)
    expect(await repo.setStatus(pending.id, 'approved')).toBeNull()
  })
})

describe('Settings, menus, media, donations, and API keys', () => {
  it('stores settings', async () => {
    const repo = new SettingsRepository(db)
    await repo.set('integration_key', 'one')
    await repo.setMany({ integration_a: '1', integration_b: '2' })
    expect(await repo.get('integration_key')).toBe('one')
    expect((await repo.getAll()).integration_b).toBe('2')
    expect(await repo.get('missing_key')).toBeNull()
  })

  it('stores menus', async () => {
    const repo = new MenuRepository(db)
    const menu = await repo.create({ name: 'Footer', slug: `footer-${unique()}` })
    expect((await repo.update(menu.id, { name: 'Footer 2' }))?.name).toBe('Footer 2')
    expect((await repo.findBySlug(menu.slug))?.id).toBe(menu.id)
    expect((await repo.findMany()).length).toBeGreaterThan(0)
    await repo.delete(menu.id)
    expect(await repo.findById(menu.id)).toBeNull()
  })

  it('stores media metadata', async () => {
    const repo = new MediaRepository(db)
    const item = await repo.create({
      filename: 'a.png',
      url: `/media/${unique()}.png`,
      mimeType: 'image/png',
      size: 10,
    })
    expect((await repo.update(item.id, { alt: 'Alt' }))?.alt).toBe('Alt')
    expect((await repo.findMany()).some((m) => m.id === item.id)).toBe(true)
    await repo.delete(item.id)
    expect(await repo.findById(item.id)).toBeNull()
  })

  it('tracks donations', async () => {
    const repo = new DonationRepository(db)
    const orderId = `NPD-${unique()}`
    await repo.create({ orderId, amount: 10_000, donorName: 'Budi', message: null })
    await repo.setPaymentUrl(orderId, 'https://pay.example/1')
    expect((await repo.setStatus(orderId, 'completed'))?.completedAt).toBeInstanceOf(Date)
    expect((await repo.findRecent()).some((d) => d.orderId === orderId)).toBe(true)
  })

  it('creates, verifies, and revokes API keys', async () => {
    const owner = await createUser('administrator')
    const repo = new ApiKeyRepository(db)
    const created = await repo.create('CI', owner.id)
    expect((await repo.verify(created.key))?.userId).toBe(owner.id)
    expect(await repo.verify('np_wrong')).toBeNull()
    expect((await repo.findMany()).some((k) => k.id === created.id)).toBe(true)
    await repo.delete(created.id!)
    expect(await repo.verify(created.key)).toBeNull()
  })
})
