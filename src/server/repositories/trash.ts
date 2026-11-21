export const trashedSlug = (slug: string, id: string) => `${slug}__trashed-${id.slice(0, 8)}`

export const restoredSlug = (slug: string) => slug.replace(/__trashed-[0-9a-f]{8}$/, '')
