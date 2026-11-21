'use client'

import { useEffect, useRef, useState } from 'react'

type Provider = 'turnstile' | 'recaptcha'

type RenderApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback'?: () => void
      theme?: 'light' | 'dark' | 'auto'
    }
  ) => unknown
}

const SCRIPTS: Record<Provider, { src: string; global: 'turnstile' | 'grecaptcha' }> = {
  turnstile: { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js', global: 'turnstile' },
  recaptcha: { src: 'https://www.google.com/recaptcha/api.js', global: 'grecaptcha' },
}

const loading = new Map<Provider, Promise<RenderApi>>()

function loadApi(provider: Provider) {
  const existing = loading.get(provider)
  if (existing) return existing
  const { src, global } = SCRIPTS[provider]
  const callback = `npCaptchaReady_${provider}`
  const promise = new Promise<RenderApi>((resolve, reject) => {
    const scope = window as unknown as Record<string, unknown>
    scope[callback] = () => resolve(scope[global] as RenderApi)
    const script = document.createElement('script')
    script.src = `${src}?render=explicit&onload=${callback}`
    script.async = true
    script.onerror = () => reject(new Error('Captcha script failed to load'))
    document.head.appendChild(script)
  })
  loading.set(provider, promise)
  return promise
}

export function CaptchaWidget({
  provider,
  siteKey,
  lazy = false,
  onToken,
}: {
  provider: Provider
  siteKey: string
  lazy?: boolean
  onToken?: (token: string) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [token, setToken] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const element = container.current
    if (!element) return
    let rendered = false
    const render = () => {
      if (rendered) return
      rendered = true
      const dark = element.closest('[data-scheme="dark"], .dark') !== null
      loadApi(provider)
        .then((api) =>
          api.render(element, {
            sitekey: siteKey,
            theme: dark ? 'dark' : 'light',
            callback: (value) => {
              setToken(value)
              onToken?.(value)
            },
            'expired-callback': () => {
              setToken('')
              onToken?.('')
            },
          })
        )
        .catch(() => setFailed(true))
    }
    if (!lazy) {
      render()
      return
    }
    const form = element.closest('form')
    const onFocus = () => render()
    form?.addEventListener('focusin', onFocus, { once: true })
    form?.addEventListener('pointerenter', onFocus, { once: true })
    return () => {
      form?.removeEventListener('focusin', onFocus)
      form?.removeEventListener('pointerenter', onFocus)
    }
  }, [provider, siteKey, lazy, onToken])

  return (
    <div>
      <div ref={container} className="min-h-[65px]" />
      <input type="hidden" name="captcha" value={token} />
      {failed && (
        <p className="text-xs text-destructive">
          The security check could not load. Disable blockers for this site and reload.
        </p>
      )}
    </div>
  )
}
