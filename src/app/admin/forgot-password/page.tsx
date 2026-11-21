import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { emailEnabled } from '@/lib/email'
import { getCaptcha } from '@/lib/plugins'
import { ForgotPasswordForm } from './forgot-password-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Lost password' }

export default async function ForgotPasswordPage() {
  if (!emailEnabled()) notFound()
  return <ForgotPasswordForm captcha={await getCaptcha()} />
}
