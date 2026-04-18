export interface DemoQuestion {
  id: number
  question: string
  options: string[]
}

export interface CaseSummary {
  period: string
  contractSalary: string
  actualSalary: string
  hasContract: string
  dismissMethod: string
  dismissReason: string
  socialSecurity: string
  handover: string
  evidence: string[]
}

export interface CalculationResultSummary {
  workYears: string
  monthlyBase: string
  compensation: string
  comparison: string
  otherClaim: string
  limitation: string
  legalBasis: string
}

export interface TriageResultSummary {
  complexity: string
  risk: string
  caliberRisk: string
  recommendation: string
}

export interface ReviewStep {
  name: string
  result: string
}

export interface EvidenceRow {
  serial: number
  name: string
  purpose: string
  status: string
}

export const demoQuestions: DemoQuestion[] = [
  {
    id: 1,
    question: '请问您是否有劳动关系证明？（工资流水、工牌、打卡记录等）',
    options: ['有，我有工资银行流水、工牌和打卡记录', '没有', '我不确定'],
  },
  {
    id: 2,
    question: '您的月工资是多少？构成是怎样的？',
    options: ['合同写的是税前6500，但每月到手就5600左右', '只有合同约定工资', '我不确定'],
  },
  {
    id: 3,
    question: '到手工资和合同约定工资的差额是什么？（税费、社保扣缴等）',
    options: ['扣了个税和个人社保，具体多少我不太清楚', '知道具体扣除金额', '我不确定'],
  },
  {
    id: 4,
    question: '您是否签署了书面劳动合同？',
    options: ['是，签过的', '没有签', '我不确定'],
  },
  {
    id: 5,
    question: '公司是怎么通知您离职的？有书面通知吗？',
    options: ['主管口头说的，没有书面通知，但有微信对话截图', '有书面通知', '没有书面通知，也没有截图', '我不确定'],
  },
  {
    id: 6,
    question: '公司给出的辞退理由是什么？',
    options: ['说是岗位调整、组织优化，但没有给我看过任何考核或违纪材料', '有考核不合格通知', '有违纪处理决定', '我不确定'],
  },
  {
    id: 7,
    question: '您的社保缴到什么时候？',
    options: ['缴到2025年2月，3月和4月没缴', '一直正常缴纳', '不清楚', '我不确定'],
  },
  {
    id: 8,
    question: '您离职后是否办理过交接、签过协议？',
    options: ['没有', '办过交接', '签过离职协议', '我不确定'],
  },
]

export const presetAnswers: number[] = [0, 0, 0, 0, 0, 0, 0, 0]

export const caseSummary: CaseSummary = {
  period: '2023.03 — 2025.04（约2年1个月）',
  contractSalary: '6,500元/月',
  actualSalary: '约5,600元/月（扣除个税及个人社保）',
  hasContract: '已签订',
  dismissMethod: '口头通知，无书面，有微信截图',
  dismissReason: '公司主张岗位调整/组织优化，无考核违纪证据',
  socialSecurity: '2023.03—2025.02正常，2025.03—04断缴',
  handover: '未办理交接，未签协议',
  evidence: ['工资银行流水', '工牌', '打卡记录', '微信辞退截图'],
}

export const calculationResult: CalculationResultSummary = {
  workYears: '2年1个月 → 按2.5个月计算',
  monthlyBase: '5,600元（银行实发金额，陕西口径）',
  compensation: '5,600 × 2.5 × 2 = 28,000元',
  comparison: '如按税前工资：6,500 × 2.5 × 2 = 32,500元（差额4,500元）',
  otherClaim: '补缴2025年3月至4月社会保险',
  limitation: '自知道权利被侵害之日起1年内',
  legalBasis: '《劳动合同法》第47条、第87条；陕西省高院《解答》（陕高法〔2020〕118号）第18条',
}

export const arbitrationDraft = `申请人：张女士
被申请人：西安某科技有限公司

请求事项：
1. 确认用人单位单方解除劳动合同行为违法；
2. 支付违法解除劳动合同赔偿金28,000元（按陕西口径，月工资基数以5,600元计算）；
3. 补缴2025年3月至4月社会保险。

事实与理由：
（根据案情摘要自动填充，此处展示固定文本）
申请人于2023年3月入职被申请人处，从事行政文员工作，双方签订书面劳动合同，合同约定税前工资6,500元/月，实际到手工资约5,600元/月。2025年4月10日，被申请人部门主管口头通知申请人“不用来了”，未出具书面解除通知，未办理交接手续。被申请人主张因岗位调整、组织优化解除劳动合同，但未提供任何考核不合格或违纪证据……`

export const evidenceRows: EvidenceRow[] = [
  { serial: 1, name: '工资银行流水', purpose: '证明到手工资标准（测算基数依据）', status: '已持有' },
  { serial: 2, name: '劳动合同', purpose: '证明劳动关系存续', status: '已持有' },
  { serial: 3, name: '工牌', purpose: '证明劳动关系', status: '已持有' },
  { serial: 4, name: '打卡记录截图', purpose: '证明实际出勤情况', status: '已持有' },
  { serial: 5, name: '微信辞退对话截图', purpose: '证明口头辞退事实', status: '已持有' },
  { serial: 6, name: '社保缴纳记录', purpose: '证明社保断缴事实', status: '需自行打印' },
  { serial: 7, name: '公司组织架构/岗位调整通知', purpose: '反证公司未举证正当理由', status: '建议补充' },
  { serial: 8, name: '工资条/工资明细', purpose: '佐证税前税后差额（本地口径依据）', status: '建议补充' },
]

export const actionChecklist: string[] = [
  '立即保全微信聊天记录（截图+录屏），防止对方撤回或删除。',
  '登录国家社会保险公共服务平台，打印社保缴纳记录。',
  '打印近12个月工资银行流水（注意：必须是实发到手的金额，而非合同约定的税前工资）。',
  '如有工资条或工资明细，一并保存（可证明税前税后差额，支持本地口径计算）。',
  '在1年内向公司注册地劳动人事争议仲裁委员会提交仲裁申请。',
  '如公司后续提供书面辞退通知，注意留存。',
]

export const triageResult: TriageResultSummary = {
  complexity: '中等（违法解除+社保补缴双主张）',
  risk: '中等（公司可能抗辩岗位调整属合法裁员）',
  caliberRisk: '工资基数计算口径存在地域差异，需律师协助确认',
  recommendation: '推荐律师介入',
}

export const reviewSteps: ReviewStep[] = [
  { name: '首页案型入口', result: '违法辞退' },
  { name: '多轮问诊', result: '8个核心问题（含到手工资确认）' },
  { name: '要素抽取', result: '案情摘要卡（区分到手/税前工资）' },
  { name: '规则测算', result: '28,000元（按到手5,600元）+社保补缴' },
  { name: '文书生成', result: '仲裁申请书+证据目录+行动清单' },
  { name: '分流建议', result: '推荐律师（含口径风险提示）' },
]

export const flowSteps: string[] = ['问诊', '要素抽取', '规则测算', '文书生成', '分流转介', '总结回顾']
