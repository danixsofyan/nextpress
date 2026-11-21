'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AuthCard } from '@/components/admin/auth-card'
import { CaptchaWidget } from '@/components/captcha-widget'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CaptchaConfig } from '@/lib/plugins'

export function ForgotPasswordForm({ captcha }: { captcha: CaptchaConfig | null }) {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    const res = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token && { 'x-captcha-token': token }) },
      body: JSON.stringify({ email: email.trim(), redirectTo: '/admin/reset-password' }),
    })
    if (res.ok) setState('sent')
    else {
      setState('error')
      setToken('')
      setAttempt((n) => n + 1)
    }
  }

  return (
    <AuthCard title="Lost your password?" subtitle="We will email you a link to choose a new one.">
      {state === 'sent' ? (
        <p role="status" className="text-sm">
          If an account uses that email, a reset link is on its way. Check your inbox and spam
          folder.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          {captcha && (
            <CaptchaWidget
              key={attempt}
              provider={captcha.provider}
              siteKey={captcha.siteKey}
              onToken={setToken}
            />
          )}
          {state === 'error' && (
            <p role="alert" className="text-sm text-destructive">
              The request failed. Wait a few minutes and try again.
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={state === 'sending' || (captcha !== null && !token)}
          >
            {state === 'sending' ? 'Sending…' : 'Email me a reset link'}
          </Button>
        </form>
      )}
      <Link
        href="/admin/login"
        className="mt-6 block text-center text-sm text-primary hover:underline"
      >
        Back to sign in
      </Link>
    </AuthCard>
  )
}
