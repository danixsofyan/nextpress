import { z } from 'zod'
import { hrefSchema } from './blocks'

export const menuItemSchema = z.object({
  id: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(60),
  url: hrefSchema,
  parentId: z.string().max(64).nullish(),
})

export const menuItemsSchema = z
  .array(menuItemSchema)
  .max(60)
  .superRefine((items, ctx) => {
    const topLevel = new Set<string>()
    items.forEach((item, index) => {
      if (!item.parentId) {
        topLevel.add(item.id)
        return
      }
      if (!topLevel.has(item.parentId)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'parentId'],
          message: 'A submenu item must follow a top-level item',
        })
      }
    })
  })

export const menuItemsJson = z
  .string()
  .max(50_000)
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw) as unknown
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Menu items must be JSON' })
      return z.NEVER
    }
  })
  .pipe(menuItemsSchema)
  .transform((items) => JSON.stringify(items))

export type MenuItem = z.infer<typeof menuItemSchema>

export type NavLink = { label: string; href: string; children?: NavLink[] }

export function menuToNavigation(raw: string): NavLink[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  const result = menuItemsSchema.safeParse(parsed)
  if (!result.success) return []
  const top = result.data.filter((i) => !i.parentId)
  return top.map((item) => {
    const children = result.data
      .filter((c) => c.parentId === item.id)
      .map((c) => ({ label: c.label, href: c.url }))
    return { label: item.label, href: item.url, ...(children.length > 0 && { children }) }
  })
}
