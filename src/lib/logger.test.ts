import { expect, test } from 'vitest'
import { redact } from './logger'

test('redacts secrets at any depth and keeps other fields', () => {
  expect(
    redact({
      requestId: 'r1',
      password: 'p',
      headers: { authorization: 'Bearer x', 'x-api-key': 'k', accept: 'json' },
      nested: [{ webhookToken: 't', ok: true }],
    })
  ).toEqual({
    requestId: 'r1',
    password: '[redacted]',
    headers: { authorization: '[redacted]', 'x-api-key': '[redacted]', accept: 'json' },
    nested: [{ webhookToken: '[redacted]', ok: true }],
  })
})

test('serializes errors without stack traces', () => {
  expect(redact(new TypeError('boom'))).toEqual({ name: 'TypeError', message: 'boom' })
})
