'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { BriefcaseBusiness, Calculator, FileText, FolderKanban, Copy, Check } from 'lucide-react'

type CardKey = 'summary' | 'calculation' | 'documents' | 'triage'

type DetailRow = {
  label: string
  value: string
}

type CardDefinition = {
  key: CardKey
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  badge: string
  rows: DetailRow[]
  highlights: string[]
  copyText: string
}

const CARD_DEFINITIONS: CardDefinition[] = [
  {
    key: 'summary',
    title: '要素抽取与案情摘要',
    subtitle: '把聊天叙述转换成结构化案情卡',
    icon: FolderKanban,
    badge: '步骤3',
    rows: [
      { label: '劳动关系起止', value: '2023.03-2025.04（约2年1个月）' },
      { label: '合同约定税前工资', value: '6,500元/月' },
      { label: '银行实发到手工资', value: '约5,600元/月（扣除个税及个人社保）' },
      { label: '劳动合同', value: '已签订书面劳动合同' },
      { label: '辞退方式', value: '主管口头通知，无书面通知，有微信截图' },
      { label: '辞退理由', value: '岗位调整/组织优化，未提供考核或违纪证据' },
      { label: '社保情况', value: '2025年3月至4月断缴' },
      { label: '交接/协议', value: '未办理交接，未签离职协议' },
      { label: '证据持有', value: '工资流水、工牌、打卡记录、微信辞退截图' },
    ],
    highlights: [
      '重点区分税前工资与到手工资，为陕西口径测算提供输入。',
      '零散叙述已整理成律师可直接接手的事实字段。',
    ],
    copyText: [
      '要素抽取与案情摘要',
      '劳动关系起止：2023.03-2025.04（约2年1个月）',
      '合同约定税前工资：6,500元/月',
      '银行实发到手工资：约5,600元/月（扣除个税及个人社保）',
      '劳动合同：已签订书面劳动合同',
      '辞退方式：口头通知，无书面，有微信截图',
      '辞退理由：岗位调整/组织优化，未见考核或违纪证据',
      '社保情况：2025年3月至4月断缴',
      '交接/协议：未办理交接，未签离职协议',
      '证据持有：工资流水、工牌、打卡记录、微信辞退截图',
    ].join('\n'),
  },
  {
    key: 'calculation',
    title: '测算赔偿项目',
    subtitle: '本地规则引擎按陕西到手工资口径计算',
    icon: Calculator,
    badge: '步骤4',
    rows: [
      { label: '工作年限', value: '2年1个月，按2.5个月补偿系数计算' },
      { label: '月工资基数（到手）', value: '5,600元（非税前6,500元）' },
      { label: '违法解除赔偿金', value: '5,600 x 2.5 x 2 = 28,000元' },
      { label: '税前口径对比', value: '6,500 x 2.5 x 2 = 32,500元，差额4,500元' },
      { label: '可另主张项目', value: '补缴2025年3月至4月社会保险' },
      { label: '仲裁时效提醒', value: '自知道或应当知道权利受侵害之日起1年内' },
    ],
    highlights: [
      '规则来源：劳动合同法第47条、第87条；陕高法〔2020〕118号第18条。',
      '金额属于测算值，不等于最终裁判结果。',
    ],
    copyText: [
      '测算赔偿项目（陕西口径）',
      '工作年限：2年1个月（按2.5个月）',
      '月工资基数：到手5,600元',
      '违法解除赔偿金：28,000元',
      '税前口径对比：32,500元，差额4,500元',
      '可另主张：补缴2025年3月至4月社保',
      '时效提醒：仲裁时效1年',
    ].join('\n'),
  },
  {
    key: 'documents',
    title: '文书生成',
    subtitle: '申请书草稿、证据目录、行动清单一并输出',
    icon: FileText,
    badge: '步骤5',
    rows: [
      { label: '仲裁申请书', value: '请求确认违法解除、赔偿28,000元、补缴2025年3月至4月社保' },
      { label: '证据目录（已持有）', value: '工资流水、劳动合同、工牌、打卡记录、微信辞退截图' },
      { label: '证据目录（建议补充）', value: '社保缴纳记录、工资条/工资明细、岗位调整通知' },
      { label: '行动清单1', value: '保全微信聊天记录（截图+录屏）' },
      { label: '行动清单2', value: '打印近12个月实发工资流水（到手金额）' },
      { label: '行动清单3', value: '在1年内提交仲裁申请' },
    ],
    highlights: [
      '文书为结构化字段填充，不依赖自由生成。',
      '请求事项明确标注陕西到手工资口径。',
    ],
    copyText: [
      '文书生成结果',
      '仲裁申请书：确认违法解除 + 赔偿28,000元 + 补缴2025年3月至4月社保',
      '证据目录（已持有）：工资流水、劳动合同、工牌、打卡记录、微信辞退截图',
      '证据目录（建议补充）：社保缴纳记录、工资条/工资明细、岗位调整通知',
      '行动清单：保全聊天记录、打印实发流水、1年内提交仲裁申请',
    ].join('\n'),
  },
  {
    key: 'triage',
    title: '繁简分流与律师转介',
    subtitle: '分级判断复杂度、风险与转介建议',
    icon: BriefcaseBusiness,
    badge: '步骤6',
    rows: [
      { label: '案件复杂度', value: '中等（违法解除 + 社保补缴双主张）' },
      { label: '风险等级', value: '中等（公司可能抗辩组织优化）' },
      { label: '口径风险', value: '工资基数地域差异明显，建议律师复核' },
      { label: '分流建议', value: '推荐律师介入，避免口径与证据链风险' },
      { label: '律师页信息', value: '劳动争议/违法解除/社保争议标签 + 数字名片 + 在线预约' },
      { label: '协作动作', value: '一键发送案情摘要到律师端口' },
    ],
    highlights: [
      '平台定位是法律服务分诊台，不替代律师。',
      '律师接手前置案情卡可节省20-40分钟前端沟通。',
    ],
    copyText: [
      '繁简分流与律师转介',
      '复杂度：中等（违法解除 + 社保补缴双主张）',
      '风险等级：中等（公司可能抗辩组织优化）',
      '口径风险：工资基数地域差异，建议律师复核',
      '分流建议：推荐律师介入',
      '律师能力标签：劳动争议 / 违法解除 / 社保争议',
      '支持一键发送案情摘要至律师端口',
    ].join('\n'),
  },
]

