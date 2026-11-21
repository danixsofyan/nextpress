import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { getWidgetAreas } from '@/lib/widgets'
import { WidgetsEditor } from './widgets-editor'

export const metadata: Metadata = { title: 'Widgets' }

export default async function WidgetsPage() {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Widgets</h1>
        <p className="text-sm text-muted-foreground">
          Widgets fill the blog sidebar and the site footer. Add, reorder, and edit them, then save.
        </p>
      </div>
      <WidgetsEditor initial={await getWidgetAreas()} />
    </DashboardLayout>
  )
}
