import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { asJson } from '@/lib/as-json'
import { db } from '@/lib/db'
import { CommentRepository } from '@/server'
import { CommentsTable } from './comments-table'

export const metadata: Metadata = { title: 'Comments' }

export default async function CommentsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Comments</h1>
      <CommentsTable initialRows={asJson(await new CommentRepository(db).findAll())} />
    </DashboardLayout>
  )
}
