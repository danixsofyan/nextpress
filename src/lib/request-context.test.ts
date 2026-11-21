import { describe, expect, it } from 'vitest'
import { beginRequestContext, currentActor, setActor } from './request-context'

async function authenticate() {
  beginRequestContext()
  await Promise.resolve()
  setActor({ actorType: 'api_key', actorId: 'k1', userId: null, requestId: 'r1' })
}

async function handler() {
  await authenticate()
  await Promise.resolve()
  return currentActor()
}

describe('request context', () => {
  it('keeps the actor set inside an awaited helper', async () => {
    expect((await handler()).actorType).toBe('api_key')
  })

  it('isolates concurrent requests', async () => {
    const other = async () => {
      beginRequestContext()
      await new Promise((r) => setTimeout(r, 5))
      return currentActor()
    }
    const [a, b] = await Promise.all([handler(), other()])
    expect(a.actorId).toBe('k1')
    expect(b.actorType).toBe('system')
  })
})
