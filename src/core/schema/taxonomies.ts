import { sql } from 'drizzle-orm'
import { check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { posts } from './posts'

export const TAXONOMY_TYPES = ['category', 'tag', 'custom'] as const

export const taxonomies = pgTable(
  'taxonomies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    type: text('type', { enum: TAXONOMY_TYPES }).notNull().default('tag'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('chk_taxonomies_type', sql`${table.type} in ('category', 'tag', 'custom')`)]
)

export const termRelationships = pgTable('term_relationships', {
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  taxonomyId: uuid('taxonomy_id')
    .notNull()
    .references(() => taxonomies.id, { onDelete: 'cascade' }),
})

export type Taxonomy = typeof taxonomies.$inferSelect
export type NewTaxonomy = typeof taxonomies.$inferInsert
