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
        return Response.json(
          { error: `${issue?.path.join('.') || 'input'}: ${issue?.message ?? 'invalid'}` },
          { status: 400 }
        )
      }
      if (uniqueViolation(error)) {
        return Response.json({ error: 'That slug is already in use' }, { status: 409 })
      }
      throw error
    }
  }
}
