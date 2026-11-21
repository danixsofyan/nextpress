import { PageRepository } from '@/server'
import { withApiErrors } from '@/lib/api-errors'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { createPageSchema } from '@/core/validators'

export async function GET(request: Request) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  return Response.json(await new PageRepository(db).findSummaries())
}

async function postHandler(request: Request) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const input = createPageSchema.parse(await request.json())
  return Response.json(await new PageRepository(db).create(input, { authorId: session.user.id }), {
    status: 201,
  })
}

export const POST = withApiErrors(postHandler)
