import { createHmac } from 'node:crypto'
import { expect, test } from 'vitest'
import { verifySumopodSignature, verifySumopodToken } from './sumopod-signature'

const secret = `whsec_${Buffer.from('test-signing-secret').toString('base64')}`
const sign = (id: string, ts: string, body: string) =>
  createHmac('sha256', Buffer.from('test-signing-secret'))
    .update(`${id}.${ts}.${body}`)
    .digest('base64')

test('accepts a valid Svix signature, including during rotation', () => {
  const body = '{"event_type":"payment.completed"}'
  const sig = sign('msg_1', '1700000000', body)
  const input = { svixId: 'msg_1', svixTimestamp: '1700000000', rawBody: body, secret }
  expect(verifySumopodSignature({ ...input, svixSignature: `v1,${sig}` })).toBe(true)
  expect(verifySumopodSignature({ ...input, svixSignature: `v1,old v1,${sig}` })).toBe(true)
})

test('rejects tampered bodies, wrong signatures, and missing headers', () => {
  const sig = sign('msg_1', '1700000000', '{"a":1}')
  const base = { svixId: 'msg_1', svixTimestamp: '1700000000', secret }
  expect(verifySumopodSignature({ ...base, rawBody: '{"a":2}', svixSignature: `v1,${sig}` })).toBe(
    false
  )
  expect(verifySumopodSignature({ ...base, rawBody: '{"a":1}', svixSignature: null })).toBe(false)
  expect(verifySumopodToken('whtok_a', 'whtok_a')).toBe(true)
  expect(verifySumopodToken('whtok_a', 'whtok_b')).toBe(false)
  expect(verifySumopodToken(null, 'whtok_a')).toBe(false)
})
