import { z } from 'zod'
import { linkSchema } from './blocks'

const title = z.string().trim().max(80).optional()

export const widgetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('search'), title }),
  z.object({ type: z.literal('recentPosts'), title, count: z.number().int().min(1).max(10) }),
  z.object({ type: z.literal('categories'), title, showCounts: z.boolean().optional() }),
  z.object({ type: z.literal('tags'), title }),
  z.object({ type: z.literal('text'), title, text: z.string().trim().min(1).max(1000) }),
  z.object({ type: z.literal('links'), title, links: z.array(linkSchema).min(1).max(10) }),
])

export const WIDGET_AREAS = ['sidebar', 'footer'] as const

export const widgetAreasSchema = z.object({
  sidebar: z.array(widgetSchema).max(12),
  footer: z.array(widgetSchema).max(8),
})

export type Widget = z.infer<typeof widgetSchema>
export type WidgetType = Widget['type']
export type WidgetAreas = z.infer<typeof widgetAreasSchema>

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
