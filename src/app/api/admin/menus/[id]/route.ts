import { apiError } from '@/lib/api-error'
import { MenuRepository } from '@/server'
import { withApiErrors } from '@/lib/api-errors'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { menuItemsJson } from '@/core/validators'

type Params = { params: Promise<{ id: string }> }

const updateMenuSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  items: menuItemsJson.optional(),
})

export async function GET(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { id } = await params
  const menu = await new MenuRepository(db).findById(id)
  if (!menu) return apiError('Not found', 404)
  return Response.json(menu)
}

async function putHandler(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { id } = await params
  const parsed = updateMenuSchema.parse(await request.json())
  const input = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined)) as {
    name?: string
    slug?: string
    items?: string
  }
  const menu = await new MenuRepository(db).update(id, input)
  if (!menu) return apiError('Not found', 404)
  return Response.json(menu)
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { id } = await params
  await new MenuRepository(db).delete(id)
  return new Response(null, { status: 204 })
}

export const PUT = withApiErrors(putHandler)
