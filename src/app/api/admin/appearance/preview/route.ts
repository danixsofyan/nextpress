import { cookies, draftMode } from 'next/headers'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { PREVIEW_COOKIE, isThemeId } from '@/lib/themes'

export async function POST(request: Request) {
  const theme = (await request.formData().catch(() => null))?.get('theme')
  const session = await requireRole(request, isThemeId(theme) ? 'administrator' : 'author')
  if (session instanceof Response) return session
  const store = await cookies()
  const draft = await draftMode()
  if (isThemeId(theme)) {
    draft.enable()
    store.set(PREVIEW_COOKIE, theme, {
      httpOnly: true,
      sameSite: 'lax',
      secure: new URL(request.url).protocol === 'https:',
      path: '/',
      maxAge: 3600,
    })
  } else {
    draft.disable()
    store.delete(PREVIEW_COOKIE)
  }
  return NextResponse.redirect(new URL('/', request.url), 303)
}
