import { NextRequest } from 'next/server'

import { getMcpRuntimeConfig } from '@/lib/mcp/config'

export class McpGuardError extends Error {
  status: number

  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

export function enforceMcpGuard(request: NextRequest) {
  const config = getMcpRuntimeConfig()

  if (config.allowedOrigins.length > 0) {
    const origin = request.headers.get('origin')

    if (!origin || !config.allowedOrigins.includes(origin)) {
      throw new McpGuardError('Origin not allowed', 403)
    }
  }

  if (config.gatewayApiKey) {
    const headerKey = request.headers.get('x-mcp-gateway-key')

    if (!headerKey || headerKey !== config.gatewayApiKey) {
      throw new McpGuardError('Invalid gateway key', 401)
    }
  }
}
