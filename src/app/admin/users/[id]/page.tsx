import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { UserForm } from '@/components/admin/user-form'
import { getCurrentSession } from '@/lib/auth'
import { isRole } from '@/lib/roles'
import { findUser } from '@/lib/users'

export const metadata: Metadata = { title: 'Edit User' }

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [target, session] = await Promise.all([findUser(id), getCurrentSession()])
  if (!target) notFound()
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Edit User</h1>
      <UserForm
        mode="edit"
        userId={target.id}
        initial={{
          name: target.name,
          email: target.email,
          role: isRole(target.role) ? target.role : 'author',
        }}
        isSelf={session?.user.id === target.id}
      />
    </DashboardLayout>
  )
}
