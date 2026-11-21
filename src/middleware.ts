import { errorBody } from '@/lib/api-error'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { env } from '@/lib/env'

const adminHost = env.ADMIN_URL ? new URL(env.ADMIN_URL).host : null

function isAdminPath(pathname: string) {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/auth/')
  )
}

function hasSession(request: NextRequest) {
  return Boolean(
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value
  )
}

const PUBLIC_ADMIN_PAGES = new Set([
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
])

export function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const response = route(request, requestId)
  response.headers.set('X-Request-ID', requestId)
  return response
}

function route(request: NextRequest, requestId: string) {
  const { pathname, search } = request.nextUrl
  const forwarded = new Headers(request.headers)
  forwarded.set('x-request-id', requestId)
  const next = () => NextResponse.next({ request: { headers: forwarded } })
  const adminPath = isAdminPath(pathname)

  if (adminHost) {
    const onAdminHost = request.headers.get('host') === adminHost
    if (onAdminHost && !adminPath) {
      if (pathname === '/') return NextResponse.redirect(new URL('/admin', request.url))
      return NextResponse.redirect(new URL(`${pathname}${search}`, env.NEXT_PUBLIC_SITE_URL))
    }
    if (!onAdminHost && adminPath) return new NextResponse(null, { status: 404 })
  }

  if (!adminPath || pathname.startsWith('/api/auth/') || PUBLIC_ADMIN_PAGES.has(pathname)) {
    return next()
  }

  if (!hasSession(request)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(errorBody('Unauthorized', 401), { status: 401 })
    }
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const response = next()
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
