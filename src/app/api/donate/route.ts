import { NextResponse } from 'next/server'
import {
  createDonationPayment,
  donationOrderId,
  donationsEnabled,
  parseDonationAmount,
} from '@/lib/donations'
import { env } from '@/lib/env'
import { redis } from '@/server'

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
  const amount = parseDonationAmount(await request.formData().catch(() => new FormData()))
  if (!amount) return back('/donate/error')
  try {
    const link = await createDonationPayment({
      orderId: donationOrderId(),
      amount,
      successUrl: new URL('/donate/thanks', env.NEXT_PUBLIC_SITE_URL).toString(),
      cancelUrl: new URL('/', env.NEXT_PUBLIC_SITE_URL).toString(),
    })
    return NextResponse.redirect(link, 303)
  } catch (error) {
    console.error(error)
    return back('/donate/error')
  }
}
