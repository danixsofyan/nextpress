import type { Metadata } from 'next'
import PublicPage, { generateMetadata as pageMetadata } from '../[slug]/page'

export const revalidate = 3600

const params = Promise.resolve({ slug: 'donate' })

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ params })
}

export default function DonatePage() {
  return <PublicPage params={params} />
}
