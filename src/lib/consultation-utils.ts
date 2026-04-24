'use client'

import type {
  SessionToolEvent,
  SessionReference,
} from '@/hooks/use-case-store'

export const MIDDLEWARE_CLIENT_CAPABILITIES = ['citations', 'tool-status', 'structured-final', 'trace-id', 'card-blocks']
export const CONSULTATION_SESSION_STORAGE_KEY = 'laborlawhelp.consultation.middleware-session'

export function normalizeReferences(value: unknown): SessionReference[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const ref = item as Record<string, unknown>
      return {
        title: typeof ref.title === 'string' ? ref.title : undefined,
        url: typeof ref.url === 'string' ? ref.url : undefined,
        snippet: typeof ref.snippet === 'string' ? ref.snippet : undefined,
      }
    })
}

export function normalizeCardActions(value: unknown): Array<{ action: string; label: string }> {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const action = item as Record<string, unknown>
      return {
        action: typeof action.action === 'string' ? action.action : '',
        label: typeof action.label === 'string' ? action.label : '',
      }
    })
    .filter((item) => item.action && item.label)
}

export function normalizeToolEvents(value: unknown): SessionToolEvent[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item) => item && typeof item === 'object')
    .reduce<SessionToolEvent[]>((events, item, index) => {
      const event = item as Record<string, unknown>
      const toolName = typeof event.tool_name === 'string'
        ? event.tool_name
        : typeof event.toolName === 'string'
          ? event.toolName
          : ''

      if (!toolName) {
        return events
      }

      const createdAt = typeof event.created_at === 'number'
        ? event.created_at
        : typeof event.createdAt === 'number'
          ? event.createdAt
          : Date.now() + index

      events.push({
        toolName,
        status: 'completed' as const,
        summary: typeof event.result_summary === 'string'
          ? event.result_summary
          : typeof event.summary === 'string'
            ? event.summary
            : undefined,
        references: normalizeReferences(event.references),
        cardType: typeof event.card_type === 'string'
          ? event.card_type
          : typeof event.cardType === 'string'
            ? event.cardType
            : undefined,
        cardTitle: typeof event.card_title === 'string'
          ? event.card_title
          : typeof event.cardTitle === 'string'
            ? event.cardTitle
            : undefined,
        cardPayload: event.card_payload && typeof event.card_payload === 'object'
          ? event.card_payload as Record<string, unknown>
          : event.cardPayload && typeof event.cardPayload === 'object'
            ? event.cardPayload as Record<string, unknown>
            : undefined,
        cardActions: normalizeCardActions(event.card_actions ?? event.cardActions),
        traceId: typeof event.trace_id === 'string'
          ? event.trace_id
          : typeof event.traceId === 'string'
            ? event.traceId
            : undefined,
        createdAt,
      })

      return events
    }, [])
}

export function pickFirstString(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null
  }

  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      return item.trim()
    }

    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>
      const candidate = [record.question, record.label, record.field]
        .find((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      if (candidate) {
        return candidate.trim()
      }
    }
  }

  return null
}

export function buildCardActionPrompt(action: string, payload: Record<string, unknown>): string | null {
  if (action === 'continue_consultation') {
    const suggestedQuestion = pickFirstString(payload.suggested_questions)
    const missingField = pickFirstString(payload.missing_info)
    return suggestedQuestion
      ? `请继续引导我补充案情，优先围绕这个问题继续：${suggestedQuestion}`
      : missingField
        ? `请继续引导我补充案情，优先补齐这项信息：${missingField}`
        : '请继续引导我补充案情，并优先追问影响赔偿测算和维权路径判断的关键信息。'
  }

  if (action === 'generate_document') {
    return '请基于当前案情和赔偿测算结果，继续为我生成适合当前阶段使用的文书，并说明我还需要补哪些材料。'
  }

  if (action === 'book_lawyer') {
    return '请基于当前案情和转介结果，帮我生成律师预约摘要，包含争议焦点、证据现状、预估金额和我需要提前准备的问题。'
  }

  return null
}

