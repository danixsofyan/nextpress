import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Database } from '@/core/db'
import { BLOCK_ICONS, blocksSchema } from '@/core/validators'
import { z } from 'zod'
import { MenuRepository } from '../repositories/menu.repository'
import { PageRepository } from '../repositories/page.repository'
import { SettingsRepository } from '../repositories/settings.repository'

const json = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
})
const fail = (message: string) => ({
  content: [{ type: 'text' as const, text: message }],
  isError: true,
})

const slug = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens')

export const WRITING_GUIDE = {
  goal: 'Readers, Google, and AI answer engines (ChatGPT, Perplexity, Google AI Overviews) should all be able to find, understand, and quote the article.',
  structure: [
    'Title: the exact question or topic people search for, under 60 characters when possible.',
    'Excerpt: a 1-2 sentence direct answer to the title. It is shown in lists, feeds, llms.txt, and the Markdown copy.',
    'Open with the answer in the first paragraph (inverted pyramid), then add detail.',
    'Use <h2> headings for each sub-question; phrase them as questions where natural. A heading that ends with ? followed by its answer becomes FAQPage structured data automatically.',
    'Keep paragraphs short (2-4 sentences). Use <ul>/<ol> for steps and options and <table> for comparisons, so answers can be lifted verbatim.',
    'End with a short FAQ section (3-5 questions with concise answers) for long articles.',
  ],
  credibility: [
    'State concrete facts, numbers, dates, and names. Cite sources with links.',
    'Define terms the first time they appear. One idea per sentence.',
    'Keep it current; editing a post updates dateModified in structured data and the sitemap.',
  ],
  metadata: [
    'metaTitle: up to 60 characters, primary keyword first.',
    'metaDescription: up to 160 characters, answers the query and invites the click.',
    'slug: short, lowercase, hyphenated keywords.',
    'Assign categories and tags with taxonomyIds so related posts cluster.',
  ],
  handledAutomatically: [
    'BlogPosting, BreadcrumbList, FAQPage, and WebSite JSON-LD',
    'Canonical URLs, Open Graph and Twitter cards, dynamic OG image',
    'sitemap.xml, RSS feed, robots.txt that allows AI crawlers',
    'llms.txt and llms-full.txt, plus a Markdown copy of every post at /blog/<slug>.md',
  ],
  avoid: [
    'Keyword stuffing, filler intros, and walls of text',
    'Answers hidden in images; describe images with alt text',
    'Duplicate posts on the same question; update the existing one instead',
  ],
}

export const BLOCK_SPEC = {
  description:
    'A page is an ordered list of blocks. Compose any landing page from these blocks; the active theme renders them. Raw HTML/CSS/JS is not allowed except sanitized HTML inside richText.',
  links: 'Every href must start with /, #, http(s):// or mailto:',
  performance: [
    'Pages must keep PageSpeed (Lighthouse) at 100 for accessibility, best practices, and SEO, and at least 90 for performance on mobile and desktop. A scheduled audit flags regressions.',
    'Blocks render on the server with no client JavaScript, so any combination is fast. Keep the first block (usually hero) text-only so it is the fast largest contentful paint.',
    'Prefer fewer, focused blocks: around 6 to 10 sections per landing page. Long pages slow the speed index and dilute the message.',
    'Keep the richText HTML semantic and small. Do not paste embeds, iframes, or inline images of text.',
  ],
  donations:
    'The donate block renders only when the site owner has configured SumoPod (SUMOPOD_API_KEY). Amounts are whole rupiah between 1,000 and 100,000,000; it shows QRIS payment through SumoPod.',
  icons: BLOCK_ICONS,
  blocks: {
    hero: {
      fields: 'eyebrow?, heading, subheading?, primary?{label,href}, secondary?{label,href}',
      example: {
        type: 'hero',
        eyebrow: 'Open source',
        heading: 'Build faster',
        subheading: 'One sentence value proposition.',
        primary: { label: 'Get started', href: '/blog' },
      },
    },
    features: {
      fields: 'heading?, intro?, columns? (2|3|4), items[1..12]{icon?, title, description}',
      example: {
        type: 'features',
        heading: 'Features',
        columns: 3,
        items: [{ icon: 'zap', title: 'Fast', description: 'Static-fast pages.' }],
      },
    },
    steps: { fields: 'heading?, items[1..8]{title, description}' },
    stats: { fields: 'heading?, items[1..6]{value, label}' },
    code: { fields: 'heading?, intro?, language?, code, caption?' },
    table: { fields: 'heading?, intro?, columns[2..5], rows[1..20][cells matching columns]' },
    faq: { fields: 'heading?, items[1..20]{question, answer}' },
    cta: { fields: 'heading, text?, primary{label,href}, secondary?{label,href}' },
    posts: { fields: 'heading?, count (1..12) — shows the latest published posts' },
    donate: {
      fields:
        'heading, text?, amounts (1..6 whole-rupiah presets, 1,000..100,000,000), buttonLabel? — QRIS donation form via SumoPod; hidden unless donations are configured',
    },
    richText: {
      fields: 'html — sanitized HTML (p, h2, h3, ul, ol, a, img, blockquote, code, pre)',
    },
  },
}

