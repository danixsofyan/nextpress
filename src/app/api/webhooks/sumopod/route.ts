import { env } from '@/lib/env'
import { logger, requestIdOf } from '@/lib/logger'
import { verifySumopodSignature, verifySumopodToken } from '@/lib/sumopod-signature'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signed =
    (env.SUMOPOD_WEBHOOK_SECRET &&
      verifySumopodSignature({
        svixId: request.headers.get('svix-id'),
        svixTimestamp: request.headers.get('svix-timestamp'),
        svixSignature: request.headers.get('svix-signature'),
        rawBody,
        secret: env.SUMOPOD_WEBHOOK_SECRET,
      })) ||
    verifySumopodToken(request.headers.get('x-webhook-token'), env.SUMOPOD_WEBHOOK_TOKEN)
  if (!signed) return new Response(null, { status: 403 })

  let event: { event_type?: string; data?: { order_id?: string; amount?: number; status?: string } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response(null, { status: 400 })
  }
  const orderId = event.data?.order_id ?? ''
  if (orderId && !orderId.startsWith('NPD-')) return new Response(null, { status: 404 })
  logger.info('donation webhook', {
    requestId: requestIdOf(request),
    event: event.event_type,
    orderId,
    amount: event.data?.amount,
    status: event.data?.status,
  })
  return Response.json({ received: true })
}
