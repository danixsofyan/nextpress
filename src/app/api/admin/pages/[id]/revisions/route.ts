import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageRepository } from '@/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  return Response.json(await new PageRepository(db).findRevisions((await params).id))
}
