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
  disputeTypes: CaseProfile['disputeTypes']
  previousAction?: 'none' | 'negotiation' | 'arbitration'
}

export function createEmptyConsultationInfo(): ConsultationInfo {
  return { evidence: [], disputeTypes: [] }
}

export function extractConsultationInfo(text: string): ConsultationInfo {
  const lower = text.toLowerCase()
  const info: ConsultationInfo = createEmptyConsultationInfo()
  const disputeTypeSet = new Set<CaseProfile['disputeTypes'][number]>()

  const entryMatch =
    text.match(/(?:于|在)?\s*(20\d{2})\s*年\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*日?)?\s*(?:入职|到岗|上班|开始工作)/) ||
    text.match(/(?:于|在)?\s*(20\d{2})\s*[-/.]\s*(\d{1,2})(?:\s*[-/.]\s*(\d{1,2}))?\s*(?:入职|到岗|上班|开始工作)/) ||
    text.match(/(?:入职|到岗|上班|开始工作)[^\d]{0,8}(20\d{2})\s*年\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*日?)?/) ||
    text.match(/(?:入职|到岗|上班|开始工作)[^\d]{0,8}(20\d{2})\s*[-/.]\s*(\d{1,2})(?:\s*[-/.]\s*(\d{1,2}))?/)
  if (entryMatch) {
    info.entryDate = formatDate(entryMatch[1], entryMatch[2], entryMatch[3])
  }

  const hasTerminationSignal = /辞退|被辞|被开|开除|裁员|解除|不用来|不让来|离职|走人/.test(lower)
  const exitMatch =
    text.match(/(?:于|在)?\s*(20\d{2})\s*年\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*日?)?\s*(?:被辞退|被开除|被裁员|离职|解除劳动关系)/) ||
    text.match(/(?:于|在)?\s*(20\d{2})\s*[-/.]\s*(\d{1,2})(?:\s*[-/.]\s*(\d{1,2}))?\s*(?:被辞退|被开除|被裁员|离职|解除劳动关系)/) ||
    text.match(/(?:被辞退|被开除|被裁员|离职|解除劳动关系)[^\d]{0,8}(20\d{2})\s*年\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*日?)?/) ||
    text.match(/(?:被辞退|被开除|被裁员|离职|解除劳动关系)[^\d]{0,8}(20\d{2})\s*[-/.]\s*(\d{1,2})(?:\s*[-/.]\s*(\d{1,2}))?/)
  if (hasTerminationSignal && /今天/.test(lower)) {
    info.exitDate = new Date().toISOString().split('T')[0]
  } else if (exitMatch && hasTerminationSignal) {
    info.exitDate = formatDate(exitMatch[1], exitMatch[2], exitMatch[3])
  }

  const wageMatch =
    text.match(/(?:月工资|工资|月薪|到手|底薪|税前|税后)[^\d]{0,6}(\d+(?:\.\d+)?)\s*(万|千|k|K|元|块)?/) ||
    text.match(/(\d+(?:\.\d+)?)\s*(万|千|k|K|元|块)\s*(?:每月|一个月|月工资|工资|月薪)/)
  if (wageMatch) {
    info.wage = normalizeAmount(wageMatch[1], wageMatch[2])
  }

  if (/没签|未签/.test(lower)) info.contract = 'unsigned'
  else if (/找不.*到|丢了/.test(lower)) info.contract = 'lost'
  else if (/签.*合同/.test(lower)) info.contract = 'signed'

  if (/社保.*(?:没交|未交|断缴|少缴)|没交社保|未缴社保/.test(lower)) {
    info.socialSecurity = false
  } else if (/社保.*(?:交了|已交|正常缴纳)|有交社保/.test(lower)) {
    info.socialSecurity = true
  }

  if (/口头/.test(lower)) info.terminationMethod = 'verbal'
  else if (/书面|通知书|解除函/.test(lower)) info.terminationMethod = 'written'

  if (/不合适|不适合/.test(lower)) info.terminationReason = '不胜任'
  else if (/违反/.test(lower)) info.terminationReason = '违纪'
  else if (/经营|效益|裁员|优化|调整/.test(lower)) info.terminationReason = '客观情况'

  if (/流水/.test(lower)) info.evidence.push('工资流水')
  if (/聊天记录|群.*聊|工作.*群|微信记录/.test(lower)) info.evidence.push('工作群聊天')
  if (/合同/.test(lower) && !/没/.test(lower)) info.evidence.push('劳动合同')
  if (/考勤/.test(lower)) info.evidence.push('考勤记录')
  if (/工牌|工作证/.test(lower)) info.evidence.push('工牌')

  if (hasTerminationSignal || info.terminationMethod || info.terminationReason || info.exitDate) {
    disputeTypeSet.add('illegal_dismissal')
  }
  if (info.contract === 'unsigned') {
    disputeTypeSet.add('contract_not_signed')
  }
  if (/拖欠工资|扣工资|欠薪|没发工资|工资没发|工资拖着/.test(lower)) {
    disputeTypeSet.add('wage_arrears')
  }
  if (/加班/.test(lower)) {
    disputeTypeSet.add('unpaid_overtime')
  }
  if (info.socialSecurity === false) {
    disputeTypeSet.add('social_security_arrears')
  }
  if (/年假|调休|未休假|未休年假/.test(lower)) {
    disputeTypeSet.add('leave_arrears')
  }
  info.disputeTypes = Array.from(disputeTypeSet)

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
    disputeTypes: [...new Set([...current.disputeTypes, ...nextInfo.disputeTypes])],
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

  const disputeTypes =
    info.disputeTypes.length > 0
      ? info.disputeTypes
      : info.terminationMethod || info.terminationReason || info.exitDate
        ? (['illegal_dismissal'] as CaseProfile['disputeTypes'])
        : []

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
    disputeTypes,
    evidence: evidenceList,
    disputePhase:
      info.previousAction === 'arbitration'
        ? 'arbitration'
        : info.previousAction === 'negotiation'
          ? 'negotiation'
          : 'none',
  }
}

function formatDate(year: string, month: string, day?: string): string {
  return `${year}-${month.padStart(2, '0')}-${(day || '01').padStart(2, '0')}`
}

function normalizeAmount(rawAmount: string, unit?: string): number {
  const numeric = Number(rawAmount)
  if (!Number.isFinite(numeric)) {
    return 0
  }

  switch ((unit || '').toLowerCase()) {
    case '万':
      return Math.round(numeric * 10000)
    case '千':
    case 'k':
      return Math.round(numeric * 1000)
    default:
      return Math.round(numeric)
  }
}
