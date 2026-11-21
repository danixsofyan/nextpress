import { ApiKeyRepository } from '@/server'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const { id } = await params
  await new ApiKeyRepository(db).delete(id)
  return new Response(null, { status: 204 })
}