type ActionHandler = () => Promise<void> | void

interface DismissDemoResultCardsProps {
  compact?: boolean
  onGenerateDocuments?: ActionHandler
  onPushLawyerCard?: ActionHandler
  documentsGenerated?: boolean
  lawyerCardPushed?: boolean
}

export function DismissDemoResultCards({
  compact = false,
  onGenerateDocuments,
  onPushLawyerCard,
  documentsGenerated = false,
  lawyerCardPushed = false,
}: DismissDemoResultCardsProps) {
  const [activeCard, setActiveCard] = useState<CardKey>('summary')
  const [copiedKey, setCopiedKey] = useState<CardKey | null>(null)
  const [isGeneratingDocuments, setIsGeneratingDocuments] = useState(false)
  const [isPushingLawyerCard, setIsPushingLawyerCard] = useState(false)

  const activeDefinition = useMemo(() => {
    return CARD_DEFINITIONS.find((definition) => definition.key === activeCard) ?? CARD_DEFINITIONS[0]
  }, [activeCard])

  const copyActiveCard = async () => {
    try {
      await navigator.clipboard.writeText(activeDefinition.copyText)
      setCopiedKey(activeDefinition.key)
      window.setTimeout(() => setCopiedKey(null), 1400)
    } catch (error) {
      console.error('Failed to copy demo card details:', error)
    }
  }

  const handleGenerateDocuments = async () => {
    if (!onGenerateDocuments || isGeneratingDocuments) return
    setIsGeneratingDocuments(true)
    try {
      await onGenerateDocuments()
    } finally {
      setIsGeneratingDocuments(false)
    }
  }

  const handlePushLawyerCard = async () => {
    if (!onPushLawyerCard || isPushingLawyerCard) return
    setIsPushingLawyerCard(true)
    try {
      await onPushLawyerCard()
    } finally {
      setIsPushingLawyerCard(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">演示结果卡</p>
          <p className="mt-1 text-xs text-slate-500">问诊完成后，按甲方要求输出四项可交互结果。</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={copyActiveCard}
          className="h-8 rounded-full border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50"
        >
          {copiedKey === activeDefinition.key ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
          {copiedKey === activeDefinition.key ? '已复制要点' : '复制当前卡片'}
        </Button>
      </div>

      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
        {CARD_DEFINITIONS.map((definition) => {
          const Icon = definition.icon
          const isActive = definition.key === activeCard
          return (
            <button
              key={definition.key}
              type="button"
              onClick={() => setActiveCard(definition.key)}
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? 'border-sky-400 bg-gradient-to-br from-sky-100 to-cyan-100 shadow-md shadow-sky-100/80'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-white/80 p-2 ring-1 ring-black/5">
                    <Icon className="h-4 w-4 text-sky-700" />
                  </span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-medium tracking-wide text-white">
                    {definition.badge}
                  </span>
                </div>
                {isActive && <span className="text-[11px] font-medium text-sky-700">当前查看</span>}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{definition.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{definition.subtitle}</p>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-medium tracking-wide text-white">
            {activeDefinition.badge}
          </span>
          <p className="text-sm font-semibold text-slate-900">{activeDefinition.title}</p>
        </div>

        <div className="mt-3 grid gap-2">
          {activeDefinition.rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{row.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{row.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-2">
          {activeDefinition.highlights.map((line) => (
            <p key={line} className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 ring-1 ring-amber-100">
              {line}
            </p>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={documentsGenerated ? 'secondary' : 'default'}
            onClick={handleGenerateDocuments}
            disabled={!onGenerateDocuments || isGeneratingDocuments || documentsGenerated}
            className="rounded-full"
          >
            {documentsGenerated ? '文书已生成' : isGeneratingDocuments ? '正在生成文书...' : '生成文书'}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={lawyerCardPushed ? 'secondary' : 'default'}
            onClick={handlePushLawyerCard}
            disabled={!onPushLawyerCard || isPushingLawyerCard || lawyerCardPushed}
            className="rounded-full"
          >
            {lawyerCardPushed ? '律师卡片已推送' : isPushingLawyerCard ? '正在推送律师卡片...' : '推送律师卡片'}
          </Button>
        </div>
      </div>
    </div>
  )
}
