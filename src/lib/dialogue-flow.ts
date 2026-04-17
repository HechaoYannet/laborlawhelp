// ========================================
// 劳动法咨询平台 - 对话流程引擎
// 模拟AI案情提炼对话
// ========================================

import type {
  CaseProfile,
  DialogueStage,
  GuidanceQuestion,
  TimelineEvent,
  DisputeType,
} from './types'

// ========================================
// 对话模板 - 情绪安抚与引导话术
// ========================================

// 初始情绪安抚话术
export const INITIAL_GREETING = `您好，特别理解您现在又委屈又生气的心情，被突然辞退换谁都会觉得无助。

别着急，我会一步步帮您理清楚情况，咱们先把关键信息捋明白，好吗？

我问您几个简单的问题，想到什么说什么就可以：

1. 您大概是什么时候入职这家公司的？今天通知您离职，工作就到今天结束了吗？

2. 您平时每个月到手工资大概多少？公司有没有和您签劳动合同，社保给您交了吗？

3. 他们说您不用来了，是口头说的还是给了书面通知？有没有说辞退您的理由？

4. 您手里有没有能证明您在这家公司上班的东西？比如工资流水、工作群聊天、考勤记录这些？

5. 您之前有没有找公司协商过，或者去过劳动仲裁之类的地方？`

// 阶段引导问题
export const GUIDANCE_QUESTIONS: GuidanceQuestion[] = [
  // 基本信息收集
  {
    id: 'basic_1',
    stage: 'gathering_basic',
    question: '请问您贵姓？方便告诉我您的全名吗？',
    hint: '用于仲裁申请书',
    field: 'applicant',
    subField: 'name',
  },
  {
    id: 'basic_2',
    stage: 'gathering_basic',
    question: '您的联系电话是多少？方便仲裁委联系您。',
    hint: '选填',
    field: 'applicant',
    subField: 'phone',
  },

  // 劳动关系信息
  {
    id: 'labor_1',
    stage: 'gathering_labor',
    question: '您是什么时候入职这家公司的？（请告诉我大概的年月）',
    hint: '例如：2023年3月',
    field: 'laborRelation',
    subField: 'startDate',
  },
  {
    id: 'labor_2',
    stage: 'gathering_labor',
    question: '劳动合同签了吗？您自己有没有合同副本？',
    hint: '已签/未签/合同丢失/不清楚',
    options: ['签了，我有合同副本', '签了，但我那份找不到了', '没签过合同', '不清楚'],
    field: 'laborRelation',
    subField: 'contractStatus',
  },

  // 工资信息
  {
    id: 'wage_1',
    stage: 'gathering_wage',
    question: '您每个月到手工资大概多少？（包括基本工资、奖金、补贴等）',
    hint: '可以按月均算',
    field: 'wageInfo',
    subField: 'monthlySalary',
  },
  {
    id: 'wage_2',
    stage: 'gathering_wage',
    question: '公司每个月什么时候发工资？最近工资发放正常吗？',
    hint: '正常/有延迟/扣发/未发',
    options: ['正常发放', '偶尔延迟几天', '经常延迟', '扣了一部分', '好几个月没发了'],
    field: 'wageInfo',
    subField: 'paymentStatus',
  },

  // 离职情况
  {
    id: 'termination_1',
    stage: 'gathering_termination',
    question: '公司是怎么通知您不用来上班的？是口头说的还是给了书面通知？',
    hint: '口头/书面/直接不让来',
    options: ['口头通知的', '给了书面辞退通知', '直接让我不用来了，也没说原因', '让我自己写辞职报告'],
    field: 'termination',
    subField: 'way',
  },
  {
    id: 'termination_2',
    stage: 'gathering_termination',
    question: '公司有没有说让您离职的理由？',
    hint: '例如：说您"不合适"、绩效考核、架构调整等',
    field: 'termination',
    subField: 'reason',
  },

  // 证据情况
  {
    id: 'evidence_1',
    stage: 'gathering_evidence',
    question: '您手里现在有哪些可以证明劳动关系或工资的证据？',
    hint: '多选',
    options: ['银行工资流水', '工作群聊天记录', '工作证/工牌', '考勤记录', '社保缴费记录', '邮件/文件', '还没有'],
  },
  {
    id: 'evidence_2',
    stage: 'gathering_evidence',
    question: '您之前有没有去劳动仲裁或者找过其他部门？',
    hint: '这是为了了解您的维权进度',
    options: ['还没去过', '去仲裁委咨询过', '已经提交了仲裁申请', '正在仲裁中'],
    field: 'disputePhase',
  },
]

