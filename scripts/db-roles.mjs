import { readFile } from 'node:fs/promises'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
const password = process.env.APP_DB_PASSWORD
if (!url || !password) {
  console.error('DATABASE_URL (owner) and APP_DB_PASSWORD are required')
  process.exit(1)
}
if (password.length < 24) {
  console.error('APP_DB_PASSWORD must be at least 24 characters')
  process.exit(1)
}

const sql = postgres(url, { max: 1, prepare: false })
try {
  await sql.unsafe(await readFile(new URL('../drizzle/app-role.sql', import.meta.url), 'utf8'))
  await sql.unsafe(
    `ALTER ROLE nextpress_app WITH LOGIN NOBYPASSRLS PASSWORD '${password.replaceAll("'", "''")}'`
  )
  console.info('Role nextpress_app is ready')
} finally {
  await sql.end()
}
