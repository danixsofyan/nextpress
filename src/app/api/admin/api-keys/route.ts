import { ApiKeyRepository } from '@/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'

const createSchema = z.object({ name: z.string().trim().min(1).max(100) })

export async function GET(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  return Response.json(await new ApiKeyRepository(db).findMany())
}

export async function POST(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: 'Name is required' }, { status: 400 })
  const created = await new ApiKeyRepository(db).create(parsed.data.name, session.user.id)
  return Response.json(created, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
