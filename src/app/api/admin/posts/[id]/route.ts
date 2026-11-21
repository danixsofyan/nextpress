import { PostRepository } from '@/server'
import { withApiErrors } from '@/lib/api-errors'
import { db } from '@/lib/db'
import { requireRole, type Session } from '@/lib/auth'
import { hasRole } from '@/lib/roles'
import { updatePostSchema } from '@/core/validators'

type Params = { params: Promise<{ id: string }> }

const forbidden = () =>
  Response.json({ error: 'Authors can only change their own posts' }, { status: 403 })

async function loadOwned(session: Session, id: string) {
  const post = await new PostRepository(db).findById(id)
  if (!post) return Response.json({ error: 'Not found' }, { status: 404 })
  if (!hasRole(session.user.role, 'editor') && post.authorId !== session.user.id) return forbidden()
  return post
}

export async function GET(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const owned = await loadOwned(session, (await params).id)
  return owned instanceof Response ? owned : Response.json(owned)
}

async function putHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  const owned = await loadOwned(session, id)
  if (owned instanceof Response) return owned
  const input = updatePostSchema.parse(await request.json())
  const post = await new PostRepository(db).update(id, input)
  if (!post) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(post)
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  const owned = await loadOwned(session, id)
  if (owned instanceof Response) return owned
  await new PostRepository(db).delete(id)
  return new Response(null, { status: 204 })
}

export const PUT = withApiErrors(putHandler)
