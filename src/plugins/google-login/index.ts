import { z } from 'zod'
import { definePlugin } from '../types'

export const googleLogin = definePlugin({
  id: 'google-login',
  name: 'Sign in with Google',
  description:
    'Adds a Google button to the admin sign-in. Only existing users can sign in this way; Google never creates new accounts. Add https://<your-domain>/api/auth/callback/google as an authorized redirect URI in Google Cloud.',
  category: 'security',
  version: '1.0.0',
  config: z.object({}),
  fields: [],
  requiredEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
})
