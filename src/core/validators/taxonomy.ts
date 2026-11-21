import { z } from 'zod'

const taxonomyFields = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
  type: z.enum(['category', 'tag', 'custom']),
  description: z.string().max(1000).optional(),
})

export const createTaxonomySchema = taxonomyFields.extend({
  type: taxonomyFields.shape.type.default('tag'),
})

export const updateTaxonomySchema = taxonomyFields.partial()

export type CreateTaxonomyInput = z.infer<typeof createTaxonomySchema>
export type UpdateTaxonomyInput = z.infer<typeof updateTaxonomySchema>
