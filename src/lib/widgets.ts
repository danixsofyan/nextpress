import { WIDGETS_SETTING, parseWidgetAreas } from '@/core/validators'
import { SettingsRepository } from '@/server'
import { cache } from 'react'
import { db } from './db'

export const getWidgetAreas = cache(async () =>
  parseWidgetAreas(await new SettingsRepository(db).get(WIDGETS_SETTING))
)
