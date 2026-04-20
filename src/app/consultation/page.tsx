'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { Button } from '@/components/ui/button'
import {
  Mic,
  MicOff,
  Send,
  User,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  LoaderCircle,
} from 'lucide-react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { ConsultationResultCards } from '@/features/consultation/components/consultation-result-cards'
import {
  extractConsultationInfo,
  mergeConsultationInfo,
  consultationInfoToCaseProfile,
} from '@/features/consultation/services/consultation-profile'
import {
  createCase,
  createSession,
  listSessionMessages,
  streamSessionChat,
} from '@/features/consultation/services/middleware-api'
import {
  useCaseStore,
  type SessionReference,
} from '@/hooks/use-case-store'
import type { PanelImperativeHandle } from 'react-resizable-panels'

const MIDDLEWARE_CLIENT_CAPABILITIES = ['citations', 'tool-status', 'structured-final', 'trace-id', 'card-blocks']
const CONSULTATION_SESSION_STORAGE_KEY = 'laborlawhelp.consultation.middleware-session'

function normalizeReferences(value: unknown): SessionReference[] {
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

function normalizeCardActions(value: unknown): Array<{ action: string; label: string }> {
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

function shortenId(value: string | null | undefined) {
  if (!value) return '未创建'
  if (value.length <= 12) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function humanizeToolName(toolName: string | null | undefined) {
  if (!toolName) return '处理中'
  if (toolName === 'skill') return 'Skill 流程控制'
  if (toolName.startsWith('mcp__pkulaw__')) {
    return `PKULaw · ${toolName.replace('mcp__pkulaw__', '')}`
  }

  return toolName.replaceAll('_', ' ')
}

function createAnonymousOwnerToken() {
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

function isSessionNotFoundError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return /session not found|会话不存在|SESSION_NOT_FOUND/i.test(error.message)
}

export default function LaborRightsConsultation() {
  const middlewareModeEnabled = process.env.NEXT_PUBLIC_ENABLE_MIDDLEWARE_CHAT === 'true'
  const middlewarePolicyVersion =
    process.env.NEXT_PUBLIC_MIDDLEWARE_POLICY_VERSION ||
    process.env.NEXT_PUBLIC_POLICY_VERSION ||
    undefined

  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [isWideScreen, setIsWideScreen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [isCompactLandscape, setIsCompactLandscape] = useState(false)
  const [composerHeight, setComposerHeight] = useState(140)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [summaryCopied, setSummaryCopied] = useState(false)
  const [packageCopied, setPackageCopied] = useState(false)

  const {
    messages,
    addMessage,
    replaceMessages,
    clearMessages,
    updateExtractedInfo,
    consultationInfo,
    setConsultationInfo,
    resetConsultationInfo,
    resetExtractedInfo,
    sessionContext,
    setSessionContext,
    resetSessionContext,
  } = useCaseStore()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const sidebarPanelRef = useRef<PanelImperativeHandle | null>(null)
  const lastMessageCountRef = useRef(0)
  const streamedResponseRef = useRef('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition()

  const persistMiddlewareSession = useCallback((payload: Record<string, unknown>) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CONSULTATION_SESSION_STORAGE_KEY, JSON.stringify(payload))
  }, [])

  const clearPersistedMiddlewareSession = useCallback(() => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(CONSULTATION_SESSION_STORAGE_KEY)
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, displayText])

  const resizeTextarea = useCallback((element?: HTMLTextAreaElement) => {
    const target = element ?? inputRef.current
    if (!target) return

    const maxHeight = isWideScreen ? 260 : isCompactLandscape ? 132 : 180
    target.style.height = 'auto'
    const nextHeight = Math.min(target.scrollHeight, maxHeight)
    target.style.height = `${nextHeight}px`
    target.style.overflowY = target.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [isCompactLandscape, isWideScreen])

  // 输入框自动高度（达到上限后显示滚动条）
  useEffect(() => {
    resizeTextarea()
  }, [inputValue, resizeTextarea])

  // 大屏与横屏状态
  useEffect(() => {
    const wideQuery = window.matchMedia('(min-width: 1280px)')
    const landscapeQuery = window.matchMedia('(orientation: landscape)')
    const compactLandscapeQuery = window.matchMedia('(orientation: landscape) and (max-height: 560px)')

    const syncDeviceState = () => {
      setIsWideScreen(wideQuery.matches)
      setIsLandscape(landscapeQuery.matches)
      setIsCompactLandscape(compactLandscapeQuery.matches)
    }

    syncDeviceState()
    wideQuery.addEventListener('change', syncDeviceState)
    landscapeQuery.addEventListener('change', syncDeviceState)
    compactLandscapeQuery.addEventListener('change', syncDeviceState)

    return () => {
      wideQuery.removeEventListener('change', syncDeviceState)
      landscapeQuery.removeEventListener('change', syncDeviceState)
      compactLandscapeQuery.removeEventListener('change', syncDeviceState)
    }
  }, [])

  // 监听输入卡片高度，动态留白避免消息与输入区重叠
  useEffect(() => {
    const composer = composerRef.current
    if (!composer) return

    const syncComposerHeight = () => {
      const rect = composer.getBoundingClientRect()
      setComposerHeight(Math.ceil(rect.height))
    }

    syncComposerHeight()
    const observer = new ResizeObserver(syncComposerHeight)
    observer.observe(composer)
    window.addEventListener('resize', syncComposerHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncComposerHeight)
    }
  }, [])

  // 软键盘弹起时抬升输入卡片，防止被遮挡
  useEffect(() => {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    if (!vv) return

    const syncKeyboardInset = () => {
      const rawInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      const isLikelyKeyboard = rawInset > 70
      setKeyboardInset(isLikelyKeyboard ? rawInset : 0)
    }

    syncKeyboardInset()
    vv.addEventListener('resize', syncKeyboardInset)
    vv.addEventListener('scroll', syncKeyboardInset)

    return () => {
      vv.removeEventListener('resize', syncKeyboardInset)
      vv.removeEventListener('scroll', syncKeyboardInset)
    }
  }, [])

  // 控制“一键到底”按钮显隐规则
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateScrollButtonState = () => {
      const hiddenThreshold = isCompactLandscape ? 50 : isLandscape ? 90 : 120
      const showThreshold = isCompactLandscape ? 140 : isLandscape ? 220 : 300
      const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      const hasEnoughMessages = messages.length > 3
      const nearBottom = distanceToBottom <= hiddenThreshold

      setIsNearBottom(nearBottom)
      if (nearBottom) {
        setUnreadCount(0)
      }

      if (!hasEnoughMessages) {
        setShowScrollToBottom(false)
        return
      }

      if (distanceToBottom > showThreshold || unreadCount > 0) {
        setShowScrollToBottom(true)
      } else if (nearBottom) {
        setShowScrollToBottom(false)
      }
    }

    container.addEventListener('scroll', updateScrollButtonState)
    updateScrollButtonState()
    return () => container.removeEventListener('scroll', updateScrollButtonState)
  }, [messages.length, isLandscape, isCompactLandscape, unreadCount])

  // 未读消息计数（未在底部时新增消息累加）
  useEffect(() => {
    if (lastMessageCountRef.current === 0) {
      lastMessageCountRef.current = messages.length
      return
    }

    if (messages.length > lastMessageCountRef.current && !isNearBottom) {
      setUnreadCount((count) => count + (messages.length - lastMessageCountRef.current))
    }

    lastMessageCountRef.current = messages.length
  }, [messages.length, isNearBottom])

  // 语音输入同步到输入框
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript)
    }
  }, [transcript])

  // 初始化问候语
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      clearMessages()
      resetExtractedInfo()
      resetConsultationInfo()
      resetSessionContext()

      if (!middlewareModeEnabled || typeof window === 'undefined') {
        setSessionContext({ mode: middlewareModeEnabled ? 'middleware' : 'local' })
        addMessage({ role: 'assistant', content: '请告诉我您的诉求' })
        return
      }

      const raw = window.localStorage.getItem(CONSULTATION_SESSION_STORAGE_KEY)
      if (!raw) {
        setSessionContext({
          mode: 'middleware',
          anonymousToken: createAnonymousOwnerToken(),
        })
        addMessage({ role: 'assistant', content: '请告诉我您的诉求' })
        return
      }

      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        const restoredConsultationInfo =
          parsed.consultationInfo && typeof parsed.consultationInfo === 'object'
            ? parsed.consultationInfo
            : null
        const restoredSessionContext =
          parsed.sessionContext && typeof parsed.sessionContext === 'object'
            ? parsed.sessionContext as Record<string, unknown>
            : null

        if (restoredConsultationInfo) {
          const nextInfo = mergeConsultationInfo(
            {
              evidence: [],
            },
            restoredConsultationInfo as Parameters<typeof mergeConsultationInfo>[1],
          )
          setConsultationInfo(nextInfo)
          updateExtractedInfo(consultationInfoToCaseProfile(nextInfo))
        }

        if (!restoredSessionContext) {
          setSessionContext({
            mode: 'middleware',
            anonymousToken: createAnonymousOwnerToken(),
          })
          addMessage({ role: 'assistant', content: '请告诉我您的诉求' })
          return
        }

        const restoredCaseId =
          typeof restoredSessionContext.caseId === 'string' ? restoredSessionContext.caseId : null
        const restoredSessionId =
          typeof restoredSessionContext.sessionId === 'string' ? restoredSessionContext.sessionId : null
        const restoredAnonymousToken =
          typeof restoredSessionContext.anonymousToken === 'string'
            ? restoredSessionContext.anonymousToken
            : createAnonymousOwnerToken()
        const restoredTraceId =
          typeof restoredSessionContext.traceId === 'string' ? restoredSessionContext.traceId : null
        const restoredSeq =
          typeof restoredSessionContext.streamSeq === 'number' ? restoredSessionContext.streamSeq : 0

        setSessionContext({
          mode: 'middleware',
          status: 'active',
          isStreaming: false,
          caseId: restoredCaseId,
          sessionId: restoredSessionId,
          anonymousToken: restoredAnonymousToken,
          sessionStatus: 'active',
          traceId: restoredTraceId,
          streamSeq: restoredSeq,
        })

        if (!restoredSessionId || !restoredAnonymousToken) {
          addMessage({ role: 'assistant', content: '请告诉我您的诉求' })
          return
        }

        let history = [] as Awaited<ReturnType<typeof listSessionMessages>>
        try {
          history = await listSessionMessages(restoredSessionId, restoredAnonymousToken)
        } catch (error) {
          if (!isSessionNotFoundError(error)) {
            throw error
          }

          clearPersistedMiddlewareSession()
          setSessionContext({
            mode: 'middleware',
            anonymousToken: createAnonymousOwnerToken(),
          })
          addMessage({ role: 'assistant', content: '请告诉我您的诉求' })
          return
        }
        if (cancelled) return

        if (history.length > 0) {
          replaceMessages(
            history.map((message) => ({
              id: message.id,
              role: message.role === 'user' ? 'user' : 'assistant',
              content: message.content,
              timestamp: message.createdAt ? Date.parse(message.createdAt) || Date.now() : Date.now(),
            })),
          )
          return
        }

        addMessage({ role: 'assistant', content: '请告诉我您的诉求' })
      } catch (error) {
        console.error('Failed to restore middleware session:', error)
        clearPersistedMiddlewareSession()
        setSessionContext({
          mode: 'middleware',
          anonymousToken: createAnonymousOwnerToken(),
        })
        addMessage({ role: 'assistant', content: '请告诉我您的诉求' })
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [
    addMessage,
    clearMessages,
    clearPersistedMiddlewareSession,
    middlewareModeEnabled,
    replaceMessages,
    resetExtractedInfo,
    resetConsultationInfo,
    resetSessionContext,
    setConsultationInfo,
    setSessionContext,
    updateExtractedInfo,
  ])

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

  const applyConsultationExtraction = (userMessage: string) => {
    const newInfo = extractConsultationInfo(userMessage)
    const info = mergeConsultationInfo(consultationInfo, newInfo)
    setConsultationInfo(info)
    updateExtractedInfo(consultationInfoToCaseProfile(info))

    return { info, newInfo }
  }

  const ensureMiddlewareSession = async () => {
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
  }

  const getAssistantResponseFromMiddleware = async (userMessage: string) => {
    applyConsultationExtraction(userMessage)

    const { sessionId, anonymousToken } = await ensureMiddlewareSession()
    const locale = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'zh-CN'
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
      toolEvents: [],
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
          setDisplayText(streamedResponseRef.current)
          setSessionContext((prev) => ({
            streamSeq: typeof seq === 'number' ? seq : prev.streamSeq,
          }))
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
                createdAt: Date.now(),
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
          const cardPayload = payload.card_payload && typeof payload.card_payload === 'object'
            ? payload.card_payload as Record<string, unknown>
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
              .findIndex((event) => event.toolName === toolName && event.status === 'started')

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
                createdAt: Date.now(),
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
          const finishReason = typeof payload.finish_reason === 'string' ? payload.finish_reason : undefined
          const ruleVersion = typeof payload.rule_version === 'string' ? payload.rule_version : undefined
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

    const finalText = streamedResponseRef.current.trim() || finalSummary || '抱歉，本次未生成有效回复，请重试。'
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
  }

  // 发送消息
  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content || isThinking) return

    addMessage({ role: 'user', content })
    setInputValue('')
    requestAnimationFrame(() => {
      resizeTextarea()
    })
    setIsThinking(true)

    try {
      if (!middlewareModeEnabled) {
        throw new Error('当前版本仅支持中间件驱动咨询，请开启 NEXT_PUBLIC_ENABLE_MIDDLEWARE_CHAT=true。')
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
  }

  // 语音切换
  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // 键盘发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setUnreadCount(0)
  }

  const toggleDesktopSidebar = () => {
    if (sidebarPanelRef.current?.isCollapsed()) {
      sidebarPanelRef.current.expand()
      return
    }

    sidebarPanelRef.current?.collapse()
  }

  const copySidebarSummary = async () => {
    const exportText = [
      '案件摘要',
      conversationSummary,
      '',
      '会话状态',
      ...sessionFacts.map((item) => `- ${item}`),
      '',
      '关键内容',
      ...keyFacts.map((item) => `- ${item}`),
      '',
      '工具执行',
      ...(sessionContext.toolEvents.length > 0
        ? sessionContext.toolEvents.map(
            (item) => `- ${humanizeToolName(item.toolName)}：${item.status === 'completed' ? item.summary || '已完成' : '处理中'}`,
          )
        : ['- 暂无工具调用记录']),
      '',
      '法律依据',
      ...(verifiedReferences.length > 0
        ? verifiedReferences.map((item) => `- ${item.title || '未命名引用'}${item.url ? ` (${item.url})` : ''}`)
        : ['- 暂无已核验引用']),
      '',
      '案件时间线',
      ...timelineItems.map((item) => `- ${item.title}：${item.detail}`),
      '',
      '证据与材料待办',
      ...checklistItems.map((item) => `- ${item.title}：${item.detail}`),
      '',
      `流程状态：${processStage.label} - ${processStage.hint}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(exportText)
      setSummaryCopied(true)
      window.setTimeout(() => setSummaryCopied(false), 1600)
    } catch (error) {
      console.error('Failed to copy summary:', error)
    }
  }

  const copyArbitrationPackage = async () => {
    const packageText = [
      '仲裁材料包',
      `案件状态：${processStage.label}`,
      '',
      '会话信息',
      ...sessionFacts.map((item) => `- ${item}`),
      '',
      '案件摘要',
      conversationSummary,
      '',
      '关键事实',
      ...keyFacts.map((item) => `- ${item}`),
      '',
      '法律依据',
      ...(verifiedReferences.length > 0
        ? verifiedReferences.map((item) => `- ${item.title || '未命名引用'}${item.snippet ? `：${item.snippet}` : ''}${item.url ? ` (${item.url})` : ''}`)
        : ['- 当前轮次暂无已核验引用']),
      '',
      '时间线',
      ...timelineItems.map((item) => `- ${item.title}：${item.detail}`),
      '',
      '建议准备材料',
      '- 身份证复印件',
      '- 劳动合同或入职证明',
      '- 工资流水或薪资证明',
      '- 聊天记录、邮件、录音等沟通证据',
      '- 考勤、工牌、工作安排截图',
      '- 离职通知或辞退说明',
      consultationInfo.evidence.length > 0
        ? `- 当前已记录证据：${consultationInfo.evidence.join('、')}`
        : '- 当前证据尚需补齐',
      '',
      '待办清单',
      ...checklistItems.map((item) => `- ${item.title}：${item.detail}`),
      '',
      `流程指导：${processStage.hint}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(packageText)
      setPackageCopied(true)
      window.setTimeout(() => setPackageCopied(false), 1600)
    } catch (error) {
      console.error('Failed to copy arbitration package:', error)
    }
  }

  const handleCardAction = async (action: string, payload: Record<string, unknown>) => {
    try {
      if (action === 'copy_document' || action === 'copy_referral' || action === 'copy_summary') {
        const text = JSON.stringify(payload, null, 2)
        await navigator.clipboard.writeText(text)
        return
      }

      if (action === 'download_document') {
        const content = typeof payload.content === 'string' ? payload.content : JSON.stringify(payload, null, 2)
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'laborlawhelp-document.txt'
        a.click()
        URL.revokeObjectURL(url)
        return
      }

      if (action === 'book_lawyer') {
        setInputValue('我想预约律师咨询，请帮我生成预约摘要。')
        requestAnimationFrame(() => {
          resizeTextarea()
          inputRef.current?.focus()
        })
      }
    } catch (error) {
      console.error('card action failed:', error)
    }
  }

  const headerClass = isCompactLandscape ? 'px-3 py-2.5' : 'px-4 py-3 md:px-6 md:py-4'
  const contentMaxWidth = isWideScreen ? 'max-w-4xl' : 'max-w-3xl'
  const bubbleTextClass = isCompactLandscape ? 'text-[13px] leading-5' : 'text-sm leading-relaxed'
  const bubblePaddingClass = isCompactLandscape ? 'px-3 py-2.5' : 'px-4 py-3'
  const avatarClass = isCompactLandscape ? 'w-7 h-7' : 'w-8 h-8'
  const buttonSizeClass = isCompactLandscape ? 'h-9 w-9' : 'h-10 w-10 md:h-11 md:w-11'
  const baseBottomClass = isCompactLandscape ? 'bottom-1.5' : isLandscape ? 'bottom-2' : 'bottom-3 md:bottom-4'
  const keyboardLiftClass =
    keyboardInset > 360
      ? '-translate-y-[22rem]'
      : keyboardInset > 300
        ? '-translate-y-[18rem]'
        : keyboardInset > 240
          ? '-translate-y-[14rem]'
          : keyboardInset > 160
            ? '-translate-y-[10rem]'
            : keyboardInset > 80
              ? '-translate-y-[6rem]'
              : 'translate-y-0'
  const scrollPaddingClass = isCompactLandscape
    ? 'pb-40'
    : composerHeight > 250
      ? 'pb-[25rem] md:pb-[22rem]'
      : composerHeight > 210
        ? 'pb-[22rem] md:pb-[20rem]'
        : 'pb-[19rem] md:pb-[17rem]'
  const showUnreadBadge = unreadCount > 0

  const renderConversation = (layout: 'mobile' | 'desktop') => {
    const gapClass = layout === 'desktop' ? 'gap-4' : isCompactLandscape ? 'gap-2' : 'gap-3'
    const messageWidthClass = layout === 'desktop' ? 'max-w-[72%]' : isWideScreen ? 'max-w-[62%]' : 'max-w-[82%]'
    const avatarSizeClass = layout === 'desktop' ? 'w-9 h-9' : avatarClass
    const assistantIconClass = layout === 'desktop' ? 'w-4.5 h-4.5' : isCompactLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4'
    const textClass = layout === 'desktop' ? 'text-[15px] leading-7' : bubbleTextClass
    const bubbleClass = layout === 'desktop' ? 'px-5 py-4' : bubblePaddingClass
    const thinkingTextClass = layout === 'desktop' ? 'text-sm' : isCompactLandscape ? 'text-xs' : 'text-sm'
    return (
      <>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${gapClass} ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className={`${avatarSizeClass} rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0`}>
                <Bot className={`${assistantIconClass} text-blue-600`} />
              </div>
            )}
            <div
              className={`${messageWidthClass} rounded-2xl ${bubbleClass} ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
              }`}
            >
              <div
                className={`${textClass} whitespace-normal break-words [word-break:break-word] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_li]:last:mb-0 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:font-semibold [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:px-3 [&_pre]:py-2 [&_pre]:font-mono [&_pre]:text-[0.92em] [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:px-2 [&_td]:py-1 ${
                  message.role === 'user'
                    ? '[&_a]:text-white [&_a]:underline [&_blockquote]:border-white/50 [&_pre]:bg-blue-700/70 [&_code]:bg-blue-700/70 [&_th]:border-white/30 [&_td]:border-white/30'
                    : '[&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-slate-300 [&_pre]:bg-slate-100 [&_code]:bg-slate-100 [&_th]:border-slate-300 [&_td]:border-slate-300'
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              </div>
            </div>
            {message.role === 'user' && (
              <div className={`${avatarSizeClass} rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0`}>
                <User className={`${assistantIconClass} text-slate-600`} />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className={`flex ${gapClass} justify-start`}>
            <div className={`${avatarSizeClass} rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0`}>
              <Bot className={`${assistantIconClass} text-blue-600`} />
            </div>
            <div className={`bg-white border border-slate-200 rounded-2xl rounded-tl-sm ${bubbleClass} shadow-sm min-h-[44px]`}>
              {displayText ? (
                <p className={`${textClass} whitespace-pre-wrap`}>
                  {displayText}
                  <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse" />
                </p>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <Bot className={`${assistantIconClass}`} />
                  <span className={thinkingTextClass}>正在思考...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {sessionContext.toolEvents.length > 0 && (
          <div className={`flex ${gapClass} justify-start`}>
            <div className={`${avatarSizeClass} rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0`}>
              <Bot className={`${assistantIconClass} text-blue-600`} />
            </div>
            <div className={messageWidthClass}>
              <ConsultationResultCards events={sessionContext.toolEvents} onAction={handleCardAction} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </>
    )
  }

  const collectedFieldCount = [
    consultationInfo.entryDate,
    consultationInfo.wage,
    consultationInfo.terminationMethod,
    consultationInfo.terminationReason,
    consultationInfo.contract,
    consultationInfo.evidence.length > 0,
    consultationInfo.previousAction,
  ].filter(Boolean).length

  const desktopMissingItems = [
    !consultationInfo.entryDate ? '入职时间' : null,
    !consultationInfo.wage ? '月工资' : null,
    !consultationInfo.terminationMethod ? '辞退方式' : null,
    !consultationInfo.evidence.length ? '证据' : null,
  ].filter((item): item is string => item !== null)

  const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')
  const latestToolEvent = sessionContext.toolEvents[sessionContext.toolEvents.length - 1] ?? null
  const verifiedReferences = sessionContext.finalPayload?.references ?? []
  const middlewareStatusLabel =
    sessionContext.status === 'streaming'
      ? '流式处理中'
      : sessionContext.status === 'initializing'
        ? '会话初始化'
        : sessionContext.status === 'error'
          ? '请求异常'
          : sessionContext.mode === 'middleware'
            ? '中间件会话'
            : '中间件未启用'

  const summarizeText = (text: string) => {
    const compactText = text.replace(/\s+/g, ' ').trim()
    if (compactText.length <= 96) return compactText
    return `${compactText.slice(0, 96)}...`
  }

  const conversationSummary = latestAssistantMessage
    ? summarizeText(sessionContext.finalPayload?.summary || latestAssistantMessage.content)
    : sessionContext.finalPayload?.summary || '等待系统生成会话总结。'

  const processStage = (() => {
    if (!consultationInfo.entryDate || !consultationInfo.wage || !consultationInfo.terminationMethod) {
      return {
        label: '信息收集中',
        hint: '继续补充入职时间、工资和辞退方式。',
      }
    }

    if (!consultationInfo.evidence.length) {
      return {
        label: '证据整理中',
        hint: '补齐证据后更适合进入赔偿测算。',
      }
    }

    if (!consultationInfo.previousAction) {
      return {
        label: '维权进度待确认',
        hint: '说明是否协商、仲裁过，便于判断下一步。',
      }
    }

    return {
      label: '可进入测算与方案',
      hint: '现在可以继续问赔偿、流程或律师建议。',
    }
  })()

  const keyFacts = [
    consultationInfo.entryDate ? `入职：${consultationInfo.entryDate}` : '入职时间未补充',
    consultationInfo.wage ? `工资：约 ${consultationInfo.wage} 元` : '工资未补充',
    consultationInfo.terminationMethod
      ? `辞退：${consultationInfo.terminationMethod === 'verbal' ? '口头通知' : '书面通知'}`
      : '辞退方式未补充',
    consultationInfo.evidence.length > 0 ? `证据：${consultationInfo.evidence.join('、')}` : '证据未补充',
    sessionContext.finalPayload?.ruleVersion ? `规则版本：${sessionContext.finalPayload.ruleVersion}` : '规则版本待返回',
    verifiedReferences.length
      ? `引用来源：${verifiedReferences.length} 条`
      : '引用来源待返回',
  ]

  const sessionFacts = [
    `运行模式：${sessionContext.mode === 'middleware' ? '中间件 + OpenHarness' : '本地回退'}`,
    `当前状态：${middlewareStatusLabel}`,
    `Case ID：${shortenId(sessionContext.caseId)}`,
    `Session ID：${shortenId(sessionContext.sessionId)}`,
    `Trace ID：${shortenId(sessionContext.traceId)}`,
    `流序号：${sessionContext.streamSeq || 0}`,
  ]

  const timelineItems = [
    {
      title: '当前提问',
      detail: latestUserMessage ? summarizeText(latestUserMessage.content) : '等待新的问题输入。',
      active: true,
    },
    {
      title: '入职时间',
      detail: consultationInfo.entryDate ? `已识别 ${consultationInfo.entryDate}` : '待补充入职时间。',
      active: Boolean(consultationInfo.entryDate),
    },
    {
      title: '辞退/离职',
      detail: consultationInfo.terminationMethod
        ? consultationInfo.terminationMethod === 'verbal'
          ? '已识别口头通知。'
          : '已识别书面通知。'
        : '待补充辞退方式。',
      active: Boolean(consultationInfo.terminationMethod),
    },
    {
      title: '证据情况',
      detail: consultationInfo.evidence.length > 0 ? `${consultationInfo.evidence.length} 项证据已记录。` : '待补充证据。',
      active: consultationInfo.evidence.length > 0,
    },
    {
      title: '维权进度',
      detail: consultationInfo.previousAction
        ? consultationInfo.previousAction === 'none'
          ? '尚未采取行动。'
          : consultationInfo.previousAction === 'negotiation'
            ? '已进入协商阶段。'
            : '已进入仲裁阶段。'
        : '待确认目前进度。',
      active: Boolean(consultationInfo.previousAction),
    },
  ]

  const checklistItems = [
    {
      title: '补充入职时间',
      detail: consultationInfo.entryDate ? `已记录 ${consultationInfo.entryDate}` : '建议明确到年月，便于计算在职时长。',
      done: Boolean(consultationInfo.entryDate),
    },
    {
      title: '确认月工资',
      detail: consultationInfo.wage ? `已记录约 ${consultationInfo.wage} 元` : '建议确认到手工资和工资结构。',
      done: Boolean(consultationInfo.wage),
    },
    {
      title: '整理证据材料',
      detail: consultationInfo.evidence.length > 0 ? `已记录 ${consultationInfo.evidence.length} 项证据` : '建议优先准备工资流水、聊天记录、考勤等。',
      done: consultationInfo.evidence.length > 0,
    },
    {
      title: '说明维权进度',
      detail: consultationInfo.previousAction
        ? consultationInfo.previousAction === 'none'
          ? '尚未采取行动。'
          : consultationInfo.previousAction === 'negotiation'
            ? '已协商过。'
            : '已进入仲裁。'
        : '建议说明是否找过公司、劳动监察或仲裁。',
      done: Boolean(consultationInfo.previousAction),
    },
  ]

  const hasMeaningfulInfo = collectedFieldCount > 0 || Boolean(latestUserMessage)

  return (
    <>
      <div className="hidden h-dvh lg:block bg-slate-50 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="h-dvh w-full">
          <ResizablePanel
            panelRef={sidebarPanelRef}
            collapsible
            collapsedSize="72px"
            defaultSize="28%"
            minSize="18%"
            maxSize="42%"
            onResize={(panelSize) => setIsSidebarCollapsed(panelSize.asPercentage <= 6)}
            className="min-w-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white"
          >
            <div className="flex h-full flex-col border-r border-white/10">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
                <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <span className="text-lg font-semibold">法</span>
                  </div>
                  {!isSidebarCollapsed && (
                    <div>
                      <h1 className="text-lg font-semibold tracking-wide">劳动维权助手</h1>
                      <p className="mt-1 text-xs text-slate-300">西安地区 · 桌面咨询模式</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={toggleDesktopSidebar}
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  aria-label={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
                >
                  {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {isSidebarCollapsed ? (
                  <div className="flex h-full flex-col items-center justify-between py-4 text-center">
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs text-slate-200 ring-1 ring-white/10">
                        {processStage.label}
                      </div>
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                        <span className="text-2xl font-semibold text-white">{collectedFieldCount}</span>
                        <span className="text-[11px] uppercase tracking-[0.25em]">facts</span>
                      </div>
                    </div>

                    <Button
                      onClick={toggleDesktopSidebar}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                      aria-label="展开侧边栏"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {!hasMeaningfulInfo && (
                      <>
                        <div className="rounded-3xl border border-sky-300/30 bg-sky-500/10 p-5 shadow-xl shadow-black/10">
                          <p className="text-sm font-medium text-slate-100">开始咨询引导</p>
                          <p className="mt-2 text-sm leading-6 text-slate-200">
                            你可以先描述劳动关系、工资、辞退方式。输入后我会自动提炼关键信息并生成流程建议。
                          </p>
                        </div>

                        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                          <p className="text-sm font-medium text-slate-100">建议优先补充</p>
                          <div className="space-y-2 text-sm text-slate-300">
                            <div className="rounded-2xl bg-white/5 px-4 py-3">1. 入职时间（例：2022年3月）</div>
                            <div className="rounded-2xl bg-white/5 px-4 py-3">2. 月工资（例：到手 8000 元）</div>
                            <div className="rounded-2xl bg-white/5 px-4 py-3">3. 辞退方式（口头/书面/突然不让上班）</div>
                          </div>
                        </div>

                        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                          <p className="text-sm font-medium text-slate-100">可直接发送示例</p>
                          <div className="space-y-2 text-sm leading-6 text-slate-300">
                            <div className="rounded-2xl bg-white/5 px-4 py-3">我 2023 年 2 月入职，月工资 9000，今天被口头辞退，能主张哪些赔偿？</div>
                            <div className="rounded-2xl bg-white/5 px-4 py-3">我有工资流水和聊天记录，下一步仲裁流程怎么走？</div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">案件进度</p>
                      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                        <div>
                          <p className="text-xs text-slate-300">已采集信息</p>
                          <p className="mt-1 text-2xl font-semibold text-white">{collectedFieldCount}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200 ring-1 ring-emerald-400/20">
                          {processStage.label}
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-300">{processStage.hint}</p>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">中间件会话</p>
                      <div className="grid gap-2 text-sm text-slate-300">
                        {sessionFacts.map((item) => (
                          <div key={item} className="rounded-2xl bg-white/5 px-4 py-3 leading-6">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100">工具执行轨迹</p>
                        {latestToolEvent && (
                          <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-slate-200">
                            最近：{humanizeToolName(latestToolEvent.toolName)}
                          </div>
                        )}
                      </div>
                      {sessionContext.toolEvents.length > 0 ? (
                        <div className="space-y-2">
                          {sessionContext.toolEvents.map((item) => (
                            <div key={`${item.createdAt}-${item.toolName}`} className="rounded-2xl bg-white/5 px-4 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-100">{humanizeToolName(item.toolName)}</p>
                                  <p className="mt-1 text-xs leading-6 text-slate-300">
                                    {item.status === 'completed' ? item.summary || '工具调用已完成' : '等待工具返回结果'}
                                  </p>
                                </div>
                                <div
                                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] ${
                                    item.status === 'completed'
                                      ? 'bg-emerald-500/15 text-emerald-200'
                                      : 'bg-amber-500/15 text-amber-100'
                                  }`}
                                >
                                  {item.status === 'completed' ? '已完成' : '处理中'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
                          当前轮次尚未返回工具调用记录。若触发 PKULaw 检索，这里会展示技能与检索轨迹。
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100">会话总结</p>
                        <Button
                          onClick={copySidebarSummary}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full border-white/15 bg-white/5 px-3 text-xs text-white hover:bg-white/10 hover:text-white"
                        >
                          {summaryCopied ? '已复制' : '复制摘要'}
                        </Button>
                      </div>
                      <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
                        {conversationSummary}
                      </p>
                      <div className="rounded-2xl bg-black/10 px-4 py-3 text-xs leading-6 text-slate-300">
                        最新诉求：{latestUserMessage ? summarizeText(latestUserMessage.content) : '等待用户输入。'}
                      </div>
                      <div className="rounded-2xl bg-black/10 px-4 py-3 text-xs leading-6 text-slate-300">
                        最新输出：{latestAssistantMessage ? summarizeText(latestAssistantMessage.content) : '等待系统回复。'}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100">法律依据引用</p>
                        <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-slate-200">
                          {verifiedReferences.length > 0 ? `${verifiedReferences.length} 条已核验` : '等待返回'}
                        </div>
                      </div>
                      {verifiedReferences.length > 0 ? (
                        <div className="space-y-2">
                          {verifiedReferences.map((item, index) => (
                            <div key={`${item.title || 'reference'}-${index}`} className="rounded-2xl bg-white/5 px-4 py-3">
                              <p className="text-sm font-medium text-slate-100">{item.title || '未命名引用'}</p>
                              {item.snippet && <p className="mt-1 text-xs leading-6 text-slate-300">{item.snippet}</p>}
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"
                                >
                                  查看原文
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
                          当前还没有已核验的法规或案例引用。完成 PKULaw 检索后，这里会展示标题、摘要和跳转链接。
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">案件时间线</p>
                      <div className="space-y-3">
                        {timelineItems.map((item, index) => (
                          <div key={item.title} className="flex gap-3">
                            <div className="flex flex-col items-center pt-1">
                              <span
                                className={`h-3 w-3 rounded-full ${
                                  item.active ? 'bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'bg-white/20'
                                }`}
                              />
                              {index < timelineItems.length - 1 && <span className="mt-2 h-full w-px bg-white/10" />}
                            </div>
                            <div className="flex-1 rounded-2xl bg-white/5 px-4 py-3">
                              <p className="text-sm font-medium text-slate-100">{item.title}</p>
                              <p className="mt-1 text-xs leading-6 text-slate-300">{item.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">证据与材料待办</p>
                      <div className="space-y-2">
                        {checklistItems.map((item) => (
                          <div
                            key={item.title}
                            className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                              item.done ? 'bg-emerald-500/10 text-emerald-200' : 'bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.done ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-inherit">{item.title}</p>
                                <p className="mt-1 text-xs leading-6 text-inherit/80">{item.detail}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100">仲裁材料包</p>
                        <Button
                          onClick={copyArbitrationPackage}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full border-white/15 bg-white/5 px-3 text-xs text-white hover:bg-white/10 hover:text-white"
                        >
                          {packageCopied ? '已复制' : '复制材料包'}
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm leading-6 text-slate-300">
                        <div className="rounded-2xl bg-white/5 px-4 py-3">一键汇总摘要、关键事实、时间线与待办清单。</div>
                        <div className="rounded-2xl bg-white/5 px-4 py-3">可直接发给律师，或作为仲裁申请前的准备稿。</div>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">关键内容</p>
                      <div className="space-y-2 text-sm text-slate-300">
                        {keyFacts.map((item) => (
                          <div key={item} className="rounded-2xl bg-white/5 px-4 py-3 leading-6">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">流程状态指导</p>
                      <div className="space-y-2 text-sm text-slate-300 leading-6">
                        {desktopMissingItems.length > 0 ? (
                          desktopMissingItems.map((item) => (
                            <div key={item} className="rounded-2xl bg-white/5 px-4 py-3">
                              请补充：{item}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-emerald-200">
                            关键信息较完整，可以继续问赔偿、流程或律师建议。
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10">
                      <p className="text-sm font-medium text-slate-100">推荐动作</p>
                      <div className="space-y-2 text-sm text-slate-300 leading-6">
                        <div className="rounded-2xl bg-white/5 px-4 py-3">补齐证据后，先看赔偿测算。</div>
                        <div className="rounded-2xl bg-white/5 px-4 py-3">确认仲裁时效，尽量不要拖延。</div>
                        <div className="rounded-2xl bg-white/5 px-4 py-3">复杂案件优先评估是否需要律师。</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isSidebarCollapsed && (
                <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-400">
                  本平台提供的信息仅供参考，不构成正式法律意见。
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="w-2 bg-slate-200/60 transition-colors hover:bg-blue-200/70" />

          <ResizablePanel defaultSize="72%" minSize="58%" className="min-w-0">
            <section className="flex h-full min-w-0 flex-col bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_36%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))]">
              <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/75 px-8 py-5 shadow-sm backdrop-blur-md">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">劳动维权咨询</h2>
                  <p className="mt-1 text-sm text-slate-500">桌面端专用布局 · 可拖拽侧边栏 · 动态会话摘要</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  在线咨询
                </div>
              </header>

              <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto overscroll-contain px-8 py-6 pb-8">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                  {renderConversation('desktop')}
                </div>

                <div
                  className={`pointer-events-none absolute right-8 bottom-32 transition-all duration-300 ease-out ${
                    showScrollToBottom ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-2 opacity-0'
                  }`}
                >
                  <div className="relative pointer-events-auto">
                    <Button
                      onClick={scrollToBottom}
                      size="icon"
                      className="h-11 w-11 rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50"
                      aria-label="一键到底"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                    {showUnreadBadge && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-blue-600 px-1 text-center text-[11px] leading-5 text-white shadow">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/80 bg-white/90 px-8 py-5 shadow-[0_-20px_50px_rgba(15,23,42,0.08)] backdrop-blur-md">
                <div ref={composerRef} className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
                    <div className="space-y-3">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value)
                          resizeTextarea(e.currentTarget)
                        }}
                        onKeyDown={handleKeyDown}
                        onInput={(e) => resizeTextarea(e.currentTarget)}
                        placeholder="输入您的问题，按 Enter 发送，Shift+Enter 换行"
                        className="min-h-[84px] max-h-[180px] w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] leading-7 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>输入框会自动增高，超过限制后支持内部滚动。</span>
                        {isListening && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-red-600">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            正在语音识别
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={toggleListening}
                        disabled={!isSupported}
                        variant={isListening ? 'destructive' : 'outline'}
                        size="icon"
                        className={`h-11 w-11 rounded-full transition-all ${
                          isListening ? 'border-red-500 bg-red-500 text-white hover:bg-red-600' : 'bg-white'
                        }`}
                      >
                        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>

                      <Button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isThinking}
                        size="icon"
                        className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="flex flex-col h-dvh bg-gradient-to-b from-slate-50 to-white overflow-hidden lg:hidden">
      {/* 顶部 */}
      <header className={`flex items-center justify-between ${headerClass} bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`${isCompactLandscape ? 'w-8 h-8' : 'w-9 h-9 md:w-10 md:h-10'} rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center`}>
            <span className={`${isCompactLandscape ? 'text-sm' : 'text-base md:text-lg'} text-white font-bold`}>法</span>
          </div>
          <div>
            <h1 className={`${isCompactLandscape ? 'text-sm' : 'text-base md:text-lg'} font-semibold text-slate-800`}>劳动维权助手</h1>
            <p className="text-xs text-slate-500">西安地区 · 智能咨询</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
            在线
          </span>
        </div>
      </header>

      {/* 消息区域 */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto overscroll-contain px-3 md:px-5 ${isCompactLandscape ? 'py-3' : 'py-5 md:py-6'} ${scrollPaddingClass}`}
      >
        <div className={`mx-auto ${isCompactLandscape ? 'space-y-3' : 'space-y-4'} ${contentMaxWidth}`}>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">当前会话</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{middlewareStatusLabel}</p>
                </div>
                {sessionContext.status === 'streaming' ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">
                    {sessionContext.mode === 'middleware' ? 'OpenHarness' : 'Local'}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Session {shortenId(sessionContext.sessionId)} · Trace {shortenId(sessionContext.traceId)}
              </p>
            </div>

            {(latestToolEvent || verifiedReferences.length > 0 || sessionContext.finalPayload?.summary) && (
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs text-slate-500">本轮结果</p>
                <p className="mt-1 text-sm leading-6 text-slate-800">
                  {sessionContext.finalPayload?.summary || sessionContext.lastToolResultSummary || '等待工具或最终摘要返回。'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  {latestToolEvent && (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {humanizeToolName(latestToolEvent.toolName)} · {latestToolEvent.status === 'completed' ? '已完成' : '处理中'}
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    引用 {verifiedReferences.length} 条
                  </span>
                  {sessionContext.finalPayload?.ruleVersion && (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {sessionContext.finalPayload.ruleVersion}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {renderConversation('mobile')}
        </div>
      </div>

      {/* 底部悬浮交互层（按钮与输入卡联动） */}
      <div className={`fixed left-0 right-0 z-40 px-3 md:px-5 pointer-events-none ${baseBottomClass} ${keyboardLiftClass} transition-transform duration-300 ease-out`}>
        <div className={`mx-auto ${contentMaxWidth}`}>
          <div className={`flex flex-col items-end ${isCompactLandscape ? 'gap-2' : 'gap-2.5 md:gap-3'}`}>
            <div className={`relative z-10 transition-all duration-300 ease-out ${
              showScrollToBottom ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
            }`}>
              <Button
                onClick={scrollToBottom}
                size="icon"
                className={`${isCompactLandscape ? 'h-9 w-9' : 'h-10 w-10'} rounded-full bg-white text-slate-600 border border-slate-200 shadow-lg hover:bg-slate-50`}
                aria-label="一键到底"
              >
                <ChevronDown className={isCompactLandscape ? 'h-4 w-4' : 'h-5 w-5'} />
              </Button>
              {showUnreadBadge && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] leading-5 px-1 text-center shadow">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            <div ref={composerRef} className={`w-full pointer-events-auto relative rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md ${isCompactLandscape ? 'px-2.5 py-2.5' : 'px-3 py-3 md:px-4 md:py-4'} shadow-xl shadow-slate-300/40`}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                resizeTextarea(e.currentTarget)
              }}
              onKeyDown={handleKeyDown}
              onInput={(e) => resizeTextarea(e.currentTarget)}
              placeholder="输入您的问题，或点击麦克风语音输入..."
              className={`w-full resize-none rounded-xl border border-slate-300 bg-slate-50 ${isCompactLandscape ? 'px-3 py-2.5 text-[13px] leading-5 min-h-[44px] max-h-[130px]' : 'px-4 py-3 text-sm md:text-base leading-6 min-h-[56px] max-h-[220px]'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              rows={1}
            />

            <div className={`mt-2 flex items-center justify-end ${isCompactLandscape ? 'gap-1.5' : 'gap-2'}`}>
              {isListening && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
              <Button
                onClick={toggleListening}
                disabled={!isSupported}
                variant={isListening ? 'destructive' : 'outline'}
                size="icon"
                className={`${buttonSizeClass} rounded-full transition-all ${
                  isListening ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : 'bg-white'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4 md:h-5 md:w-5" /> : <Mic className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>

              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isThinking}
                size="icon"
                className={`${buttonSizeClass} rounded-full bg-blue-600 hover:bg-blue-700`}
              >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
