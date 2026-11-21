import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { asJson } from '@/lib/as-json'
import { db } from '@/lib/db'
import { PageRepository } from '@/server'
import { PagesTable } from './pages-table'

export const metadata: Metadata = { title: 'Pages' }

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const view = (await searchParams).view === 'trash' ? 'trash' : 'all'
  const repo = new PageRepository(db)
  const [live, trashed] = await Promise.all([
    repo.findSummaries(),
    repo.findSummaries({ trashed: true }),
  ])
  const tab = (active: boolean) =>
    active ? 'font-semibold text-foreground' : 'text-primary hover:underline'
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pages</h1>
        <Button asChild>
          <Link href="/admin/pages/new">
            <Plus className="size-4" /> New Page
          </Link>
        </Button>
      </div>
      <nav className="flex gap-2 text-sm text-muted-foreground" aria-label="Page views">
        <Link href="/admin/pages" className={tab(view === 'all')}>
          All ({live.length})
        </Link>
        |
        <Link href="/admin/pages?view=trash" className={tab(view === 'trash')}>
          Trash ({trashed.length})
        </Link>
      </nav>
      <PagesTable key={view} view={view} initialRows={asJson(view === 'trash' ? trashed : live)} />
    </DashboardLayout>
  )
}