// ========================================
// 对话逻辑处理
// ========================================

export interface DialogueContext {
  currentStage: DialogueStage
  answeredQuestions: Set<string>
  extractedInfo: Partial<CaseProfile>
  timeline: TimelineEvent[]
}

// 处理用户输入，提取信息
export function processUserInput(
  userMessage: string,
  context: DialogueContext
): {
  response: string
  updatedContext: DialogueContext
  isComplete: boolean
  stageInfo: Partial<CaseProfile>
} {
  const { currentStage } = context
  const updatedContext = { ...context }
  let stageInfo: Partial<CaseProfile> = {}
  let response = ''
  let isComplete = false

  // 提取信息
  const extracted = extractInfoFromMessage(userMessage, currentStage)
  stageInfo = extracted.info
  updatedContext.extractedInfo = { ...updatedContext.extractedInfo, ...extracted.info }

  // 根据阶段生成回应
  switch (currentStage) {
    case 'initial':
      response = `好的，我大概了解了您的情况。别担心，我会帮您理清楚权利。

让我再确认几个关键信息：`
      updatedContext.currentStage = 'gathering_basic'
      break

    case 'gathering_basic':
      // 已提取姓名等信息
      response = `好的，已记录。您的情况我大概了解了。`

      // 自动进入下一阶段
      updatedContext.currentStage = 'gathering_labor'
      response += `\n\n接下来我想了解一下劳动关系的情况：\n`

      // 添加入职事件
      if (stageInfo.laborRelation?.startDate) {
        updatedContext.timeline.push({
          date: stageInfo.laborRelation.startDate,
          title: '入职公司',
          description: '签订劳动合同',
          type: 'entry',
        })
      }
      break

    case 'gathering_labor':
      // 提取劳动合同信息
      if (stageInfo.laborRelation) {
        updatedContext.extractedInfo.laborRelation = {
          ...updatedContext.extractedInfo.laborRelation,
          ...stageInfo.laborRelation,
        }
      }

      response = `明白了，合同情况我记下了。`
      updatedContext.currentStage = 'gathering_wage'
      response += `\n\n现在我想了解一下工资情况：`
      break

    case 'gathering_wage':
      if (stageInfo.wageInfo) {
        updatedContext.extractedInfo.wageInfo = {
          ...updatedContext.extractedInfo.wageInfo,
          ...stageInfo.wageInfo,
        }
      }

      response = `好的，工资情况已记录。`
      updatedContext.currentStage = 'gathering_termination'
      response += `\n\n现在说说离职的情况吧：`
      break

    case 'gathering_termination':
      if (stageInfo.termination) {
        updatedContext.extractedInfo.termination = {
          ...updatedContext.extractedInfo.termination,
          ...stageInfo.termination,
        }
      }

      // 添加离职事件
      updatedContext.timeline.push({
        date: new Date().toISOString().split('T')[0],
        title: '被通知解除劳动关系',
        description: `方式：${userMessage}`,
        type: 'termination',
      })

      // 判断争议类型
      const disputeTypes = determineDisputeTypes(updatedContext.extractedInfo)
      updatedContext.extractedInfo.disputeTypes = disputeTypes

      response = `好的，我清楚了。公司这种做法确实有问题。`
      updatedContext.currentStage = 'gathering_evidence'
      response += `\n\n接下来想了解一下您手头有哪些证据：`
      break

    case 'gathering_evidence':
      // 提取证据信息
      const evidenceList = extractEvidence(userMessage)
      updatedContext.extractedInfo.evidence = evidenceList

      response = `好的，证据情况已记录。`
      updatedContext.currentStage = 'summarizing'
      break

    case 'summarizing':
      isComplete = true
      break
  }

  return {
    response,
    updatedContext,
    isComplete,
    stageInfo,
  }
}

