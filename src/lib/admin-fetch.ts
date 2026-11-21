export async function apiFetch<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const headers =
    init.body && !(init.body instanceof FormData)
      ? { 'Content-Type': 'application/json', ...init.headers }
      : init.headers
  const res = await fetch(url, { ...init, ...(headers && { headers }) })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? body.message ?? `Request failed (${res.status})`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong'
