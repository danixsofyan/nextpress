import { apiError } from '@/lib/api-error'
import { PostRepository } from '@/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { hasRole } from '@/lib/roles'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  const repo = new PostRepository(db)
  const post = await repo.findById(id, { includeTrashed: true })
  if (!post?.deletedAt) return apiError('Not found', 404)
  if (!hasRole(session.user.role, 'editor') && post.authorId !== session.user.id) {
    return apiError('Authors can only change their own posts', 403)
  }
  return Response.json(await repo.restore(id))
}
