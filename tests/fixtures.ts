import { user } from '@/core/schema'
import { db } from '@/lib/db'

export const unique = () => Math.random().toString(36).slice(2, 10)

export async function createUser(role: 'administrator' | 'editor' | 'author' = 'author') {
  const id = `user_${unique()}`
  const [row] = await db
    .insert(user)
    .values({ id, name: `User ${id}`, email: `${id}@example.test`, emailVerified: true, role })
    .returning()
  return row!
}
