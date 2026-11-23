import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

describe('verifyCaptcha with an active plugin', () => {
  it('asks the provider and fails closed', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'x'.repeat(32)
    const { savePlugin } = await import('./plugins')
    const { verifyCaptcha, clientIp } = await import('./captcha')
    expect(
      await savePlugin('cloudflare-turnstile', {
        config: { siteKey: '1x00000000000000000000AA' },
        active: true,
      })
    ).toEqual({ ok: true })
    expect(await verifyCaptcha(null)).toBe(false)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ success: true }))
    )
    expect(await verifyCaptcha('token', '1.2.3.4')).toBe(true)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ success: false }))
    )
    expect(await verifyCaptcha('token')).toBe(false)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline')))
    )
    expect(await verifyCaptcha('token')).toBe(false)
    expect(clientIp(new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))).toBe('9.9.9.9')
    await savePlugin('cloudflare-turnstile', { active: false })
  })
})
