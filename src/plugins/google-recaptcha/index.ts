import { z } from 'zod'
import { definePlugin } from '../types'

export const googleRecaptcha = definePlugin({
  id: 'google-recaptcha',
  name: 'Google reCAPTCHA',
  description:
    'Protects the admin sign-in and the donation form with the reCAPTCHA v2 checkbox. Only one captcha plugin can be active.',
  category: 'security',
  version: '1.0.0',
  config: z.object({
    siteKey: z
      .string()
      .regex(/^[0-9A-Za-z_-]{20,64}$/, 'Paste the v2 site key from the reCAPTCHA admin console'),
  }),
  fields: [
    {
      key: 'siteKey',
      label: 'Site key',
      placeholder: '6Lc…',
      help: 'Set RECAPTCHA_SECRET_KEY in the environment for the secret key.',
    },
  ],
  requiredEnv: ['RECAPTCHA_SECRET_KEY'],
  captcha: 'recaptcha',
})
