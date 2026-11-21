import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { getPluginStates } from '@/lib/plugins'
import { PluginsTable } from './plugins-table'

export const metadata: Metadata = { title: 'Plugins' }

export default async function PluginsPage() {
  const rows = (await getPluginStates()).map(({ plugin, ...state }) => ({
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    category: plugin.category,
    version: plugin.version,
    fields: plugin.fields,
    ...state,
  }))
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Plugins</h1>
        <p className="text-sm text-muted-foreground">
          Plugins ship as code in <code>src/plugins/&lt;name&gt;</code>. Activate them and fill in
          their settings here, without a deploy. Secrets stay in environment variables.
        </p>
      </div>
      <PluginsTable rows={rows} />
    </DashboardLayout>
  )
}
