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

export default async function PagesPage() {
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
      <PagesTable initialRows={asJson(await new PageRepository(db).findSummaries())} />
    </DashboardLayout>
  )
}
