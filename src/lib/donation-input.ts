import { DONATION_MAX, DONATION_MIN } from '@/core/validators/blocks'

export function parseDonationAmount(form: FormData): number | null {
  const custom = String(form.get('custom') ?? '').trim()
  const raw = custom !== '' ? custom : String(form.get('amount') ?? '')
  if (!/^\d{1,9}$/.test(raw)) return null
  const amount = Number(raw)
  return amount >= DONATION_MIN && amount <= DONATION_MAX ? amount : null
}

export function donationOrderId(now = Date.now(), random = crypto.randomUUID()) {
  return `NPD-${now.toString(36).toUpperCase()}-${random.slice(0, 8).toUpperCase()}`
}
