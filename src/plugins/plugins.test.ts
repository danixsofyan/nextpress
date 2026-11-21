import { describe, expect, it } from 'vitest'
import { PLUGINS, findPlugin } from '.'

describe('plugins', () => {
  it('have unique ids and fields that match their config', () => {
    expect(new Set(PLUGINS.map((p) => p.id)).size).toBe(PLUGINS.length)
    for (const plugin of PLUGINS) {
      const sample = Object.fromEntries(plugin.fields.map((f) => [f.key, '']))
      expect(plugin.config.safeParse(sample).success).toBe(false)
    }
  })

  it('validates analytics and pixel ids', () => {
    const ga = findPlugin('google-analytics')!
    expect(ga.config.safeParse({ measurementId: 'G-ABC123XYZ' }).success).toBe(true)
    expect(ga.config.safeParse({ measurementId: 'G-1");alert(1)//' }).success).toBe(false)
    const pixel = findPlugin('meta-pixel')!
    expect(pixel.config.safeParse({ pixelId: '123456789012345' }).success).toBe(true)
    expect(pixel.config.safeParse({ pixelId: "1');x('" }).success).toBe(false)
  })
})
