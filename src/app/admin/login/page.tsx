import type { Metadata } from 'next'
import { hasUsers } from '@/lib/auth'
import { emailEnabled } from '@/lib/email'
import { getCaptcha, isPluginActive } from '@/lib/plugins'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [users, captcha, google] = await Promise.all([
    hasUsers(),
    getCaptcha(),
    isPluginActive('google-login'),
  ])
  return (
    <LoginForm
      needsSetup={!users}
      captcha={captcha}
      googleLogin={google && users}
      googleError={(await searchParams).error === 'google'}
      canResetPassword={users && emailEnabled()}
    />
  )
}
