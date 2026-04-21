'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SessionToolEvent } from '@/hooks/use-case-store'
import { cn } from '@/lib/utils'
import {
  BadgeDollarSign,
  CircleAlert,
  FileSearch,
  Sparkles,
} from 'lucide-react'
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

function formatCurrency(value: number | null) {
  if (value === null) {
    return '--'
  }
  return `¥${value.toLocaleString('zh-CN')}`
}

function formatPercent(value: number | null) {
  if (value === null) {
    return '--'
  }
  return `${Math.round(value * 100)}%`
}

function ResultCardShell({
  title,
  summary,
  accentClassName,
  chipClassName,
  icon,
  meta,
  children,
  actions,
}: {
  title: string
  summary?: string
  accentClassName: string
  chipClassName: string
  icon: ReactNode
  meta?: ReactNode
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-[26px] border bg-white/96 py-0 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-black/5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(15,23,42,0.12)]',
        accentClassName,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-current/90 via-current/55 to-transparent opacity-85" />

      <CardHeader className="gap-4 px-5 pt-5 pb-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm', chipClassName)}>
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', chipClassName)} variant="outline">
                  工具结果
                </Badge>
                {meta}
              </div>
              <CardTitle className="mt-2 text-base leading-6 font-semibold text-slate-950 md:text-lg">
                {title}
              </CardTitle>
            </div>
          </div>
        </div>

        {summary ? (
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3 text-sm leading-6 text-slate-600">
            {summary}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-5 md:px-6 md:pb-6">
        {children}

        {actions ? (
          <div className="border-t border-slate-200/80 pt-4">
            <div className="flex flex-wrap gap-2">{actions}</div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function MetricTile({
  label,
  value,
  toneClassName,
}: {
  label: string
  value: string
  toneClassName?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm', toneClassName)}>
      <p className="text-[11px] font-medium tracking-[0.12em] text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 md:text-base">{value}</p>
    </div>
  )
}

function SectionBlock({
  title,
  toneClassName,
  children,
}: {
  title: string
  toneClassName?: string
  children: ReactNode
}) {
  return (
    <section className={cn('rounded-2xl border border-slate-200/80 bg-slate-50/75 p-4', toneClassName)}>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function renderActions(
  actions: Array<{ action: string; label: string }> | undefined,
  payload: Record<string, unknown>,
  onAction?: (action: string, payload: Record<string, unknown>) => void,
  accentClassName?: string,
) {
  if (!actions || actions.length === 0) {
    return null
  }

  return actions.map((action) => (
    <Button
      key={action.action}
      type="button"
      size="sm"
      variant="outline"
      className={cn(
        'h-9 rounded-full border bg-white px-4 text-sm text-slate-700 shadow-sm hover:bg-slate-50',
        accentClassName,
      )}
      onClick={() => onAction?.(action.action, payload)}
    >
      {action.label}
    </Button>
  ))
}

function renderFactSummaryCard(
  event: SessionToolEvent,
  onAction?: (action: string, payload: Record<string, unknown>) => void,
) {
  const payload = event.cardPayload ?? {}
  const extractedFacts = isRecord(payload.extracted_facts) ? payload.extracted_facts : {}
  const disputeTypes = Array.isArray(payload.dispute_types)
    ? payload.dispute_types.filter((item): item is string => typeof item === 'string')
    : []
  const completeness = typeof payload.info_completeness === 'number' ? payload.info_completeness : null
  const missing = asArray(payload.missing_info)
  // 展开对象内容，避免 [object Object] 展示
  function renderFactValue(val: unknown) {
    if (val === null || val === undefined) return '--'
    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        return val.map(renderFactValue).join('，')
      }
      // 展开对象的 key:value
      return (
        <div className="text-xs text-slate-700">
          {Object.entries(val as Record<string, unknown>).map(([k, v]) => (
            <div key={k}><span className="font-semibold">{k}：</span>{renderFactValue(v)}</div>
          ))}
        </div>
      )
    }
    return String(val)
  }
  const factEntries = Object.entries(extractedFacts).filter(([, value]) => value !== null && value !== '')

  return (
    <ResultCardShell
      title={event.cardTitle || '要素提取与案情摘要'}
      summary={event.summary}
      accentClassName="text-sky-600 border-sky-200/80"
      chipClassName="border-sky-200 bg-sky-50 text-sky-700"
      icon={<FileSearch className="h-5 w-5" />}
      meta={completeness !== null ? <Badge className="bg-sky-100 text-sky-700">完整度 {formatPercent(completeness)}</Badge> : null}
      actions={renderActions(event.cardActions, payload, onAction, 'border-sky-200 text-sky-700 hover:bg-sky-50')}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <MetricTile label="争议类型" value={disputeTypes.length > 0 ? disputeTypes.join(' / ') : '待补充'} />
        <MetricTile
          label="待补字段"
          value={missing.length > 0 ? `${missing.length} 项` : '已较完整'}
          toneClassName={missing.length > 0 ? 'bg-amber-50/90 border-amber-200/80' : 'bg-emerald-50/90 border-emerald-200/80'}
        />
      </div>

      {factEntries.length > 0 ? (
        <SectionBlock title="已识别关键信息">
          <div className="grid gap-2 md:grid-cols-2">
            {factEntries.map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium text-slate-500">{key}</p>
                <div className="mt-1 text-sm leading-6 text-slate-800">{renderFactValue(value)}</div>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {missing.length > 0 ? (
        <SectionBlock title="建议优先补充" toneClassName="border-amber-200/80 bg-amber-50/70">
          <div className="grid gap-2">
            {missing.map((item, index) => (
              <div key={`${index}-${String(item.field ?? '')}`} className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-white/85 px-4 py-3">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{String(item.label ?? item.field ?? '待补信息')}</p>
                  {typeof item.reason === 'string' && item.reason ? (
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.reason}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}
    </ResultCardShell>
  )
}

function renderCompensationCard(
  event: SessionToolEvent,
  onAction?: (action: string, payload: Record<string, unknown>) => void,
) {
  const payload = event.cardPayload ?? {}
  const calculations = asArray(payload.calculations)
  const totalAmount = typeof payload.total_amount === 'number' ? payload.total_amount : null

  return (
    <ResultCardShell
      title={event.cardTitle || '赔偿项目测算'}
      summary={event.summary}
      accentClassName="text-rose-600 border-rose-200/80"
      chipClassName="border-rose-200 bg-rose-50 text-rose-700"
      icon={<BadgeDollarSign className="h-5 w-5" />}
      meta={totalAmount !== null ? <Badge className="bg-rose-100 text-rose-700">预计总额 {formatCurrency(totalAmount)}</Badge> : null}
      actions={renderActions(event.cardActions, payload, onAction, 'border-rose-200 text-rose-700 hover:bg-rose-50')}
    >
      {totalAmount !== null ? (
        <div className="rounded-[24px] border border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(255,255,255,0.98))] px-5 py-4 shadow-sm">
          <p className="text-xs font-medium tracking-[0.14em] text-rose-500 uppercase">赔偿测算</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(totalAmount)}</p>
          <p className="mt-1 text-sm text-slate-600">以下分项用于解释总额组成，方便继续追问或生成文书。</p>
        </div>
      ) : null}

      {calculations.length > 0 ? (
        <SectionBlock title="分项明细">
          <div className="grid gap-3">
            {calculations.map((item, index) => (
              <div key={`${index}-${String(item.item ?? '')}`} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{String(item.item ?? '计算项')}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{String(item.formula ?? '暂无公式说明')}</p>
                  </div>
                  <div className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
                    {String(item.amount ?? '--')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}
    </ResultCardShell>
  )
}

function renderCaseSummaryCard(
  event: SessionToolEvent,
  onAction?: (action: string, payload: Record<string, unknown>) => void,
) {
  const payload = event.cardPayload ?? {}
  const parties = isRecord(payload.parties) ? payload.parties : {}
  const applicant = isRecord(parties.applicant) ? parties.applicant : {}
  const respondent = isRecord(parties.respondent) ? parties.respondent : {}
  const employment = isRecord(payload.employment) ? payload.employment : {}
  const termination = isRecord(payload.termination) ? payload.termination : {}
  const dispute = isRecord(payload.dispute) ? payload.dispute : {}
  const claims = Array.isArray(dispute.claims)
    ? dispute.claims.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
  const compensationAmount = typeof dispute.compensation_amount === 'number' ? dispute.compensation_amount : null
  const summary = typeof dispute.summary === 'string' ? dispute.summary : ''
  const region = typeof payload.region === 'string' ? payload.region : '待补充'
  const generatedAt = typeof payload.generated_at === 'string' ? payload.generated_at : null

  return (
    <ResultCardShell
      title={event.cardTitle || '案情摘要卡片'}
      summary={event.summary}
      accentClassName="text-emerald-600 border-emerald-200/80"
      chipClassName="border-emerald-200 bg-emerald-50 text-emerald-700"
      icon={<FileSearch className="h-5 w-5" />}
      meta={compensationAmount !== null ? <Badge className="bg-emerald-100 text-emerald-700">争议金额 {formatCurrency(compensationAmount)}</Badge> : null}
      actions={renderActions(event.cardActions, payload, onAction, 'border-emerald-200 text-emerald-700 hover:bg-emerald-50')}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MetricTile label="申请人" value={typeof applicant.name === 'string' && applicant.name ? applicant.name : '待补充'} />
        <MetricTile label="被申请人" value={typeof respondent.name === 'string' && respondent.name ? respondent.name : '待补充'} />
        <MetricTile label="地区" value={region} />
      </div>

      <SectionBlock title="劳动关系概览">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">在职期间</p>
            <div className="mt-1 text-sm leading-6 text-slate-800">{typeof employment.period === 'string' && employment.period ? employment.period : '待补充'}</div>
            {Object.keys(employment).length > 0 && typeof employment !== 'string' && (
              <div className="mt-1 text-xs text-slate-500">{Object.entries(employment).map(([k, v]) => (
                <div key={k}><span className="font-semibold">{k}：</span>{String(v)}</div>
              ))}</div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">岗位</p>
            <div className="mt-1 text-sm leading-6 text-slate-800">{typeof employment.position === 'string' && employment.position ? employment.position : '待补充'}</div>
          </div>
          {Object.keys(termination).length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-slate-500">解除/终止</p>
              <div className="mt-1 text-sm leading-6 text-slate-800">{Object.entries(termination).map(([k, v]) => (
                <div key={k}><span className="font-semibold">{k}：</span>{String(v)}</div>
              ))}</div>
            </div>
          )}
        </div>
      </SectionBlock>

      {summary ? (
        <SectionBlock title="争议摘要">
          <p className="text-sm leading-6 text-slate-700">{summary}</p>
        </SectionBlock>
      ) : null}

      {claims.length > 0 ? (
        <SectionBlock title="当前诉求">
          <div className="grid gap-2">
            {claims.map((claim) => (
              <div key={claim} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                {claim}
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {generatedAt ? (
        <p className="text-xs text-slate-500">生成时间：{generatedAt}</p>
      ) : null}
    </ResultCardShell>
  )
}

function renderCard(
  event: SessionToolEvent,
  onAction?: (action: string, payload: Record<string, unknown>) => void,
) {
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
    return (
      <LawyerReferralPanel
        payload={event.cardPayload}
        actions={event.cardActions || []}
        onAction={onAction}
      />
    )
  }

  if (event.cardType === 'case_summary') {
    return renderCaseSummaryCard(event, onAction)
  }

  return (
    <DocumentPreviewPanel
      title={typeof event.cardPayload.document_type === 'string' ? event.cardPayload.document_type : event.cardTitle || '文书生成'}
      payload={event.cardPayload}
      actions={event.cardActions || []}
      onAction={onAction}
    />
  )
}

export function ConsultationResultCards({ events, onAction }: ConsultationResultCardsProps) {
  // 卡片自动消失逻辑：只展示最后一轮的卡片
  const lastCardIndex = events.length > 0 ? events.length - 1 : -1
  const completedCards = events.filter(
    (event, idx) => event.status === 'completed' && event.cardType && event.cardPayload && idx === lastCardIndex,
  )

  if (completedCards.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1 text-xs font-medium tracking-[0.14em] text-slate-500 uppercase">
        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
        结构化结果卡片
      </div>
      <div className="grid gap-4">
        {completedCards.map((event) => (
          <div key={`${event.createdAt}-${event.toolName}-${event.cardType}`}>
            {renderCard(event, onAction)}
          </div>
        ))}
      </div>
    </div>
  )
}
