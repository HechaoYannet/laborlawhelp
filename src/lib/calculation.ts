// ========================================
// 劳动法咨询平台 - 赔偿计算引擎
// 西安本地化口径
// ========================================

import type {
  CaseProfile,
  CalculationResult,
  CalculationItem,
} from './types'

// ========================================
// 西安本地化参数（2024-2025年数据）
// ========================================
export const XIAN_PARAMS = {
  // 社平工资（月均）- 2024年数据
  socialAverageWage: 4200,

  // 最低工资标准
  minimumWage: 2160,

  // 仲裁时效（天）
  arbitrationDeadline: 365,

  // 经济补偿金上限（月数）
  compensationCap: 12,

  // 加班工资倍数
  overtimeMultiplier: {
    weekday: 1.5,
    weekend: 2.0,
    holiday: 3.0,
  },

  // 年假天数
  annualLeaveDays: 5,

  // 工伤停工留薪期（一般月数）
  workInjuryPeriod: 12,
}

// ========================================
// 计算经济补偿金/违法解除赔偿金
// ========================================
function calculateTerminationCompensation(
  profile: CaseProfile
): CalculationItem[] {
  const items: CalculationItem[] = []
  const { laborRelation, wageInfo, termination } = profile

  // 在职月数
  const months = laborRelation.duration || calculateDuration(laborRelation.startDate, laborRelation.endDate)
  // 月工资
  const monthlySalary = wageInfo.monthlySalary

  if (months <= 0 || !monthlySalary || monthlySalary <= 0) {
    return items
  }

  // 计算N（按在职年限）
  let nMonths = calculateCompensationBase(months)
  if (nMonths > XIAN_PARAMS.compensationCap) nMonths = XIAN_PARAMS.compensationCap

  // 判断是否违法解除
  // 口头辞退 + 无明确合法理由 = 违法解除
  const isIllegalTermination =
    termination.way === 'oral_notice' ||
    termination.reason === 'not_suitable' ||
    termination.reason === 'unknown'

  if (isIllegalTermination) {
    // 违法解除 = 2N
    const amount = Math.round(monthlySalary * nMonths * 2)
    items.push({
      name: '违法解除劳动合同赔偿金',
      legalBasis: '《中华人民共和国劳动合同法》第八十七条',
      calculationBasis: `月工资 ${monthlySalary}元 × 工作年限 ${nMonths}个月 × 2倍`,
      calculationProcess: `${monthlySalary} × ${nMonths} × 2 = ${amount}`,
      amount,
      remark: '公司口头以"不合适"为由辞退，未提供充分证据，构成违法解除',
      category: 'system_estimate',
    })

    // 代通知金（如未提前30天通知）
    if (termination.way === 'oral_notice' || termination.way === 'no_notice') {
      items.push({
        name: '代通知金',
        legalBasis: '《中华人民共和国劳动合同法》第四十条',
        calculationBasis: '1个月工资',
        calculationProcess: `${monthlySalary} × 1 = ${monthlySalary}`,
        amount: monthlySalary,
        remark: '公司未提前30天书面通知，应支付一个月工资作为代通知金（注：代通知金需根据具体情况确定）',
        category: 'need_lawyer_review',
      })
    }
  } else if (termination.way === 'negotiated') {
    // 协商解除 = N 或 N+1
    const amount = Math.round(monthlySalary * nMonths)
    items.push({
      name: '经济补偿金',
      legalBasis: '《中华人民共和国劳动合同法》第四十六条第二款',
      calculationBasis: `月工资 ${monthlySalary}元 × 工作年限 ${nMonths}个月`,
      calculationProcess: `${monthlySalary} × ${nMonths} = ${amount}`,
      amount,
      remark: '双方协商一致解除劳动合同',
      category: 'system_estimate',
    })
  }

  return items
}

