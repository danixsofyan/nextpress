import { apiError } from '@/lib/api-error'
import { ZodError } from 'zod'

function uniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

export function withApiErrors<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof ZodError) {
        const issue = error.issues[0]
        return apiError(`${issue?.path.join('.') || 'input'}: ${issue?.message ?? 'invalid'}`, 400)
      }
      if (uniqueViolation(error)) {
        return apiError('That slug is already in use', 409)
      }
      throw error
    }
  }
}
