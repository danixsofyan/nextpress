import { notFound, redirect } from 'next/navigation'
import { DOCS, isDocsEnabled } from '@/lib/docs'

export default function DocsIndex() {
  if (!isDocsEnabled()) notFound()
  redirect(`/docs/${DOCS[0]}`)
}
