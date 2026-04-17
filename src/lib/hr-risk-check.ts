// ========================================
// 劳动法咨询平台 - HR风险预警模块
// ========================================

import type { RiskScenario, RiskCheck } from './types'

// ========================================
// HR风险场景配置
// ========================================

export const HR_RISK_SCENARIOS: Record<RiskScenario, Omit<RiskCheck, 'level' | 'warnings' | 'suggestions'>> = {
  offer_letter: {
    scenario: 'offer_letter',
    legalBasis: '《劳动合同法》第三条、第十条',
  },
  probation: {
    scenario: 'probation',
    legalBasis: '《劳动合同法》第十九条、第二十一条',
  },
  employee_handbook: {
    scenario: 'employee_handbook',
    legalBasis: '《劳动合同法》第四条',
  },
  reward_punishment: {
    scenario: 'reward_punishment',
    legalBasis: '《劳动合同法》第四条',
  },
  termination: {
    scenario: 'termination',
    legalBasis: '《劳动合同法》第三十九条、第四十条、第八十七条',
  },
  transfer: {
    scenario: 'transfer',
    legalBasis: '《劳动合同法》第三十五条',
  },
  contract_renewal: {
    scenario: 'contract_renewal',
    legalBasis: '《劳动合同法》第十四条、第八十二条',
  },
  working_hours: {
    scenario: 'working_hours',
    legalBasis: '《劳动法》第三十六条、第三十九条、第四十四条',
  },
}

// ========================================
// 风险检查函数
// ========================================

export function checkOfferLetterRisk(
  hasOfferLetter: boolean,
  hasSignedConfirmation: boolean,
  hasDeadline: boolean,
  deadlineDate?: string
): RiskCheck {
  const warnings: string[] = []
  const suggestions: string[] = []

  if (!hasOfferLetter) {
    warnings.push('尚未发送录用通知书（Offer Letter），建议补充书面录用通知')
    suggestions.push('发送正式的书面录用通知书，明确岗位、薪资、入职日期等关键条款')
  }

  if (hasOfferLetter && !hasSignedConfirmation) {
    warnings.push('录用通知书未经候选人签字确认，存在法律风险')
    suggestions.push('要求候选人回复确认邮件或签署Offer Letter回执，留存证据')
  }

  if (hasOfferLetter && hasDeadline && deadlineDate) {
    warnings.push('录用通知书包含报到截止日期，需确保及时发送')
    suggestions.push('建议提前1-2周发送，确保候选人有充足考虑时间')
  }

  return {
    ...HR_RISK_SCENARIOS.offer_letter,
    level: warnings.length === 0 ? 'low' : warnings.length >= 2 ? 'high' : 'medium',
    warnings,
    suggestions,
  }
}

export function checkProbationRisk(
  probationPeriod: number, // 月数
  hasWrittenConditions: boolean,
  hasEvaluationStandard: boolean,
  hasNotice3Days: boolean
): RiskCheck {
  const warnings: string[] = []
  const suggestions: string[] = []

  // 试用期长度检查
  if (probationPeriod > 6) {
    warnings.push('试用期期限超过法定期限（6个月），违反《劳动合同法》第十九条')
    suggestions.push('立即调整劳动合同，将试用期缩短至法定期限内')
  } else if (probationPeriod === 0) {
    warnings.push('未约定试用期，视为劳动合同期限的一部分')
    suggestions.push('如需约定试用期，应在劳动合同中明确约定')
  }

  if (!hasWrittenConditions) {
    warnings.push('未书面明确录用条件（试用期考核标准）')
    suggestions.push('制定并书面告知劳动者录用条件，包括岗位要求、工作标准等')
  }

  if (!hasEvaluationStandard) {
    warnings.push('缺乏试用期评估标准和考核机制')
    suggestions.push('建立客观、可量化的试用期考核标准，留存考核记录')
  }

  if (!hasNotice3Days) {
    warnings.push('试用期解除未提前3天通知')
    suggestions.push('试用期解除劳动关系，需提前3天书面通知并说明理由')
  }

  return {
    ...HR_RISK_SCENARIOS.probation,
    level: warnings.length === 0 ? 'low' : warnings.length >= 3 ? 'critical' : warnings.length >= 1 ? 'high' : 'medium',
    warnings,
    suggestions,
  }
}

