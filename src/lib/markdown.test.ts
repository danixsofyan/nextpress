import { expect, test } from 'vitest'
import { extractFaq, htmlToMarkdown } from './markdown'

test('converts article HTML to Markdown', () => {
  const html =
    '<h2>Why &amp; how</h2><p>Use <strong>bold</strong>, <em>italic</em> and <a href="/docs?a=1&amp;b=2">docs</a>.</p>' +
    '<ul><li>One</li><li>Two</li></ul><ol><li>First</li><li>Second</li></ol>' +
    '<pre><code>const a = 1 &lt; 2</code></pre><blockquote><p>Quote</p></blockquote>' +
    '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table><img src="/media/x.png" alt="Chart">'
  expect(htmlToMarkdown(html)).toBe(
    [
      '## Why & how',
      '',
      'Use **bold**, *italic* and [docs](/docs?a=1&b=2).',
      '',
      '- One',
      '- Two',
      '',
      '1. First',
      '2. Second',
      '',
      '```',
      'const a = 1 < 2',
      '```',
      '',
      '> Quote',
      '',
      '| A | B |',
      '| --- | --- |',
      '| 1 | 2 |',
      '',
      '![Chart](/media/x.png)',
    ].join('\n')
  )
})

test('extracts question headings and their answers', () => {
  const html =
    '<p>Intro</p><h2>What is NextPress?</h2><p>An open-source CMS.</p><p>Built on Next.js.</p>' +
    '<h2>Features</h2><p>Many.</p><h3>Is it free?</h3><p>Yes, MIT.</p><h2>Empty?</h2>'
  expect(extractFaq(html)).toEqual([
    { question: 'What is NextPress?', answer: 'An open-source CMS. Built on Next.js.' },
    { question: 'Is it free?', answer: 'Yes, MIT.' },
  ])
})
