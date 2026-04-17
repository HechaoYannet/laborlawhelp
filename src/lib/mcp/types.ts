export type McpIntent = 'regulation' | 'case' | 'procedure' | 'general'

export interface McpToolSummary {
  name: string
  description?: string
  title?: string
}

export interface McpToolCallResult {
  toolName: string
  text: string
  rawContent: unknown
}

export interface McpQueryRequest {
  query: string
  intent?: McpIntent
  maxTools?: number
}

export interface McpQueryResponse {
  query: string
  intent: McpIntent
  selectedTools: McpToolSummary[]
  results: McpToolCallResult[]
  fallbackMessage?: string
}