export function checkEmployeeHandbookRisk(
  hasHandbook: boolean,
  handbookVersion: string,
  hasDemocraticProcedure: boolean,
  hasSignatureRecords: boolean
): RiskCheck {
  const warnings: string[] = []
  const suggestions: string[] = []

  if (!hasHandbook) {
    warnings.push('尚未制定员工手册，缺乏制度化管理依据')
    suggestions.push('制定员工手册，明确考勤、请假、奖惩等制度规范')
  }

  if (hasHandbook && !hasDemocraticProcedure) {
    warnings.push('员工手册未经民主程序制定，可能影响效力')
    suggestions.push('员工手册等涉及劳动者切身利益的规章制度，应经职工代表大会讨论，并与工会或职工代表平等协商确定')
  }

  if (hasHandbook && !hasSignatureRecords) {
    warnings.push('员工手册未进行公示确认，员工可能不知晓相关规定')
    suggestions.push('组织员工学习员工手册，并留存签收记录或培训记录')
  }

  if (hasHandbook) {
    warnings.push(`员工手册版本为${handbookVersion}，建议定期更新`)
    suggestions.push('根据法律法规变化和公司实际情况，定期修订员工手册')
  }

  return {
    ...HR_RISK_SCENARIOS.employee_handbook,
    level: warnings.length === 0 ? 'low' : warnings.length >= 2 ? 'high' : 'medium',
    warnings,
    suggestions,
  }
}

export function checkRewardPunishmentRisk(
  hasRewardPolicy: boolean,
  hasPunishmentPolicy: boolean,
  hasNotificationRecords: boolean
): RiskCheck {
  const warnings: string[] = []
  const suggestions: string[] = []

  if (!hasRewardPolicy) {
    warnings.push('尚未建立奖励制度')
    suggestions.push('制定明确的奖励政策和标准，包括绩效奖金、项目奖金等')
  }

  if (!hasPunishmentPolicy) {
    warnings.push('尚未建立惩罚制度')
    suggestions.push('制定明确的违纪处分制度，列明各类违规行为及相应处分')
  }

  if (hasPunishmentPolicy && !hasNotificationRecords) {
    warnings.push('奖惩制度未有效告知员工，可能影响纪律处分的效力')
    suggestions.push('确保奖惩制度已向员工公示并留存告知记录')
  }

  return {
    ...HR_RISK_SCENARIOS.reward_punishment,
    level: warnings.length === 0 ? 'low' : warnings.length >= 2 ? 'high' : 'medium',
    warnings,
    suggestions,
  }
}

export function checkTerminationRisk(
  terminationWay: 'oral' | 'written' | 'negotiated',
  hasEvidence: boolean,
  hasNotice30Days: boolean,
  hasFinalSettlement: boolean
): RiskCheck {
  const warnings: string[] = []
  const suggestions: string[] = []

  if (terminationWay === 'oral') {
    warnings.push('采用口头方式解除劳动关系，举证困难，法律风险高')
    suggestions.push('改为书面通知方式，明确解除理由，留存书面证据')
  }

  if (!hasEvidence) {
    warnings.push('缺乏解除劳动关系的书面证据')
    suggestions.push('发送书面解除通知，载明解除原因、日期等信息，建议采用邮寄方式并保留签收回执')
  }

  if (!hasNotice30Days && terminationWay !== 'negotiated') {
    warnings.push('未提前30天书面通知或支付代通知金')
    suggestions.push('依据《劳动合同法》第40条，解除合同应提前30日书面通知或支付一个月工资作为代通知金')
  }

  if (!hasFinalSettlement) {
    warnings.push('未及时办理离职结算')
    suggestions.push('在解除劳动关系时，及时结清工资、办理离职手续，出具离职证明')
  }

  return {
    ...HR_RISK_SCENARIOS.termination,
    level: warnings.length === 0 ? 'low' : warnings.length >= 3 ? 'critical' : warnings.length >= 2 ? 'high' : 'medium',
    warnings,
    suggestions,
  }
}

export function checkTransferRisk(
  hasAgreement: boolean,
  hasReason: boolean,
  hasNewJobDescription: boolean,
  hasSalaryProtection: boolean
): RiskCheck {
  const warnings: string[] = []
  const suggestions: string[] = []

  if (!hasAgreement) {
    warnings.push('调岗未经劳动者书面同意')
    suggestions.push('调岗属于变更劳动合同，应与劳动者协商一致，签订书面变更协议')
  }

  if (!hasReason) {
    warnings.push('调岗缺乏合理理由')
    suggestions.push('保留组织架构调整、生产经营需要等合理原因的书面证据')
  }

  if (!hasNewJobDescription) {
    warnings.push('未明确新岗位的工作内容和职责')
    suggestions.push('提供新岗位的工作说明书，明确工作职责和考核标准')
  }

  if (!hasSalaryProtection) {
    warnings.push('调岗可能涉及薪酬调整')
    suggestions.push('调岗应遵循"薪随岗变"原则，薪酬调整应有明确依据，并保留相关记录')
  }

  return {
    ...HR_RISK_SCENARIOS.transfer,
    level: warnings.length === 0 ? 'low' : warnings.length >= 2 ? 'high' : 'medium',
    warnings,
    suggestions,
  }
}

