import { requireRole } from '@/lib/auth'
import { getDashboardStats } from '@/lib/dashboard'

export async function GET(request: Request) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  return Response.json(await getDashboardStats())
}
