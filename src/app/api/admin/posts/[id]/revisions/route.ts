import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { loadOwnedPost } from '@/lib/post-access'
import { PostRepository } from '@/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  const owned = await loadOwnedPost(session, id)
  if (owned instanceof Response) return owned
  return Response.json(await new PostRepository(db).findRevisions(id))
}
