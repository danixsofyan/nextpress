import type { Metadata } from 'next'
import { hasUsers } from '@/lib/auth'
import { getCaptcha } from '@/lib/plugins'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage() {
  const [users, captcha] = await Promise.all([hasUsers(), getCaptcha()])
  return <LoginForm needsSetup={!users} captcha={captcha} />
}
