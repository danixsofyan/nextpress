type Level = 'debug' | 'info' | 'warn' | 'error'
type Fields = Record<string, unknown>

const SENSITIVE = /pass(word)?|secret|token|authorization|cookie|api[-_]?key|signature/i
const LEVELS: Level[] = ['debug', 'info', 'warn', 'error']
const minLevel = LEVELS.indexOf(process.env.NODE_ENV === 'production' ? 'info' : 'debug')

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[depth]'
  if (value instanceof Error) return { name: value.name, message: value.message }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) =>
        SENSITIVE.test(k) ? [k, '[redacted]'] : [k, redact(v, depth + 1)]
      )
    )
  }
  return value
}

function write(level: Level, msg: string, fields: Fields = {}) {
  if (LEVELS.indexOf(level) < minLevel) return
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    service: 'nextpress',
    msg,
    ...(redact(fields) as Fields),
  })
  if (level === 'error' || level === 'warn') console.error(line)
  else console.log(line)
}

export const logger = {
  debug: (msg: string, fields?: Fields) => write('debug', msg, fields),
  info: (msg: string, fields?: Fields) => write('info', msg, fields),
  warn: (msg: string, fields?: Fields) => write('warn', msg, fields),
  error: (msg: string, fields?: Fields) => write('error', msg, fields),
}

export const requestIdOf = (request: Request) => request.headers.get('x-request-id') ?? undefined
