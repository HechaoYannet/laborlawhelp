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
  const origin = request.headers.get('origin')
  const headerKey = request.headers.get('x-mcp-gateway-key')
  const isTrustedBrowserRequest = Boolean(
    origin &&
      (
        config.allowedOrigins.length > 0
          ? config.allowedOrigins.includes(origin)
          : origin === request.nextUrl.origin
      ),
  )
  const hasValidGatewayKey = Boolean(
    config.gatewayApiKey &&
      headerKey &&
      headerKey === config.gatewayApiKey,
  )

  if (config.allowedOrigins.length > 0 && origin && !config.allowedOrigins.includes(origin) && !hasValidGatewayKey) {
      throw new McpGuardError('Origin not allowed', 403)
  }

  if (config.gatewayApiKey && !isTrustedBrowserRequest && !hasValidGatewayKey) {
      throw new McpGuardError('Invalid gateway key', 401)
  }
}
