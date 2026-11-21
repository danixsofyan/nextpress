import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { getCurrentSession } from '@/lib/auth'
import { isRole, ROLE_LABELS } from '@/lib/roles'
import { ProfileForm } from './profile-form'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const session = await getCurrentSession()
  if (!session) redirect('/admin/login')
  const { name, email, role } = session.user
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Profile</h1>
      <ProfileForm
        name={name}
        email={email}
        role={isRole(role) ? ROLE_LABELS[role] : String(role)}
      />
    </DashboardLayout>
  )
}
