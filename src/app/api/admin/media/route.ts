import { apiError } from '@/lib/api-error'
import { MediaRepository } from '@/server'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { detectFileType } from '@/lib/file-type'
import { putObject } from '@/lib/storage'

export async function GET(request: Request) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session
  return Response.json(await new MediaRepository(db).findMany())
}

export async function POST(request: Request) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return apiError('No file', 400)
  if (file.size > env.MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
    return apiError(`File exceeds ${env.MAX_UPLOAD_SIZE_MB} MB limit`, 413)
  }

  const buffer = await file.arrayBuffer()
  const type = detectFileType(new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 16)))
  if (!type) {
    return apiError(
      'File type not allowed. Upload PNG, JPEG, GIF, WebP, AVIF, MP4, WebM, MP3, or PDF.',
      415
    )
  }

  const url = await putObject(`${crypto.randomUUID()}.${type.ext}`, buffer, type.mime)

  const media = await new MediaRepository(db).create({
    filename: file.name,
    url,
    mimeType: type.mime,
    size: file.size,
  })

  return Response.json(media, { status: 201 })
}
