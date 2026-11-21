import { sql } from 'drizzle-orm'
import { db } from './db'

export type DashboardStats = {
  totalPosts: number
  publishedPosts: number
  totalPages: number
  totalMedia: number
  totalTaxonomies: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const rows = await db.execute<DashboardStats>(sql`
    select
      (select count(*) from posts)::int as "totalPosts",
      (select count(*) from posts where status = 'published')::int as "publishedPosts",
      (select count(*) from pages)::int as "totalPages",
      (select count(*) from media)::int as "totalMedia",
      (select count(*) from taxonomies)::int as "totalTaxonomies"
  `)
  const row = rows[0]
  return {
    totalPosts: row?.totalPosts ?? 0,
    publishedPosts: row?.publishedPosts ?? 0,
    totalPages: row?.totalPages ?? 0,
    totalMedia: row?.totalMedia ?? 0,
    totalTaxonomies: row?.totalTaxonomies ?? 0,
  }
}
