import { beforeAll, describe, expect, it, vi } from 'vitest'

const sendMail = vi.fn<(message: unknown) => Promise<{ messageId: string }>>(async () => ({
  messageId: '1',
}))
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail }) } }))

beforeAll(() => {
  Object.assign(process.env, {
    SMTP_HOST: 'smtp.example.test',
    SMTP_USER: 'user',
    SMTP_PASS: 'pass',
    SMTP_FROM: 'NextPress <no-reply@example.test>',
  })
})

describe('email', () => {
  it('sends escaped HTML and plain text, and notifies administrators about comments', async () => {
    const { emailEnabled, emailLayout, sendEmail } = await import('./email')
    const { notifyNewComment } = await import('./notifications')
    const { createUser } = await import('../../tests/fixtures')
    expect(emailEnabled()).toBe(true)
    const layout = emailLayout(['<b>Hi</b>'], { label: 'Go', url: 'https://x.test/?a=1&b=2' })
    expect(layout.html).toContain('&lt;b&gt;Hi&lt;/b&gt;')
    expect(layout.html).toContain('a=1&amp;b=2')
    expect(layout.text).toContain('Go: https://x.test/?a=1&b=2')
    expect(await sendEmail({ to: 'a@example.test', subject: 'S', ...layout })).toBe(true)

    const admin = await createUser('administrator')
    await notifyNewComment({
      authorName: 'Ani',
      content: 'x'.repeat(700),
      status: 'pending',
      post: { title: 'Post', slug: 'post', authorId: null },
    })
    const last = sendMail.mock.calls.at(-1)?.[0] as unknown as {
      to: string[]
      subject: string
      text: string
    }
    expect(last.to).toContain(admin.email)
    expect(last.subject).toContain('Please moderate')
    expect(last.text).toContain('…')

    sendMail.mockRejectedValueOnce(new Error('smtp down'))
    expect(await sendEmail({ to: 'a@example.test', subject: 'S', html: '', text: '' })).toBe(false)
  })
})
