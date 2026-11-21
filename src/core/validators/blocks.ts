import { z } from 'zod'

export const BLOCK_ICONS = [
  'bot',
  'book',
  'check',
  'cloud',
  'code',
  'database',
  'download',
  'file-text',
  'gauge',
  'github',
  'globe',
  'heart',
  'image',
  'key',
  'layout',
  'lock',
  'palette',
  'plug',
  'rocket',
  'rss',
  'search',
  'settings',
  'shield',
  'sparkles',
  'star',
  'upload',
  'users',
  'zap',
] as const

export const DONATION_MIN = 1000
export const DONATION_MAX = 100_000_000

const text = (max: number) => z.string().trim().min(1).max(max)

const href = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^(\/(?!\/)|#|https?:\/\/|mailto:)/.test(v), {
    message: 'Links must start with /, #, http(s):// or mailto:',
  })

const link = z.object({ label: text(60), href })

export const blockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hero'),
    eyebrow: text(60).optional(),
    heading: text(120),
    subheading: text(400).optional(),
    primary: link.optional(),
    secondary: link.optional(),
  }),
  z.object({
    type: z.literal('features'),
    heading: text(120).optional(),
    intro: text(400).optional(),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
    items: z
      .array(
        z.object({ icon: z.enum(BLOCK_ICONS).optional(), title: text(80), description: text(300) })
      )
      .min(1)
      .max(12),
  }),
  z.object({
    type: z.literal('steps'),
    heading: text(120).optional(),
    items: z
      .array(z.object({ title: text(80), description: text(300) }))
      .min(1)
      .max(8),
  }),
  z.object({
    type: z.literal('stats'),
    heading: text(120).optional(),
    items: z
      .array(z.object({ value: text(20), label: text(60) }))
      .min(1)
      .max(6),
  }),
  z.object({
    type: z.literal('code'),
    heading: text(120).optional(),
    intro: text(400).optional(),
    language: text(20).optional(),
    code: z.string().min(1).max(5000),
    caption: text(200).optional(),
  }),
  z.object({
    type: z.literal('table'),
    heading: text(120).optional(),
    intro: text(400).optional(),
    columns: z.array(text(60)).min(2).max(5),
    rows: z
      .array(z.array(z.string().trim().max(200)).min(2).max(5))
      .min(1)
      .max(20),
  }),
  z.object({
    type: z.literal('faq'),
    heading: text(120).optional(),
    items: z
      .array(z.object({ question: text(200), answer: text(1000) }))
      .min(1)
      .max(20),
  }),
  z.object({
    type: z.literal('cta'),
    heading: text(120),
    text: text(300).optional(),
    primary: link,
    secondary: link.optional(),
  }),
  z.object({
    type: z.literal('posts'),
    heading: text(120).optional(),
    count: z.number().int().min(1).max(12).default(3),
  }),
  z.object({
    type: z.literal('donate'),
    heading: text(120),
    text: text(300).optional(),
    amounts: z.array(z.number().int().min(DONATION_MIN).max(DONATION_MAX)).min(1).max(6),
    buttonLabel: text(40).optional(),
  }),
  z.object({
    type: z.literal('lottie'),
    heading: text(120).optional(),
    intro: text(300).optional(),
    src: z
      .string()
      .trim()
      .max(300)
      .regex(/^\/(?!\/)[\w\-/]+(\.[\w\-]+)*\.json$/, {
        message: 'Use a same-site Lottie JSON path such as /lottie/globe.json',
      })
      .refine((v) => !v.includes('..'), { message: 'Path must not contain ..' }),
    label: text(120),
    loop: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('richText'),
    html: z.string().max(20000),
  }),
])

export const blocksSchema = z.array(blockSchema).max(50)

export type Block = z.infer<typeof blockSchema>
export type BlockType = Block['type']
