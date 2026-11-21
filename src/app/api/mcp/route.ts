import { db } from '@/lib/db'
import { registerThemeTools } from '@/lib/themes'
import { handleMcpRequest } from '@/server'

export const runtime = 'nodejs'

function handler(request: Request) {
  return handleMcpRequest(db, request, registerThemeTools)
}

export { handler as GET, handler as POST, handler as DELETE }
