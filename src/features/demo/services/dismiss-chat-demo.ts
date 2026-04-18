import type { CaseProfile } from '@/lib/types'
import type { ConsultationInfo } from '@/features/consultation/services/consultation-profile'

export interface DismissDemoStepCard {
  title: string
  description: string
  highlight: string
}

export const dismissDemoStepCards: DismissDemoStepCard[] = [
  {
    title: '步骤1：首页入口',
    description: '从首页点击违法辞退演示卡片进入咨询页。',
    highlight: '1分钟',
  },
  {
    title: '步骤2：多轮问诊',
    description: '固定 8 轮追问，覆盖工资、合同、辞退、社保与证据。',
    highlight: '3-4分钟',
  },
  {
    title: '步骤3：要素抽取',
    description: '把聊天信息整理成结构化案情摘要卡。',
    highlight: '1分钟',
  },
  {
    title: '步骤4：规则测算',
    description: '按陕西口径以到手工资计算赔偿金。',
    highlight: '1-2分钟',
  },
  {
    title: '步骤5：文书生成',
    description: '输出仲裁申请书、证据目录与行动清单。',
    highlight: '2分钟',
  },
  {
    title: '步骤6：分流转介',
    description: '展示复杂度、风险与律师推荐建议。',
    highlight: '1分钟',
  },
  {
    title: '步骤7：总结回顾',
    description: '在聊天中完成整条闭环回顾。',
    highlight: '1分钟',
  },
]

export function getDismissDemoStageIndex(turnCount: number): number {
  if (turnCount <= 0) return 1
  if (turnCount < 8) return 2
  if (turnCount === 8) return 3
  if (turnCount === 9) return 4
  if (turnCount === 10) return 5
  if (turnCount === 11) return 6
  return 7
}

export function getDismissDemoStageSummary(turnCount: number) {
  const stageIndex = getDismissDemoStageIndex(turnCount)
  const card = dismissDemoStepCards[stageIndex - 1]
  return {
    stageIndex,
    stepLabel: card?.title ?? '步骤7：总结回顾',
    description: card?.description ?? '在聊天中完成整条闭环回顾。',
    highlight: card?.highlight ?? '1分钟',
  }
}
export const dismissDemoCaseProfile: CaseProfile = {
  applicant: {
    name: '张女士',
    phone: '138****0000',
  },
  respondent: {
    name: '西安某科技有限公司',
    address: '西安市高新区',
  },
  laborRelation: {
    startDate: '2023-03-01',
    endDate: '2025-04-10',
    duration: 25,
    contractStatus: 'signed',
  },
  wageInfo: {
    monthlySalary: 5600,
    salaryStructure: [],
    paymentStatus: 'normal',
  },
  socialSecurity: {
    status: 'partial',
    unpaidMonths: 2,
  },
  termination: {
    way: 'oral_notice',
    reason: 'organizational',
    reasonDescription: '公司主张岗位调整、组织优化，但未提供考核或违纪材料',
    noticeDate: '2025-04-10',
    lastWorkDate: '2025-04-10',
  },
  disputeTypes: ['illegal_dismissal', 'social_security_arrears'],
  evidence: [
    {
      name: '工资银行流水',
      proofPurpose: '证明到手工资标准（测算基数依据）',
      available: true,
    },
    {
      name: '工牌',
      proofPurpose: '证明劳动关系',
      available: true,
    },
    {
      name: '打卡记录',
      proofPurpose: '证明实际出勤情况',
      available: true,
    },
    {
      name: '微信辞退截图',
      proofPurpose: '证明口头辞退事实',
      available: true,
    },
  ],
  disputePhase: 'none',
}

export const dismissDemoConsultationInfo: ConsultationInfo = {
  entryDate: '2023-03-01',
  exitDate: '2025-04-10',
  wage: 5600,
  contract: 'signed',
  socialSecurity: false,
  terminationMethod: 'verbal',
  terminationReason: '岗位调整、组织优化',
  evidence: ['工资流水', '工牌', '打卡记录', '微信辞退截图'],
  previousAction: 'none',
}

export const dismissDemoGreeting = `您好，这里是违法辞退的陕西口径演示模式。

我会直接在这个聊天里按固定流程帮您整理：案情、测算、文书、分流建议。

咱们先从第1个问题开始：您手里有没有工资流水、工牌和打卡记录？`

export function getDismissDemoAssistantReply(turnIndex: number): string {
  switch (turnIndex) {
    case 0:
      return `我记下了。第2个问题：您的合同工资是多少，到手工资是多少？

在陕西口径下，后面的测算会按到手工资来做。`
    case 1:
      return `明白了。第3个问题：您签过书面劳动合同吗？如果签过，手里还有没有副本？`
    case 2:
      return `好的。第4个问题：公司是口头通知您离职，还是给了书面通知？`
    case 3:
      return `我了解了。第5个问题：公司给出的辞退理由是什么？有没有考核不合格或违纪材料？`
    case 4:
      return `收到。第6个问题：您的社保缴到什么时候？2025年3月和4月有没有断缴？`
    case 5:
      return `好的。第7个问题：您离职后有没有办理交接，或者签过离职协议？`
    case 6:
      return `我已经把前面的信息串起来了。第8个问题：您之前有没有找公司协商，或者去劳动仲裁咨询过？`
    case 7:
      return `我把这条案子整理好了，给您直接出一个聊天里的结果卡：

【案情摘要】
2023年3月入职，2025年4月被口头通知离职；书面劳动合同已签；实际到手工资约5600元；公司主张岗位调整/组织优化，但没有给出考核或违纪材料；2025年3月至4月社保断缴情形明显。

【陕西口径测算】
工龄约2年1个月，按2.5个月计算；以到手工资5600元为基数，违法解除赔偿金约28,000元。若按税前6500元计算，则约32,500元，差额4,500元。

【文书建议】
可直接准备仲裁申请书草稿、证据目录和行动清单；重点证据是工资流水、工牌、打卡记录和微信辞退截图。

【分流建议】
这类案子属于中等复杂度，建议律师介入，重点核对工资基数口径和公司解除理由。

如果您愿意，我下一条可以继续按“提交仲裁前要准备什么”帮您列成清单。`
    default:
      return `我已经把这条演示案子整理完了。您可以继续问赔偿、材料清单，或者直接问仲裁流程。`
  }
}