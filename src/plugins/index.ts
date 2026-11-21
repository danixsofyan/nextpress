import { cloudflareTurnstile } from './cloudflare-turnstile'
import { googleAnalytics } from './google-analytics'
import { googleLogin } from './google-login'
import { googleRecaptcha } from './google-recaptcha'
import { metaPixel } from './meta-pixel'
import type { PluginDefinition } from './types'

export const PLUGINS: PluginDefinition[] = [
  googleAnalytics,
  metaPixel,
  cloudflareTurnstile,
  googleRecaptcha,
  googleLogin,
]

export const findPlugin = (id: string) => PLUGINS.find((p) => p.id === id)

export type { CaptchaProvider, PluginDefinition, PluginField } from './types'
