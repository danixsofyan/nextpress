import { apiError } from './api-error'
import type { Session } from './auth'
import { db } from './db'
import { hasRole } from './roles'
import { PostRepository } from '@/server'

export async function loadOwnedPost(session: Session, id: string, includeTrashed = false) {
  const post = await new PostRepository(db).findById(id, { includeTrashed })
  if (!post) return apiError('Not found', 404)
  if (!hasRole(session.user.role, 'editor') && post.authorId !== session.user.id) {
    return apiError('Authors can only change their own posts', 403)
  }
  return post
}
