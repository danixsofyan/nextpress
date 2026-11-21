import type { Metadata } from 'next'
import { asJson } from '@/lib/as-json'
import { db } from '@/lib/db'
import { MediaRepository } from '@/server'
import { MediaClient } from './media-client'

export const metadata: Metadata = { title: 'Media' }

export default async function MediaPage() {
  return <MediaClient initialItems={asJson(await new MediaRepository(db).findMany())} />
}
