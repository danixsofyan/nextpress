import { z } from 'zod'
import { blocksSchema } from './blocks'

const pageFields = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(500),
  content: z.string(),
  blocks: blocksSchema.nullable().optional(),
  status: z.enum(['draft', 'published']),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
})

export const createPageSchema = pageFields.extend({
  content: pageFields.shape.content.default(''),
  status: pageFields.shape.status.default('draft'),
})

export const updatePageSchema = pageFields.partial()

export type CreatePageInput = z.infer<typeof createPageSchema>
export type UpdatePageInput = z.infer<typeof updatePageSchema>
