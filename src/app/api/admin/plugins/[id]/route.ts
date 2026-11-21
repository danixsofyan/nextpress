import { z } from 'zod'
import { apiError } from '@/lib/api-error'
import { withApiErrors } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'
import { savePlugin } from '@/lib/plugins'

type Params = { params: Promise<{ id: string }> }

const bodySchema = z.object({
  active: z.boolean().optional(),
  config: z.record(z.string(), z.string().max(500)).optional(),
})

async function putHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const { active, config } = bodySchema.parse(await request.json())
  const result = await savePlugin((await params).id, {
    ...(active !== undefined && { active }),
    ...(config !== undefined && { config }),
  })
  if ('error' in result) return apiError(result.error, result.status)
  return new Response(null, { status: 204 })
}

export const PUT = withApiErrors(putHandler)
