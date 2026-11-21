import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import './admin.css'
import { ConfirmProvider } from '@/components/admin/confirm-dialog'
import { ToastProvider } from '@/components/admin/toast'

export const metadata: Metadata = {
  title: { template: '%s | NextPress Admin', absolute: 'NextPress Admin' },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
