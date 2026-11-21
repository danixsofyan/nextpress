import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { type HealthStatus, runSiteHealth } from '@/lib/site-health'

export const metadata: Metadata = { title: 'Site Health' }
export const dynamic = 'force-dynamic'

const STYLE: Record<HealthStatus, { icon: typeof CheckCircle2; label: string; className: string }> =
  {
    critical: { icon: XCircle, label: 'Critical', className: 'text-destructive' },
    recommended: {
      icon: AlertTriangle,
      label: 'Recommended',
      className: 'text-amber-600 dark:text-amber-400',
    },
    good: {
      icon: CheckCircle2,
      label: 'Good',
      className: 'text-emerald-600 dark:text-emerald-400',
    },
  }

export default async function SiteHealthPage() {
  const checks = await runSiteHealth()
  const critical = checks.filter((c) => c.status === 'critical').length
  const recommended = checks.filter((c) => c.status === 'recommended').length
  const summary =
    critical > 0
      ? `${critical} critical issue${critical === 1 ? '' : 's'} need attention`
      : recommended > 0
        ? `Good, with ${recommended} recommended improvement${recommended === 1 ? '' : 's'}`
        : 'Everything looks good'

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Site Health</h1>
        <p className="text-sm text-muted-foreground">{summary}.</p>
      </div>
      <ul className="divide-y rounded-lg border">
        {checks.map((check) => {
          const { icon: Icon, label, className } = STYLE[check.status]
          return (
            <li key={check.id} className="flex gap-3 p-4">
              <Icon className={`mt-0.5 size-5 shrink-0 ${className}`} aria-hidden />
              <div className="min-w-0">
                <p className="font-medium">
                  {check.label}{' '}
                  <span className={`ml-1 text-xs font-normal ${className}`}>{label}</span>
                </p>
                <p className="text-sm break-words text-muted-foreground">{check.description}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </DashboardLayout>
  )
}