// ========================================
// 计算未签劳动合同双倍工资
// ========================================
function calculateUnsignContractCompensation(
  profile: CaseProfile
): CalculationItem[] {
  const items: CalculationItem[] = []
  const { laborRelation, wageInfo } = profile

  if (laborRelation.contractStatus === 'unsigned') {
    const months = laborRelation.duration || calculateDuration(laborRelation.startDate, laborRelation.endDate)
    const monthlySalary = wageInfo.monthlySalary

    if (!monthlySalary || monthlySalary <= 0 || months <= 1) {
      return items
    }

    // 未签合同超过1个月不满1年：每月支付2倍工资
    // 最多11个月
    const unpaidMonths = Math.max(0, Math.min(Math.floor(months) - 1, 11))
    const amount = Math.round(monthlySalary * unpaidMonths)

    if (unpaidMonths > 0) {
      items.push({
        name: '未签订劳动合同双倍工资差额',
        legalBasis: '《中华人民共和国劳动合同法》第八十二条第一款',
        calculationBasis: `月工资 ${monthlySalary}元 × 未签合同月数 ${unpaidMonths}个月`,
        calculationProcess: `${monthlySalary} × ${unpaidMonths} = ${amount}`,
        amount,
        remark: `用人单位自用工之日起超过1个月不满1年未与劳动者订立书面劳动合同的，应每月支付二倍工资`,
        category: 'system_estimate',
      })
    }
  } else if (laborRelation.contractStatus === 'lost') {
    // 合同丢失，公司需证明已签合同，否则承担不利后果
    items.push({
      name: '未签订劳动合同双倍工资差额（待核实）',
      legalBasis: '《中华人民共和国劳动合同法》第八十二条第一款',
      calculationBasis: '需核实公司是否持有劳动合同',
      calculationProcess: '需提供劳动合同或其他证据证明',
      amount: 0,
      remark: '请先获取劳动合同副本，如公司无法提供，可能主张双倍工资',
      category: 'need_lawyer_review',
    })
  }

  return items
}

// ========================================
// 计算工资拖欠
// ========================================
function calculateWageArrears(profile: CaseProfile): CalculationItem[] {
  const items: CalculationItem[] = []
  const { wageInfo } = profile

  if (
    wageInfo.paymentStatus === 'delayed' ||
    wageInfo.paymentStatus === 'withheld' ||
    wageInfo.paymentStatus === 'not_paid'
  ) {
    const unpaidAmount = wageInfo.unpaidAmount || 0
    const unpaidMonths = wageInfo.unpaidMonths || 1

    if (unpaidAmount > 0) {
      items.push({
        name: '拖欠工资',
        legalBasis: '《中华人民共和国劳动法》第五十条',
        calculationBasis: `拖欠工资总额`,
        calculationProcess: `${unpaidAmount}`,
        amount: unpaidAmount,
        remark: `拖欠期间：${unpaidMonths}个月`,
        category: 'system_estimate',
      })

      // 拖欠工资的经济补偿金（50%-100%）
      items.push({
        name: '拖欠工资经济补偿金',
        legalBasis: '《违反和解除劳动合同的经济补偿办法》第三条',
        calculationBasis: `拖欠工资数额的25%`,
        calculationProcess: `${unpaidAmount} × 25% = ${Math.round(unpaidAmount * 0.25)}`,
        amount: Math.round(unpaidAmount * 0.25),
        remark: '用人单位克扣或者无故拖欠劳动者工资的，需加发相当于工资报酬25%的经济补偿金',
        category: 'system_estimate',
      })
    }
  }

  return items
}

// ========================================
// 计算加班费
// ========================================
function calculateOvertimePay(profile: CaseProfile): CalculationItem[] {
  if (!profile.disputeTypes.includes('unpaid_overtime')) {
    return []
  }

  const items: CalculationItem[] = []

  // 加班费需要考勤记录等证据，这里做基础计算
  // 如果没有具体加班数据，返回提示信息

  items.push({
    name: '加班工资（如有加班）',
    legalBasis: '《中华人民共和国劳动法》第四十四条',
    calculationBasis: '需提供加班考勤记录',
    calculationProcess: '根据实际加班时长计算',
    amount: 0,
    remark: '请提供加班记录、考勤打卡等证据后可进一步测算',
    category: 'need_lawyer_review',
  })

  return items
}

// ========================================
// 计算未休年假工资
// ========================================
function calculateUnusedAnnualLeave(
  profile: CaseProfile,
  years: number = 1
): CalculationItem[] {
  if (!profile.disputeTypes.includes('leave_arrears')) {
    return []
  }

  const items: CalculationItem[] = []
  const monthlySalary = profile.wageInfo.monthlySalary
  if (!monthlySalary || monthlySalary <= 0) {
    return items
  }
  const dailySalary = Math.round((monthlySalary / 21.75) * 100) / 100

  // 每年应休年假天数（按累计工作年限）
  let annualLeaveDays = XIAN_PARAMS.annualLeaveDays
  const duration = profile.laborRelation.duration || calculateDuration(profile.laborRelation.startDate, profile.laborRelation.endDate)
  if (duration >= 120) {
    // 满10年不满20年
    annualLeaveDays = 10
  }
  if (duration >= 240) {
    // 满20年
    annualLeaveDays = 15
  }

  const unusedDays = annualLeaveDays * years // 假设未休
  const amount = Math.round(dailySalary * unusedDays * 2) // 未休年假支付2倍工资

  if (unusedDays > 0) {
    items.push({
      name: '未休年假工资',
      legalBasis: '《职工带薪年休假条例》第五条',
      calculationBasis: `日工资 × 未休年假天数 × 2倍`,
      calculationProcess: `${dailySalary} × ${unusedDays} × 2 = ${amount}`,
      amount,
      remark: `应休年假：${annualLeaveDays}天/年，未休天数：${unusedDays}天`,
      category: 'system_estimate',
    })
  }

  return items
}

