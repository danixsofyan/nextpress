import { describe, expect, it } from 'vitest'
import { formatStars, githubRepo } from './github'

describe('github links', () => {
  it('recognises repository URLs only', () => {
    expect(githubRepo('https://github.com/danixsofyan/nextpress')).toBe('danixsofyan/nextpress')
    expect(githubRepo('https://github.com/a-b/c.d.git/')).toBe('a-b/c.d')
    expect(githubRepo('https://github.com/danixsofyan')).toBeNull()
    expect(githubRepo('https://github.com/a/b/issues')).toBeNull()
    expect(githubRepo('https://evil.com/github.com/a/b')).toBeNull()
  })

  it('formats star counts compactly', () => {
    expect(formatStars(7)).toBe('7')
    expect(formatStars(1520)).toBe('1.5K')
  })
})
