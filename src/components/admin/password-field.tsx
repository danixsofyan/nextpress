'use client'

import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+'

export function generatePassword(length = 20) {
  const bytes = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(bytes, (n) => CHARSET[n % CHARSET.length]).join('')
}

export function passwordStrength(value: string) {
  if (!value) return null
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length
  const score =
    (value.length >= 8 ? 1 : 0) +
    (value.length >= 12 ? 1 : 0) +
    (value.length >= 16 ? 1 : 0) +
    classes
  if (value.length < 8 || score <= 3)
    return { label: 'Weak', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' }
  if (score <= 5)
    return {
      label: 'Medium',
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    }
  return {
    label: 'Strong',
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  }
}

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
}

export function PasswordField({ id, value, onChange, autoComplete = 'new-password' }: Props) {
  const [visible, setVisible] = useState(false)
  const strength = passwordStrength(value)

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          onChange(generatePassword())
          setVisible(true)
        }}
      >
        Generate password
      </Button>
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete}
            minLength={8}
            className="flex h-9 w-full rounded-t-md border border-input bg-background px-3 font-mono text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
          {strength && (
            <div
              className={`rounded-b-md px-3 py-1 text-center text-xs font-semibold ${strength.className}`}
            >
              {strength.label}
            </div>
          )}
        </div>
        <Button type="button" variant="outline" onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {visible ? 'Hide' : 'Show'}
        </Button>
      </div>
    </div>
  )
}
