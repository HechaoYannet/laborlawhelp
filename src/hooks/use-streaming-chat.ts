'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
  createCase,
  createSession,
  streamSessionChat,
} from '@/features/consultation/services/middleware-api'
import {
  extractConsultationInfo,
  mergeConsultationInfo,
  consultationInfoToCaseProfile,
} from '@/features/consultation/services/consultation-profile'
import {
  MIDDLEWARE_CLIENT_CAPABILITIES,
  normalizeReferences,
  normalizeCardActions,
  buildCardActionPrompt,
  sanitizeAssistantText,
  nextToolEventCreatedAt,
  createAnonymousOwnerToken,
} from '@/lib/consultation-utils'
import type { SessionContextState } from '@/hooks/use-case-store'

type SessionContextUpdater =
  | Partial<SessionContextState>
  | ((prev: SessionContextState) => Partial<SessionContextState>)
import type { FollowMode } from '@/hooks/use-scroll-management'
import type { ConsultationInfo } from '@/features/consultation/services/consultation-profile'
import type { CaseProfile, DialogueMessage } from '@/lib/types'

export function useStreamingChat({
  sessionContext,
  setSessionContext,
  consultationInfo,
  setConsultationInfo,
  updateExtractedInfo,
  middlewareModeEnabled,
  middlewarePolicyVersion,
  addMessage,
  isThinking,
  setIsThinking,
  setDisplayText,
  scrollContainerRef,
  streamingBubbleRef,
  followModeRef,
  shouldFollowStreamingBubbleRef,
  isNearBottomRef,
  scrollContainerTo,
  desktopInputRef,
  mobileInputRef,
  resizeAllTextareas,
  inputValue,
  isListening,
  startListening,
  stopListening,
  clearPersistedMiddlewareSession,
  persistMiddlewareSession,
}: {
  sessionContext: SessionContextState
  setSessionContext: (updates: SessionContextUpdater) => void
  consultationInfo: ConsultationInfo
  setConsultationInfo: (info: ConsultationInfo) => void
  updateExtractedInfo: (info: Partial<CaseProfile>) => void
  middlewareModeEnabled: boolean
  middlewarePolicyVersion: string | undefined
  addMessage: (message: Omit<DialogueMessage, 'id' | 'timestamp'>) => void
  isThinking: boolean
  setIsThinking: (value: boolean | ((prev: boolean) => boolean)) => void
  setDisplayText: (value: string | ((prev: string) => string)) => void
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  streamingBubbleRef: React.RefObject<HTMLDivElement | null>
  followModeRef: React.MutableRefObject<FollowMode>
  shouldFollowStreamingBubbleRef: React.MutableRefObject<boolean>
  isNearBottomRef: React.MutableRefObject<boolean>
  scrollContainerTo: (top: number, behavior?: ScrollBehavior) => void
  desktopInputRef: React.RefObject<HTMLTextAreaElement | null>
  mobileInputRef: React.RefObject<HTMLTextAreaElement | null>
  resizeAllTextareas: () => void
  inputValue: string
  isListening: boolean
  startListening: () => void
  stopListening: () => void
  clearPersistedMiddlewareSession: () => void
  persistMiddlewareSession: (payload: Record<string, unknown>) => void
}) {
  const streamedResponseRef = useRef('')

  // 会话持久化
  useEffect(() => {
    if (!middlewareModeEnabled) return
    if (!sessionContext.caseId && !sessionContext.sessionId && !sessionContext.anonymousToken) {
      clearPersistedMiddlewareSession()
      return
    }

    persistMiddlewareSession({
      consultationInfo,
      sessionContext: {
        caseId: sessionContext.caseId,
        sessionId: sessionContext.sessionId,
        anonymousToken: sessionContext.anonymousToken,
        traceId: sessionContext.traceId,
        streamSeq: sessionContext.streamSeq,
      },
    })
  }, [
    clearPersistedMiddlewareSession,
    consultationInfo,
    middlewareModeEnabled,
    persistMiddlewareSession,
    sessionContext.anonymousToken,
    sessionContext.caseId,
    sessionContext.sessionId,
    sessionContext.streamSeq,
    sessionContext.traceId,
  ])

  const applyConsultationExtraction = useCallback(
    (userMessage: string) => {
      const newInfo = extractConsultationInfo(userMessage)
      const info = mergeConsultationInfo(consultationInfo, newInfo)
      setConsultationInfo(info)
      updateExtractedInfo(consultationInfoToCaseProfile(info))

      return { info, newInfo }
    },
    [consultationInfo, setConsultationInfo, updateExtractedInfo],
  )

  const ensureMiddlewareSession = useCallback(async () => {
    let caseId = sessionContext.caseId
    let sessionId = sessionContext.sessionId
    let anonymousToken = sessionContext.anonymousToken

    if (!anonymousToken) {
      anonymousToken = createAnonymousOwnerToken()
    }

    setSessionContext({
      status: 'initializing',
      isStreaming: false,
      mode: 'middleware',
      anonymousToken,
      lastError: null,
    })

    if (!caseId) {
      const caseResult = await createCase(anonymousToken)
      caseId = caseResult.caseId
      anonymousToken = caseResult.anonymousToken ?? anonymousToken
    }

    if (!caseId) {
      throw new Error('中间件会话初始化失败：缺少案件标识')
    }

    if (!sessionId) {
      const sessionResult = await createSession(caseId, anonymousToken)
      sessionId = sessionResult.sessionId
      anonymousToken = sessionResult.anonymousToken ?? anonymousToken
    }

    setSessionContext({
      caseId,
      sessionId,
      sessionStatus: 'active',
      anonymousToken,
      status: 'active',
      isStreaming: false,
      mode: 'middleware',
      lastError: null,
    })

    return { caseId, sessionId, anonymousToken }
  }, [sessionContext.caseId, sessionContext.sessionId, sessionContext.anonymousToken, setSessionContext])

  const getAssistantResponseFromMiddleware = useCallback(
    async (userMessage: string) => {
      applyConsultationExtraction(userMessage)

      const { sessionId, anonymousToken } = await ensureMiddlewareSession()
      const locale =
        typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'zh-CN'
      let streamErrorCode = ''
      let streamErrorMessage = ''
      let streamErrorRetryable = false
      let streamTraceId = ''
      let finalSummary = ''

      streamedResponseRef.current = ''
      setDisplayText('')
      setSessionContext({
        status: 'streaming',
        isStreaming: true,
        currentMessageId: null,
        traceId: null,
        lastToolName: null,
        lastToolResultSummary: null,
        // 不清除 toolEvents：保留此前轮次的结果卡片，新卡片追加在后面
        finalPayload: null,
        lastError: null,
      })

      await streamSessionChat(
        sessionId,
        {
          message: userMessage,
          client_seq: sessionContext.streamSeq,
          locale,
          policy_version: middlewarePolicyVersion,
          client_capabilities: [...MIDDLEWARE_CLIENT_CAPABILITIES],
        },
        {
          onMessageStart: (payload) => {
            const messageId = typeof payload.message_id === 'string' ? payload.message_id : null
            const traceId = typeof payload.trace_id === 'string' ? payload.trace_id : null
            streamedResponseRef.current = ''
            setDisplayText('')
            if (traceId) {
              streamTraceId = traceId
            }
            setSessionContext({
              currentMessageId: messageId,
              traceId,
            })
          },
          onContentDelta: (delta, seq) => {
            if (!delta) return

            streamedResponseRef.current += delta
            setDisplayText(sanitizeAssistantText(streamedResponseRef.current))
            setSessionContext((prev) => ({
              streamSeq: typeof seq === 'number' ? seq : prev.streamSeq,
            }))

            // 直驱滚动：不等 React 批次，内容到达即跟随
            if (shouldFollowStreamingBubbleRef.current && isNearBottomRef.current) {
              const container = scrollContainerRef.current
              if (container) {
                scrollContainerTo(
                  container.scrollHeight - container.clientHeight,
                  'instant' as ScrollBehavior,
                )
              }
            }
          },
          onToolCall: (payload) => {
            const toolName = typeof payload.tool_name === 'string' ? payload.tool_name : '处理中'
            const traceId = typeof payload.trace_id === 'string' ? payload.trace_id : undefined
            if (traceId) {
              streamTraceId = traceId
            }
            setSessionContext((prev) => ({
              traceId: traceId ?? prev.traceId,
              lastToolName: toolName,
              lastToolResultSummary: '等待工具结果',
              toolEvents: [
                ...prev.toolEvents,
                {
                  toolName,
                  status: 'started',
                  summary: '工具调用中',
                  references: [],
                  traceId,
                  createdAt: nextToolEventCreatedAt(),
                },
              ],
            }))
          },
          onToolResult: (payload) => {
            const toolName = typeof payload.tool_name === 'string' ? payload.tool_name : null
            const resultSummary =
              typeof payload.result_summary === 'string' ? payload.result_summary : '工具调用已完成'
            const references = normalizeReferences(payload.references)
            const cardType = typeof payload.card_type === 'string' ? payload.card_type : undefined
            const cardTitle = typeof payload.card_title === 'string' ? payload.card_title : undefined
            const cardPayload =
              payload.card_payload && typeof payload.card_payload === 'object'
                ? (payload.card_payload as Record<string, unknown>)
                : undefined
            const cardActions = normalizeCardActions(payload.card_actions)
            const traceId = typeof payload.trace_id === 'string' ? payload.trace_id : undefined
            if (traceId) {
              streamTraceId = traceId
            }

            setSessionContext((prev) => {
              const nextToolEvents = [...prev.toolEvents]
              const reverseIndex = [...nextToolEvents]
                .reverse()
                .findIndex(
                  (event) => event.toolName === toolName && event.status === 'started',
                )

              if (reverseIndex >= 0) {
                const targetIndex = nextToolEvents.length - reverseIndex - 1
                nextToolEvents[targetIndex] = {
                  ...nextToolEvents[targetIndex],
                  status: 'completed',
                  summary: resultSummary,
                  references,
                  cardType,
                  cardTitle,
                  cardPayload,
                  cardActions,
                  traceId: traceId ?? nextToolEvents[targetIndex].traceId,
                }
              } else if (toolName) {
                nextToolEvents.push({
                  toolName,
                  status: 'completed',
                  summary: resultSummary,
                  references,
                  cardType,
                  cardTitle,
                  cardPayload,
                  cardActions,
                  traceId,
                  createdAt: nextToolEventCreatedAt(),
                })
              }

              return {
                traceId: traceId ?? prev.traceId,
                lastToolName: toolName,
                lastToolResultSummary: resultSummary,
                toolEvents: nextToolEvents,
              }
            })
          },
          onFinal: (payload) => {
            const summary = typeof payload.summary === 'string' ? payload.summary : undefined
            const finishReason =
              typeof payload.finish_reason === 'string' ? payload.finish_reason : undefined
            const ruleVersion =
              typeof payload.rule_version === 'string' ? payload.rule_version : undefined
            const references = normalizeReferences(payload.references)
            const traceId = typeof payload.trace_id === 'string' ? payload.trace_id : undefined
            if (traceId) {
              streamTraceId = traceId
            }
            finalSummary = summary || ''

            setSessionContext((prev) => ({
              traceId: traceId ?? prev.traceId,
              finalPayload: {
                summary,
                references,
                ruleVersion,
                finishReason,
                traceId: traceId ?? prev.traceId ?? undefined,
              },
            }))
          },
          onMessageEnd: () => {
            setSessionContext({
              status: 'active',
              sessionStatus: 'active',
              isStreaming: false,
            })
          },
          onError: (payload) => {
            const rawCode = payload.code
            streamErrorCode =
              typeof rawCode === 'number' || typeof rawCode === 'string'
                ? String(rawCode)
                : 'OH_SERVICE_ERROR'
            streamErrorMessage =
              typeof payload.message === 'string' ? payload.message : '中间件流式会话失败'
            streamErrorRetryable = Boolean(payload.retryable)
            if (typeof payload.trace_id === 'string') {
              streamTraceId = payload.trace_id
            }
          },
        },
        anonymousToken,
      )

      if (streamErrorMessage) {
        const errorInfo = {
          code: streamErrorCode || 'OH_SERVICE_ERROR',
          message: streamErrorMessage,
          retryable: streamErrorRetryable,
        }
        setSessionContext({
          status: 'error',
          isStreaming: false,
          traceId: streamTraceId || sessionContext.traceId,
          lastError: errorInfo,
        })
        throw new Error(errorInfo.message)
      }

      const finalText = sanitizeAssistantText(
        streamedResponseRef.current.trim() ||
          finalSummary ||
          '抱歉，本次未生成有效回复，请重试。',
      )
      addMessage({ role: 'assistant', content: finalText })
      setDisplayText('')
      setIsThinking(false)
      setSessionContext({
        status: 'active',
        sessionStatus: 'active',
        isStreaming: false,
        traceId: streamTraceId || sessionContext.traceId,
        lastError: null,
      })
    },
    [
      applyConsultationExtraction,
      ensureMiddlewareSession,
      sessionContext.streamSeq,
      sessionContext.traceId,
      middlewarePolicyVersion,
      setSessionContext,
      setDisplayText,
      setIsThinking,
      addMessage,
      scrollContainerRef,
      shouldFollowStreamingBubbleRef,
      isNearBottomRef,
      scrollContainerTo,
    ],
  )

  // 发送消息
  const sendMessage = useCallback(
    async (rawContent?: string) => {
      const content = (rawContent ?? inputValue).trim()
      if (!content || isThinking) return

      addMessage({ role: 'user', content })
      if (desktopInputRef.current) {
        desktopInputRef.current.value = ''
        desktopInputRef.current.style.height = 'auto'
        desktopInputRef.current.style.overflowY = 'hidden'
      }
      if (mobileInputRef.current) {
        mobileInputRef.current.value = ''
        mobileInputRef.current.style.height = 'auto'
        mobileInputRef.current.style.overflowY = 'hidden'
      }
      resizeAllTextareas()
      requestAnimationFrame(() => {
        resizeAllTextareas()
      })
      setIsThinking(true)

      try {
        if (!middlewareModeEnabled) {
          throw new Error(
            '当前版本仅支持中间件驱动咨询，请开启 NEXT_PUBLIC_ENABLE_MIDDLEWARE_CHAT=true。',
          )
        }

        await getAssistantResponseFromMiddleware(content)
      } catch (error) {
        console.error('Error:', error)

        setSessionContext({
          status: 'error',
          isStreaming: false,
          lastError: {
            code: 'CHAT_REQUEST_FAILED',
            message: error instanceof Error ? error.message : '发送失败，请稍后重试。',
            retryable: true,
          },
        })
        addMessage({ role: 'assistant', content: '服务暂时不可用，请稍后重试。' })
        setDisplayText('')
        setIsThinking(false)
      }
    },
    [
      inputValue,
      isThinking,
      addMessage,
      desktopInputRef,
      mobileInputRef,
      resizeAllTextareas,
      setIsThinking,
      middlewareModeEnabled,
      getAssistantResponseFromMiddleware,
      setSessionContext,
      setDisplayText,
    ],
  )

  const handleSend = useCallback(async () => {
    await sendMessage()
  }, [sendMessage])

  // 语音切换
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // 键盘发送
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  // 卡片指令回调
  const handleCardAction = useCallback(
    async (action: string, payload: Record<string, unknown>) => {
      try {
        if (
          action === 'copy_document' ||
          action === 'copy_referral' ||
          action === 'copy_summary'
        ) {
          const text = JSON.stringify(payload, null, 2)
          await navigator.clipboard.writeText(text)
          return
        }

        if (action === 'download_document') {
          const content =
            typeof payload.content === 'string'
              ? payload.content
              : JSON.stringify(payload, null, 2)
          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'laborlawhelp-document.txt'
          a.click()
          URL.revokeObjectURL(url)
          return
        }

        const nextPrompt = buildCardActionPrompt(action, payload)
        if (nextPrompt) {
          await sendMessage(nextPrompt)
        }
      } catch (error) {
        console.error('card action failed:', error)
      }
    },
    [sendMessage],
  )

  return {
    handleSend,
    handleKeyDown,
    toggleListening,
    handleCardAction,
    sendMessage,
    streamedResponseRef,
  }
}
