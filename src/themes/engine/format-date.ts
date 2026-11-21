const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const pad = (n: number) => String(n).padStart(2, '0')

function ordinal(day: number) {
  if (day % 100 >= 11 && day % 100 <= 13) return 'th'
  return ['th', 'st', 'nd', 'rd'][day % 10] ?? 'th'
}

function partsIn(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
    zone: get('timeZoneName'),
  }
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

export function formatDate(date: Date | string, format = 'F j, Y', timeZone = 'UTC') {
  const p = partsIn(new Date(date), isValidTimeZone(timeZone) ? timeZone : 'UTC')
  const hour12 = p.hour % 12 || 12
  const tokens: Record<string, () => string> = {
    d: () => pad(p.day),
    D: () => DAYS[p.weekday]?.slice(0, 3) ?? '',
    j: () => String(p.day),
    l: () => DAYS[p.weekday] ?? '',
    N: () => String(p.weekday === 0 ? 7 : p.weekday),
    S: () => ordinal(p.day),
    w: () => String(p.weekday),
    F: () => MONTHS[p.month - 1] ?? '',
    M: () => MONTHS[p.month - 1]?.slice(0, 3) ?? '',
    m: () => pad(p.month),
    n: () => String(p.month),
    Y: () => String(p.year),
    y: () => String(p.year).slice(-2),
    a: () => (p.hour < 12 ? 'am' : 'pm'),
    A: () => (p.hour < 12 ? 'AM' : 'PM'),
    g: () => String(hour12),
    G: () => String(p.hour),
    h: () => pad(hour12),
    H: () => pad(p.hour),
    i: () => pad(p.minute),
    s: () => pad(p.second),
    T: () => p.zone,
  }
  let out = ''
  for (let i = 0; i < format.length; i++) {
    const ch = format[i] as string
    if (ch === '\\') {
      out += format[i + 1] ?? ''
      i++
    } else {
      out += tokens[ch]?.() ?? ch
    }
  }
  return out
}