// ========================================
// 计算社保欠缴
// ========================================
function calculateSocialSecurityArrears(
  profile: CaseProfile
): CalculationItem[] {
  const items: CalculationItem[] = []
  const { socialSecurity } = profile

  if (socialSecurity.status === 'not_paid' || socialSecurity.status === 'partial') {
    const unpaidMonths = socialSecurity.unpaidMonths || 0

    items.push({
      name: '社保欠缴（补偿或补缴）',
      legalBasis: '《中华人民共和国社会保险法》第八十六条',
      calculationBasis: '需社保部门核算',
      calculationProcess: '需到社保经办机构核算具体金额',
      amount: 0,
      remark: `欠缴月数：${unpaidMonths}个月。建议到社保部门打印缴费记录，核算具体欠缴金额`,
      category: 'need_lawyer_review',
    })
  }

  return items
}

// ========================================
// 主计算函数
// ========================================
export function calculateCompensation(profile: CaseProfile): CalculationResult {
  const items: CalculationItem[] = []

  // 1. 违法解除/经济补偿金
  items.push(...calculateTerminationCompensation(profile))

  // 2. 未签合同双倍工资
  items.push(...calculateUnsignContractCompensation(profile))

  // 3. 工资拖欠
  items.push(...calculateWageArrears(profile))

  // 4. 加班费
  items.push(...calculateOvertimePay(profile))

  // 5. 未休年假
  items.push(...calculateUnusedAnnualLeave(profile))

  // 6. 社保欠缴
  items.push(...calculateSocialSecurityArrears(profile))

  // 计算总额
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  // 生成摘要
  const summary = generateSummary(items, totalAmount)

  return {
    items,
    totalAmount,
    summary,
    disclaimer: `【重要声明】
1. 本测算结果仅供参考，不构成法律意见，不能替代律师复核或仲裁/诉讼结果。
2. 实际仲裁金额以劳动仲裁委认定为准。
3. 部分项目（如代通知金、加班费等）需根据具体证据情况确定，建议咨询专业律师。
4. 仲裁时效为1年，从知道或应当知道权利被侵害之日起计算。`,
  }
}

// ========================================
// 辅助函数
// ========================================

// 计算在职时长（月）
function calculateDuration(startDate: string, endDate?: string): number {
  if (!startDate) return 0
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()
  const months = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
  return Math.max(0, months)
}

function calculateCompensationBase(months: number): number {
  if (months <= 0) {
    return 0
  }

  const fullYears = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (remainingMonths === 0) {
    return fullYears
  }

  return remainingMonths < 6 ? fullYears + 0.5 : fullYears + 1
}

// 生成摘要文本
function generateSummary(items: CalculationItem[], total: number): string {
  const definiteItems = items.filter((i) => i.category === 'system_estimate')
  const reviewItems = items.filter((i) => i.category === 'need_lawyer_review')

  let summary = `根据您的情况，初步测算如下：\n\n`

  if (definiteItems.length > 0) {
    summary += `【系统测算项目】\n`
    definiteItems.forEach((item) => {
      summary += `• ${item.name}：${item.amount}元\n`
    })
  }

  if (reviewItems.length > 0) {
    summary += `\n【需律师复核项目】\n`
    reviewItems.forEach((item) => {
      summary += `• ${item.name}：需进一步核实\n`
    })
  }

  summary += `\n【合计参考金额】约 ${total} 元\n`
  summary += `\n注：以上金额仅供参考，实际结果以仲裁裁决为准。`

  return summary
}

// 获取案件关键指标
export function getCaseMetrics(profile: CaseProfile) {
  const duration = profile.laborRelation.duration || calculateDuration(
    profile.laborRelation.startDate,
    profile.laborRelation.endDate
  )

  return {
    duration,                    // 在职月数
    monthlySalary: profile.wageInfo.monthlySalary || 0,
    isOralTermination: profile.termination.way === 'oral_notice',
    hasContract: profile.laborRelation.contractStatus === 'signed',
    hasEvidence: profile.evidence.length > 0,
    disputeTypes: profile.disputeTypes,
  }
}
