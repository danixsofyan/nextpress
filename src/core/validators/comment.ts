import { z } from 'zod'

const clean = (value: string) =>
  value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  authorName: z.string().transform(clean).pipe(z.string().trim().min(1).max(80)),
  content: z.string().transform(clean).pipe(z.string().trim().min(1).max(2000)),
})

export const commentStatusSchema = z.enum(['pending', 'approved', 'spam', 'trash'])

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type CommentStatus = z.infer<typeof commentStatusSchema>
