import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { asJson } from '@/lib/as-json'
import { db } from '@/lib/db'
import { PostRepository } from '@/server'
import { PostsTable } from './posts-table'

export const metadata: Metadata = { title: 'Posts' }

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const view = (await searchParams).view === 'trash' ? 'trash' : 'all'
  const repo = new PostRepository(db)
  const [live, trashed] = await Promise.all([
    repo.findAllSummaries(),
    repo.findAllSummaries({ trashed: true }),
  ])
  const tab = (active: boolean) =>
    active ? 'font-semibold text-foreground' : 'text-primary hover:underline'
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
      <nav className="flex gap-2 text-sm text-muted-foreground" aria-label="Post views">
        <Link href="/admin/posts" className={tab(view === 'all')}>
          All ({live.length})
        </Link>
        |
        <Link href="/admin/posts?view=trash" className={tab(view === 'trash')}>
          Trash ({trashed.length})
        </Link>
      </nav>
      <PostsTable key={view} view={view} initialRows={asJson(view === 'trash' ? trashed : live)} />
    </DashboardLayout>
  )
}
