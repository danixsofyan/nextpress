import { TaxonomyRepository } from '@/server'
import { withApiErrors } from '@/lib/api-errors'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { updateTaxonomySchema } from '@/core/validators'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { id } = await params
  const item = await new TaxonomyRepository(db).findById(id)
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(item)
}

async function putHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { id } = await params
  const input = updateTaxonomySchema.parse(await request.json())
  const item = await new TaxonomyRepository(db).update(id, input)
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(item)
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { id } = await params
  await new TaxonomyRepository(db).delete(id)
  return new Response(null, { status: 204 })
}

export const PUT = withApiErrors(putHandler)
