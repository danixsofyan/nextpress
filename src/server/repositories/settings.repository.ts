import { revalidatePublicSite } from '../revalidate'
import { audit } from '../audit'
import type { Database } from '@/core/db'
import { settings } from '@/core/schema'
import { eq } from 'drizzle-orm'

export class SettingsRepository {
  constructor(private readonly db: Database) {}

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.db.select().from(settings)
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  }

  async get(key: string): Promise<string | null> {
    const result = await this.db.select().from(settings).where(eq(settings.key, key)).limit(1)
    return result[0]?.value ?? null
  }

  async set(key: string, value: string): Promise<void> {
    await this.write(key, value)
    await audit(
      this.db,
      'settings.update',
      { type: 'setting', id: key },
      { after: { [key]: value } }
    )
    revalidatePublicSite()
  }

  private async write(key: string, value: string) {
    await this.db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } })
  }

  async setMany(pairs: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(pairs)) {
      await this.write(key, value)
    }
    await audit(this.db, 'settings.update', { type: 'setting' }, { after: pairs })
    revalidatePublicSite()
  }
}
