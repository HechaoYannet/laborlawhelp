import { z } from 'zod'

const envSchema = z.object({
  MCP_ROUTER_COMMAND: z.string().default(process.platform === 'win32' ? 'npx.cmd' : 'npx'),
  MCP_ROUTER_ARGS: z.string().default('-y pkulaw-mcp-router@latest serve --config ./config/pkulaw-mcp-router.toml'),
  MCP_ROUTER_CWD: z.string().optional(),
  MCP_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  MCP_REQUEST_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
  MCP_GATEWAY_API_KEY: z.string().optional(),
  MCP_ALLOWED_ORIGINS: z.string().optional(),
})

export interface McpRuntimeConfig {
  command: string
  args: string[]
  cwd?: string
  requestTimeoutMs: number
  requestRetries: number
  gatewayApiKey?: string
  allowedOrigins: string[]
}

let cachedConfig: McpRuntimeConfig | null = null

export function getMcpRuntimeConfig(): McpRuntimeConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const parsed = envSchema.parse(process.env)
  cachedConfig = {
    command: parsed.MCP_ROUTER_COMMAND,
    args: parsed.MCP_ROUTER_ARGS.split(' ').filter(Boolean),
    cwd: parsed.MCP_ROUTER_CWD,
    requestTimeoutMs: parsed.MCP_REQUEST_TIMEOUT_MS,
    requestRetries: parsed.MCP_REQUEST_RETRIES,
    gatewayApiKey: parsed.MCP_GATEWAY_API_KEY,
    allowedOrigins: (parsed.MCP_ALLOWED_ORIGINS || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean),
  }

  return cachedConfig
}
