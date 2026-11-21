'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES, type Role } from '@/lib/roles'
import { PasswordField } from './password-field'
import { useToast } from './toast'

type Props = {
  mode: 'create' | 'edit'
  userId?: string
  initial?: { name: string; email: string; role: Role }
  isSelf?: boolean
}

export function UserForm({ mode, userId, initial, isSelf = false }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [role, setRole] = useState<Role>(initial?.role ?? 'author')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(mode === 'create' ? '/api/admin/users' : `/api/admin/users/${userId}`, {
      method: mode === 'create' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role, password }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Could not save the user')
      return
    }
    if (mode === 'create') {
      toast.success(`User "${name}" added.`)
      router.push('/admin/users')
      return
    }
    setPassword('')
    toast.success('User updated.')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <Label htmlFor="name">Name (required)</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          autoComplete="off"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="email">Email (required)</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="off"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="password">
          {mode === 'create' ? 'Password (required)' : 'New password'}
        </Label>
        {mode === 'edit' && (
          <p className="mb-2 text-xs text-muted-foreground">
            Leave empty to keep the current password.
          </p>
        )}
        <div className="mt-1">
          <PasswordField id="password" value={password} onChange={setPassword} />
        </div>
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          disabled={isSelf}
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          {isSelf ? 'You cannot change your own role.' : ROLE_DESCRIPTIONS[role]}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || (mode === 'create' && password.length < 8)}>
          {saving ? 'Saving...' : mode === 'create' ? 'Add User' : 'Update User'}
        </Button>
      </div>
    </form>
  )
}
