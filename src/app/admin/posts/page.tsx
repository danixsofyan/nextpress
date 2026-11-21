import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { PostsTable } from './posts-table'

export const metadata: Metadata = { title: 'Posts' }

export default function PostsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="size-4" /> New Post
          </Link>
        </Button>
      </div>
      <PostsTable />
    </DashboardLayout>
  )
}
