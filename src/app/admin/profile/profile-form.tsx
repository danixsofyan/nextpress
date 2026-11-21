'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PasswordField } from '@/components/admin/password-field'
import { useToast } from '@/components/admin/toast'

async function errorText(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({}))
  return body.message ?? body.error ?? fallback
}

export function ProfileForm({
  name: initialName,
  email,
  role,
}: {
  name: string
  email: string
  role: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const toast = useToast()

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setSavingName(true)
    const res = await fetch('/api/auth/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setSavingName(false)
    if (res.ok) toast.success('Profile updated.')
    else toast.error(await errorText(res, 'Could not update profile'))
    if (res.ok) router.refresh()
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setSavingPassword(true)
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword, revokeOtherSessions: true }),
    })
    setSavingPassword(false)
    if (!res.ok) {
      toast.error(await errorText(res, 'Could not change password'))
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    toast.success('Password changed. Other devices were signed out.')
  }

  return (
    <div className="max-w-xl space-y-10">
      <form onSubmit={saveName} className="space-y-6">
        <h2 className="text-lg font-semibold">Personal information</h2>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="mt-1" />
          <p className="mt-1 text-xs text-muted-foreground">
            Ask an administrator to change your email.
          </p>
        </div>
        <div>
          <Label>Role</Label>
          <p className="mt-1 text-sm capitalize">{role}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={savingName}>
            {savingName ? 'Saving...' : 'Update Profile'}
          </Button>
        </div>
      </form>

      <form onSubmit={changePassword} className="space-y-6 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">Account management</h2>
        <div>
          <Label htmlFor="current_password">Current password</Label>
          <Input
            id="current_password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="new_password">New password</Label>
          <div className="mt-1">
            <PasswordField id="new_password" value={newPassword} onChange={setNewPassword} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={savingPassword || newPassword.length < 8 || !currentPassword}
          >
            {savingPassword ? 'Saving...' : 'Change Password'}
          </Button>
        </div>
      </form>
    </div>
  )
}
