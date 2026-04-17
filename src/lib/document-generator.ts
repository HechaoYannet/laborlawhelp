// ========================================
// 劳动法咨询平台 - 文书生成模块
// ========================================

import type {
  CaseProfile,
  DocumentType,
  DocumentContent,
  CalculationResult,
  TimelineEvent,
} from './types'

// ========================================
// 文书生成器
// ========================================

export function generateDocument(
  type: DocumentType,
  profile: CaseProfile,
  calculation?: CalculationResult,
  timeline?: TimelineEvent[]
): DocumentContent {
  switch (type) {
    case 'arbitration_application':
      return generateArbitrationApplication(profile)
    case 'evidence_directory':
      return generateEvidenceDirectory(profile)
    case 'calculation_statement':
      return generateCalculationStatement(profile, calculation)
    case 'action_checklist':
      return generateActionChecklist(profile, timeline)
    default:
      throw new Error('Unknown document type: ' + type)
  }
}

// ========================================
// 1. 仲裁申请书
// ========================================
function generateArbitrationApplication(profile: CaseProfile): DocumentContent {
  const { applicant, respondent, laborRelation, wageInfo, termination, disputeTypes } = profile

  // 生成请求事项
  const claims: string[] = []
  const claimAmounts: string[] = []

  // 违法解除赔偿金
  if (disputeTypes.includes('illegal_dismissal')) {
    const duration = laborRelation.duration || 12
    const months = Math.min(Math.ceil(duration / 12), 12)
    const salary = wageInfo.monthlySalary || 4500
    const amount = salary * months * 2
    claims.push('请求被申请人支付违法解除劳动合同赔偿金')
    claimAmounts.push(amount + '元')
  }

  // 代通知金
  if (termination.way === 'oral_notice' || termination.way === 'no_notice') {
    const salary = wageInfo.monthlySalary || 4500
    claims.push('请求被申请人支付未提前通知代通知金')
    claimAmounts.push(salary + '元')
  }

  // 未签合同双倍工资
  if (laborRelation.contractStatus === 'unsigned') {
    const duration = laborRelation.duration || 12
    const unpaidMonths = Math.min(Math.floor(duration), 11)
    const salary = wageInfo.monthlySalary || 4500
    const amount = salary * unpaidMonths
    claims.push('请求被申请人支付未签订书面劳动合同二倍工资差额')
    claimAmounts.push(amount + '元')
  }

  // 工资拖欠
  if (wageInfo.paymentStatus !== 'normal' && wageInfo.unpaidAmount) {
    claims.push('请求被申请人支付拖欠工资')
    claimAmounts.push(wageInfo.unpaidAmount + '元')
  }

  const totalClaim = claimAmounts.join('、')

  // 格式化日期
  const formatDate = (date: string) => {
    if (!date) return '____年__月__日'
    const d = new Date(date)
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
  }

  // 构建内容
  const lines: string[] = []
  lines.push('劳动人事争议仲裁申请书')
  lines.push('')
  lines.push('申请人：' + (applicant.name || '（请填写姓名）'))
  lines.push('身份证号：' + (applicant.idNumber || '（请填写身份证号）'))
  lines.push('联系电话：' + (applicant.phone || '（请填写联系电话）'))
  lines.push('地址：' + (applicant.address || '（请填写地址）'))
  lines.push('')
  lines.push('被申请人：' + (respondent.name || '（请填写公司全称）'))
  lines.push('统一社会信用代码：' + (respondent.creditCode || '（请填写信用代码）'))
  lines.push('法定代表人：' + (respondent.legalRepresentative || '（请填写法定代表人）'))
  lines.push('地址：' + (respondent.address || '（请填写公司地址）'))
  lines.push('')
  lines.push('仲裁请求：')
  claims.forEach((claim, i) => {
    lines.push((i + 1) + '. ' + claim + ' ' + (claimAmounts[i] || ''))
  })
  if (claimAmounts.length > 0) {
    lines.push('')
    lines.push('合计请求金额：' + totalClaim)
  }
  lines.push('')
  lines.push('事实与理由：')
  lines.push('')
  lines.push('一、劳动关系建立情况')
  const contractStatusText = laborRelation.contractStatus === 'signed' 
    ? '双方已签订书面劳动合同。' 
    : laborRelation.contractStatus === 'unsigned' 
      ? '被申请人未与申请人签订书面劳动合同。' 
      : '劳动合同情况：' + (laborRelation.contractLostRemark || '待核实') + '。'
  lines.push('申请人于' + formatDate(laborRelation.startDate) + '入职被申请人处工作，担任（请填写岗位）职务，双方建立了劳动关系。' + contractStatusText)
  lines.push('')
  lines.push('二、工资薪酬情况')
  const wageStatusText = wageInfo.paymentStatus === 'normal' 
    ? '工资正常发放。' 
    : '近期工资发放存在问题：' + (wageInfo.paymentStatus === 'delayed' ? '存在延迟发放情况' : wageInfo.paymentStatus === 'withheld' ? '存在扣发情况' : '存在未发放情况') + '。'
  lines.push('申请人在职期间月工资标准为' + (wageInfo.monthlySalary || '（请填写）') + '元，工资通过银行转账方式发放。' + wageStatusText)
  lines.push('')
  lines.push('三、被申请人违法解除劳动关系情况')
  const reasonText = termination.reasonDescription || 
    (termination.reason === 'not_suitable' ? '"不合适"' : 
     termination.reason === 'performance' ? '"绩效考核不达标"' : 
     termination.reason === 'organizational' ? '"组织架构调整"' : '（请填写理由）')
  const noticeWayText = termination.way === 'oral_notice' 
    ? '被申请人仅通过口头方式通知申请人解除劳动关系，未出具书面解除通知。' 
    : termination.way === 'written_notice' 
      ? '被申请人向申请人出具了书面解除通知。' 
      : '被申请人未提供充分证据证明其解除行为的合法性。'
  lines.push(formatDate(termination.noticeDate || laborRelation.endDate || new Date().toISOString()) + '，被申请人以' + reasonText + '为由，通知申请人解除劳动关系。' + noticeWayText)
  lines.push('')
  lines.push('四、法律依据')
  lines.push('被申请人的上述行为已违反《中华人民共和国劳动合同法》的相关规定，严重侵害了申请人的合法权益。为维护申请人的合法权益，依据《中华人民共和国劳动争议调解仲裁法》等相关法律规定，申请人特向贵委提出仲裁申请，请求依法支持申请人的仲裁请求。')
  lines.push('')
  lines.push('此致')
  lines.push((respondent.address ? respondent.address.split('区')[0] + '区' : '（请填写）') + '劳动人事争议仲裁委员会')
  lines.push('')
  lines.push('申请人：' + (applicant.name || '（签名）'))
  lines.push(formatDate(new Date().toISOString()))
  lines.push('')
  lines.push('附件：')
  lines.push('1. 身份证复印件 1份')
  lines.push('2. 企业工商信息 1份')
  lines.push('3. 证据材料清单及证据复印件 ' + ((profile.evidence?.length || 0) + 1) + '份')

  return {
    type: 'arbitration_application',
    title: '劳动仲裁申请书（草稿）',
    content: lines.join('\n'),
    generatedAt: Date.now(),
  }
}

