import { trace } from '@opentelemetry/api'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

import { getMcpRuntimeConfig } from '@/lib/mcp/config'
import type { McpToolCallResult, McpToolSummary } from '@/lib/mcp/types'

const tracer = trace.getTracer('laborlawhelp-mcp-gateway')

function normalizeToolText(rawContent: unknown): string {
  if (!Array.isArray(rawContent)) {
    return ''
  }

  const lines: string[] = []

  for (const item of rawContent) {
    if (typeof item !== 'object' || item === null) {
      continue
    }

    const typedItem = item as { type?: string; text?: string }

    if (typedItem.type === 'text' && typedItem.text) {
      lines.push(typedItem.text)
    }
  }

  return lines.join('\n').trim()
}

async function withClient<T>(handler: (client: Client) => Promise<T>): Promise<T> {
  const config = getMcpRuntimeConfig()

  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args,
    cwd: config.cwd,
    env: {
      ...process.env,
    } as Record<string, string>,
    stderr: 'pipe',
  })

  const client = new Client({
    name: 'laborlawhelp-mcp-gateway',
    version: '0.1.0',
  })

  const stderrStream = transport.stderr
  if (stderrStream) {
    stderrStream.on('data', chunk => {
      const text = String(chunk).trim()
      if (text) {
        console.error('[mcp-router-stderr]', text)
      }
    })
  }

  await client.connect(transport)

  try {
    return await handler(client)
  } finally {
    await transport.close()
  }
}

export async function listMcpTools(): Promise<McpToolSummary[]> {
  return tracer.startActiveSpan('mcp.list_tools', async span => {
    const config = getMcpRuntimeConfig()

    try {
      const response = await withClient(client =>
        client.listTools(undefined, {
          timeout: config.requestTimeoutMs,
        }),
      )

      const tools = response.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        title: tool.title,
      }))

      span.setAttribute('mcp.tools.count', tools.length)
      span.end()

      return tools
    } catch (error) {
      span.recordException(error as Error)
      span.setAttribute('mcp.error', true)
      span.end()
      throw error
    }
  })
}

export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<McpToolCallResult> {
  return tracer.startActiveSpan('mcp.call_tool', async span => {
    const config = getMcpRuntimeConfig()
    span.setAttribute('mcp.tool.name', toolName)

    let lastError: unknown

    for (let attempt = 0; attempt <= config.requestRetries; attempt += 1) {
      try {
        const response = await withClient(client =>
          client.callTool(
            {
              name: toolName,
              arguments: args,
            },
            undefined,
            {
              timeout: config.requestTimeoutMs,
            },
          ),
        )

        const text = normalizeToolText(response.content)

        span.setAttribute('mcp.retry.attempt', attempt)
        span.setAttribute('mcp.result.length', text.length)
        span.end()

        return {
          toolName,
          text,
          rawContent: response.content,
        }
      } catch (error) {
        lastError = error
      }
    }

    span.recordException(lastError as Error)
    span.setAttribute('mcp.error', true)
    span.end()
    throw lastError
  })
}
