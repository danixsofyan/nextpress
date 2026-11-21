'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, BookOpen } from 'lucide-react'
import { ThemeToggle } from '@/components/admin/theme-toggle'
import { CaptchaWidget } from '@/components/captcha-widget'
import type { CaptchaConfig } from '@/lib/plugins'

export function LoginForm({
  needsSetup,
  captcha,
  googleLogin,
  googleError = false,
}: {
  needsSetup: boolean
  captcha: CaptchaConfig | null
  googleLogin: boolean
  googleError?: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(
    googleError ? 'Google sign-in failed. Only existing users can sign in with Google.' : ''
  )
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [attempt, setAttempt] = useState(0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch(needsSetup ? '/api/auth/sign-up/email' : '/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(captchaToken && { 'x-captcha-token': captchaToken }),
      },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    })
    if (res.ok) {
      router.push('/admin/dashboard')
      router.refresh()
    } else {
      setError(
        res.status === 403 && captcha
          ? 'The security check failed. Please try again.'
          : needsSetup
            ? 'Could not create the account'
            : 'Invalid email or password'
      )
      setCaptchaToken('')
      setAttempt((n) => n + 1)
    }
    setLoading(false)
  }

  async function signInWithGoogle() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        callbackURL: '/admin/dashboard',
        errorCallbackURL: '/admin/login?error=google',
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { url?: string }
    if (res.ok && data.url?.startsWith('https://')) {
      window.location.href = data.url
      return
    }
    setError('Google sign-in is not available right now.')
    setLoading(false)
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-6 md:p-10">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <ThemeToggle className="fixed top-4 right-4 z-20" />

      <div className="relative z-10 w-full max-w-sm md:max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-md">
          <div className="grid md:grid-cols-2">
            <form className="p-6 md:p-8" onSubmit={handleSubmit}>
              <div className="mb-6 flex flex-col items-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <BookOpen className="size-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {needsSetup ? 'Welcome to NextPress' : 'Welcome back'}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {needsSetup
                      ? 'Create the first administrator account'
                      : 'Sign in to NextPress Admin'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {needsSetup && (
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-foreground">
                      Name
                    </label>
                    <input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={needsSetup ? 'new-password' : 'current-password'}
                      minLength={8}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-0 right-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      <span className="sr-only">{showPassword ? 'Hide' : 'Show'} password</span>
                    </button>
                  </div>
                </div>

                {captcha && (
                  <CaptchaWidget
                    key={attempt}
                    provider={captcha.provider}
                    siteKey={captcha.siteKey}
                    onToken={setCaptchaToken}
                  />
                )}

                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || (captcha !== null && !captchaToken)}
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {loading ? 'Please wait...' : needsSetup ? 'Create account' : 'Sign in'}
                </button>

                {googleLogin && (
                  <>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="h-px flex-1 bg-border" />
                      or
                      <span className="h-px flex-1 bg-border" />
                    </div>
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      disabled={loading}
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                        <path
                          fill="#EA4335"
                          d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12s4.3 9.7 9.6 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
                        />
                      </svg>
                      Sign in with Google
                    </button>
                  </>
                )}
              </div>
            </form>

            <div className="relative hidden overflow-hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70" />
              <div className="relative flex h-full flex-col items-center justify-center gap-6 p-8 text-primary-foreground">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm">
                  <BookOpen className="size-8" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold">NextPress</h2>
                  <p className="mt-2 text-sm text-primary-foreground/80">
                    Open-source CMS built on Next.js.
                    <br />
                    Fast, secure, AI-ready.
                  </p>
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  {[
                    'SEO-first with generateMetadata',
                    'MCP server for AI agents',
                    'Theme system like WordPress',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-primary-foreground/60" />
                      <span className="text-primary-foreground/90">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
