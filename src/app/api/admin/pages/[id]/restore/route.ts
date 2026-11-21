import { apiError } from '@/lib/api-error'
import { PageRepository } from '@/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const page = await new PageRepository(db).restore((await params).id)
  if (!page) return apiError('Not found', 404)
  return Response.json(page)
}