// ========================================
// 2. 证据目录
// ========================================
function generateEvidenceDirectory(profile: CaseProfile): DocumentContent {
  const { applicant, respondent, evidence } = profile

  const formatDate = (date: string) => {
    if (!date) return '____'
    const d = new Date(date)
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0')
  }

  // 建议证据
  const suggestedEvidence = [
    { name: '劳动合同', purpose: '证明劳动关系及合同期限' },
    { name: '工资银行流水', purpose: '证明工资标准及发放情况' },
    { name: '社保缴费记录', purpose: '证明社保缴纳情况' },
    { name: '辞退通知/聊天记录', purpose: '证明解除劳动关系的事实' },
    { name: '工作证/工牌', purpose: '证明劳动关系' },
    { name: '考勤记录', purpose: '证明工作时间（如有加班需提供）' },
    { name: '录用通知（Offer）', purpose: '证明入职约定条件' },
  ]

  const allEvidence = [
    ...evidence.map((e, i) => ({
      serial: i + 1,
      name: e.name,
      proofPurpose: e.proofPurpose,
      source: e.available ? '已有' : '需补充获取',
      remark: e.available ? '' : '（建议）',
    })),
    ...suggestedEvidence
      .filter((s) => !evidence.some((e) => e.name.includes(s.name)))
      .map((s, i) => ({
        serial: evidence.length + i + 1,
        name: s.name,
        proofPurpose: s.purpose,
        source: '建议补充获取',
        remark: '（建议）',
      })),
  ]

  const lines: string[] = []
  lines.push('证据目录')
  lines.push('')
  lines.push('申请人：' + (applicant.name || '（请填写）'))
  lines.push('被申请人：' + (respondent.name || '（请填写）'))
  lines.push('证据材料总数：' + allEvidence.length + '项')
  lines.push('')
  lines.push('┌────┬──────────────────┬────────────────────────────────┬──────────┬─────────┬────────┐')
  lines.push('│ 序号 │ 证据名称          │ 证明目的                       │ 页码     │ 来源    │ 备注   │')
  lines.push('├────┼──────────────────┼────────────────────────────────┼──────────┼─────────┼────────┤')
  allEvidence.forEach((e) => {
    const name = e.name.padEnd(12).slice(0, 12)
    const purpose = e.proofPurpose.slice(0, 16).padEnd(16)
    const source = e.source.slice(0, 4).padEnd(4)
    lines.push('│ ' + String(e.serial).padEnd(2) + ' │ ' + name + ' │ ' + purpose + ' │ ____    │ ' + source + '   │ ' + (e.remark || ' ') + '   │')
  })
  lines.push('└────┴──────────────────┴────────────────────────────────┴──────────┴─────────┴────────┘')
  lines.push('')
  lines.push('证据整理说明：')
  lines.push('')
  lines.push('1. 以上证据请按序号整理，每份证据标注页码；')
  lines.push('2. 证据原件请妥善保管，提交仲裁委时只需提交复印件（每份证据一式两份）；')
  lines.push('3. 电子证据（如微信聊天记录、邮件等）请截图打印，并保留原始载体；')
  lines.push('4. 银行流水请到银行柜台打印并加盖银行印章；')
  lines.push('5. 社保缴费记录请到社保经办机构自助打印或通过政务平台查询下载。')
  lines.push('')
  lines.push(formatDate(new Date().toISOString()))
  lines.push('申请人签名：' + (applicant.name || '（签名）'))

  return {
    type: 'evidence_directory',
    title: '证据目录（建议）',
    content: lines.join('\n'),
    generatedAt: Date.now(),
  }
}

