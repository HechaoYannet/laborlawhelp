'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type {
  CaseProfile,
  DialogueMessage,
} from '@/lib/types'
import {
  createEmptyConsultationInfo,
  type ConsultationInfo,
} from '@/features/consultation/services/consultation-profile'

function createMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `msg_${crypto.randomUUID()}`
  }

  return `msg_${Date.now()}`
}

export type SessionRuntimeStatus = 'idle' | 'initializing' | 'active' | 'streaming' | 'error'
export type ConsultationRuntimeMode = 'local' | 'middleware'
export type BackendSessionStatus = 'active' | 'ended' | 'expired'

export interface SessionStreamError {
  code: string
  message: string
  retryable: boolean
}

export interface SessionReference {
  title?: string
  url?: string
  snippet?: string
}

export interface SessionToolEvent {
  toolName: string
  status: 'started' | 'completed'
  summary?: string
  references: SessionReference[]
  cardType?: string
  cardTitle?: string
  cardPayload?: Record<string, unknown>
  cardActions?: Array<{ action: string; label: string }>
  traceId?: string
  createdAt: number
  turnId?: number
}

export interface SessionFinalPayload {
  summary?: string
  references: SessionReference[]
  ruleVersion?: string
  finishReason?: string
  traceId?: string
}

export interface SessionContextState {
  caseId: string | null
  sessionId: string | null
  sessionStatus: BackendSessionStatus | null
  anonymousToken: string | null
  currentMessageId: string | null
  isStreaming: boolean
  streamSeq: number
  traceId: string | null
  status: SessionRuntimeStatus
  mode: ConsultationRuntimeMode
  lastToolName: string | null
  lastToolResultSummary: string | null
  toolEvents: SessionToolEvent[]
  finalPayload: SessionFinalPayload | null
  lastError: SessionStreamError | null
}

const initialSessionContext: SessionContextState = {
  caseId: null,
  sessionId: null,
  sessionStatus: null,
  anonymousToken: null,
  currentMessageId: null,
  isStreaming: false,
  streamSeq: 0,
  traceId: null,
  status: 'idle',
  mode: 'local',
  lastToolName: null,
  lastToolResultSummary: null,
  toolEvents: [],
  finalPayload: null,
  lastError: null,
}

type SessionContextUpdater =
  | Partial<SessionContextState>
  | ((prev: SessionContextState) => Partial<SessionContextState>)

interface CaseStoreContextType {
  messages: DialogueMessage[]
  extractedInfo: Partial<CaseProfile>
  consultationInfo: ConsultationInfo
  sessionContext: SessionContextState
  addMessage: (message: Omit<DialogueMessage, 'id' | 'timestamp'>) => void
  replaceMessages: (messages: DialogueMessage[]) => void
  clearMessages: () => void
  updateExtractedInfo: (info: Partial<CaseProfile>) => void
  setConsultationInfo: (info: ConsultationInfo) => void
  setSessionContext: (updates: SessionContextUpdater) => void
  resetSessionContext: () => void
  resetConsultationInfo: () => void
  resetExtractedInfo: () => void
}

const CaseStoreContext = createContext<CaseStoreContextType | null>(null)

export function CaseStoreProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<DialogueMessage[]>([])
  const [extractedInfo, setExtracted] = useState<Partial<CaseProfile>>({})
  const [consultationInfo, setConsultationInfoState] = useState<ConsultationInfo>(createEmptyConsultationInfo())
  const [sessionContext, setSessionContextState] = useState<SessionContextState>(initialSessionContext)

  const addMessage = useCallback((message: Omit<DialogueMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      {
        ...message,
        id: createMessageId(),
        timestamp: Date.now(),
      },
    ])
  }, [])

  const replaceMessages = useCallback((nextMessages: DialogueMessage[]) => {
    setMessages(nextMessages)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const updateExtractedInfo = useCallback((info: Partial<CaseProfile>) => {
    setExtracted(prev => ({ ...prev, ...info }))
  }, [])

  const setConsultationInfo = useCallback((info: ConsultationInfo) => {
    setConsultationInfoState(info)
  }, [])

  const setSessionContext = useCallback((updates: SessionContextUpdater) => {
    setSessionContextState(prev => {
      const next = {
        ...prev,
        ...(typeof updates === 'function' ? updates(prev) : updates),
      }
      // toolEvents 上限 50 条，超出时截断最早条目
      if (next.toolEvents.length > 50) {
        next.toolEvents = next.toolEvents.slice(-50)
      }
      return next
    })
  }, [])

  const resetSessionContext = useCallback(() => {
    setSessionContextState(initialSessionContext)
  }, [])

  const resetConsultationInfo = useCallback(() => {
    setConsultationInfoState(createEmptyConsultationInfo())
  }, [])

  const resetExtractedInfo = useCallback(() => {
    setExtracted({})
  }, [])

  const value: CaseStoreContextType = {
    messages,
    extractedInfo,
    consultationInfo,
    sessionContext,
    addMessage,
    replaceMessages,
    clearMessages,
    updateExtractedInfo,
    setConsultationInfo,
    setSessionContext,
    resetSessionContext,
    resetConsultationInfo,
    resetExtractedInfo,
  }

  return <CaseStoreContext.Provider value={value}>{children}</CaseStoreContext.Provider>
}

export function useCaseStore() {
  const context = useContext(CaseStoreContext)
  if (!context) {
    throw new Error('useCaseStore must be used within CaseStoreProvider')
  }
  return context
}
