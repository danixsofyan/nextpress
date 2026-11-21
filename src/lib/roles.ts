export const ROLES = ['administrator', 'editor', 'author'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  administrator: 'Administrator',
  editor: 'Editor',
  author: 'Author',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  administrator: 'Full access, including settings, users, API keys and import.',
  editor: 'Manages all content: posts, pages, media, categories, tags and menus.',
  author: 'Writes and publishes posts and uploads media.',
}

const RANK: Record<Role, number> = { author: 1, editor: 2, administrator: 3 }

export const isRole = (value: unknown): value is Role => ROLES.includes(value as Role)

export function hasRole(role: unknown, min: Role) {
  return isRole(role) && RANK[role] >= RANK[min]
}
