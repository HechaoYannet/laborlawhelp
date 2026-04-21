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

interface ConsultationResultCardsProps {
  events: SessionToolEvent[]
  onAction?: (action: string, payload: Record<string, unknown>) => void
}

const FIELD_LABELS: Record<string, string> = {
  action: '建议动作',
  action_hint: '处理建议',
  amount: '金额',
  applicant: '申请人',
  checklist: '下一步行动',
  claims: '当前诉求',
  company: '公司',
  compensation: '赔偿测算',
  compensation_amount: '争议金额',
  complex: '复杂程度',
  complexity: '复杂程度',
  content: '内容',
  dispute: '争议信息',
  dispute_types: '争议类型',
  document_type: '文书类型',
  employment: '劳动关系',
  end_date: '结束时间',
  evidence: '证据',
  extracted_facts: '已提取信息',
  field: '字段',
  formula: '计算公式',
  generated_at: '生成时间',
  info_completeness: '信息完整度',
  item: '项目',
  label: '标签',
  missing_evidence: '待补证据',
  missing_info: '待补信息',
  monthly_salary: '月工资',
  name: '名称',
  notice_date: '通知日期',
  period: '在职期间',
  position: '岗位',
  reason: '原因',
  recommended_lawyers: '推荐律师',
  region: '地区',
  respondent: '被申请人',
  risk_tags: '风险标签',
  salary: '工资',
  standard_evidence: '标准证据',
  start_date: '开始时间',
  summary: '摘要',
  termination: '解除 / 终止',
  total_amount: '总金额',
  urgency: '紧急程度',
  way: '方式',
  gender: '性别',
  start: '开始时间',
  end: '结束时间',
  monthly_wage_pretax: '税前月工资',
  monthly_wage_take_home: '税后月工资',
  has_written_contract: '是否签订书面合同',
  has_social_insurance: '是否缴纳社保',
  legal_references: '法律依据',
  retrieved_references: '检索结果',
}

const VALUE_LABELS: Record<string, string> = {
  oral_notice: '口头辞退',
  written_notice: '书面通知辞退',
  no_notice: '未提前通知',
  forced_resign: '被迫离职',
  negotiated: '协商解除',
  not_suitable: '不胜任工作',
  performance: '绩效不达标',
  organizational: '组织调整',
  business_loss: '经营困难',
  violation: '违纪违规',
  unknown: '待补充',
  simple: '低复杂度',
  moderate: '中复杂度',
  complex: '高复杂度',
  low: '低',
  medium: '中',
  high: '高',
  fact_summary: '要素摘要',
  compensation: '赔偿测算',
  lawyer_referral: '律师推荐',
  case_summary: '案情摘要',
  arbitration_application: '仲裁申请书',
  complaint_letter: '投诉信',
  evidence_checklist: '证据清单',
  legal_opinion: '法律意见',
  male: '男',
  female: '女',
  yes: '是',
  no: '否',
}

function normalizeKey(key: string) {
  return key
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => isRecord(item))
    : []
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function looksLikeJsonString(value: string) {
  const trimmed = value.trim()
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  )
}

