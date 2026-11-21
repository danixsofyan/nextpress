import { createHmac, timingSafeEqual } from 'node:crypto'

const equal = (a: string, b: string) => {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function verifySumopodSignature(input: {
  svixId: string | null
  svixTimestamp: string | null
  svixSignature: string | null
  rawBody: string
  secret: string
}) {
  const { svixId, svixTimestamp, svixSignature, rawBody, secret } = input
  if (!svixId || !svixTimestamp || !svixSignature || !secret) return false
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', key)
    .update(`${svixId}.${svixTimestamp}.${rawBody}`)
    .digest('base64')
  return svixSignature
    .split(' ')
    .map((part) => part.split(',')[1])
    .some((sig) => typeof sig === 'string' && equal(sig, expected))
}

export const verifySumopodToken = (received: string | null, expected: string | undefined) =>
  Boolean(received && expected && equal(received, expected))
