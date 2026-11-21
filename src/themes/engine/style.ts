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

function readableOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.45 ? '#0a0a0a' : '#ffffff'
}

export function themeStyleVars(style: ThemeStyle): Record<string, string> {
  const mix = (pct: number) =>
    `color-mix(in srgb, ${style.foreground} ${pct}%, ${style.background})`
  const [sm, md, lg, xl, xxl] = RADII[style.radius]
  return {
    '--color-primary': style.primary,
    '--color-primary-foreground': readableOn(style.primary),
    '--color-background': style.background,
    '--color-foreground': style.foreground,
    '--color-card': style.background,
    '--color-card-foreground': style.foreground,
    '--color-popover': style.background,
    '--color-popover-foreground': style.foreground,
    '--color-secondary': style.accent,
    '--color-secondary-foreground': style.foreground,
    '--color-muted': style.accent,
    '--color-muted-foreground': mix(62),
    '--color-accent': style.accent,
    '--color-accent-foreground': style.foreground,
    '--color-border': mix(14),
    '--color-input': mix(18),
    '--color-ring': style.primary,
    '--radius-sm': sm,
    '--radius-md': md,
    '--radius-lg': lg,
    '--radius-xl': xl,
    '--radius-2xl': xxl,
    fontFamily: FONT_STACKS[style.font],
  }
}
