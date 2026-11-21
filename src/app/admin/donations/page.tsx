import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { db } from '@/lib/db'
import { DonationRepository } from '@/server'

export const metadata: Metadata = { title: 'Donations' }

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export default async function DonationsPage() {
  const rows = await new DonationRepository(db).findRecent()
  const total = rows.filter((d) => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0)
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Donations</h1>
        <p className="text-sm text-muted-foreground">
          Received: <span className="font-semibold text-foreground">{rupiah.format(total)}</span>
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Donor</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Completed</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No donations yet.
                </td>
              </tr>
            )}
            {rows.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="max-w-xs px-4 py-3">
                  <p className="font-medium">{d.donorName ?? 'Anonymous'}</p>
                  {d.message && (
                    <p className="mt-0.5 break-words whitespace-pre-line text-muted-foreground">
                      {d.message}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{d.orderId}</td>
                <td className="px-4 py-3">{rupiah.format(d.amount)}</td>
                <td className="px-4 py-3">
                  <Badge variant={d.status === 'completed' ? 'default' : 'secondary'}>
                    {d.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{d.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {d.completedAt?.toLocaleString() ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
