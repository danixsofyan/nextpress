import { apiError } from '@/lib/api-error'
import { z } from 'zod'
import { auth, requireRole } from '@/lib/auth'
import { emailEnabled } from '@/lib/email'
import { runAsInvite } from '@/lib/request-context'
import { emailTaken, firstIssue, listUsers, userFields } from '@/lib/users'

const createSchema = z.object({ ...userFields, sendInvite: z.boolean().optional() })

export async function GET(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  return Response.json(await listUsers())
}

export async function POST(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) return apiError(firstIssue(parsed.error), 400)
  if (await emailTaken(parsed.data.email)) {
    return apiError('A user with this email already exists', 409)
  }
  const { sendInvite, ...fields } = parsed.data
  const { user } = await auth.api.createUser({ body: fields, headers: request.headers })
  if (sendInvite && emailEnabled()) {
    await runAsInvite(() =>
      auth.api.requestPasswordReset({
        body: { email: user.email, redirectTo: '/admin/reset-password' },
      })
    )
  }
  return Response.json({ id: user.id }, { status: 201 })
}
