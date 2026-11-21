export type Embed =
  | { provider: 'youtube'; id: string; start?: number }
  | { provider: 'vimeo'; id: string }
  | { provider: 'spotify'; kind: string; id: string }

export function parseEmbed(raw: string): Embed | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null
  const host = url.hostname.replace(/^(www\.|m\.)/, '')
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    const id =
      host === 'youtu.be'
        ? url.pathname.slice(1)
        : url.pathname === '/watch'
          ? url.searchParams.get('v')
          : /^\/(embed|shorts|live)\/([^/]+)/.exec(url.pathname)?.[2]
    if (!id || !/^[\w-]{11}$/.test(id)) return null
    const start = Number.parseInt(
      url.searchParams.get('t') ?? url.searchParams.get('start') ?? '',
      10
    )
    return { provider: 'youtube', id, ...(start > 0 && { start }) }
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = /\/(?:video\/)?(\d{6,12})(?:$|[/?])/.exec(url.pathname + '/')?.[1]
    return id ? { provider: 'vimeo', id } : null
  }
  if (host === 'open.spotify.com') {
    const match = /^\/(?:embed\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]{22})/.exec(
      url.pathname
    )
    return match ? { provider: 'spotify', kind: match[1]!, id: match[2]! } : null
  }
  return null
}

export function embedSrc(embed: Embed, autoplay = false) {
  switch (embed.provider) {
    case 'youtube':
      return `https://www.youtube-nocookie.com/embed/${embed.id}?rel=0${autoplay ? '&autoplay=1' : ''}${embed.start ? `&start=${embed.start}` : ''}`
    case 'vimeo':
      return `https://player.vimeo.com/video/${embed.id}?dnt=1${autoplay ? '&autoplay=1' : ''}`
    case 'spotify':
      return `https://open.spotify.com/embed/${embed.kind}/${embed.id}`
  }
}

export const embedThumbnail = (embed: Embed) =>
  embed.provider === 'youtube' ? `https://i.ytimg.com/vi/${embed.id}/hqdefault.jpg` : null

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

export function autoEmbed(html: string) {
  return html.replace(
    /<p>\s*(?:<a [^>]*href="([^"]+)"[^>]*>[^<]*<\/a>|(https:\/\/[^\s<]+))\s*<\/p>/g,
    (match, linked: string | undefined, bare: string | undefined) => {
      const embed = parseEmbed((linked ?? bare ?? '').replace(/&amp;/g, '&'))
      if (!embed) return match
      const height = embed.provider === 'spotify' ? 'height="152"' : 'class="np-embed-video"'
      return `<figure class="np-embed"><iframe src="${escapeAttr(embedSrc(embed))}" ${height} loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="Embedded ${embed.provider} content"></iframe></figure>`
    }
  )
}
