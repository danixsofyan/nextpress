import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Thank you', robots: { index: false } }

export default function DonateThanksPage() {
  return (
    <section className="mx-auto max-w-xl py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Thank you for your support</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Your donation keeps this project independent and open source.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to home
      </Link>
    </section>
  )
}
