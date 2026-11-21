import { describe, expect, it } from 'vitest'
import { defaultScheme, schemeColorVars, themeSchemeCss } from './style'

const style = {
  primary: '#0f172a',
  background: '#ffffff',
  foreground: '#0f172a',
  accent: '#f1f5f9',
  font: 'sans',
  radius: 'medium',
} as const

describe('color schemes', () => {
  it('defaults to dark and honours a saved light preference', () => {
    expect(defaultScheme(style)).toBe('dark')
    expect(defaultScheme({ ...style, scheme: 'light' })).toBe('light')
  })

  it('keeps the light palette and swaps to a dark one', () => {
    expect(schemeColorVars(style, 'light')['--color-background']).toBe('#ffffff')
    const dark = schemeColorVars(style, 'dark')
    expect(dark['--color-background']).toBe('#09090b')
    expect(dark['--color-primary']).toBe('#fafafa')
    expect(dark['--color-primary-foreground']).toBe('#0a0a0a')
    expect(schemeColorVars({ ...style, primary: '#16a34a' }, 'dark')['--color-primary']).toBe(
      '#16a34a'
    )
  })

  it('emits one rule per scheme for the site wrapper', () => {
    const css = themeSchemeCss(style, '.np-site')
    expect(css).toContain(".np-site[data-scheme='dark']{")
    expect(css).toContain(".np-site[data-scheme='light']{")
    expect(css).not.toMatch(/[<>]/)
  })
})
