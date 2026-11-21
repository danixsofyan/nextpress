export const errorCode = (status: number) => `NP-${status}0`

export const errorBody = (message: string, status: number) => ({
  error: message,
  code: errorCode(status),
})

export const apiError = (message: string, status: number, headers?: HeadersInit) =>
  Response.json(errorBody(message, status), { status, ...(headers && { headers }) })
