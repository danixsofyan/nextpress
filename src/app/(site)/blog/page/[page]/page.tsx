import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { BlogIndex, blogPageHref } from '@/components/blog-index'

export const revalidate = 3600

export async function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ page: string }> }

const parsePage = (value: string) => (/^[1-9]\d{0,4}$/.test(value) ? Number(value) : null)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = parsePage((await params).page)
  if (!page) return {}
  return { title: `Blog · Page ${page}`, alternates: { canonical: blogPageHref(page) } }
}

export default async function BlogPagedPage({ params }: Props) {
  const page = parsePage((await params).page)
  if (!page) notFound()
  if (page === 1) permanentRedirect('/blog')
  return <BlogIndex page={page} />
}
