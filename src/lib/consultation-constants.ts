'use client'

export const FIELD_LABELS: Record<string, string> = {
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

export const VALUE_LABELS: Record<string, string> = {
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

export function normalizeKey(key: string) {
  return key
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase()
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

export function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => isRecord(item))
    : []
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

export function looksLikeJsonString(value: string) {
  const trimmed = value.trim()
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  )
}

export function tryParseStructuredString(value: string): unknown {
  if (!looksLikeJsonString(value)) {
    return value
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

export function formatFieldLabel(key: string) {
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

export function formatValueLabel(value: string) {
  const trimmed = value.trim()
  return VALUE_LABELS[trimmed] ?? VALUE_LABELS[normalizeKey(trimmed)] ?? trimmed
}

export function formatSummary(summary?: string) {
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

export function formatCurrency(value: number | null) {
  return value === null ? '--' : `¥${value.toLocaleString('zh-CN')}`
}

export function formatPercent(value: number | null) {
  return value === null ? '--' : `${Math.round(value * 100)}%`
}
