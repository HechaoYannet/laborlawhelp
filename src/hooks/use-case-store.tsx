'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type {
  CaseProfile,
  FactTimeline,
  CalculationResult,
  DocumentContent,
  CaseTriagResult,
  LawyerProfile,
  DialogueMessage,
  DialogueStage,
  TimelineEvent,
} from '@/lib/types'

// 初始空案情
const initialCaseProfile: CaseProfile = {
  applicant: { name: '' },
  respondent: { name: '' },
  laborRelation: { startDate: '', duration: 0, contractStatus: 'unknown' },
  wageInfo: { monthlySalary: 0, salaryStructure: [], paymentStatus: 'normal' },
  socialSecurity: { status: 'unknown' },
  termination: { way: 'unknown', reason: 'unknown' },
  disputeTypes: [],
  evidence: [],
  disputePhase: 'none',
}

const initialTimeline: FactTimeline = { events: [], currentPhase: 'none' }

function createMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `msg_${crypto.randomUUID()}`
  }

  return `msg_${Date.now()}`
}

interface CaseStoreContextType {
  // State
  caseProfile: CaseProfile
  timeline: FactTimeline
  calculationResult: CalculationResult | null
  documents: DocumentContent[]
  分流结果: CaseTriagResult | null
  recommendedLawyers: LawyerProfile[]
  messages: DialogueMessage[]
  currentStage: DialogueStage
  extractedInfo: Partial<CaseProfile>
  
