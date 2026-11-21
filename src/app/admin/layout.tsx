import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import './admin.css'
import { AdminSessionProvider } from '@/components/admin/admin-session'
import { ConfirmProvider } from '@/components/admin/confirm-dialog'
import { getCurrentSession } from '@/lib/auth'
import { ToastProvider } from '@/components/admin/toast'

export const metadata: Metadata = {
  title: { template: '%s | NextPress Admin', absolute: 'NextPress Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession().catch(() => null)
  const user = session
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role ?? 'author',
      }
    : null
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ToastProvider>
        <ConfirmProvider>
          <AdminSessionProvider user={user}>{children}</AdminSessionProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
