import { env } from './env'

export { donationOrderId, parseDonationAmount, parseDonor } from './donation-input'

export const donationsEnabled = () => Boolean(env.SUMOPOD_API_KEY)

export async function createDonationPayment(input: {
  orderId: string
  amount: number
  successUrl: string
  cancelUrl: string
  requestId?: string | undefined
}) {
  if (!env.SUMOPOD_API_KEY) throw new Error('Donations are not configured')
  const res = await fetch(`${env.SUMOPOD_API_BASE_URL.replace(/\/+$/, '')}/api/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': env.SUMOPOD_API_KEY,
      ...(input.requestId && { 'X-Request-ID': input.requestId }),
    },
    body: JSON.stringify({
      order_id: input.orderId,
      amount: input.amount,
      currency: 'IDR',
      expires_in_hours: 24,
      success_return_url: input.successUrl,
      cancel_return_url: input.cancelUrl,
      payment_method_type_code: 'QRIS',
    }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    payment_link_url?: string
    error?: string
    message?: string
  }
  if (!res.ok || !data.payment_link_url?.startsWith('https://')) {
    throw new Error(`SumoPod rejected the payment: ${data.error ?? data.message ?? res.status}`)
  }
  return data.payment_link_url
}