export function checkContractRenewalRisk(
  contractEndDate: string,
  hasRenewalNotice: boolean,
  noticeDaysBefore: number,
  hasSignedRenewal: boolean
): RiskCheck {
  const warnings: string[] = []
  const suggestions: string[] = []

  if (hasRenewalNotice && noticeDaysBefore < 30) {
    warnings.push('续签劳动合同未提前30天通知')
    suggestions.push('建议在合同到期前30天与劳动者沟通续签事宜')
  }

  if (!hasSignedRenewal) {
    warnings.push('劳动合同到期未及时续签')
    suggestions.push('劳动合同到期后，如继续用工，应在一个月内签订书面劳动合同，否则可能承担双倍工资责任')
  }

  // 计算是否已超过一个月
  if (hasSignedRenewal === false && contractEndDate) {
    const endDate = new Date(contractEndDate)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 30) {
      warnings.push('劳动合同到期已超过一个月未续签')
      suggestions.push('应立即与劳动者补签劳动合同，逾期可能需支付双倍工资')
    }
  }

  return {
    ...HR_RISK_SCENARIOS.contract_renewal,
    level: warnings.length === 0 ? 'low' : warnings.length >= 2 ? 'high' : 'medium',
    warnings,
    suggestions,
  }
}

export function checkWorkingHoursRisk(
  workingHoursSystem: 'standard' | 'flexible' | 'shift' | 'unfixed',
  hasOvertimeRecords: boolean,
  hasOvertimeLimit: boolean,
  hasCompensationStandard: boolean
): RiskCheck {
  const warnings: string[] = []
  const suggestions: string[] = []

  if (workingHoursSystem === 'standard') {
    if (!hasOvertimeRecords) {
      warnings.push('缺乏加班考勤记录')
      suggestions.push('建立加班审批制度，如实记录加班情况，留存考勤记录作为支付加班费的依据')
    }
  }

  if (hasOvertimeLimit === false) {
    warnings.push('未对加班时长进行限制')
    suggestions.push('控制加班时间，确保每日加班不超过3小时，每月加班不超过36小时')
  }

  if (!hasCompensationStandard) {
    warnings.push('加班工资计发标准不明确')
    suggestions.push('明确加班工资计算基数，按法定标准支付加班费：工作日150%、休息日200%、法定节假日300%')
  }

  return {
    ...HR_RISK_SCENARIOS.working_hours,
    level: warnings.length === 0 ? 'low' : warnings.length >= 2 ? 'high' : 'medium',
    warnings,
    suggestions,
  }
}

// ========================================
// 综合风险评估
// ========================================

export function generateComprehensiveRiskReport(checks: RiskCheck[]): {
  overallLevel: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  priorityItems: RiskCheck[]
} {
  const levelOrder = { low: 0, medium: 1, high: 2, critical: 3 }

  const overallLevel =
    checks.some((c) => c.level === 'critical')
      ? 'critical'
      : checks.some((c) => c.level === 'high')
        ? 'high'
        : checks.some((c) => c.level === 'medium')
          ? 'medium'
          : 'low'

  const criticalAndHigh = checks.filter((c) => c.level === 'high' || c.level === 'critical')

  const summary = `综合评估：共检查${checks.length}项风险点，` +
    `其中${criticalAndHigh.length}项存在较高风险，` +
    `整体风险等级为"${overallLevel === 'critical' ? '极高' : overallLevel === 'high' ? '较高' : overallLevel === 'medium' ? '中等' : '较低'}"`

  return {
    overallLevel,
    summary,
    priorityItems: criticalAndHigh,
  }
}

// ========================================
// 风险场景名称映射
// ========================================

export const SCENARIO_NAMES: Record<RiskScenario, string> = {
  offer_letter: '录用通知留痕',
  probation: '试用期合规',
  employee_handbook: '员工手册公示',
  reward_punishment: '奖惩制度告知',
  termination: '离职证据留存',
  transfer: '调岗调薪程序',
  contract_renewal: '合同续签管理',
  working_hours: '工时制度合规',
}
