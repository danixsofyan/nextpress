import { expect, test } from 'vitest'
import { detectFileType } from './file-type'

const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(
    parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p))
  )

test('detects allowed types from their magic bytes', () => {
  expect(detectFileType(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d]))?.mime).toBe('image/png')
  expect(detectFileType(bytes([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe('jpg')
  expect(detectFileType(bytes('RIFF', [0, 0, 0, 0], 'WEBP'))?.mime).toBe('image/webp')
  expect(detectFileType(bytes([0, 0, 0, 0x1c], 'ftypavif'))?.mime).toBe('image/avif')
  expect(detectFileType(bytes([0, 0, 0, 0x18], 'ftypisom'))?.mime).toBe('video/mp4')
  expect(detectFileType(bytes('%PDF-1.7'))?.mime).toBe('application/pdf')
  expect(detectFileType(bytes('ID3', [4, 0]))?.mime).toBe('audio/mpeg')
})

test('rejects content that does not match an allowed type', () => {
  expect(detectFileType(bytes('<html><script>alert(1)</script>'))).toBeNull()
  expect(detectFileType(bytes('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull()
  expect(detectFileType(new Uint8Array())).toBeNull()
})
