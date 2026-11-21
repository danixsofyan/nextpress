import { asJson } from '@/lib/as-json'
import { db } from '@/lib/db'
import { PageRepository, SettingsRepository } from '@/server'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const [settings, pages] = await Promise.all([
    new SettingsRepository(db).getAll(),
    new PageRepository(db).findMany(),
  ])
  return (
    <SettingsClient
      initialSettings={settings}
      initialPages={asJson(pages).map(({ id, title, slug, status }) => ({
        id,
        title,
        slug,
        status,
      }))}
    />
  )
}
