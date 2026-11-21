import type { Metadata } from 'next'
import { env } from '@/lib/env'
import { getSiteSettings } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings()
  return {
    title: { template: `%s | ${site.title}`, default: site.title },
    description: site.description || undefined,
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    icons: { icon: site.icon },
    openGraph: {
      siteName: site.title,
      type: 'website',
      images: [site.ogImage || `/og?title=${encodeURIComponent(site.title)}`],
    },
    twitter: { card: 'summary_large_image' },
    ...(site.discourageSearch && { robots: { index: false, follow: false } }),
    alternates: { types: { 'application/rss+xml': [{ url: '/feed.xml', title: site.title }] } },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