// ========================================
// 3. 赔偿计算明细表
// ========================================
function generateCalculationStatement(
  profile: CaseProfile,
  calculation?: CalculationResult
): DocumentContent {
  const { applicant, respondent, wageInfo, laborRelation } = profile

  const formatDate = (date: string) => {
    if (!date) return '____'
    const d = new Date(date)
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
  }

  const duration = laborRelation.duration || 0
  const monthlySalary = wageInfo.monthlySalary || 4500
  const items = calculation?.items || []

  const lines: string[] = []
  lines.push('赔偿计算明细表')
  lines.push('')
  lines.push('申请人：' + (applicant.name || '（请填写）'))
  lines.push('被申请人：' + (respondent.name || '（请填写）'))
  lines.push('')
  lines.push('一、基本信息')
  lines.push('- 劳动关系存续期间：' + formatDate(laborRelation.startDate) + ' 至 ' + formatDate(laborRelation.endDate || ''))
  lines.push('- 在职时长：约' + duration + '个月')
  lines.push('- 月工资标准：' + monthlySalary + '元')
  lines.push('')
  lines.push('二、赔偿项目明细')
  lines.push('')
  lines.push('┌────┬────────────────────────┬──────────────────────────────┬────────────────────────────────────┬───────────┐')
  lines.push('│ 序号 │ 赔偿项目                │ 法律依据                     │ 计算过程                            │ 金额（元） │')
  lines.push('├────┼────────────────────────┼──────────────────────────────┼────────────────────────────────────┼───────────┤')
  items.forEach((item, i) => {
    const name = item.name.padEnd(12).slice(0, 12)
    const basis = item.legalBasis.slice(0, 12).padEnd(12)
    const process = item.calculationProcess.slice(0, 18).padEnd(18)
    lines.push('│ ' + String(i + 1).padEnd(2) + ' │ ' + name + ' │ ' + basis + ' │ ' + process + ' │ ' + String(item.amount).padEnd(7) + ' │')
  })
  lines.push('├────┴────────────────────────┴──────────────────────────────┴────────────────────────────────────┼───────────┤')
  lines.push('│                                                                                        合计 │ ' + String(calculation?.totalAmount || 0).padEnd(7) + ' │')
  lines.push('└─────────────────────────────────────────────────────────────────────────────────────────────────┴───────────┘')
  lines.push('')
  lines.push('三、说明')
  lines.push('')
  lines.push('1. 以上金额为系统初步测算结果，仅供参考，实际金额以仲裁裁决为准；')
  lines.push('')
  lines.push('2. 各项赔偿的法律依据：')
  lines.push('   - 违法解除赔偿金：《劳动合同法》第87条')
  lines.push('   - 代通知金：《劳动合同法》第40条')
  lines.push('   - 未签合同双倍工资：《劳动合同法》第82条')
  lines.push('   - 加班工资：《劳动法》第44条')
  lines.push('')
  lines.push('3. 部分项目需根据具体证据情况确定，建议咨询专业律师。')
  lines.push('')
  lines.push('四、免责声明')
  lines.push('本计算明细仅供参考，不构成正式的法律意见。实际仲裁结果受多种因素影响，包括证据完整性、仲裁员判断等。建议在正式提交仲裁前咨询专业劳动法律师。')
  lines.push('')
  lines.push(formatDate(new Date().toISOString()))

  return {
    type: 'calculation_statement',
    title: '赔偿计算明细表',
    content: lines.join('\n'),
    generatedAt: Date.now(),
  }
}

