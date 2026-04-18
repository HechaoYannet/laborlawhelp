export type MiddlewareEventType =
  | 'message_start'
  | 'content_delta'
  | 'tool_call'
  | 'tool_result'
  | 'final'
  | 'message_end'
  | 'error'

export interface MiddlewareAttachment {
  id: string
  name: string
  url: string
  mime_type: string
}

export interface MiddlewareCreateCaseResult {
  caseId: string
  anonymousToken?: string | null
}

export interface MiddlewareCreateSessionResult {
  sessionId: string
  anonymousToken?: string | null
}

export interface MiddlewareChatRequest {
  message: string
  attachments?: MiddlewareAttachment[]
  client_seq?: number
}

export interface MiddlewareChatHandlers {
  onMessageStart?: (payload: Record<string, unknown>) => void
  onContentDelta?: (delta: string, seq?: number) => void
  onToolCall?: (payload: Record<string, unknown>) => void
  onToolResult?: (payload: Record<string, unknown>) => void
  onFinal?: (payload: Record<string, unknown>) => void
  onMessageEnd?: (payload: Record<string, unknown>) => void
  onError?: (payload: Record<string, unknown>) => void
}

const DEFAULT_API_BASE_URL = '/api/v1'

function getApiBaseUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_MIDDLEND_BASE_URL ||
    process.env.NEXT_PUBLIC_MIDDLEWARE_API_BASE_URL
  if (!fromEnv) return DEFAULT_API_BASE_URL
  return fromEnv.replace(/\/$/, '')
}

function resolveAnonymousTokenFromResponse(response: Response) {
  return response.headers.get('x-anonymous-token') || response.headers.get('X-Anonymous-Token')
}

function buildHeaders(anonymousToken?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (anonymousToken) {
    headers['X-Anonymous-Token'] = anonymousToken
  }

  return headers
}

function extractId(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

async function readJsonSafely(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  if (!text) return {}

  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch {
    // Keep empty object as a safe fallback when backend returns non-JSON text.
  }

  return {}
}

async function assertOk(response: Response, action: string): Promise<Record<string, unknown>> {
  const payload = await readJsonSafely(response)
  if (!response.ok) {
    const message = typeof payload.message === 'string' ? payload.message : `${action}失败`
    throw new Error(message)
  }

  return payload
}

export async function createCase(anonymousToken?: string | null): Promise<MiddlewareCreateCaseResult> {
  const response = await fetch(`${getApiBaseUrl()}/cases`, {
    method: 'POST',
    headers: buildHeaders(anonymousToken),
    body: JSON.stringify({}),
  })

  const payload = await assertOk(response, '创建案件')
  const caseId =
    extractId(payload.case_id) ||
    extractId(payload.caseId) ||
    extractId(payload.id)

  if (!caseId) {
    throw new Error('创建案件失败：返回数据缺少 case_id')
  }

  return {
    caseId,
    anonymousToken: extractId(payload.anonymous_token) || resolveAnonymousTokenFromResponse(response),
  }
}

export async function createSession(caseId: string, anonymousToken?: string | null): Promise<MiddlewareCreateSessionResult> {
  const response = await fetch(`${getApiBaseUrl()}/cases/${caseId}/sessions`, {
    method: 'POST',
    headers: buildHeaders(anonymousToken),
    body: JSON.stringify({}),
  })

  const payload = await assertOk(response, '创建会话')
  const sessionId =
    extractId(payload.session_id) ||
    extractId(payload.sessionId) ||
    extractId(payload.id)

  if (!sessionId) {
    throw new Error('创建会话失败：返回数据缺少 session_id')
  }

  return {
    sessionId,
    anonymousToken: extractId(payload.anonymous_token) || resolveAnonymousTokenFromResponse(response),
  }
}

function parseSSEEventBlock(block: string): { event: MiddlewareEventType; data: Record<string, unknown> } | null {
  const lines = block.split('\n')
  let eventName = ''
  const dataLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('event:')) {
      eventName = trimmed.slice(6).trim()
      continue
    }

    if (trimmed.startsWith('data:')) {
      dataLines.push(trimmed.slice(5).trim())
    }
  }

  if (!eventName) return null
  if (!dataLines.length) return null

  const rawData = dataLines.join('\n')
  try {
    const parsed = JSON.parse(rawData)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return {
      event: eventName as MiddlewareEventType,
      data: parsed as Record<string, unknown>,
    }
  } catch {
    return null
  }
}

export async function streamSessionChat(
  sessionId: string,
  request: MiddlewareChatRequest,
  handlers: MiddlewareChatHandlers,
  anonymousToken?: string | null,
): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/sessions/${sessionId}/chat`, {
    method: 'POST',
    headers: buildHeaders(anonymousToken),
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const payload = await readJsonSafely(response)
    const message = typeof payload.message === 'string' ? payload.message : '会话流请求失败'
    throw new Error(message)
  }

  if (!response.body) {
    throw new Error('会话流请求失败：服务端未返回流响应')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let lastSeq = typeof request.client_seq === 'number' ? request.client_seq : 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() || ''

    for (const block of blocks) {
      const parsed = parseSSEEventBlock(block)
      if (!parsed) continue

      const { event, data } = parsed
      switch (event) {
        case 'message_start':
          handlers.onMessageStart?.(data)
          break
        case 'content_delta': {
          const delta = typeof data.delta === 'string' ? data.delta : ''
          const seq = typeof data.seq === 'number' ? data.seq : undefined

          if (typeof seq === 'number') {
            if (seq <= lastSeq) {
              continue
            }
            lastSeq = seq
          }

          handlers.onContentDelta?.(delta, seq)
          break
        }
        case 'tool_call':
          handlers.onToolCall?.(data)
          break
        case 'tool_result':
          handlers.onToolResult?.(data)
          break
        case 'final':
          handlers.onFinal?.(data)
          break
        case 'message_end':
          handlers.onMessageEnd?.(data)
          break
        case 'error':
          handlers.onError?.(data)
          break
      }
    }
  }
}
