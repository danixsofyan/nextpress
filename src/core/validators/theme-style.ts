import { z } from 'zod'

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex color like #0f172a')
  .transform((v) => v.toLowerCase())

export const THEME_FONTS = ['sans', 'serif', 'mono'] as const
export const THEME_RADII = ['none', 'small', 'medium', 'large'] as const

export const themeStyleSchema = z.object({
  primary: hex,
  background: hex,
  foreground: hex,
  accent: hex,
  font: z.enum(THEME_FONTS),
  radius: z.enum(THEME_RADII),
  scheme: z.enum(['dark', 'light']).optional(),
})

export type ThemeStyle = z.infer<typeof themeStyleSchema>
