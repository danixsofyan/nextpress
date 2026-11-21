import type { Database } from '@/core/db'
import { DONATION_STATUSES, donations } from '@/core/schema'
import { desc, eq } from 'drizzle-orm'

type DonationStatus = (typeof DONATION_STATUSES)[number]

const STATUS_WORDS: [RegExp, DonationStatus][] = [
  [/paid|success|settle|complete/i, 'completed'],
  [/expire/i, 'expired'],
  [/fail|cancel|reject/i, 'failed'],
]

export function donationStatus(...signals: (string | undefined)[]): DonationStatus | null {
  const text = signals.filter(Boolean).join(' ')
  return STATUS_WORDS.find(([pattern]) => pattern.test(text))?.[1] ?? null
}

export class DonationRepository {
  constructor(private readonly db: Database) {}

  async create(input: { orderId: string; amount: number; requestId?: string | null | undefined }) {
    const [row] = await this.db.insert(donations).values(input).returning()
    return row!
  }

  async setPaymentUrl(orderId: string, paymentUrl: string) {
    await this.db.update(donations).set({ paymentUrl }).where(eq(donations.orderId, orderId))
  }

  async setStatus(orderId: string, status: DonationStatus) {
    const [row] = await this.db
      .update(donations)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === 'completed' && { completedAt: new Date() }),
      })
      .where(eq(donations.orderId, orderId))
      .returning()
    return row ?? null
  }

  async findRecent(limit = 200) {
    return this.db.select().from(donations).orderBy(desc(donations.createdAt)).limit(limit)
  }
}
