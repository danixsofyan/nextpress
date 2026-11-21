import { user } from '@/core/schema'
import { and, count, desc, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { db } from './db'
import { ROLES } from './roles'

export const userFields = {
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  role: z.enum(ROLES),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
}

export function listUsers() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
}

export async function findUser(id: string) {
  const [row] = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.id, id))
    .limit(1)
  return row ?? null
}

export async function otherAdministrators(excludeId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(user)
    .where(and(eq(user.role, 'administrator'), ne(user.id, excludeId)))
  return row?.n ?? 0
}

export async function emailTaken(email: string, excludeId?: string) {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(excludeId ? and(eq(user.email, email), ne(user.id, excludeId)) : eq(user.email, email))
    .limit(1)
  return Boolean(row)
}

export const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? 'Invalid input'
