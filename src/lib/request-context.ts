import { AsyncLocalStorage } from 'node:async_hooks'

export type Actor = {
  actorType: 'user' | 'api_key' | 'system'
  actorId: string | null
  userId: string | null
  requestId: string | null
}

const systemActor = (): Actor => ({
  actorType: 'system',
  actorId: null,
  userId: null,
  requestId: null,
})

const storage = new AsyncLocalStorage<Actor>()

export const beginRequestContext = () => storage.enterWith(systemActor())

export function setActor(actor: Actor) {
  const store = storage.getStore()
  if (store) Object.assign(store, actor)
  else storage.enterWith(actor)
}

export const currentActor = (): Actor => ({ ...(storage.getStore() ?? systemActor()) })

const invites = new AsyncLocalStorage<true>()

export const runAsInvite = <T>(task: () => Promise<T>) => invites.run(true, task)

export const isInvite = () => invites.getStore() === true
