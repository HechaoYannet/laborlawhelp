// ========================================
// 劳动法咨询平台 - 繁简分流与律师推荐
// ========================================

import type {
  CaseProfile,
  CaseTriagResult,
  LawyerProfile,
  CaseComplexity,
} from './types'

// ========================================
// 繁简分流评估
// ========================================

export function evaluateCaseComplexity(profile: CaseProfile): CaseTriagResult {
  const dimensions = {
    // 争议金额
    disputeAmount: calculateDisputeAmount(profile),

    // 证据完整度评分 (0-100)
    evidenceScore: evaluateEvidenceScore(profile),

    // 法律关系复杂度 (1-5)
    legalRelations: evaluateLegalRelations(profile),

    // 是否涉及工伤等级
    hasInjuryGrade: profile.disputeTypes.includes('work_injury'),

    // 是否接近时效边缘（30天内）
    nearDeadline: isNearDeadline(profile),

    // 是否多主体
    multipleParties: false, // 暂不支持多主体判断

    // 是否特殊行业
    specialIndustry: false, // 暂不支持
  }

  // 计算综合复杂度
  const complexity = calculateComplexity(dimensions)

  // 生成推荐
  const recommended = generateRecommendation(dimensions, complexity)

  // 生成评估理由
  const reason = generateReason(dimensions, complexity)

  return {
    complexity,
    dimensions,
    recommended,
    reason,
  }
}

// 计算争议金额
function calculateDisputeAmount(profile: CaseProfile): number {
  let amount = 0

  // 经济补偿金/赔偿金
  const duration = profile.laborRelation.duration || 12
  const months = Math.min(Math.ceil(duration / 12), 12)
  const salary = profile.wageInfo.monthlySalary || 4500

  if (
    profile.disputeTypes.includes('illegal_dismissal') ||
    profile.termination.way === 'oral_notice'
  ) {
    amount += salary * months * 2
  }

  // 未签合同双倍工资
  if (profile.laborRelation.contractStatus === 'unsigned') {
    const unpaidMonths = Math.min(Math.floor(duration), 11)
    amount += salary * unpaidMonths
  }

  // 工资拖欠
  if (profile.wageInfo.unpaidAmount) {
    amount += profile.wageInfo.unpaidAmount
  }

  return amount
}

// 评估证据完整度
function evaluateEvidenceScore(profile: CaseProfile): number {
  let score = 0

  const evidenceNames = profile.evidence.map((e) => e.name)

  // 关键证据计分
  if (evidenceNames.some((e) => e.includes('流水'))) score += 25
  if (evidenceNames.some((e) => e.includes('合同'))) score += 20
  if (evidenceNames.some((e) => e.includes('群') || e.includes('聊天'))) score += 15
  if (evidenceNames.some((e) => e.includes('社保'))) score += 10
  if (evidenceNames.some((e) => e.includes('考勤'))) score += 10
  if (evidenceNames.some((e) => e.includes('邮件'))) score += 10
  if (evidenceNames.some((e) => e.includes('通知'))) score += 15
  if (evidenceNames.some((e) => e.includes('工牌'))) score += 5

  return Math.min(score, 100)
}

// 评估法律关系复杂度
function evaluateLegalRelations(profile: CaseProfile): number {
  let complexity = 1

  // 基础复杂度
  if (profile.disputeTypes.length > 1) complexity += 1
  if (profile.disputeTypes.includes('work_injury')) complexity += 2
  if (profile.laborRelation.contractStatus === 'unsigned') complexity += 1

  // 特殊情况
  if (profile.termination.reason === 'violation') complexity += 1

  return Math.min(complexity, 5)
}

