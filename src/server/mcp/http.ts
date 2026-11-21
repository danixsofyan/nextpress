import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { Database } from '@/core/db'
import { isValidApiKey } from '../middleware/auth'
import { type McpExtension, createMcpServer } from './server'

export async function handleMcpRequest(db: Database, request: Request, extend?: McpExtension) {
  if (!(await isValidApiKey(db, request.headers.get('X-Api-Key')))) {
    return Response.json({ error: 'Invalid or missing X-Api-Key header' }, { status: 401 })
  }
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  })
  await createMcpServer(db, extend).connect(transport)
  return transport.handleRequest(request)
}