// 从用户消息中提取信息
function extractInfoFromMessage(
  message: string,
  stage: DialogueStage
): { info: Partial<CaseProfile> } {
  const info: Partial<CaseProfile> = {}
  const lowerMessage = message.toLowerCase()

  // 提取日期
  const datePatterns = [
    /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/,
    /(\d{4})(\d{2})(\d{2})/,
  ]

  // 提取金额
  const amountPatterns = [
    /(\d+(?:\.\d+)?)\s*万/,
    /(\d+(?:\.\d+)?)\s*千/,
    /(\d+(?:\.\d+)?)\s*元/,
  ]

  // 提取姓名
  if (stage === 'gathering_basic' && lowerMessage.includes('姓')) {
    // 需要更复杂的NLP处理，这里简化处理
  }

  // 提取入职日期
  if (stage === 'gathering_labor') {
    for (const pattern of datePatterns) {
      const match = message.match(pattern)
      if (match) {
        if (!info.laborRelation) info.laborRelation = {} as CaseProfile['laborRelation']
        const year = match[1] || match[4]
        const month = match[2] || match[5]
        const day = match[3] || match[6] || '01'
        info.laborRelation.startDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        break
      }
    }
  }

  // 提取工资
  if (stage === 'gathering_wage') {
    for (const pattern of amountPatterns) {
      const match = message.match(pattern)
      if (match) {
        if (!info.wageInfo) info.wageInfo = {} as CaseProfile['wageInfo']
        let amount = parseFloat(match[1])
        if (lowerMessage.includes('万')) amount *= 10000
        else if (lowerMessage.includes('千')) amount *= 1000
        info.wageInfo.monthlySalary = Math.round(amount)
        break
      }
    }

    // 提取支付状态
    if (lowerMessage.includes('正常')) {
      if (!info.wageInfo) info.wageInfo = {} as CaseProfile['wageInfo']
      info.wageInfo.paymentStatus = 'normal'
    } else if (lowerMessage.includes('延迟') || lowerMessage.includes('拖')) {
      if (!info.wageInfo) info.wageInfo = {} as CaseProfile['wageInfo']
      info.wageInfo.paymentStatus = 'delayed'
    } else if (lowerMessage.includes('扣')) {
      if (!info.wageInfo) info.wageInfo = {} as CaseProfile['wageInfo']
      info.wageInfo.paymentStatus = 'withheld'
    } else if (lowerMessage.includes('没发') || lowerMessage.includes('欠')) {
      if (!info.wageInfo) info.wageInfo = {} as CaseProfile['wageInfo']
      info.wageInfo.paymentStatus = 'not_paid'
    }
  }

  // 提取离职方式
  if (stage === 'gathering_termination') {
    if (!info.termination) info.termination = {} as CaseProfile['termination']

    if (lowerMessage.includes('口头')) {
      info.termination.way = 'oral_notice'
    } else if (lowerMessage.includes('书面')) {
      info.termination.way = 'written_notice'
    } else if (lowerMessage.includes('不让') || lowerMessage.includes('直接')) {
      info.termination.way = 'no_notice'
    } else if (lowerMessage.includes('辞职')) {
      info.termination.way = 'forced_resign'
    } else if (lowerMessage.includes('协商')) {
      info.termination.way = 'negotiated'
    }

    // 提取离职理由
    if (lowerMessage.includes('不合适')) {
      info.termination.reason = 'not_suitable'
    } else if (lowerMessage.includes('绩效')) {
      info.termination.reason = 'performance'
    } else if (lowerMessage.includes('架构') || lowerMessage.includes('调整')) {
      info.termination.reason = 'organizational'
    } else if (lowerMessage.includes('亏损')) {
      info.termination.reason = 'business_loss'
    } else if (lowerMessage.includes('违反')) {
      info.termination.reason = 'violation'
    }
  }

  return { info }
}

// 提取证据信息
function extractEvidence(message: string): CaseProfile['evidence'] {
  const evidence: CaseProfile['evidence'] = []
  const lowerMessage = message.toLowerCase()

  const evidenceMap: Record<string, { name: string; purpose: string; available: boolean }> = {
    '流水': { name: '银行工资流水', purpose: '证明工资标准及发放情况', available: false },
    '工资卡': { name: '银行工资流水', purpose: '证明工资标准及发放情况', available: false },
    '群': { name: '工作群聊天记录', purpose: '证明劳动关系及工作内容', available: false },
    '工作群': { name: '工作群聊天记录', purpose: '证明劳动关系及工作内容', available: false },
    '工牌': { name: '工作证/工牌', purpose: '证明劳动关系', available: false },
    '工作证': { name: '工作证/工牌', purpose: '证明劳动关系', available: false },
    '考勤': { name: '考勤记录', purpose: '证明工作时间及加班情况', available: false },
    '社保': { name: '社保缴费记录', purpose: '证明社保缴纳情况', available: false },
    '邮件': { name: '工作邮件', purpose: '证明工作内容及劳动关系', available: false },
    '合同': { name: '劳动合同', purpose: '证明劳动关系及合同期限', available: false },
  }

  for (const [key, value] of Object.entries(evidenceMap)) {
    if (lowerMessage.includes(key)) {
      evidence.push({
        name: value.name,
        proofPurpose: value.purpose,
        available: !lowerMessage.includes('没有') && !lowerMessage.includes('还没'),
      })
    }
  }

  // 如果说"没有"或"还没"，说明暂时没有证据
  if (evidence.length === 0 && (lowerMessage.includes('没有') || lowerMessage.includes('还没') || lowerMessage.includes('没有任'))) {
    evidence.push({
      name: '暂无证据',
      proofPurpose: '需要进一步收集',
      available: false,
    })
  }

  return evidence
}

