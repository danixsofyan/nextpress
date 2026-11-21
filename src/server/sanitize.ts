import type { Block } from '@/core/validators'
import sanitizeHtml from 'sanitize-html'

const options: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'h1', 'h2', 'mark', 's', 'u'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['style'],
  },
  allowedStyles: {
    '*': { 'text-align': [/^(left|right|center|justify)$/] },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
}

export function sanitizeContent<T extends { content?: string | undefined }>(input: T): T {
  if (input.content === undefined) return input
  return { ...input, content: sanitizeHtml(input.content, options) }
}

export function sanitizeBlocks<T extends { blocks?: Block[] | null | undefined }>(input: T): T {
  if (!input.blocks) return input
  return {
    ...input,
    blocks: input.blocks.map((block) =>
      block.type === 'richText' ? { ...block, html: sanitizeHtml(block.html, options) } : block
    ),
  }
}
