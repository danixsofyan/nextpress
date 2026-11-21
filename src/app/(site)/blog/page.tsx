import type { Metadata } from 'next'
import { BlogIndex } from '@/components/blog-index'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog',
  alternates: { canonical: '/blog' },
}

export default function BlogPage() {
  return <BlogIndex page={1} />
}
