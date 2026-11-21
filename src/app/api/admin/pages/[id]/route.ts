import { apiError } from '@/lib/api-error'
import { PageRepository } from '@/server'
import { withApiErrors } from '@/lib/api-errors'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { updatePageSchema } from '@/core/validators'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { id } = await params
  const page = await new PageRepository(db).findById(id)
  if (!page) return apiError('Not found', 404)
  return Response.json(page)
}

async function putHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { id } = await params
  const input = updatePageSchema.parse(await request.json())
  const page = await new PageRepository(db).update(id, input)
  if (!page) return apiError('Not found', 404)
  return Response.json(page)
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { id } = await params
  const repo = new PageRepository(db)
  const done =
    new URL(request.url).searchParams.get('permanent') === '1'
      ? await repo.purge(id)
      : await repo.delete(id)
  if (!done) return apiError('Not found', 404)
  return new Response(null, { status: 204 })
}

export const PUT = withApiErrors(putHandler)
