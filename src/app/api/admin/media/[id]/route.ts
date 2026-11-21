import { MediaRepository } from '@/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { deleteObject } from '@/lib/storage'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const { id } = await params
  const repo = new MediaRepository(db)
  const item = await repo.findById(id)
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })
  await deleteObject(item.url)
  await repo.delete(id)
  return new Response(null, { status: 204 })
}
