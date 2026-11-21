import { NextResponse } from 'next/server'
import {
  createDonationPayment,
  donationOrderId,
  donationsEnabled,
  parseDonationAmount,
  parseDonor,
} from '@/lib/donations'
import { clientIp, verifyCaptcha } from '@/lib/captcha'
import { env } from '@/lib/env'
import { logger, requestIdOf } from '@/lib/logger'
import { db } from '@/lib/db'
import { DonationRepository, redis } from '@/server'

const LIMIT_PER_MINUTE = 5

async function rateLimited(request: Request) {
  if (!redis) return false
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const key = `donate:${ip}:${Math.floor(Date.now() / 60_000)}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 60)
  return count > LIMIT_PER_MINUTE
}

const back = (path: string) => NextResponse.redirect(new URL(path, env.NEXT_PUBLIC_SITE_URL), 303)

export async function POST(request: Request) {
  if (!donationsEnabled()) return back('/donate/error')
  if (await rateLimited(request)) return back('/donate/error')
  const form = await request.formData().catch(() => new FormData())
  const amount = parseDonationAmount(form)
  const donor = parseDonor(form)
  if (!amount || !donor) return back('/donate/error')
  const captcha = form.get('captcha')
  if (
    !(await verifyCaptcha(typeof captcha === 'string' ? captcha : null, clientIp(request.headers)))
  ) {
    return back('/donate/error')
  }
  const requestId = requestIdOf(request)
  const orderId = donationOrderId()
  const repo = new DonationRepository(db)
  try {
    await repo.create({ orderId, amount, ...donor, requestId })
    const link = await createDonationPayment({
      orderId,
      amount,
      successUrl: new URL('/donate/thanks', env.NEXT_PUBLIC_SITE_URL).toString(),
      cancelUrl: new URL('/', env.NEXT_PUBLIC_SITE_URL).toString(),
      requestId,
    })
    await repo.setPaymentUrl(orderId, link)
    return NextResponse.redirect(link, 303)
  } catch (error) {
    logger.error('donation payment failed', { requestId, orderId, amount, err: error })
    await repo
      .setStatus(orderId, 'failed')
      .catch((err) => logger.error('donation status update failed', { requestId, orderId, err }))
    return back('/donate/error')
  }
}
