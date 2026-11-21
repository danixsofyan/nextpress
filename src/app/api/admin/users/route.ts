import { z } from 'zod'
import { auth, requireRole } from '@/lib/auth'
import { emailTaken, firstIssue, listUsers, userFields } from '@/lib/users'

const createSchema = z.object(userFields)

export async function GET(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  return Response.json(await listUsers())
}

export async function POST(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: firstIssue(parsed.error) }, { status: 400 })
  if (await emailTaken(parsed.data.email)) {
    return Response.json({ error: 'A user with this email already exists' }, { status: 409 })
  }
  const { user } = await auth.api.createUser({ body: parsed.data, headers: request.headers })
  return Response.json({ id: user.id }, { status: 201 })
}
