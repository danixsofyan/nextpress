import { type WidgetAreas, widgetAreasSchema } from '@/core/validators'
import { SettingsRepository } from '@/server'
import { cache } from 'react'
import { db } from './db'

export const WIDGETS_SETTING = 'widgets'

export const EMPTY_AREAS: WidgetAreas = { sidebar: [], footer: [] }

export function parseWidgetAreas(raw: string | null | undefined): WidgetAreas {
  if (!raw) return EMPTY_AREAS
  try {
    const parsed = widgetAreasSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : EMPTY_AREAS
  } catch {
    return EMPTY_AREAS
  }
}

export const getWidgetAreas = cache(async () =>
  parseWidgetAreas(await new SettingsRepository(db).get(WIDGETS_SETTING))
)
