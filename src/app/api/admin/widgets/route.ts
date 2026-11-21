import { widgetAreasSchema } from '@/core/validators'
import { withApiErrors } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { WIDGETS_SETTING, getWidgetAreas } from '@/lib/widgets'
import { SettingsRepository } from '@/server'

export async function GET(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  return Response.json(await getWidgetAreas())
}

async function putHandler(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const areas = widgetAreasSchema.parse(await request.json())
  await new SettingsRepository(db).set(WIDGETS_SETTING, JSON.stringify(areas))
  return Response.json(areas)
}

export const PUT = withApiErrors(putHandler)
