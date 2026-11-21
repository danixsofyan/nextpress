import type { ThemeStyle } from '@/core/validators'

const FONT_STACKS: Record<ThemeStyle['font'], string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
}

const RADII: Record<ThemeStyle['radius'], [string, string, string, string, string]> = {
  none: ['0', '0', '0', '0', '0'],
  small: ['0.125rem', '0.25rem', '0.375rem', '0.5rem', '0.75rem'],
  medium: ['0.25rem', '0.375rem', '0.5rem', '0.75rem', '1rem'],
  large: ['0.5rem', '0.75rem', '1rem', '1.25rem', '1.75rem'],
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const readableOn = (hex: string) => (luminance(hex) > 0.45 ? '#0a0a0a' : '#ffffff')

export type ColorScheme = 'light' | 'dark'

export const COLOR_SCHEMES: readonly ColorScheme[] = ['dark', 'light']

export const defaultScheme = (style: ThemeStyle): ColorScheme => style.scheme ?? 'dark'

const DARK = { background: '#09090b', foreground: '#fafafa', accent: '#1c1c22' }

export function schemeColorVars(style: ThemeStyle, scheme: ColorScheme): Record<string, string> {
  const { background, foreground, accent } = scheme === 'dark' ? DARK : style
  const primary = scheme === 'dark' && luminance(style.primary) < 0.08 ? '#fafafa' : style.primary
  const mix = (pct: number) => `color-mix(in srgb, ${foreground} ${pct}%, ${background})`
  return {
    '--color-primary': primary,
    '--color-primary-foreground': readableOn(primary),
    '--color-glow-1': `oklch(from ${style.primary} 0.66 max(c, 0.17) h)`,
    '--color-glow-2': `oklch(from ${style.primary} 0.72 max(c, 0.16) calc(h + 75))`,
    '--color-glow-3': `oklch(from ${style.primary} 0.78 max(c, 0.13) calc(h + 35))`,
    '--color-background': background,
    '--color-foreground': foreground,
    '--color-card': scheme === 'dark' ? mix(4) : background,
    '--color-card-foreground': foreground,
    '--color-popover': background,
    '--color-popover-foreground': foreground,
    '--color-secondary': accent,
    '--color-secondary-foreground': foreground,
    '--color-muted': accent,
    '--color-muted-foreground': mix(62),
    '--color-accent': accent,
    '--color-accent-foreground': foreground,
    '--color-border': mix(14),
    '--color-input': mix(18),
    '--color-ring': primary,
  }
}

export function themeShapeVars(style: ThemeStyle): Record<string, string> {
  const [sm, md, lg, xl, xxl] = RADII[style.radius]
  return {
    '--radius-sm': sm,
    '--radius-md': md,
    '--radius-lg': lg,
    '--radius-xl': xl,
    '--radius-2xl': xxl,
    fontFamily: FONT_STACKS[style.font],
  }
}

export const themeStyleVars = (style: ThemeStyle, scheme: ColorScheme = 'light') => ({
  ...schemeColorVars(style, scheme),
  ...themeShapeVars(style),
})

const declarations = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(';')

export function themeSchemeCss(style: ThemeStyle, selector: string) {
  return COLOR_SCHEMES.map(
    (scheme) =>
      `${selector}[data-scheme='${scheme}']{${declarations(schemeColorVars(style, scheme))};color-scheme:${scheme}}`
  ).join('')
}