function tryParseStructuredString(value: string): unknown {
  if (!looksLikeJsonString(value)) {
    return value
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function formatFieldLabel(key: string) {
  const normalizedKey = normalizeKey(key)

  if (FIELD_LABELS[key]) {
    return FIELD_LABELS[key]
  }

  if (FIELD_LABELS[normalizedKey]) {
    return FIELD_LABELS[normalizedKey]
  }

  const normalized = key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()

  if (!normalized) {
    return key
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatValueLabel(value: string) {
  const trimmed = value.trim()
  return VALUE_LABELS[trimmed] ?? VALUE_LABELS[normalizeKey(trimmed)] ?? trimmed
}

function formatSummary(summary?: string) {
  if (!summary) {
    return summary
  }

  const parsed = tryParseStructuredString(summary)
  if (parsed !== summary) {
    if (isRecord(parsed)) {
      const disputeTypes = asStringArray(parsed.dispute_types)
      const completeness =
        typeof parsed.info_completeness === 'number'
          ? formatPercent(parsed.info_completeness)
          : null
      const missingCount = Array.isArray(parsed.missing_info) ? parsed.missing_info.length : 0

      const summaryParts = [
        disputeTypes.length > 0 ? `争议类型：${disputeTypes.map(formatValueLabel).join(' / ')}` : null,
        completeness ? `完整度：${completeness}` : null,
        missingCount > 0 ? `待补信息：${missingCount} 项` : '信息较完整',
      ].filter((item): item is string => Boolean(item))

      return summaryParts.length > 0 ? summaryParts.join('；') : undefined
    }

    return undefined
  }

  const retrievedRefsMatch = summary.match(/^retrieved\s+(\d+)\s+legal reference\(s\)$/i)
  if (retrievedRefsMatch) {
    return `已检索到 ${retrievedRefsMatch[1]} 条法律依据`
  }

  return formatValueLabel(summary)
}

function formatCurrency(value: number | null) {
  return value === null ? '--' : `¥${value.toLocaleString('zh-CN')}`
}

function formatPercent(value: number | null) {
  return value === null ? '--' : `${Math.round(value * 100)}%`
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
        'group relative overflow-hidden rounded-[26px] border bg-white/96 py-0 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-black/5 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(15,23,42,0.12)]',
        accentClassName,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-current/90 via-current/55 to-transparent opacity-85" />

      <CardHeader className="gap-3 px-4 pb-3 pt-4 sm:gap-4 sm:px-5 sm:pb-4 sm:pt-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm',
                chipClassName,
              )}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                    chipClassName,
                  )}
                  variant="outline"
                >
                  结构化结果
                </Badge>
                {meta}
              </div>
              <CardTitle className="mt-2 text-base font-semibold leading-6 text-slate-950 md:text-lg">
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

      <CardContent className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-5 sm:pb-5 md:px-6 md:pb-6">
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
  value: ReactNode
  toneClassName?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm',
        toneClassName,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-semibold text-slate-900 md:text-base">{value}</div>
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
    <section className={cn('rounded-2xl border border-slate-200/80 bg-slate-50/75 p-3 sm:p-4', toneClassName)}>
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
      <div className="grid gap-2.5 min-[420px]:grid-cols-2">
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
          <div className="grid gap-2 min-[420px]:grid-cols-2">
            {factEntries.map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium text-slate-500">{formatFieldLabel(key)}</p>
                <div className="mt-1 text-sm leading-6 text-slate-800">{renderValue(value, key)}</div>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {missing.length > 0 ? (
        <SectionBlock title="建议优先补充" toneClassName="border-amber-200/80 bg-amber-50/70">
          <div className="grid gap-2">
            {missing.map((item, index) => (
              <div
                key={`${index}-${String(item.field ?? item.label ?? '')}`}
                className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-white/85 px-4 py-3"
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {String(item.label ?? formatFieldLabel(String(item.field ?? '待补信息')))}
                  </p>
                  {typeof item.reason === 'string' && item.reason ? (
                    <p className="mt-1 text-xs leading-5 text-slate-600">{formatValueLabel(item.reason)}</p>
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
        <div className="rounded-[24px] border border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(255,255,255,0.98))] px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-rose-500">赔偿测算</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(totalAmount)}</p>
          <p className="mt-1 text-sm text-slate-600">以下分项用于解释总额构成，便于继续追问或生成文书。</p>
        </div>
      ) : null}

      {calculations.length > 0 ? (
        <SectionBlock title="分项明细">
          <div className="grid gap-2.5">
            {calculations.map((item, index) => (
              <div
                key={`${index}-${String(item.item ?? '')}`}
                className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {String(item.item ?? '计算项')}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {String(item.formula ?? '暂无公式说明')}
                    </p>
                  </div>
                  <div className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
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
      <div className="grid gap-2.5 min-[420px]:grid-cols-2 md:grid-cols-3">
        <MetricTile label="申请人" value={typeof applicant.name === 'string' && applicant.name ? applicant.name : '待补充'} />
        <MetricTile label="被申请人" value={typeof respondent.name === 'string' && respondent.name ? respondent.name : '待补充'} />
        <MetricTile label="地区" value={region} />
      </div>

      <SectionBlock title="劳动关系概览">
        <div className="grid gap-2 min-[420px]:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">在职期间</p>
            <div className="mt-1 text-sm leading-6 text-slate-800">{renderValue(employment.period, 'period')}</div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">岗位</p>
            <div className="mt-1 text-sm leading-6 text-slate-800">{renderValue(employment.position, 'position')}</div>
          </div>
          {Object.keys(employment).length > 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm md:col-span-2">
              <p className="text-xs font-medium text-slate-500">劳动关系详情</p>
              <div className="mt-1 text-sm leading-6 text-slate-800">{renderValue(employment, 'employment')}</div>
            </div>
          ) : null}
          {Object.keys(termination).length > 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm md:col-span-2">
              <p className="text-xs font-medium text-slate-500">解除 / 终止</p>
              <div className="mt-1 text-sm leading-6 text-slate-800">{renderValue(termination, 'termination')}</div>
            </div>
          ) : null}
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
              <div
                key={claim}
                className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"
              >
                {formatValueLabel(claim)}
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {generatedAt ? <p className="text-xs text-slate-500">生成时间：{generatedAt}</p> : null}
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
  return `${event.createdAt}-${event.toolName}-${event.cardType ?? 'unknown'}`
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
    <div className="space-y-4 px-2 sm:px-0">
      <div className="relative">
        <div className="relative flex items-center gap-2 px-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:px-1">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          结果卡片导航
        </div>
        <div className="relative mt-3 overflow-hidden rounded-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-gradient-to-r from-white via-white/95 to-transparent sm:w-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-white via-white/95 to-transparent sm:w-10" />
          <div className="overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-4">
            <div className="flex min-w-max items-center gap-2 py-1">
              {completedCards.map((event, index) => {
                const tone = getCardTabTone(event)
                const cardKey = getCardEventKey(event)
                const isActive = cardKey === getCardEventKey(activeCard)
                const label = getCardTabLabel(event, index)

                return (
                  <button
                    key={cardKey}
                    type="button"
                    className={cn(
                      'group relative inline-flex shrink-0 items-center overflow-hidden border text-sm font-medium transition-[width,padding,background-color,border-color,color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 active:scale-[0.98]',
                      isActive
                        ? cn(
                            'h-10 w-[clamp(8rem,40vw,14rem)] justify-start gap-2 rounded-full px-3.5 py-2 sm:h-11 sm:px-4 sm:py-2.5',
                            tone.active,
                          )
                        : cn('h-9 w-9 justify-center rounded-full p-0 sm:h-10 sm:w-10', tone.idle),
                    )}
                    onClick={() => setActiveCardKey(cardKey)}
                    aria-pressed={isActive}
                    aria-label={label}
                    title={label}
                  >
                    <span
                      className={cn(
                        'relative z-10 flex items-center justify-center rounded-full border border-current/10 bg-white/85 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        isActive ? 'h-6 w-6 shrink-0 scale-100' : 'h-6 w-6 scale-90',
                      )}
                    >
                      {tone.icon}
                    </span>
                    {isActive ? (
                      <>
                        <span
                          className={cn(
                            'relative z-10 h-2 w-2 shrink-0 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                            tone.dot,
                            'scale-110 animate-in fade-in-0 zoom-in-75',
                          )}
                        />
                        <span className="relative z-10 min-w-0 truncate whitespace-nowrap animate-in slide-in-from-left-2 fade-in-0 duration-300">
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
        className="animate-in slide-in-from-bottom-3 fade-in-0 px-1.5 duration-300 sm:px-0"
      >
        {renderCard(activeCard, onAction)}
      </div>
    </div>
  )
}