// ========================================
// 4. 维权行动清单
// ========================================
function generateActionChecklist(
  profile: CaseProfile,
  timeline?: TimelineEvent[]
): DocumentContent {
  const { applicant, respondent, laborRelation, termination } = profile

  const formatDate = (date: string) => {
    if (!date) return '____'
    const d = new Date(date)
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
  }

  // 计算仲裁时效
  const noticeDate = termination.noticeDate || laborRelation.endDate || new Date().toISOString()
  const deadlineDate = new Date(noticeDate)
  deadlineDate.setFullYear(deadlineDate.getFullYear() + 1)

  const steps = [
    {
      title: '收集基础材料',
      details: [
        '到社保部门打印社保缴费记录',
        '到银行打印工资流水（加盖银行印章）',
        '整理劳动合同（如有）',
        '收集工作群聊天记录、邮件等工作证据',
      ],
      remark: '约需1-2个工作日',
    },
    {
      title: '整理证据材料',
      details: [
        '按证据目录整理所有材料',
        '证据复印一式两份',
        '电子证据截图打印',
        '证据标注页码',
      ],
      remark: '约需1个工作日',
    },
    {
      title: '准备仲裁申请材料',
      details: [
        '填写仲裁申请书',
        '准备身份证复印件',
        '获取公司工商信息（国家企业信用信息公示系统）',
        '整理证据目录',
      ],
      remark: '约需1个工作日',
    },
    {
      title: '提交仲裁申请',
      details: [
        '到公司注册地的劳动仲裁委提交申请',
        '也可以通过微信"全国劳动人事争议调解服务平台"小程序提交',
        '仲裁委受理后5个工作日内反馈',
      ],
      remark: '注意时效！',
    },
  ]

  const lines: string[] = []
  lines.push('维权行动清单')
  lines.push('')
  lines.push('申请人：' + (applicant.name || '（请填写）'))
  lines.push('被申请人：' + (respondent.name || '（请填写）'))
  lines.push('生成日期：' + formatDate(new Date().toISOString()))
  lines.push('')
  lines.push('⏰ 重要时间提醒')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push('⚠️ 劳动仲裁时效：1年')
  lines.push('您的时效起算日：' + formatDate(noticeDate))
  lines.push('仲裁申请截止日：' + formatDate(deadlineDate.toISOString()))
  lines.push('')
  lines.push('请务必在截止日前提交仲裁申请！')
  lines.push('')
  lines.push('📋 维权步骤')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  steps.forEach((step, i) => {
    lines.push('【第' + (i + 1) + '步】' + step.title)
    step.details.forEach((detail) => {
      lines.push('  □ ' + detail)
    })
    lines.push('⏱️ 预计耗时：' + step.remark)
    lines.push('')
  })
  lines.push('📍 下一步办理机构')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push('仲裁提交地点：')
  lines.push('- ' + (respondent.address ? respondent.address.split('区')[0] + '区' : '（公司注册地）') + '劳动人事争议仲裁委员会')
  lines.push('- 或通过"全国劳动人事争议调解服务平台"微信小程序在线申请')
  lines.push('')
  lines.push('⚠️ 风险提示')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push('1. 仲裁时效为1年，从知道或应当知道权利被侵害之日起计算，务必按时提交申请；')
  lines.push('')
  lines.push('2. 如公司后续提供您"不符合录用条件"或"严重违反规章制度"的证据，可能影响违法解除的认定，建议提前准备相关反驳材料；')
  lines.push('')
  lines.push('3. 仲裁委一般会在受理后45天内安排开庭，请保持电话畅通；')
  lines.push('')
  lines.push('4. 如对仲裁裁决不服，可在收到裁决书之日起15日内向基层人民法院提起诉讼。')
  lines.push('')
  lines.push('💡 温馨提示')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push('1. 保持冷静，避免与公司发生直接冲突；')
  lines.push('2. 保留所有与公司沟通的记录；')
  lines.push('3. 如条件允许，可先尝试与公司协商；')
  lines.push('4. 如有疑问，可先到仲裁委咨询窗口了解流程。')
  lines.push('')
  lines.push(formatDate(new Date().toISOString()))

  return {
    type: 'action_checklist',
    title: '维权行动清单',
    content: lines.join('\n'),
    generatedAt: Date.now(),
  }
}

// ========================================
// 导出为文本（用于复制或下载）
// ========================================
export function exportAsText(doc: DocumentContent): string {
  return doc.content
}

// 触发下载
export function downloadDocument(doc: DocumentContent): void {
  const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = doc.title + '_' + new Date().toISOString().split('T')[0] + '.txt'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
