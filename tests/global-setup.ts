import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const PREFIX = 'nextpress_test_'

function withDatabase(url: string, name: string) {
  const parsed = new URL(url)
  parsed.pathname = `/${name}`
  return parsed.toString()
}

const isAlive = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export default async function setup() {
  const serverUrl = process.env.TEST_DATABASE_URL
  if (!serverUrl) throw new Error('Set TEST_DATABASE_URL to run the integration tests')
  const admin = postgres(serverUrl, { max: 1, onnotice: () => {} })
  const stale = await admin<{ datname: string }[]>`
    select datname from pg_database where datname like ${`${PREFIX}%`}`
  for (const { datname } of stale) {
    const pid = Number(datname.slice(PREFIX.length))
    if (!isAlive(pid)) await admin.unsafe(`drop database if exists "${datname}" with (force)`)
  }
  const name = `${PREFIX}${process.pid}`
  await admin.unsafe(`drop database if exists "${name}" with (force)`)
  await admin.unsafe(`create database "${name}"`)
  const url = withDatabase(serverUrl, name)
  const client = postgres(url, { max: 1, onnotice: () => {} })
  await migrate(drizzle(client), { migrationsFolder: './drizzle' })
  await client.end()
  process.env.DATABASE_URL = url

  return async () => {
    await admin.unsafe(`drop database if exists "${name}" with (force)`)
    await admin.end()
  }
}