const ASSISTANT_INTERNAL_META_PATTERNS = [
  /我将按照劳动争议智能分诊工作流为您分析。?/g,
  /首先，我需要加载工作流技能，然后收集更多信息(?:进行详细分析)?。?/g,
  /我需要加载工作流技能，然后收集更多信息(?:进行详细分析)?。?/g,
]

export function sanitizeAssistantText(raw: string): string {
  let sanitized = raw

  for (const pattern of ASSISTANT_INTERNAL_META_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  const normalizedNewlines = sanitized.replace(/\r\n/g, '\n')
  const lines = normalizedNewlines.split('\n')
  const compactedLines: string[] = []

  for (const line of lines) {
    const previous = compactedLines[compactedLines.length - 1]
    const trimmed = line.trim()

    if (trimmed === '' && previous === '') {
      continue
    }

    if (
      trimmed !== '' &&
      previous &&
      previous.trim() !== '' &&
      previous.trim().replace(/\s+/g, ' ') === trimmed.replace(/\s+/g, ' ')
    ) {
      continue
    }

    compactedLines.push(trimmed === '' ? '' : line)
  }

  return compactedLines.join('\n').trim()
}

export function splitStableMarkdown(raw: string): { rendered: string; pending: string } {
  if (!raw.trim()) {
    return { rendered: '', pending: '' }
  }

  const fenceMatches = raw.match(/```/g)
  const hasUnclosedFence = Boolean(fenceMatches && fenceMatches.length % 2 === 1)
  if (hasUnclosedFence) {
    const lastFenceIndex = raw.lastIndexOf('```')
    return {
      rendered: raw.slice(0, Math.max(0, lastFenceIndex)).trim(),
      pending: raw.slice(Math.max(0, lastFenceIndex)).trim(),
    }
  }

  const lastDoubleBreak = raw.lastIndexOf('\n\n')
  if (lastDoubleBreak >= 0) {
    return {
      rendered: raw.slice(0, lastDoubleBreak).trim(),
      pending: raw.slice(lastDoubleBreak + 2).trim(),
    }
  }

  return { rendered: '', pending: raw.trim() }
}

export function getMarkdownClassName(textClass: string, role: 'user' | 'assistant') {
  return `${textClass} whitespace-normal break-words [word-break:break-word] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_li]:last:mb-0 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:font-semibold [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:px-3 [&_pre]:py-2 [&_pre]:font-mono [&_pre]:text-[0.92em] [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:px-2 [&_td]:py-1 ${
    role === 'user'
      ? '[&_a]:text-white [&_a]:underline [&_blockquote]:border-white/50 [&_pre]:bg-blue-700/70 [&_code]:bg-blue-700/70 [&_th]:border-white/30 [&_td]:border-white/30'
      : '[&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-slate-300 [&_pre]:bg-slate-100 [&_code]:bg-slate-100 [&_th]:border-slate-300 [&_td]:border-slate-300'
  }`
}

export function shortenId(value: string | null | undefined) {
  if (!value) return '未创建'
  if (value.length <= 12) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

export function humanizeToolName(toolName: string | null | undefined) {
  if (!toolName) return '处理中'
  if (toolName === 'skill') return 'Skill 流程控制'
  if (toolName.startsWith('mcp__pkulaw__')) {
    return `PKULaw · ${toolName.replace('mcp__pkulaw__', '')}`
  }

  return toolName.replaceAll('_', ' ')
}

export function createAnonymousOwnerToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `anon-${crypto.randomUUID()}`
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `anon-${token}`
  }

  return `anon-insecure-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

let toolEventSeq = 0
export function nextToolEventCreatedAt() {
  toolEventSeq += 1
  return Date.now() + toolEventSeq
}

export function isSessionNotFoundError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return /session not found|会话不存在|SESSION_NOT_FOUND/i.test(error.message)
}
