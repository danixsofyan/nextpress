import { describe, expect, it, vi } from 'vitest'

vi.mock('@/server', () => ({ SettingsRepository: class {} }))
vi.mock('./db', () => ({ db: {} }))
vi.mock('./env', () => ({ env: {} }))

const { parseStoredPlugins } = await import('./plugins')

describe('parseStoredPlugins', () => {
  it('reads the stored JSON', () => {
    const raw = JSON.stringify({
      'meta-pixel': { active: true, config: { pixelId: '1234567890' } },
    })
    expect(parseStoredPlugins(raw)['meta-pixel']?.active).toBe(true)
  })

  it('migrates the legacy Google Analytics setting', () => {
    expect(parseStoredPlugins(undefined, 'G-ABC123')).toEqual({
      'google-analytics': { active: true, config: { measurementId: 'G-ABC123' } },
    })
    expect(parseStoredPlugins(undefined, 'bad')).toEqual({})
  })

  it('ignores corrupt JSON', () => {
    expect(parseStoredPlugins('{oops')).toEqual({})
  })
})
