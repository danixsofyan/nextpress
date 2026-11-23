import { vi } from 'vitest'

process.env.NEXT_PUBLIC_SITE_URL ??= 'https://example.test'
process.env.BETTER_AUTH_SECRET ??= 'integration-test-secret-integration-test-secret'
process.env.NEXTPRESS_API_KEY ??= 'np_integration_test_key_000000000000000000'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T>(fn: T) => fn,
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
  headers: async () => new Headers(),
  draftMode: async () => ({ isEnabled: false, enable: () => undefined, disable: () => undefined }),
}))
