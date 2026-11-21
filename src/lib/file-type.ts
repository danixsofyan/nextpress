const TYPES = [
  { mime: 'image/png', ext: 'png', match: (b: Uint8Array) => starts(b, [0x89, 0x50, 0x4e, 0x47]) },
  { mime: 'image/jpeg', ext: 'jpg', match: (b: Uint8Array) => starts(b, [0xff, 0xd8, 0xff]) },
  { mime: 'image/gif', ext: 'gif', match: (b: Uint8Array) => ascii(b, 0, 'GIF8') },
  {
    mime: 'image/webp',
    ext: 'webp',
    match: (b: Uint8Array) => ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP'),
  },
  {
    mime: 'image/avif',
    ext: 'avif',
    match: (b: Uint8Array) => ascii(b, 4, 'ftyp') && /^avi[fs]$/.test(text(b, 8, 4)),
  },
  {
    mime: 'video/mp4',
    ext: 'mp4',
    match: (b: Uint8Array) => ascii(b, 4, 'ftyp') && !/^avi[fs]$/.test(text(b, 8, 4)),
  },
  {
    mime: 'video/webm',
    ext: 'webm',
    match: (b: Uint8Array) => starts(b, [0x1a, 0x45, 0xdf, 0xa3]),
  },
  {
    mime: 'audio/mpeg',
    ext: 'mp3',
    match: (b: Uint8Array) =>
      ascii(b, 0, 'ID3') || (b[0] === 0xff && ((b[1] ?? 0) & 0xe0) === 0xe0),
  },
  { mime: 'application/pdf', ext: 'pdf', match: (b: Uint8Array) => ascii(b, 0, '%PDF-') },
] as const

const starts = (b: Uint8Array, bytes: number[]) => bytes.every((v, i) => b[i] === v)
const text = (b: Uint8Array, at: number, length: number) =>
  String.fromCharCode(...b.subarray(at, at + length))
const ascii = (b: Uint8Array, at: number, value: string) => text(b, at, value.length) === value

export function detectFileType(bytes: Uint8Array) {
  const found = TYPES.find((t) => t.match(bytes))
  return found ? { mime: found.mime, ext: found.ext } : null
}
