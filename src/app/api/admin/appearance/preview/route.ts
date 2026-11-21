import { requireRole } from '@/lib/auth'
import { PREVIEW_COOKIE, isThemeId } from '@/lib/themes'

export async function POST(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const theme = (await request.formData().catch(() => null))?.get('theme')
  const response = new Response(null, { status: 303, headers: { Location: '/' } })
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  const cookie = isThemeId(theme)
    ? `${PREVIEW_COOKIE}=${theme}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${secure}`
    : `${PREVIEW_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  response.headers.append('Set-Cookie', cookie)
  return response
}