  // Actions
  updateCaseProfile: (updates: Partial<CaseProfile>) => void
  updateApplicant: (info: Partial<CaseProfile['applicant']>) => void
  updateRespondent: (info: Partial<CaseProfile['respondent']>) => void
  updateLaborRelation: (info: Partial<CaseProfile['laborRelation']>) => void
  updateWageInfo: (info: Partial<CaseProfile['wageInfo']>) => void
  updateTermination: (info: Partial<CaseProfile['termination']>) => void
  updateSocialSecurity: (info: Partial<CaseProfile['socialSecurity']>) => void
  addDisputeType: (type: CaseProfile['disputeTypes'][number]) => void
  removeDisputeType: (type: CaseProfile['disputeTypes'][number]) => void
  addEvidence: (evidence: CaseProfile['evidence'][number]) => void
  addTimelineEvent: (event: TimelineEvent) => void
  setTimelinePhase: (phase: FactTimeline['currentPhase']) => void
  setCalculationResult: (result: CalculationResult) => void
  addDocument: (doc: DocumentContent) => void
  removeDocument: (type: DocumentContent['type']) => void
  set分流结果: (result: CaseTriagResult) => void
  setRecommendedLawyers: (lawyers: LawyerProfile[]) => void
  addMessage: (message: Omit<DialogueMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  setCurrentStage: (stage: DialogueStage) => void
  updateExtractedInfo: (info: Partial<CaseProfile>) => void
  resetExtractedInfo: () => void
  resetAll: () => void
}

const CaseStoreContext = createContext<CaseStoreContextType | null>(null)

export function CaseStoreProvider({ children }: { children: ReactNode }) {
  const [caseProfile, setCaseProfile] = useState<CaseProfile>(initialCaseProfile)
  const [timeline, setTimeline] = useState<FactTimeline>(initialTimeline)
  const [calculationResult, setCalcResult] = useState<CalculationResult | null>(null)
  const [documents, setDocuments] = useState<DocumentContent[]>([])
  const [分流结果, set分流] = useState<CaseTriagResult | null>(null)
  const [recommendedLawyers, setLawyers] = useState<LawyerProfile[]>([])
  const [messages, setMessages] = useState<DialogueMessage[]>([])
  const [currentStage, setStage] = useState<DialogueStage>('initial')
  const [extractedInfo, setExtracted] = useState<Partial<CaseProfile>>({})

  const updateCaseProfile = useCallback((updates: Partial<CaseProfile>) => {
    setCaseProfile(prev => ({ ...prev, ...updates }))
  }, [])

  const updateApplicant = useCallback((info: Partial<CaseProfile['applicant']>) => {
    setCaseProfile(prev => ({ ...prev, applicant: { ...prev.applicant, ...info } }))
  }, [])

  const updateRespondent = useCallback((info: Partial<CaseProfile['respondent']>) => {
    setCaseProfile(prev => ({ ...prev, respondent: { ...prev.respondent, ...info } }))
  }, [])

  const updateLaborRelation = useCallback((info: Partial<CaseProfile['laborRelation']>) => {
    setCaseProfile(prev => ({ ...prev, laborRelation: { ...prev.laborRelation, ...info } }))
  }, [])

  const updateWageInfo = useCallback((info: Partial<CaseProfile['wageInfo']>) => {
    setCaseProfile(prev => ({ ...prev, wageInfo: { ...prev.wageInfo, ...info } }))
  }, [])

  const updateTermination = useCallback((info: Partial<CaseProfile['termination']>) => {
    setCaseProfile(prev => ({ ...prev, termination: { ...prev.termination, ...info } }))
  }, [])

  const updateSocialSecurity = useCallback((info: Partial<CaseProfile['socialSecurity']>) => {
    setCaseProfile(prev => ({ ...prev, socialSecurity: { ...prev.socialSecurity, ...info } }))
  }, [])

  const addDisputeType = useCallback((type: CaseProfile['disputeTypes'][number]) => {
    setCaseProfile(prev => ({
      ...prev,
      disputeTypes: [...new Set([...prev.disputeTypes, type])],
    }))
  }, [])

  const removeDisputeType = useCallback((type: CaseProfile['disputeTypes'][number]) => {
    setCaseProfile(prev => ({
      ...prev,
      disputeTypes: prev.disputeTypes.filter(t => t !== type),
    }))
  }, [])

  const addEvidence = useCallback((evidence: CaseProfile['evidence'][number]) => {
    setCaseProfile(prev => ({
      ...prev,
      evidence: [...prev.evidence, evidence],
    }))
  }, [])

  const addTimelineEvent = useCallback((event: TimelineEvent) => {
    setTimeline(prev => ({
      ...prev,
      events: [...prev.events, event].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    }))
  }, [])

  const setTimelinePhase = useCallback((phase: FactTimeline['currentPhase']) => {
    setTimeline(prev => ({ ...prev, currentPhase: phase }))
  }, [])

  const setCalculationResult = useCallback((result: CalculationResult) => {
    setCalcResult(result)
  }, [])

  const addDocument = useCallback((doc: DocumentContent) => {
    setDocuments(prev => [...prev.filter(d => d.type !== doc.type), doc])
  }, [])

  const removeDocument = useCallback((type: DocumentContent['type']) => {
    setDocuments(prev => prev.filter(d => d.type !== type))
  }, [])

  const set分流结果Fn = useCallback((result: CaseTriagResult) => {
    set分流(result)
  }, [])

  const setRecommendedLawyers = useCallback((lawyers: LawyerProfile[]) => {
    setLawyers(lawyers)
  }, [])

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

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const setCurrentStage = useCallback((stage: DialogueStage) => {
    setStage(stage)
  }, [])

  const updateExtractedInfo = useCallback((info: Partial<CaseProfile>) => {
    setExtracted(prev => ({ ...prev, ...info }))
  }, [])

  const resetExtractedInfo = useCallback(() => {
    setExtracted({})
  }, [])

  const resetAll = useCallback(() => {
    setCaseProfile(initialCaseProfile)
    setTimeline(initialTimeline)
    setCalcResult(null)
    setDocuments([])
    set分流(null)
    setLawyers([])
    setMessages([])
    setStage('initial')
    setExtracted({})
  }, [])

  const value: CaseStoreContextType = {
    caseProfile,
    timeline,
    calculationResult,
    documents,
    分流结果,
    recommendedLawyers,
    messages,
    currentStage,
    extractedInfo,
    updateCaseProfile,
    updateApplicant,
    updateRespondent,
    updateLaborRelation,
    updateWageInfo,
    updateTermination,
    updateSocialSecurity,
    addDisputeType,
    removeDisputeType,
    addEvidence,
    addTimelineEvent,
    setTimelinePhase,
    setCalculationResult,
    addDocument,
    removeDocument,
    set分流结果: set分流结果Fn,
    setRecommendedLawyers,
    addMessage,
    clearMessages,
    setCurrentStage,
    updateExtractedInfo,
    resetExtractedInfo,
    resetAll,
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