const pageFields = {
  title: z.string().min(1).max(500),
  slug,
  blocks: blocksSchema
    .optional()
    .describe('Ordered blocks that make up the page. Call get_block_spec first.'),
  content: z.string().optional().describe('Optional HTML body used when there are no blocks'),
  status: z.enum(['draft', 'published']).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
}

export function registerSiteTools(server: McpServer, db: Database) {
  const pages = new PageRepository(db)
  const settings = new SettingsRepository(db)
  const menus = new MenuRepository(db)

  server.tool(
    'get_block_spec',
    'Describe the page blocks (hero, features, steps, stats, code, table, faq, cta, posts, richText) used to build landing pages',
    {},
    async () => json(BLOCK_SPEC)
  )

  server.tool('list_pages', 'List all pages with their status', {}, async () => {
    const rows = await pages.findMany()
    return json(
      rows.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        blocks: p.blocks?.length ?? 0,
      }))
    )
  })

  server.tool('get_page', 'Get a page, including its blocks, by slug', { slug }, async (input) => {
    const page = await pages.findBySlug(input.slug)
    return page ? json(page) : fail(`No page with slug "${input.slug}"`)
  })

  server.tool(
    'create_page',
    'Create a page. Build landing pages by passing blocks. Published pages are served at /{slug}.',
    pageFields,
    async (input) => {
      if (await pages.findBySlug(input.slug)) return fail(`Slug "${input.slug}" is already used`)
      const page = await pages.create({
        title: input.title,
        slug: input.slug,
        content: input.content ?? '',
        blocks: input.blocks ?? null,
        status: input.status ?? 'draft',
        ...(input.metaTitle && { metaTitle: input.metaTitle }),
        ...(input.metaDescription && { metaDescription: input.metaDescription }),
      })
      return json({ id: page.id, slug: page.slug, status: page.status, url: `/${page.slug}` })
    }
  )

  server.tool(
    'update_page',
    'Update a page by ID. Passing blocks replaces all blocks of the page.',
    {
      id: z.string().uuid(),
      ...pageFields,
      title: pageFields.title.optional(),
      slug: slug.optional(),
    },
    async ({ id, ...input }) => {
      const data = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined))
      const page = await pages.update(id, data)
      return page
        ? json({ id: page.id, slug: page.slug, status: page.status })
        : fail('Page not found')
    }
  )

  server.tool(
    'delete_page',
    'Move a page to the Trash by ID (restore it from the admin)',
    { id: z.string().uuid() },
    async ({ id }) => ((await pages.delete(id)) ? json({ trashed: id }) : fail('Page not found'))
  )

  server.tool(
    'set_homepage',
    'Choose what the homepage shows: the latest posts, or a published page (for example a landing page built with blocks)',
    { show: z.enum(['posts', 'page']), pageId: z.string().uuid().optional() },
    async ({ show, pageId }) => {
      if (show === 'page') {
        if (!pageId) return fail('pageId is required when show is page')
        const page = await pages.findById(pageId)
        if (!page) return fail('Page not found')
        if (page.status !== 'published') return fail('Publish the page before using it as homepage')
        await settings.setMany({ show_on_front: 'page', page_on_front: pageId })
        return json({ homepage: `/${page.slug}` })
      }
      await settings.setMany({ show_on_front: 'posts' })
      return json({ homepage: 'latest posts' })
    }
  )

  server.tool(
    'set_navigation',
    'Replace the site header navigation links',
    {
      items: z
        .array(
          z.object({
            label: z.string().min(1).max(40),
            href: z
              .string()
              .max(500)
              .regex(/^(\/(?!\/)|#|https?:\/\/)/, 'href must start with /, # or http(s)://'),
          })
        )
        .min(1)
        .max(8),
    },
    async ({ items }) => {
      const serialized = JSON.stringify(
        items.map((item, i) => ({ id: String(i + 1), label: item.label, url: item.href }))
      )
      const existing = await menus.findBySlug('primary')
      if (existing) await menus.update(existing.id, { items: serialized })
      else await menus.create({ name: 'Primary', slug: 'primary', items: serialized })
      return json({ navigation: items })
    }
  )

  server.tool(
    'update_site_identity',
    'Update the site title, tagline, and default meta description',
    {
      siteTitle: z.string().min(1).max(200).optional(),
      tagline: z.string().max(300).optional(),
      metaDescription: z.string().max(160).optional(),
    },
    async ({ siteTitle, tagline, metaDescription }) => {
      const values: Record<string, string> = {}
      if (siteTitle !== undefined) values.site_title = siteTitle
      if (tagline !== undefined) values.site_tagline = tagline
      if (metaDescription !== undefined) values.default_meta_description = metaDescription
      if (Object.keys(values).length === 0) return fail('Nothing to update')
      await settings.setMany(values)
      return json({ updated: Object.keys(values) })
    }
  )

  server.tool(
    'get_writing_guide',
    'How to write posts and pages that rank in Google (SEO) and get quoted by AI answer engines (AEO/GEO). Call this before create_post or create_page.',
    {},
    async () => json(WRITING_GUIDE)
  )
}
