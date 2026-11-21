import { describe, expect, it } from 'vitest'
import { customCssSchema } from './custom-css'

describe('customCssSchema', () => {
  it('accepts ordinary CSS', () => {
    expect(customCssSchema.safeParse('.np-site h1 { color: #16a34a; }').success).toBe(true)
  })

  it('rejects CSS that can break out of the style tag or load code', () => {
    for (const css of [
      '</style><script>alert(1)</script>',
      '@import url(https://evil.example/x.css);',
      'a { background: url(javascript:alert(1)) }',
      'a { width: expression(alert(1)) }',
    ]) {
      expect(customCssSchema.safeParse(css).success).toBe(false)
    }
  })
})
