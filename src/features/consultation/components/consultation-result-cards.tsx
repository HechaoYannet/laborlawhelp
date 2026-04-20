'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SessionToolEvent } from '@/hooks/use-case-store'
import { DocumentPreviewPanel } from './document-preview-panel'
import { LawyerReferralPanel } from './lawyer-referral-panel'

interface ConsultationResultCardsProps {
  events: SessionToolEvent[]
  onAction?: (action: string, payload: Record<string, unknown>) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is Record<string, unknown> => isRecord(item))
}

function renderFactSummaryCard(event: SessionToolEvent, onAction?: (action: string, payload: Record<string, unknown>) => void) {
  const payload = event.cardPayload ?? {}
  const extractedFacts = isRecord(payload.extracted_facts) ? payload.extracted_facts : {}
  const disputeTypes = Array.isArray(payload.dispute_types) ? payload.dispute_types.filter((item): item is string => typeof item === 'string') : []
  const completeness = typeof payload.info_completeness === 'number' ? payload.info_completeness : null
  const missing = asArray(payload.missing_info)

  return (
    <Card className="border-sky-200/80 bg-sky-50/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-sky-900">{event.cardTitle || '要素抽取与案情摘要'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {event.summary ? <p className="text-xs leading-6 text-slate-600">{event.summary}</p> : null}

        {disputeTypes.length > 0 ? (
          <p className="rounded-lg bg-white p-3 text-xs text-slate-700">争议类型：{disputeTypes.join('、')}</p>
        ) : null}

        {completeness !== null ? (
          <p className="rounded-lg bg-white p-3 text-xs text-slate-700">信息完整度：{Math.round(completeness * 100)}%</p>
        ) : null}

        {isRecord(extractedFacts) ? (
          <pre className="max-h-44 overflow-auto rounded-lg bg-white p-3 text-xs leading-5 text-slate-700">
            {JSON.stringify(extractedFacts, null, 2)}
          </pre>
        ) : null}

        {missing.length > 0 ? (
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="mb-2 text-xs font-semibold text-amber-800">待补字段</p>
            <ul className="space-y-1 text-xs text-amber-700">
              {missing.map((item, index) => (
                <li key={`${index}-${String(item.field ?? '')}`}>• {String(item.label ?? item.field ?? '未知字段')}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {event.cardActions && event.cardActions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {event.cardActions.map((action) => (
              <Button
                key={action.action}
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-sky-300 bg-white text-sky-700 hover:bg-sky-100"
                onClick={() => onAction?.(action.action, payload)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function renderCompensationCard(event: SessionToolEvent, onAction?: (action: string, payload: Record<string, unknown>) => void) {
  const payload = event.cardPayload ?? {}
  const calculations = asArray(payload.calculations)
  const totalAmount = typeof payload.total_amount === 'number' ? payload.total_amount : null

  return (
    <Card className="border-rose-200/80 bg-rose-50/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-rose-900">{event.cardTitle || '测算赔偿项目'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {calculations.length > 0 ? (
          <div className="space-y-2">
            {calculations.map((item, index) => (
              <div key={`${index}-${String(item.item ?? '')}`} className="rounded-lg bg-white p-3">
                <p className="text-xs font-medium text-slate-800">{String(item.item ?? '计算项')}</p>
                <p className="mt-1 text-xs text-slate-600">公式：{String(item.formula ?? '-')}</p>
                <p className="mt-1 text-xs text-slate-600">金额：{String(item.amount ?? '-')}</p>
              </div>
            ))}
          </div>
        ) : null}

        {totalAmount !== null ? (
          <p className="rounded-lg bg-white p-3 text-sm font-semibold text-rose-700">合计：¥{totalAmount.toLocaleString()}</p>
        ) : null}

        {event.cardActions && event.cardActions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {event.cardActions.map((action) => (
              <Button
                key={action.action}
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-rose-300 bg-white text-rose-700 hover:bg-rose-100"
                onClick={() => onAction?.(action.action, payload)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function renderCard(event: SessionToolEvent, onAction?: (action: string, payload: Record<string, unknown>) => void) {
  if (!event.cardType || !event.cardPayload) {
    return null
  }

  if (event.cardType === 'fact_summary') {
    return renderFactSummaryCard(event, onAction)
  }

  if (event.cardType === 'compensation') {
    return renderCompensationCard(event, onAction)
  }

  if (event.cardType === 'lawyer_referral') {
    return <LawyerReferralPanel payload={event.cardPayload} actions={event.cardActions || []} onAction={onAction} />
  }

  return <DocumentPreviewPanel title={event.cardTitle || '文书生成'} payload={event.cardPayload} actions={event.cardActions || []} onAction={onAction} />
}

export function ConsultationResultCards({ events, onAction }: ConsultationResultCardsProps) {
  const completedCards = events.filter((event) => event.status === 'completed' && event.cardType && event.cardPayload)
  if (completedCards.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {completedCards.map((event) => (
        <div key={`${event.createdAt}-${event.toolName}-${event.cardType}`}>{renderCard(event, onAction)}</div>
      ))}
    </div>
  )
}
