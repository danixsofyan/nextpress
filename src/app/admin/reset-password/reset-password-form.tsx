'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AuthCard } from '@/components/admin/auth-card'
import { PasswordField } from '@/components/admin/password-field'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [password, setPassword] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('saving')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: password, token }),
    })
    setState(res.ok ? 'done' : 'error')
  }

  if (!token) {
    return (
      <AuthCard title="Link expired" subtitle="This password reset link is invalid or has expired.">
        <Link
          href="/admin/forgot-password"
          className="block text-center text-sm text-primary hover:underline"
        >
          Request a new link
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Use at least 8 characters.">
      {state === 'done' ? (
        <div className="space-y-4 text-center">
          <p role="status" className="text-sm">
            Your password was changed.
          </p>
          <Button asChild className="w-full">
            <Link href="/admin/login">Sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Label htmlFor="new-password">New password</Label>
          <PasswordField id="new-password" value={password} onChange={setPassword} />
          {state === 'error' && (
            <p role="alert" className="text-sm text-destructive">
              The password could not be changed. The link may have expired.
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={state === 'saving' || password.length < 8}
          >
            {state === 'saving' ? 'Saving…' : 'Save password'}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
