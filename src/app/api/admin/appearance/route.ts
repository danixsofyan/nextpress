import { withApiErrors } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'
import { appearanceInputSchema, getAppearance, saveAppearance } from '@/lib/themes'

export async function GET(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  return Response.json(await getAppearance())
}

export const PUT = withApiErrors(async (request: Request) => {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const input = appearanceInputSchema.parse(await request.json())
  return Response.json(await saveAppearance(input))
})
