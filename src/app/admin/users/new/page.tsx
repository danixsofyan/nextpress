import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { UserForm } from '@/components/admin/user-form'
import { emailEnabled } from '@/lib/email'

export const metadata: Metadata = { title: 'Add User' }

export const dynamic = 'force-dynamic'

export default function NewUserPage() {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Add User</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a brand new user and add them to this site.
        </p>
      </div>
      <UserForm mode="create" canInvite={emailEnabled()} />
    </DashboardLayout>
  )
}
