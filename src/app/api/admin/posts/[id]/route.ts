import { PostRepository } from '@/server'
import { withApiErrors } from '@/lib/api-errors'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { updatePostSchema } from '@/core/validators'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  const post = await new PostRepository(db).findById(id)
  if (!post) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(post)
}

async function putHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  const body = await request.json()
  const input = updatePostSchema.parse(body)
  const post = await new PostRepository(db).update(id, input)
  if (!post) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(post)
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  await new PostRepository(db).delete(id)
  return new Response(null, { status: 204 })
}

export const PUT = withApiErrors(putHandler)
