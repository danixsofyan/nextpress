import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { asJson } from '@/lib/as-json'
import { getCurrentSession } from '@/lib/auth'
import { listUsers } from '@/lib/users'
import { UsersTable } from './users-table'

export const metadata: Metadata = { title: 'Users' }

export default async function UsersPage() {
  const [session, users] = await Promise.all([getCurrentSession(), listUsers()])
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button asChild>
          <Link href="/admin/users/new">
            <UserPlus className="size-4" /> Add User
          </Link>
        </Button>
      </div>
      <UsersTable currentUserId={session?.user.id ?? ''} initialRows={asJson(users)} />
    </DashboardLayout>
  )
}
