import { BookOpen } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background p-6">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
