import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export const MAX_IMPORT_BYTES = 20 * 1024 * 1024

function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^::ffff:/, '')
  if (isIP(ip) === 4) {
    const [a = 0, b = 0] = ip.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    )
  }
  return ip === '::' || ip === '::1' || /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip)
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Invalid URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('Private addresses are not allowed')
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error('Private addresses are not allowed')
  }
  return url
}

export async function fetchFeed(raw: string): Promise<string> {
  let url = await assertPublicUrl(raw)
  const signal = AbortSignal.timeout(15_000)

  for (let redirects = 0; redirects <= 3; redirects++) {
    const res = await fetch(url, {
      redirect: 'manual',
      signal,
      headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
    })
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = await assertPublicUrl(new URL(res.headers.get('location') as string, url).toString())
      continue
    }
    if (!res.ok || !res.body) throw new Error(`Feed request failed with status ${res.status}`)
    if (Number(res.headers.get('content-length') ?? 0) > MAX_IMPORT_BYTES) {
      throw new Error('Feed is larger than 20 MB')
    }

    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_IMPORT_BYTES) {
        await reader.cancel()
        throw new Error('Feed is larger than 20 MB')
      }
      chunks.push(value)
    }
    return Buffer.concat(chunks).toString('utf8')
  }
  throw new Error('Too many redirects')
}
