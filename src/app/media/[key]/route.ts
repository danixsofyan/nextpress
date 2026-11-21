import { getObject, isMediaKey } from '@/lib/storage'

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  if (!isMediaKey(key)) return new Response('Not found', { status: 404 })
  const object = await getObject(key)
  if (!object?.body) return new Response('Not found', { status: 404 })
  return new Response(object.body, {
    headers: {
      'Content-Type': object.headers.get('Content-Type') ?? 'application/octet-stream',
      ...(object.headers.get('Content-Length') && {
        'Content-Length': object.headers.get('Content-Length') as string,
      }),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  })
}
