const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: ' ',
}

const decode = (s: string) =>
  s
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e: string) => ENTITIES[e] ?? '')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))

const stripTags = (s: string) =>
  decode(s.replace(/<\/(p|li|div|h[1-6])>|<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim()

export function htmlToMarkdown(html: string): string {
  let md = html
    .replace(/\r\n?/g, '\n')
    .replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, code: string) => {
      return `\n\n\`\`\`\n${code.replace(/<[^>]+>/g, '').trim()}\n\`\`\`\n\n`
    })
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, text: string) => {
      return `\n\n${'#'.repeat(Number(level))} ${stripTags(text)}\n\n`
    })
    .replace(/<img[^>]*?src="([^"]*)"[^>]*?>/gi, (tag: string, src: string) => {
      const alt = tag.match(/alt="([^"]*)"/i)?.[1] ?? ''
      return `![${decode(alt)}](${src})`
    })
    .replace(/<a[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, text: string) => {
      return `[${stripTags(text)}](${decode(href)})`
    })
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner: string) => {
      return `\n\n${stripTags(inner.replace(/<\/p>/gi, '\n'))
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')}\n\n`
    })
    .replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, table: string) => {
      const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
        [...(row[1] ?? '').matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) =>
          stripTags(m[1] ?? '').replace(/\|/g, '\\|')
        )
      )
      const lines = rows.map((cells) => `| ${cells.join(' | ')} |`)
      if (rows[0]) lines.splice(1, 0, `| ${rows[0].map(() => '---').join(' | ')} |`)
      return `\n\n${lines.join('\n')}\n\n`
    })
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, list: string) => {
      let n = 0
      return `\n\n${list.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, item: string) => {
        n += 1
        return `${n}. ${stripTags(item)}\n`
      })}\n`
    })
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item: string) => `- ${stripTags(item)}\n`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
    .replace(/<\/(p|div|ul)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
  md = decode(md)
  return md
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export type FaqItem = { question: string; answer: string }

export function extractFaq(html: string): FaqItem[] {
  const items: FaqItem[] = []
  const pattern = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>([\s\S]*?)(?=<h[1-4][^>]*>|$)/gi
  for (const match of html.matchAll(pattern)) {
    const question = stripTags(match[1] ?? '')
    const answer = stripTags(match[2] ?? '')
    if (question.endsWith('?') && answer) items.push({ question, answer })
  }
  return items
}
