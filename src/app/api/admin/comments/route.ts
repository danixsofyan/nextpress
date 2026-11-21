import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { CommentRepository } from '@/server'

export async function GET(request: Request) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  return Response.json(await new CommentRepository(db).findAll())
}