// 判断争议类型
function determineDisputeTypes(info: Partial<CaseProfile>): DisputeType[] {
  const types: DisputeType[] = []

  // 违法解除
  if (
    info.termination?.way === 'oral_notice' ||
    info.termination?.way === 'no_notice' ||
    info.termination?.reason === 'not_suitable'
  ) {
    types.push('illegal_dismissal')
  }

  // 未签合同
  if (info.laborRelation?.contractStatus === 'unsigned') {
    types.push('contract_not_signed')
  }

  // 工资问题
  if (
    info.wageInfo?.paymentStatus === 'delayed' ||
    info.wageInfo?.paymentStatus === 'withheld' ||
    info.wageInfo?.paymentStatus === 'not_paid'
  ) {
    types.push('wage_arrears')
  }

  // 社保问题
  if (info.socialSecurity?.status === 'not_paid' || info.socialSecurity?.status === 'partial') {
    types.push('social_security_arrears')
  }

  return types
}

// ========================================
// 案情总结生成
// ========================================

export function generateCaseSummary(profile: Partial<CaseProfile>): string {
  const { laborRelation, wageInfo, termination, disputeTypes, evidence } = profile

  let summary = `好的，我帮您把情况整理清楚了，您可以先看一下：

`

  // 劳动关系摘要
  summary += `📋 **结构化案情卡**
`
  if (laborRelation?.startDate) {
    const endDate = termination?.noticeDate || new Date().toISOString().split('T')[0]
    const duration = calculateMonths(laborRelation.startDate, endDate)
    summary += `- **劳动关系**：${formatDate(laborRelation.startDate)}入职，${formatDate(endDate)}被通知离职，在职时长约${duration}个月
`
  }

  if (wageInfo?.monthlySalary) {
    summary += `- **薪资情况**：月均到手约${wageInfo.monthlySalary}元
`
  }

  if (laborRelation?.contractStatus) {
    const contractStatusText: Record<string, string> = {
      'signed': '已签合同',
      'unsigned': '未签合同',
      'lost': '合同丢失',
      'expired': '合同到期',
      'unknown': '不清楚',
    }
    summary += `- **合同与社保**：${contractStatusText[laborRelation.contractStatus] || '待确认'}
`
  }

  if (termination) {
    const wayText: Record<string, string> = {
      'oral_notice': '口头',
      'written_notice': '书面',
      'no_notice': '未通知直接不让来',
      'negotiated': '协商',
      'forced_resign': '被迫辞职',
    }
    const reasonText: Record<string, string> = {
      'not_suitable': '以"不合适"为由',
      'performance': '绩效考核不达标',
      'organizational': '组织架构调整',
      'unknown': '未说明理由',
    }
    summary += `- **离职情况**：公司${wayText[termination.way] || '以某种方式'}通知解除劳动关系${termination.reason ? `，${reasonText[termination.reason] || termination.reason}` : ''}
`
  }

  summary += `- **证据情况**：${evidence?.length ? evidence.map(e => e.name).join('、') : '待整理'}
`
  summary += `- **维权进度**：尚未开始维权
`

  // 争议焦点
  if (disputeTypes && disputeTypes.length > 0) {
    summary += `
⏱️ **事实时间轴**：
`
    if (laborRelation?.startDate) {
      summary += `${formatDate(laborRelation.startDate)} 入职公司${laborRelation.contractStatus === 'signed' ? '，签订劳动合同' : ''}
`
    }
    if (termination?.noticeDate) {
      summary += `${formatDate(termination.noticeDate)} 公司通知解除劳动关系
`
    }

    summary += `
📍 **争议焦点**：`
    const disputeText: Record<string, string> = {
      'illegal_dismissal': '公司辞退是否构成违法解除',
      'wage_arrears': '工资拖欠问题',
      'unpaid_overtime': '加班费问题',
      'contract_not_signed': '未签合同双倍工资',
      'social_security_arrears': '社保欠缴问题',
    }
    summary += disputeTypes.map(t => disputeText[t] || t).join('、')
  }

  return summary
}

// ========================================
// 辅助函数
// ========================================

function calculateMonths(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
}

function formatDate(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
