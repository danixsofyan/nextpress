import type { Metadata } from 'next'
import { TaxonomyArchive, archiveMetadata } from '@/components/taxonomy-archive'

export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return archiveMetadata('category', (await params).slug)
}

export default async function Page({ params }: Props) {
  return <TaxonomyArchive type="category" slug={(await params).slug} />
}
