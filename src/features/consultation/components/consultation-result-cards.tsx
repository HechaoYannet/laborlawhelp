'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SessionToolEvent } from '@/hooks/use-case-store'
import { cn } from '@/lib/utils'
import {
  BadgeDollarSign,
  CircleAlert,
  FileSearch,
  ScrollText,
  Sparkles,
  Users,
} from 'lucide-react'
import { DocumentPreviewPanel } from './document-preview-panel'
import { LawyerReferralPanel } from './lawyer-referral-panel'
import {
  FIELD_LABELS,
  VALUE_LABELS,
  normalizeKey,
  formatFieldLabel,
  formatValueLabel,
  formatCurrency,
  formatPercent,
  isRecord,
  asRecord,
  asArray,
  asStringArray,
  looksLikeJsonString,
  tryParseStructuredString,
  formatSummary,
} from '@/lib/consultation-constants'

interface ConsultationResultCardsProps {
  events: SessionToolEvent[]
  onAction?: (action: string, payload: Record<string, unknown>) => void
}

function renderValue(value: unknown, parentKey?: string): ReactNode {
  if (value === null || value === undefined || value === '') {
    return '--'
  }

  if (typeof value === 'string') {
    const parsed = tryParseStructuredString(value)
    if (parsed !== value) {
      return renderValue(parsed, parentKey)
    }

    return <span className="whitespace-pre-wrap break-words">{formatValueLabel(value)}</span>
  }

  if (typeof value === 'number') {
    if (/(amount|salary|wage|compensation|price|fee)$/i.test(parentKey ?? '')) {
      return formatCurrency(value)
    }
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '--'
    }

    if (value.every((item) => typeof item === 'string')) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={`${String(item)}-${index}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
            >
              {formatValueLabel(String(item))}
            </span>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-1.5">
        {value.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2"
          >
            {renderValue(item, parentKey)}
          </div>
        ))}
      </div>
    )
  }

  if (isRecord(value)) {
    return (
      <div className="space-y-1.5">
        {Object.entries(value).map(([key, entry]) => (
          <div
            key={key}
            className="rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2"
          >
            <div className="text-xs font-medium text-slate-500">{formatFieldLabel(key)}</div>
            <div className="mt-1 text-sm leading-6 text-slate-700">{renderValue(entry, key)}</div>
          </div>
        ))}
      </div>
    )
  }

  return String(value)
}

function formatDocumentTitle(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  return VALUE_LABELS[value.trim()] ?? value.trim()
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
        'group relative overflow-hidden border bg-white/96 py-0 backdrop-blur transition-all duration-300',
        'rounded-[26px] shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-black/5 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(15,23,42,0.12)]',
        'max-sm:rounded-xl max-sm:shadow-sm max-sm:ring-0 max-sm:hover:translate-y-0 max-sm:hover:shadow-sm',
        accentClassName,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-current/90 via-current/55 to-transparent opacity-85 max-sm:h-1" />

      <CardHeader className="gap-2 px-3 pb-2 pt-3 sm:gap-4 sm:px-5 sm:pb-4 sm:pt-5 md:px-6 max-sm:space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm',
                'h-9 w-9 sm:h-11 sm:w-11',
                chipClassName,
              )}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge
                  className={cn(
                    'rounded-full border font-semibold',
                    'px-2 py-0.5 text-[10px] sm:px-2.5 sm:py-1 sm:text-[11px]',
                    chipClassName,
                  )}
                  variant="outline"
                >
                  结构化结果
                </Badge>
                {meta}
              </div>
              <CardTitle className="mt-1.5 text-sm font-semibold leading-5 text-slate-950 sm:mt-2 sm:text-base sm:leading-6 md:text-lg">
                {title}
              </CardTitle>
            </div>
          </div>
        </div>

        {summary ? (
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 text-xs leading-5 text-slate-600 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
            {summary}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3 sm:space-y-4 sm:px-5 sm:pb-5 md:px-6 md:pb-6 max-sm:space-y-2.5">
        {children}

        {actions ? (
          <div className="border-t border-slate-200/80 pt-3 sm:pt-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">{actions}</div>
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
  value: ReactNode
  toneClassName?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white shadow-sm sm:rounded-2xl',
        'px-3 py-2 sm:px-4 sm:py-3',
        toneClassName,
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 sm:text-[11px]">
        {label}
      </p>
      <div className="mt-0.5 text-xs font-semibold text-slate-900 sm:mt-1 sm:text-sm md:text-base">
        {value}
      </div>
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
    <section className={cn('rounded-xl border border-slate-200/80 bg-slate-50/75 p-2.5 sm:rounded-2xl sm:p-4', toneClassName)}>
      <p className="text-xs font-semibold text-slate-900 sm:text-sm">{title}</p>
      <div className="mt-2 sm:mt-3">{children}</div>
    </section>
  )
}

function renderActions(
  actions: Array<{ action: string; label: string }> | undefined,
  payload: Record<string, unknown>,
  onAction?: (action: string, payload: Record<string, unknown>) => void,
  accentClassName?: string,
) {
  if (!actions?.length) {
    return null
  }

  return actions.map((action) => (
    <Button
      key={action.action}
      type="button"
      size="sm"
      variant="outline"
      className={cn(
        'h-8 rounded-full border bg-white text-xs text-slate-700 shadow-sm hover:bg-slate-50 sm:h-9 sm:px-4 sm:text-sm',
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
  const payload = asRecord(event.cardPayload)
  const extractedFacts = asRecord(payload.extracted_facts)
  const disputeTypes = asStringArray(payload.dispute_types)
  const completeness = typeof payload.info_completeness === 'number' ? payload.info_completeness : null
  const missing = asArray(payload.missing_info)
  const factEntries = Object.entries(extractedFacts).filter(([, value]) => value !== null && value !== '')

  return (
    <ResultCardShell
      title={event.cardTitle || '要素提取与案情摘要'}
      summary={formatSummary(event.summary)}
      accentClassName="border-sky-200/80 text-sky-600"
      chipClassName="border-sky-200 bg-sky-50 text-sky-700"
      icon={<FileSearch className="h-5 w-5" />}
      meta={
        completeness !== null ? (
          <Badge className="bg-sky-100 text-sky-700">完整度 {formatPercent(completeness)}</Badge>
        ) : null
      }
      actions={renderActions(
        event.cardActions,
        payload,
        onAction,
        'border-sky-200 text-sky-700 hover:bg-sky-50',
      )}
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        <MetricTile label="争议类型" value={disputeTypes.length > 0 ? disputeTypes.map(formatValueLabel).join(' / ') : '待补充'} />
        <MetricTile
          label="待补字段"
          value={missing.length > 0 ? `${missing.length} 项` : '较完整'}
          toneClassName={
            missing.length > 0
              ? 'border-amber-200/80 bg-amber-50/90'
              : 'border-emerald-200/80 bg-emerald-50/90'
          }
        />
      </div>

      {factEntries.length > 0 ? (
        <SectionBlock title="已识别关键信息">
          <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2 sm:gap-2">
            {factEntries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium text-slate-500 sm:text-xs">{formatFieldLabel(key)}</p>
                <div className="mt-0.5 text-xs leading-5 text-slate-800 sm:mt-1 sm:text-sm sm:leading-6">{renderValue(value, key)}</div>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {missing.length > 0 ? (
        <SectionBlock title="建议优先补充" toneClassName="border-amber-200/80 bg-amber-50/70">
          <div className="grid gap-1.5 sm:gap-2">
            {missing.map((item, index) => (
              <div
                key={`${index}-${String(item.field ?? item.label ?? '')}`}
                className="flex items-start gap-2 rounded-xl border border-amber-200/80 bg-white/85 px-3 py-2.5 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3"
              >
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 sm:h-4 sm:w-4" />
                <div>
                  <p className="text-xs font-medium text-slate-900 sm:text-sm">
                    {String(item.label ?? formatFieldLabel(String(item.field ?? '待补信息')))}
                  </p>
                  {typeof item.reason === 'string' && item.reason ? (
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-600 sm:mt-1 sm:text-xs sm:leading-5">{formatValueLabel(item.reason)}</p>
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
  const payload = asRecord(event.cardPayload)
  const calculations = asArray(payload.calculations)
  const totalAmount = typeof payload.total_amount === 'number' ? payload.total_amount : null

  return (
    <ResultCardShell
      title={event.cardTitle || '赔偿项目测算'}
      summary={formatSummary(event.summary)}
      accentClassName="border-rose-200/80 text-rose-600"
      chipClassName="border-rose-200 bg-rose-50 text-rose-700"
      icon={<BadgeDollarSign className="h-5 w-5" />}
      meta={
        totalAmount !== null ? (
          <Badge className="bg-rose-100 text-rose-700">预计总额 {formatCurrency(totalAmount)}</Badge>
        ) : null
      }
      actions={renderActions(
        event.cardActions,
        payload,
        onAction,
        'border-rose-200 text-rose-700 hover:bg-rose-50',
      )}
    >
      {totalAmount !== null ? (
        <div className="rounded-xl border border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(255,255,255,0.98))] px-4 py-3 shadow-sm sm:rounded-[24px] sm:px-5 sm:py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-rose-500 sm:text-xs">赔偿测算</p>
          <p className="mt-1 text-xl font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{formatCurrency(totalAmount)}</p>
          <p className="mt-0.5 text-xs text-slate-600 sm:mt-1 sm:text-sm">以下分项用于解释总额构成，便于继续追问或生成文书。</p>
        </div>
      ) : null}

      {calculations.length > 0 ? (
        <SectionBlock title="分项明细">
          <div className="grid gap-1.5 sm:gap-2.5">
            {calculations.map((item, index) => (
              <div
                key={`${index}-${String(item.item ?? '')}`}
                className="rounded-xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm sm:rounded-2xl sm:px-4 sm:py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                      {String(item.item ?? '计算项')}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:mt-1 sm:text-xs sm:leading-5">
                      {String(item.formula ?? '暂无公式说明')}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 sm:px-3 sm:py-1 sm:text-sm">
                    {typeof item.amount === 'number'
                      ? formatCurrency(item.amount)
                      : formatValueLabel(String(item.amount ?? '--'))}
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
  const payload = asRecord(event.cardPayload)
  const parties = asRecord(payload.parties)
  const applicant = asRecord(parties.applicant)
  const respondent = asRecord(parties.respondent)
  const employment = asRecord(payload.employment)
  const termination = asRecord(payload.termination)
  const dispute = asRecord(payload.dispute)
  const claims = asStringArray(dispute.claims)
  const compensationAmount =
    typeof dispute.compensation_amount === 'number' ? dispute.compensation_amount : null
  const summary = typeof dispute.summary === 'string' ? dispute.summary : ''
  const region = typeof payload.region === 'string' && payload.region ? payload.region : '待补充'
  const generatedAt = typeof payload.generated_at === 'string' ? payload.generated_at : null

  return (
    <ResultCardShell
      title={event.cardTitle || '案情摘要卡片'}
      summary={formatSummary(event.summary)}
      accentClassName="border-emerald-200/80 text-emerald-600"
      chipClassName="border-emerald-200 bg-emerald-50 text-emerald-700"
      icon={<ScrollText className="h-5 w-5" />}
      meta={
        compensationAmount !== null ? (
          <Badge className="bg-emerald-100 text-emerald-700">
            争议金额 {formatCurrency(compensationAmount)}
          </Badge>
        ) : null
      }
      actions={renderActions(
        event.cardActions,
        payload,
        onAction,
        'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
      )}
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:grid-cols-3">
        <MetricTile label="申请人" value={typeof applicant.name === 'string' && applicant.name ? applicant.name : '待补充'} />
        <MetricTile label="被申请人" value={typeof respondent.name === 'string' && respondent.name ? respondent.name : '待补充'} />
        <MetricTile label="地区" value={region} />
      </div>

      <SectionBlock title="劳动关系概览">
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3">
            <p className="text-[10px] font-medium text-slate-500 sm:text-xs">在职期间</p>
            <div className="mt-0.5 text-xs leading-5 text-slate-800 sm:mt-1 sm:text-sm sm:leading-6">{renderValue(employment.period, 'period')}</div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3">
            <p className="text-[10px] font-medium text-slate-500 sm:text-xs">岗位</p>
            <div className="mt-0.5 text-xs leading-5 text-slate-800 sm:mt-1 sm:text-sm sm:leading-6">{renderValue(employment.position, 'position')}</div>
          </div>
          {Object.keys(employment).length > 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 md:col-span-2">
              <p className="text-[10px] font-medium text-slate-500 sm:text-xs">劳动关系详情</p>
              <div className="mt-0.5 text-xs leading-5 text-slate-800 sm:mt-1 sm:text-sm sm:leading-6">{renderValue(employment, 'employment')}</div>
            </div>
          ) : null}
          {Object.keys(termination).length > 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 md:col-span-2">
              <p className="text-[10px] font-medium text-slate-500 sm:text-xs">解除 / 终止</p>
              <div className="mt-0.5 text-xs leading-5 text-slate-800 sm:mt-1 sm:text-sm sm:leading-6">{renderValue(termination, 'termination')}</div>
            </div>
          ) : null}
        </div>
      </SectionBlock>

      {summary ? (
        <SectionBlock title="争议摘要">
          <p className="text-xs leading-5 text-slate-700 sm:text-sm sm:leading-6">{summary}</p>
        </SectionBlock>
      ) : null}

      {claims.length > 0 ? (
        <SectionBlock title="当前诉求">
          <div className="grid gap-1.5 sm:gap-2">
            {claims.map((claim) => (
              <div
                key={claim}
                className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs leading-5 text-slate-700 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
              >
                {formatValueLabel(claim)}
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {generatedAt ? <p className="text-[11px] text-slate-500 sm:text-xs">生成时间：{generatedAt}</p> : null}
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

  const payload = asRecord(event.cardPayload)

  if (event.cardType === 'fact_summary') {
    return renderFactSummaryCard(event, onAction)
  }

  if (event.cardType === 'compensation') {
    return renderCompensationCard(event, onAction)
  }

  if (event.cardType === 'lawyer_referral') {
    return (
      <LawyerReferralPanel
        payload={payload}
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
      title={formatDocumentTitle(payload.document_type) || event.cardTitle || '文书生成'}
      payload={payload}
      actions={event.cardActions || []}
      onAction={onAction}
    />
  )
}

function getCardEventKey(event: SessionToolEvent) {
  return `${event.createdAt}-${event.toolName ?? 'unknown'}-${event.cardType ?? 'unknown'}`
}

function getCardTabLabel(event: SessionToolEvent, index: number) {
  if (event.cardTitle?.trim()) return event.cardTitle.trim()
  if (event.cardType === 'fact_summary') return '要素摘要'
  if (event.cardType === 'compensation') return '赔偿测算'
  if (event.cardType === 'lawyer_referral') return '律师推荐'
  if (event.cardType === 'case_summary') return '案情摘要'
  return `结果卡 ${index + 1}`
}

function getCardTabTone(event: SessionToolEvent) {
  if (event.cardType === 'fact_summary') {
    return {
      active: 'border-sky-300 bg-sky-50 text-sky-700 shadow-[0_10px_25px_rgba(14,165,233,0.14)]',
      idle: 'border-slate-200/80 bg-white/92 text-slate-500 hover:border-sky-200 hover:bg-sky-50/70 hover:text-sky-700',
      dot: 'bg-sky-500',
      glow: 'from-sky-200/70 via-sky-100/40 to-transparent',
      icon: <FileSearch className="h-3.5 w-3.5" />,
    }
  }

  if (event.cardType === 'compensation') {
    return {
      active: 'border-rose-300 bg-rose-50 text-rose-700 shadow-[0_10px_25px_rgba(244,63,94,0.14)]',
      idle: 'border-slate-200/80 bg-white/92 text-slate-500 hover:border-rose-200 hover:bg-rose-50/70 hover:text-rose-700',
      dot: 'bg-rose-500',
      glow: 'from-rose-200/70 via-rose-100/40 to-transparent',
      icon: <BadgeDollarSign className="h-3.5 w-3.5" />,
    }
  }

  if (event.cardType === 'lawyer_referral') {
    return {
      active: 'border-violet-300 bg-violet-50 text-violet-700 shadow-[0_10px_25px_rgba(139,92,246,0.14)]',
      idle: 'border-slate-200/80 bg-white/92 text-slate-500 hover:border-violet-200 hover:bg-violet-50/70 hover:text-violet-700',
      dot: 'bg-violet-500',
      glow: 'from-violet-200/70 via-violet-100/40 to-transparent',
      icon: <Users className="h-3.5 w-3.5" />,
    }
  }

  if (event.cardType === 'case_summary') {
    return {
      active: 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-[0_10px_25px_rgba(16,185,129,0.14)]',
      idle: 'border-slate-200/80 bg-white/92 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/70 hover:text-emerald-700',
      dot: 'bg-emerald-500',
      glow: 'from-emerald-200/70 via-emerald-100/40 to-transparent',
      icon: <ScrollText className="h-3.5 w-3.5" />,
    }
  }

  return {
    active: 'border-amber-300 bg-amber-50 text-amber-700 shadow-[0_10px_25px_rgba(245,158,11,0.14)]',
    idle: 'border-slate-200/80 bg-white/92 text-slate-500 hover:border-amber-200 hover:bg-amber-50/70 hover:text-amber-700',
    dot: 'bg-amber-500',
    glow: 'from-amber-200/70 via-amber-100/40 to-transparent',
    icon: <ScrollText className="h-3.5 w-3.5" />,
  }
}

export function ConsultationResultCards({ events, onAction }: ConsultationResultCardsProps) {
  const completedCards = useMemo(
    () =>
      events.filter(
        (event) => event.status === 'completed' && event.cardType && event.cardPayload,
      ),
    [events],
  )
  const [activeCardKey, setActiveCardKey] = useState<string | null>(null)

  useEffect(() => {
    if (completedCards.length === 0) {
      setActiveCardKey(null)
      return
    }

    setActiveCardKey(getCardEventKey(completedCards[completedCards.length - 1]!))
  }, [completedCards])

  if (completedCards.length === 0) {
    return null
  }

  const activeCard =
    completedCards.find((event) => getCardEventKey(event) === activeCardKey) ??
    completedCards[completedCards.length - 1]

  return (
    <div className="space-y-3 px-1 sm:space-y-4 sm:px-0">
      <div className="relative">
        <div className="relative flex items-center gap-1.5 px-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:gap-2 sm:px-1 sm:text-[11px]">
          <Sparkles className="h-3 w-3 text-blue-600 sm:h-3.5 sm:w-3.5" />
          结果卡片导航
        </div>
        <div className="relative mt-2 overflow-hidden rounded-full sm:mt-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-6 bg-gradient-to-r from-white via-white/95 to-transparent sm:w-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-l from-white via-white/95 to-transparent sm:w-10" />
          <div className="overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-4">
            <div className="flex min-w-max items-center gap-1.5 py-1 sm:gap-2">
              {completedCards.map((event, index) => {
                const tone = getCardTabTone(event)
                const cardKey = getCardEventKey(event)
                const isActive = cardKey === getCardEventKey(activeCard)
                const label = getCardTabLabel(event, index)

                return (
                  <button
                    key={`${cardKey}-${index}`}
                    type="button"
                    className={cn(
                      'group relative inline-flex shrink-0 items-center overflow-hidden border text-sm font-medium transition-[width,padding,background-color,border-color,color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 active:scale-[0.98]',
                      isActive
                        ? cn(
                            'h-9 justify-start gap-1.5 rounded-full px-3 py-2 sm:h-11 sm:gap-2 sm:px-4 sm:py-2.5',
                            'w-[clamp(6rem,36vw,14rem)] sm:w-[clamp(8rem,40vw,14rem)]',
                            tone.active,
                          )
                        : cn('h-8 w-8 justify-center rounded-full p-0 sm:h-10 sm:w-10', tone.idle),
                    )}
                    onClick={() => setActiveCardKey(cardKey)}
                    aria-pressed={isActive}
                    aria-label={label}
                    title={label}
                  >
                    <span
                      className={cn(
                        'relative z-10 flex items-center justify-center rounded-full border border-current/10 bg-white/85 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        isActive ? 'h-5 w-5 shrink-0 scale-100 sm:h-6 sm:w-6' : 'h-5 w-5 scale-90 sm:h-6 sm:w-6',
                      )}
                    >
                      {tone.icon}
                    </span>
                    {isActive ? (
                      <>
                        <span
                          className={cn(
                            'relative z-10 h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-2 sm:w-2',
                            tone.dot,
                            'scale-110 animate-in fade-in-0 zoom-in-75',
                          )}
                        />
                        <span className="relative z-10 min-w-0 truncate whitespace-nowrap text-xs sm:text-sm animate-in slide-in-from-left-2 fade-in-0 duration-300">
                          {label}
                        </span>
                      </>
                    ) : null}
                    <span
                      className={cn(
                        'pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r opacity-0 blur-xl transition-opacity duration-300',
                        tone.glow,
                        isActive ? 'opacity-100' : 'group-hover:opacity-70',
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        key={getCardEventKey(activeCard)}
        className="animate-in slide-in-from-bottom-3 fade-in-0 px-0 duration-300 sm:px-1.5"
      >
        {renderCard(activeCard, onAction)}
      </div>
    </div>
  )
}
