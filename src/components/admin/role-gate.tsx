import { ShieldAlert } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { hasRole, type Role } from '@/lib/roles'
import { DashboardLayout } from './dashboard-layout'

export async function RoleGate({ min, children }: { min: Role; children: React.ReactNode }) {
  const session = await getCurrentSession()
  if (!session) redirect('/admin/login')
  if (!hasRole(session.user.role, min)) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
          <ShieldAlert className="size-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">You do not have access to this page</h1>
          <p className="text-sm text-muted-foreground">
            Ask an administrator if you need this permission.
          </p>
        </div>
      </DashboardLayout>
    )
  }
  return children
}
