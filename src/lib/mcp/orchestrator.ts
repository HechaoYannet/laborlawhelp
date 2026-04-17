import type {
  McpIntent,
  McpQueryRequest,
  McpQueryResponse,
  McpToolSummary,
} from '@/lib/mcp/types'
import { callMcpTool, listMcpTools } from '@/lib/mcp/client'

const INTENT_KEYWORDS: Record<McpIntent, string[]> = {
  regulation: ['法', '条例', '法规', '条文', 'law', 'regulation'],
  case: ['案例', '判决', '裁判', '案由', 'case', 'judgment'],
  procedure: ['流程', '程序', '申请', '仲裁', 'procedure'],
  general: [],
}

function detectIntent(query: string, explicitIntent?: McpIntent): McpIntent {
  if (explicitIntent) {
    return explicitIntent
  }

  const normalized = query.toLowerCase()

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [McpIntent, string[]][]) {
    if (keywords.length === 0) {
      continue
    }

    if (keywords.some(keyword => normalized.includes(keyword))) {
      return intent
    }
  }

  return 'general'
}

function rankToolsByIntent(tools: McpToolSummary[], intent: McpIntent): McpToolSummary[] {
  const keywords = INTENT_KEYWORDS[intent]

  if (keywords.length === 0) {
    return tools
  }

  return [...tools].sort((a, b) => {
    const aSource = `${a.name} ${a.description || ''}`.toLowerCase()
    const bSource = `${b.name} ${b.description || ''}`.toLowerCase()

    const aScore = keywords.reduce((score, keyword) => score + (aSource.includes(keyword) ? 1 : 0), 0)
    const bScore = keywords.reduce((score, keyword) => score + (bSource.includes(keyword) ? 1 : 0), 0)

    return bScore - aScore
  })
}

function buildToolArgs(query: string): Record<string, unknown> {
  return {
    query,
    keyword: query,
    text: query,
  }
}

export async function queryMcpWithRules(payload: McpQueryRequest): Promise<McpQueryResponse> {
  const safeQuery = payload.query.trim().slice(0, 400)
  const intent = detectIntent(safeQuery, payload.intent)
  const allTools = await listMcpTools()
  const rankedTools = rankToolsByIntent(allTools, intent)

  const requestedMax = payload.maxTools ?? 3
  const maxTools = Math.max(1, Math.min(5, requestedMax))
  const selectedTools = rankedTools.slice(0, maxTools)

  const results = []

  for (const tool of selectedTools) {
    try {
      const result = await callMcpTool(tool.name, buildToolArgs(safeQuery))
      results.push(result)
    } catch (error) {
      results.push({
        toolName: tool.name,
        text: `Tool call failed: ${(error as Error).message}`,
        rawContent: null,
      })
    }
  }

  const successfulResults = results.filter(item => item.text && !item.text.startsWith('Tool call failed:'))

  return {
    query: safeQuery,
    intent,
    selectedTools,
    results,
    fallbackMessage:
      successfulResults.length > 0
        ? undefined
        : '当前未检索到可用结果，请稍后重试或缩短问题范围。',
  }
}
