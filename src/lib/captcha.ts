import { env } from './env'
import { logger } from './logger'
import { type CaptchaConfig, getCaptcha } from './plugins'

const VERIFY_URL: Record<CaptchaConfig['provider'], string> = {
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  recaptcha: 'https://www.google.com/recaptcha/api/siteverify',
}

const secretFor = (provider: CaptchaConfig['provider']) =>
  provider === 'turnstile' ? env.TURNSTILE_SECRET_KEY : env.RECAPTCHA_SECRET_KEY

export async function verifyCaptcha(token: string | null | undefined, ip?: string | null) {
  const captcha = await getCaptcha()
  if (!captcha) return true
  const secret = secretFor(captcha.provider)
  if (!token || !secret || token.length > 4096) return false
  try {
    const res = await fetch(VERIFY_URL[captcha.provider], {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, ...(ip && { remoteip: ip }) }),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (err) {
    logger.error('captcha verification failed', { provider: captcha.provider, err })
    return false
  }
}

export const clientIp = (headers: Headers) =>
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
