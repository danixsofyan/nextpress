import { TaxonomyRepository } from '@/server'
import { withApiErrors } from '@/lib/api-errors'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { createTaxonomySchema } from '@/core/validators'

export async function GET(request: Request) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const param = new URL(request.url).searchParams.get('type')
  const type = param === 'category' || param === 'tag' || param === 'custom' ? param : undefined
  return Response.json(await new TaxonomyRepository(db).findManyWithCounts(type))
}

async function postHandler(request: Request) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const input = createTaxonomySchema.parse(await request.json())
  return Response.json(await new TaxonomyRepository(db).create(input), { status: 201 })
}

export const POST = withApiErrors(postHandler)
