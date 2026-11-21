import { apiError } from '@/lib/api-error'
import { z } from 'zod'
import { auth, requireRole } from '@/lib/auth'
import { emailTaken, findUser, firstIssue, otherAdministrators, userFields } from '@/lib/users'

type Params = { params: Promise<{ id: string }> }

const updateSchema = z
  .object({ ...userFields, password: userFields.password.or(z.literal('')) })
  .partial()

export async function GET(request: Request, { params }: Params) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const found = await findUser((await params).id)
  if (!found) return apiError('Not found', 404)
  return Response.json(found)
}

export async function PUT(request: Request, { params }: Params) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const { id } = await params
  const target = await findUser(id)
  if (!target) return apiError('Not found', 404)

  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: firstIssue(parsed.error) }, { status: 400 })
  const { name, email, role, password } = parsed.data

  if (role && role !== target.role && target.role === 'administrator') {
    if (id === session.user.id) {
      return apiError('You cannot change your own role', 400)
    }
    if ((await otherAdministrators(id)) === 0) {
      return apiError('The site needs at least one administrator', 400)
    }
  }
  if (email && email !== target.email && (await emailTaken(email, id))) {
    return apiError('A user with this email already exists', 409)
  }

  const headers = request.headers
  if (name !== undefined || email !== undefined) {
    await auth.api.adminUpdateUser({
      body: {
        userId: id,
        data: { ...(name !== undefined && { name }), ...(email !== undefined && { email }) },
      },
      headers,
    })
  }
  if (role && role !== target.role) {
    await auth.api.setRole({ body: { userId: id, role }, headers })
  }
  if (password) {
    await auth.api.setUserPassword({ body: { userId: id, newPassword: password }, headers })
  }
  return Response.json(await findUser(id))
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const { id } = await params
  if (id === session.user.id) {
    return apiError('You cannot delete your own account', 400)
  }
  const target = await findUser(id)
  if (!target) return apiError('Not found', 404)
  if (target.role === 'administrator' && (await otherAdministrators(id)) === 0) {
    return apiError('The site needs at least one administrator', 400)
  }
  await auth.api.removeUser({ body: { userId: id }, headers: request.headers })
  return new Response(null, { status: 204 })
}