// 是否接近时效边缘
function isNearDeadline(profile: CaseProfile): boolean {
  if (!profile.termination.noticeDate && !profile.laborRelation.endDate) {
    return false
  }

  const noticeDate = new Date(
    profile.termination.noticeDate || profile.laborRelation.endDate || new Date()
  )
  const now = new Date()
  const daysDiff = Math.floor(
    (noticeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  // 超过11个月视为接近时效
  return daysDiff < 0 && Math.abs(daysDiff) > 330
}

// 计算综合复杂度
function calculateComplexity(dimensions: CaseTriagResult['dimensions']): CaseComplexity {
  // 复杂案件指标
  if (
    dimensions.hasInjuryGrade ||
    dimensions.nearDeadline ||
    dimensions.multipleParties ||
    dimensions.specialIndustry
  ) {
    return 'complex'
  }

  // 中等案件指标
  if (
    dimensions.evidenceScore < 60 ||
    dimensions.legalRelations >= 3 ||
    dimensions.disputeAmount > 50000
  ) {
    return 'moderate'
  }

  // 简单案件
  return 'simple'
}

// 生成推荐
function generateRecommendation(
  dimensions: CaseTriagResult['dimensions'],
  complexity: CaseComplexity
): CaseTriagResult['recommended'] {
  switch (complexity) {
    case 'complex':
      return {
        selfHelp: false,
        lawyerMatch: true,
        urgency: dimensions.nearDeadline ? 'high' : 'medium',
      }

    case 'moderate':
      return {
        selfHelp: true,
        lawyerMatch: true,
        urgency: 'medium',
      }

    case 'simple':
      return {
        selfHelp: true,
        lawyerMatch: dimensions.evidenceScore < 50,
        urgency: dimensions.nearDeadline ? 'high' : 'low',
      }
  }
}

// 生成评估理由
function generateReason(dimensions: CaseTriagResult['dimensions'], complexity: CaseComplexity): string {
  const reasons: string[] = []

  if (dimensions.disputeAmount > 0) {
    reasons.push(`争议金额约${dimensions.disputeAmount}元`)
  }

  if (dimensions.evidenceScore >= 70) {
    reasons.push('证据较为完整')
  } else if (dimensions.evidenceScore < 50) {
    reasons.push('证据相对薄弱，需要补充')
  }

  if (dimensions.hasInjuryGrade) {
    reasons.push('涉及工伤认定，程序较复杂')
  }

  if (dimensions.nearDeadline) {
    reasons.push('⚠️ 接近仲裁时效边缘，建议尽快行动')
  }

  if (dimensions.legalRelations >= 3) {
    reasons.push('法律关系较复杂，涉及多个争议点')
  }

  switch (complexity) {
    case 'complex':
      reasons.push('建议委托专业律师代理')
      break
    case 'moderate':
      reasons.push('可自助推进，律师协助可提高成功率')
      break
    case 'simple':
      reasons.push('可按步骤自助维权')
      break
  }

  return reasons.join('；')
}

// ========================================
// 律师推荐
// ========================================

// 模拟律师数据（实际应从后端获取）
const MOCK_LAWYERS: LawyerProfile[] = [
  {
    id: 'lawyer_001',
    name: '王明',
    firm: '陕西XX律师事务所',
    regions: ['西安', '陕西'],
    caseTypes: ['illegal_dismissal', 'wage_arrears', 'contract_not_signed'],
    experienceLevel: 'senior',
    reputationScore: 95,
    phone: '138****5678',
    consultationFee: 300,
    freeConsultation: true,
  },
  {
    id: 'lawyer_002',
    name: '李华',
    firm: '西安XX律师事务所',
    regions: ['西安', '陕西'],
    caseTypes: ['illegal_dismissal', 'work_injury', 'social_security_arrears'],
    experienceLevel: 'mid',
    reputationScore: 88,
    phone: '139****8765',
    consultationFee: 200,
    freeConsultation: true,
  },
  {
    id: 'lawyer_003',
    name: '张伟',
    firm: '陕西XX律师事务所',
    regions: ['西安', '咸阳', '陕西'],
    caseTypes: ['illegal_dismissal', 'wage_arrears', 'leave_arrears'],
    experienceLevel: 'senior',
    reputationScore: 92,
    phone: '137****2345',
    consultationFee: 500,
    freeConsultation: false,
  },
]

// 推荐律师
export function recommendLawyers(
  profile: CaseProfile,
  count: number = 3
): LawyerProfile[] {
  // 根据地域、案件类型筛选
  const matched = MOCK_LAWYERS.filter((lawyer) => {
    // 地域匹配（默认西安）
    const regionMatch =
      lawyer.regions.includes('西安') ||
      lawyer.regions.some((r) => profile.respondent.address?.includes(r))

    // 案件类型匹配
    const caseTypeMatch = profile.disputeTypes.some((type) =>
      lawyer.caseTypes.includes(type)
    )

    return regionMatch && caseTypeMatch
  })

  // 按信誉评分排序
  const sorted = matched.sort((a, b) => b.reputationScore - a.reputationScore)

  return sorted.slice(0, count)
}

// 生成推荐理由
export function generateLawyerRecommendationReason(lawyer: LawyerProfile): string {
  const reasons: string[] = []

  if (lawyer.experienceLevel === 'senior') {
    reasons.push('资深劳动法律师')
  } else if (lawyer.experienceLevel === 'mid') {
    reasons.push('经验丰富')
  }

  reasons.push(`信誉评分 ${lawyer.reputationScore}`)

  if (lawyer.freeConsultation) {
    reasons.push('支持免费咨询')
  }

  return reasons.join('，')
}
