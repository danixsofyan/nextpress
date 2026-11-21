import { PageRepository } from '@/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { PageBody } from '@/components/page-body'
import { db } from '@/lib/db'
import { faqSchema, pageFaq } from '@/lib/seo'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function getPage(slug: string) {
  const page = await new PageRepository(db).findBySlug(slug)
  return page?.status === 'published' ? page : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage((await params).slug)
  if (!page) return {}
  return {
    title: page.metaTitle ?? page.title,
    ...(page.metaDescription && { description: page.metaDescription }),
    alternates: { canonical: `/${page.slug}` },
    openGraph: { title: page.metaTitle ?? page.title, url: `/${page.slug}` },
  }
}

export default async function PublicPage({ params }: Props) {
  const page = await getPage((await params).slug)
  if (!page) notFound()

  const faq = faqSchema(pageFaq(page.content, page.blocks))

  return (
    <>
      {faq && <JsonLd data={faq} />}
      <PageBody page={page} />
    </>
  )
}
