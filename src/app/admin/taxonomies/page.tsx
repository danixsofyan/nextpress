import { asJson } from '@/lib/as-json'
import { db } from '@/lib/db'
import { TaxonomyRepository } from '@/server'
import { TaxonomiesClient } from './taxonomies-client'

export default async function TaxonomiesPage() {
  const repo = new TaxonomyRepository(db)
  const [category, tag] = await Promise.all([
    repo.findManyWithCounts('category'),
    repo.findManyWithCounts('tag'),
  ])
  return <TaxonomiesClient initial={asJson({ category, tag })} />
}
