import { z } from 'zod'
import { definePlugin } from '../types'

export const cloudflareTurnstile = definePlugin({
  id: 'cloudflare-turnstile',
  name: 'Cloudflare Turnstile',
  description:
    'Stops bots on the admin sign-in and the donation form with a privacy-friendly challenge. Only one captcha plugin can be active.',
  category: 'security',
  version: '1.0.0',
  config: z.object({
    siteKey: z
      .string()
      .regex(/^[0-9A-Za-z_-]{10,64}$/, 'Paste the site key from the Turnstile dashboard'),
  }),
  fields: [
    {
      key: 'siteKey',
      label: 'Site key',
      placeholder: '0x4AAAAAAA…',
      help: 'Set TURNSTILE_SECRET_KEY in the environment for the secret key.',
    },
  ],
  requiredEnv: ['TURNSTILE_SECRET_KEY'],
  captcha: 'turnstile',
})
