import { z } from 'zod'

export const CUSTOM_CSS_MAX = 20_000

export const customCssSchema = z
  .string()
  .max(CUSTOM_CSS_MAX)
  .refine((css) => !css.includes('<'), { message: 'Additional CSS cannot contain <' })
  .refine((css) => !/@import|expression\s*\(|javascript:|behavior\s*:/i.test(css), {
    message: 'Additional CSS cannot use @import, expression(), javascript:, or behavior',
  })
