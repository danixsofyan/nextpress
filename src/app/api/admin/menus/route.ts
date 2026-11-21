import { MenuRepository } from '@/server'
import { withApiErrors } from '@/lib/api-errors'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { menuItemsJson } from '@/core/validators'

const createMenuSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  items: menuItemsJson.optional(),
})

export async function GET(request: Request) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  return Response.json(await new MenuRepository(db).findMany())
}

async function postHandler(request: Request) {
  const session = await requireRole(request, 'editor')
  if (session instanceof Response) return session
  const { name, slug, items } = createMenuSchema.parse(await request.json())
  return Response.json(
    await new MenuRepository(db).create({
      name,
      slug,
      ...(items !== undefined && { items }),
    }),
    { status: 201 }
  )
}

export const POST = withApiErrors(postHandler)
