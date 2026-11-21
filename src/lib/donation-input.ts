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

export const DONOR_NAME_MAX = 80
export const DONOR_MESSAGE_MAX = 500

const cleanText = (value: FormDataEntryValue | null, max: number) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max)

export function parseDonor(form: FormData) {
  const donorName = cleanText(form.get('name'), DONOR_NAME_MAX)
  if (!donorName) return null
  return { donorName, message: cleanText(form.get('message'), DONOR_MESSAGE_MAX) || null }
}
