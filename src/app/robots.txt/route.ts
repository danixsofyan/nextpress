import { env } from '@/lib/env'
import { getSiteSettings } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function GET() {
  const site = await getSiteSettings()
  const sitemap = `Sitemap: ${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`

  let body: string
  if (site.discourageSearch) {
    body = 'User-agent: *\nDisallow: /\n'
  } else if (site.robotsTxt) {
    body = `${site.robotsTxt.trim()}\n`
    if (!/^sitemap:/im.test(body)) body += `\n${sitemap}\n`
  } else {
    const agents = [
      '*',
      'Googlebot',
      'Bingbot',
      'GPTBot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'ClaudeBot',
      'Claude-SearchBot',
      'PerplexityBot',
      'Google-Extended',
      'Applebot-Extended',
    ]
    body = `${agents
      .map((agent) => `User-agent: ${agent}\nAllow: /\nDisallow: /admin\nDisallow: /api/`)
      .join('\n\n')}\n\n${sitemap}\n`
  }

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
