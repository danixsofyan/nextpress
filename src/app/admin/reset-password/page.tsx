import type { Metadata } from 'next'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = { title: 'Choose a new password' }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams
  return (
    <ResetPasswordForm token={!error && token && /^[\w-]{8,200}$/.test(token) ? token : null} />
  )
}
