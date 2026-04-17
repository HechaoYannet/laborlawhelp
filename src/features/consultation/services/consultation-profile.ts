import type { CaseProfile, Evidence } from '@/lib/types'

export type ConsultationInfo = {
  entryDate?: string
  exitDate?: string
  wage?: number
  contract?: 'signed' | 'unsigned' | 'lost'
  socialSecurity?: boolean
  terminationMethod?: 'verbal' | 'written' | 'unknown'
  terminationReason?: string
  evidence: string[]
  previousAction?: 'none' | 'negotiation' | 'arbitration'
}

export function createEmptyConsultationInfo(): ConsultationInfo {
  return { evidence: [] }
}

export function extractConsultationInfo(text: string): ConsultationInfo {
  const lower = text.toLowerCase()
  const info: ConsultationInfo = createEmptyConsultationInfo()

  const entryMatch = text.match(/(\d{4})[年\-\/]?(\d{1,2})/)
  if (entryMatch) {
    info.entryDate = `${entryMatch[1]}-${entryMatch[2].padStart(2, '0')}-01`
  }

  const exitMatch = text.match(/(20\d{2})[年\-\/](\d{1,2})[月\-\/](\d{1,2})?[日]?/)
  if (exitMatch && /辞|不用来|开|走/.test(lower)) {
    info.exitDate = `${exitMatch[1]}-${exitMatch[2].padStart(2, '0')}-${(exitMatch[3] || '01').padStart(2, '0')}`
  }

  const wageMatch = text.match(/(\d+)(?:千|万|元)/)
  if (wageMatch) {
    let wage = parseInt(wageMatch[1], 10)
    if (/万/.test(text)) wage *= 10000
    else if (/千/.test(text)) wage *= 1000
    else if (wage < 100) wage *= 1000
    info.wage = wage
  }

  if (/没签/.test(lower)) info.contract = 'unsigned'
  else if (/找不.*到|丢了/.test(lower)) info.contract = 'lost'
  else if (/签.*合同/.test(lower)) info.contract = 'signed'

  if (/没交/.test(lower)) info.socialSecurity = false
  else if (/交了/.test(lower) || /应该/.test(lower)) info.socialSecurity = true

  if (/口头/.test(lower)) info.terminationMethod = 'verbal'
  else if (/书面/.test(lower)) info.terminationMethod = 'written'

  if (/不合适/.test(lower)) info.terminationReason = '不胜任'
  else if (/违反/.test(lower)) info.terminationReason = '违纪'
  else if (/经营|效益/.test(lower)) info.terminationReason = '客观情况'

  if (/流水/.test(lower)) info.evidence.push('工资流水')
  if (/群.*聊|工作.*群/.test(lower)) info.evidence.push('工作群聊天')
  if (/合同/.test(lower) && !/没/.test(lower)) info.evidence.push('劳动合同')
  if (/考勤/.test(lower)) info.evidence.push('考勤记录')
  if (/工牌|工作证/.test(lower)) info.evidence.push('工牌')

  if (/仲裁/.test(lower)) info.previousAction = 'arbitration'
  else if (/协商/.test(lower)) info.previousAction = 'negotiation'
  else if (/没找过|不知道|没.*去过/.test(lower)) info.previousAction = 'none'

  return info
}

export function mergeConsultationInfo(
  current: ConsultationInfo,
  nextInfo: ConsultationInfo,
): ConsultationInfo {
  return {
    ...current,
    ...nextInfo,
    evidence: [...new Set([...current.evidence, ...nextInfo.evidence])],
  }
}

export function consultationInfoToCaseProfile(info: ConsultationInfo): CaseProfile {
  const evidenceMap: Record<string, string> = {
    工资流水: '证明工资标准及发放情况',
    工作群聊天: '证明劳动关系及工作内容',
    劳动合同: '证明劳动关系和合同条款',
    考勤记录: '证明工作时间及加班情况',
    工牌: '证明劳动关系',
  }

  const evidenceList: Evidence[] = info.evidence.map(name => ({
    name,
    proofPurpose: evidenceMap[name] || '证明劳动关系及争议事实',
    available: true,
  }))

  const terminationWayMap: Record<NonNullable<ConsultationInfo['terminationMethod']>, CaseProfile['termination']['way']> = {
    verbal: 'oral_notice',
    written: 'written_notice',
    unknown: 'unknown',
  }

  const terminationReasonMap: Record<string, CaseProfile['termination']['reason']> = {
    不胜任: 'not_suitable',
    违纪: 'violation',
    客观情况: 'organizational',
  }

  return {
    applicant: { name: '' },
    respondent: { name: '' },
    laborRelation: {
      startDate: info.entryDate || '',
      endDate: info.exitDate,
      duration: 0,
      contractStatus: info.contract || 'unknown',
    },
    wageInfo: {
      monthlySalary: info.wage || 0,
      salaryStructure: [],
      paymentStatus: 'normal',
    },
    socialSecurity: {
      status:
        info.socialSecurity === true
          ? 'full'
          : info.socialSecurity === false
            ? 'not_paid'
            : 'unknown',
    },
    termination: {
      way: info.terminationMethod
        ? terminationWayMap[info.terminationMethod]
        : 'unknown',
      reason: info.terminationReason
        ? (terminationReasonMap[info.terminationReason] || 'unknown')
        : 'unknown',
    },
    disputeTypes: ['illegal_dismissal'],
    evidence: evidenceList,
    disputePhase:
      info.previousAction === 'arbitration'
        ? 'arbitration'
        : info.previousAction === 'negotiation'
          ? 'negotiation'
          : 'none',
  }
}
