import { z } from 'zod'
import { withApiErrors } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'
import { erasePersonalData, findPersonalData, privacyQuerySchema } from '@/lib/privacy'

async function postHandler(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const query = privacyQuerySchema.parse(await request.json())
  const data = await findPersonalData(query)
  const download = new URL(request.url).searchParams.get('download') === '1'
  return Response.json(
    { exportedAt: new Date().toISOString(), query, ...data },
    download
      ? {
          headers: {
            'Content-Disposition': 'attachment; filename="personal-data.json"',
            'Cache-Control': 'no-store',
          },
        }
      : { headers: { 'Cache-Control': 'no-store' } }
  )
}

async function deleteHandler(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const { name } = z.object({ name: z.string().trim().min(1).max(80) }).parse(await request.json())
  return Response.json(await erasePersonalData(name))
}

export const POST = withApiErrors(postHandler)
export const DELETE = withApiErrors(deleteHandler)
