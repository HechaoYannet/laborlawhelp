import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { queryMcpWithRules } from '@/lib/mcp/orchestrator'
import { enforceMcpGuard, McpGuardError } from '@/lib/security/mcp-guard'

export const runtime = 'nodejs'

const querySchema = z.object({
  query: z.string().trim().min(2).max(1000),
  intent: z.enum(['regulation', 'case', 'procedure', 'general']).optional(),
  maxTools: z.number().int().min(1).max(5).optional(),
})

export async function POST(request: NextRequest) {
  try {
    enforceMcpGuard(request)

    const body = await request.json()
    const payload = querySchema.parse(body)

    const response = await queryMcpWithRules(payload)

    console.log(
      JSON.stringify({
        event: 'mcp_query_completed',
        queryLength: payload.query.length,
        intent: response.intent,
        selectedToolCount: response.selectedTools.length,
        resultCount: response.results.length,
        at: Date.now(),
      }),
    )

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof McpGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: error.issues,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: 'MCP query failed',
        detail: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
