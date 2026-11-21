import { apiError } from '@/lib/api-error'
import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  const path = new URL(request.url).searchParams.get('path') ?? '/'
  if (!/^\/(?!\/)/.test(path)) return apiError('Invalid path', 400)
  ;(await draftMode()).enable()
  return NextResponse.redirect(new URL(path, request.url), 307)
}
