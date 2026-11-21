import { describe, expect, it } from 'vitest'
import { autoEmbed, embedSrc, parseEmbed } from './embeds'

describe('parseEmbed', () => {
  it('recognises YouTube, Vimeo, and Spotify links', () => {
    expect(parseEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42')).toEqual({
      provider: 'youtube',
      id: 'dQw4w9WgXcQ',
      start: 42,
    })
    expect(parseEmbed('https://youtu.be/dQw4w9WgXcQ')).toMatchObject({ id: 'dQw4w9WgXcQ' })
    expect(parseEmbed('https://youtube.com/shorts/dQw4w9WgXcQ')).toMatchObject({
      provider: 'youtube',
    })
    expect(parseEmbed('https://vimeo.com/76979871')).toEqual({ provider: 'vimeo', id: '76979871' })
    expect(parseEmbed('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT')).toEqual({
      provider: 'spotify',
      kind: 'track',
      id: '4cOdK2wGLETKBW3PvgPWqT',
    })
  })

  it('rejects other hosts, http, and malformed ids', () => {
    for (const url of [
      'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://evil.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=bad"id',
      'javascript:alert(1)',
    ]) {
      expect(parseEmbed(url)).toBeNull()
    }
  })

  it('builds privacy-friendly player URLs', () => {
    expect(embedSrc({ provider: 'youtube', id: 'dQw4w9WgXcQ' })).toContain('youtube-nocookie.com')
    expect(embedSrc({ provider: 'vimeo', id: '1' })).toContain('dnt=1')
  })
})

describe('autoEmbed', () => {
  it('turns a lone link paragraph into a lazy iframe and leaves other text alone', () => {
    const html = autoEmbed(
      '<p>Intro https://youtu.be/dQw4w9WgXcQ</p><p><a href="https://youtu.be/dQw4w9WgXcQ">https://youtu.be/dQw4w9WgXcQ</a></p>'
    )
    expect(html).toContain('<p>Intro https://youtu.be/dQw4w9WgXcQ</p>')
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"')
    expect(html).toContain('loading="lazy"')
  })
})
