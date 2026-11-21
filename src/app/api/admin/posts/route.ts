import { PostRepository } from '@/server'
import { withApiErrors } from '@/lib/api-errors'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { createPostSchema } from '@/core/validators'

export async function GET(request: Request) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  if (slug) {
    const post = await new PostRepository(db).findBySlug(slug)
    if (!post) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(post)
  }
  return Response.json(await new PostRepository(db).findAllSummaries())
}

async function postHandler(request: Request) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const body = await request.json()
  const input = createPostSchema.parse(body)
  const repo = new PostRepository(db)
  return Response.json(await repo.create(input), { status: 201 })
}

export const POST = withApiErrors(postHandler)
