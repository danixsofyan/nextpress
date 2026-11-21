import { type McpExtension, SettingsRepository } from '@/server'
import { type ThemeStyle, themeStyleSchema } from '@/core/validators'
import defaultTheme from '@/themes/default'
import editorialTheme from '@/themes/editorial'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { z } from 'zod'
import { getCurrentSession } from './auth'
import { db } from './db'
import { hasRole } from './roles'

export const THEMES = {
  default: defaultTheme,
  editorial: editorialTheme,
} as const

export type ThemeId = keyof typeof THEMES
export const THEME_IDS = Object.keys(THEMES) as [ThemeId, ...ThemeId[]]
export const PREVIEW_COOKIE = 'nextpress_theme_preview'
export const ACTIVE_THEME_KEY = 'active_theme'
export const styleKey = (id: ThemeId) => `theme_style:${id}`

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && Object.hasOwn(THEMES, value)

export function resolveStyle(id: ThemeId, raw: string | undefined): ThemeStyle {
  if (raw) {
    try {
      const parsed = themeStyleSchema.safeParse(JSON.parse(raw))
      if (parsed.success) return parsed.data
    } catch {}
  }
  return THEMES[id].defaultStyle
}

export async function getAppearance() {
  const s = await new SettingsRepository(db).getAll()
  const active = isThemeId(s[ACTIVE_THEME_KEY]) ? (s[ACTIVE_THEME_KEY] as ThemeId) : 'default'
  return {
    active,
    themes: THEME_IDS.map((id) => {
      const t = THEMES[id]
      return {
        id,
        label: t.label,
        description: t.description,
        version: t.version,
        defaultStyle: t.defaultStyle,
        style: resolveStyle(id, s[styleKey(id)]),
        customized: Boolean(s[styleKey(id)]),
      }
    }),
  }
}

export const getActiveTheme = cache(async () => {
  const appearance = await getAppearance()
  let id = appearance.active
  let preview = false
  const wanted = (await cookies()).get(PREVIEW_COOKIE)?.value
  if (isThemeId(wanted) && wanted !== id) {
    const session = await getCurrentSession().catch(() => null)
    if (session && hasRole(session.user.role, 'administrator')) {
      id = wanted
      preview = true
    }
  }
  const entry = appearance.themes.find((t) => t.id === id) ?? appearance.themes[0]
  return { id, theme: THEMES[id], style: entry?.style ?? THEMES[id].defaultStyle, preview }
})

export async function saveAppearance(input: {
  active?: ThemeId | undefined
  styles?: Partial<Record<ThemeId, ThemeStyle | null>> | undefined
}) {
  const values: Record<string, string> = {}
  if (input.active) values[ACTIVE_THEME_KEY] = input.active
  for (const id of THEME_IDS) {
    const style = input.styles?.[id]
    if (style !== undefined) values[styleKey(id)] = style ? JSON.stringify(style) : ''
  }
  if (Object.keys(values).length > 0) await new SettingsRepository(db).setMany(values)
  return getAppearance()
}

export const appearanceInputSchema = z.object({
  active: z.enum(THEME_IDS).optional(),
  styles: z.partialRecord(z.enum(THEME_IDS), themeStyleSchema.nullable()).optional(),
})

const json = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
})

export const registerThemeTools: McpExtension = (server) => {
  server.tool(
    'list_themes',
    "List installed themes, the active theme, and each theme's current style (colors, font, radius)",
    {},
    async () => json(await getAppearance())
  )

  server.tool(
    'set_theme',
    'Activate an installed theme for the public site',
    { theme: z.enum(THEME_IDS) },
    async ({ theme }) => json((await saveAppearance({ active: theme })).active)
  )

  server.tool(
    'update_theme_style',
    "Customize a theme's style. Colors are 6-digit hex. Omitted fields keep their current value; reset=true restores the theme defaults.",
    {
      theme: z.enum(THEME_IDS),
      style: themeStyleSchema.partial().optional(),
      reset: z.boolean().optional(),
    },
    async ({ theme, style, reset }) => {
      if (reset) {
        await saveAppearance({ styles: { [theme]: null } })
        return json(THEMES[theme].defaultStyle)
      }
      const current = (await getAppearance()).themes.find((t) => t.id === theme)?.style
      const next = themeStyleSchema.parse({ ...current, ...style })
      await saveAppearance({ styles: { [theme]: next } })
      return json(next)
    }
  )
}
