import { NextRequest, NextResponse } from 'next/server'

import { listMcpTools } from '@/lib/mcp/client'
import { enforceMcpGuard, McpGuardError } from '@/lib/security/mcp-guard'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    enforceMcpGuard(request)

    const tools = await listMcpTools()

    console.log(
      JSON.stringify({
        event: 'mcp_tools_listed',
        count: tools.length,
        at: Date.now(),
      }),
    )

    return NextResponse.json({ tools })
  } catch (error) {
    if (error instanceof McpGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: 'Failed to list MCP tools', detail: (error as Error).message },
      { status: 500 },
    )
  }
}
