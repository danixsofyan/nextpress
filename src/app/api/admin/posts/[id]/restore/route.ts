import { PostRepository } from '@/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { loadOwnedPost } from '@/lib/post-access'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  const owned = await loadOwnedPost(session, id, true)
  if (owned instanceof Response) return owned
  const post = await new PostRepository(db).restore(id)
  return post
    ? Response.json(post)
    : Response.json({ error: 'Not in the Trash', code: 'NP-4090' }, { status: 409 })
}
