import { apiError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth'
import { parseFeed } from '@/lib/importers/feed'
import { fetchFeed, MAX_IMPORT_BYTES } from '@/lib/importers/fetch-feed'
import { runImport } from '@/lib/importers/run'
import { parseWxr } from '@/lib/importers/wxr'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session

  const form = await request.formData()
  const type = form.get('type')
  const status = form.get('status') === 'draft' ? 'draft' : 'keep'
  const file = form.get('file')
  const url = String(form.get('url') ?? '').trim()

  if (type !== 'wordpress' && type !== 'rss') {
    return apiError('Unknown importer', 400)
  }

  let xml: string
  try {
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_IMPORT_BYTES) {
        return apiError('File is larger than 20 MB', 413)
      }
      xml = await file.text()
    } else if (type === 'rss' && url) {
      xml = await fetchFeed(url)
    } else {
      return apiError(
        type === 'rss'
          ? 'Upload a feed file or enter a feed URL'
          : 'Upload a WordPress export file',
        400
      )
    }
  } catch (error) {
    return apiError(error instanceof Error ? error.message : 'Could not read the source', 400)
  }

  let items: ReturnType<typeof parseWxr>
  try {
    items = type === 'wordpress' ? parseWxr(xml) : parseFeed(xml)
  } catch (error) {
    return apiError(error instanceof Error ? error.message : 'Could not parse the file', 422)
  }
  if (items.length === 0) {
    return apiError('No posts or pages found to import', 422)
  }

  return Response.json(await runImport(items, status, session.user.id))
}
