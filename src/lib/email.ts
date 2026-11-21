import nodemailer, { type Transporter } from 'nodemailer'
import { env } from './env'
import { logger } from './logger'

export const emailEnabled = () =>
  Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM)

let transport: Transporter | null = null

function transporter() {
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
  return transport
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function emailLayout(paragraphs: string[], action?: { label: string; url: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px">${escapeHtml(p)}</p>`).join('')
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(action.label)}</a></p><p style="margin:0;color:#6b7280;font-size:13px">Or open this link: ${escapeHtml(action.url)}</p>`
    : ''
  return {
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#111827;max-width:560px">${body}${button}</div>`,
    text: [...paragraphs, ...(action ? [`${action.label}: ${action.url}`] : [])].join('\n\n'),
  }
}

export async function sendEmail(message: {
  to: string | string[]
  subject: string
  html: string
  text: string
}) {
  if (!emailEnabled()) return false
  try {
    await transporter().sendMail({ from: env.SMTP_FROM, ...message })
    return true
  } catch (err) {
    logger.error('email failed', { subject: message.subject, err })
    return false
  }
}
