// ========================================
// 劳动法咨询平台 - 核心类型定义
// ========================================

// 争议类型枚举
export type DisputeType =
  | 'illegal_dismissal'        // 违法解除/辞退
  | 'wage_arrears'            // 工资拖欠
  | 'unpaid_overtime'         // 加班费未支付
  | 'contract_not_signed'      // 未签劳动合同
  | 'contract_expired'         // 劳动合同到期未续签
  | 'work_injury'             // 工伤
  | 'social_security_arrears' // 社保欠缴
  | 'leave_arrears'           // 年假/调休未休
  | 'other'                   // 其他

// 合同签署状态
export type ContractStatus =
  | 'signed'          // 已签合同
  | 'unsigned'        // 未签合同
  | 'lost'            // 合同丢失
  | 'expired'         // 合同到期
  | 'unknown'         // 不清楚

// 离职/解除方式
export type TerminationWay =
  | 'oral_notice'     // 口头通知
  | 'written_notice'  // 书面通知
  | 'no_notice'       // 未通知（直接不让来）
  | 'negotiated'      // 协商解除
  | 'forced_resign'   // 被迫离职
  | 'voluntary_resign' // 主动辞职
  | 'unknown'         // 不清楚

// 离职理由
export type TerminationReason =
  | 'not_suitable'    // "不合适"
  | 'performance'     // 绩效考核不达标
  | 'organizational'  // 组织架构调整
  | 'business_loss'   // 经营亏损
  | 'violation'       // 违反规章制度
  | 'negotiated'      // 协商一致
  | 'unknown'         // 不清楚/未说明

// 社保缴纳状态
export type SocialSecurityStatus =
  | 'full'           // 正常缴纳
  | 'partial'        // 部分缴纳
  | 'not_paid'       // 未缴纳
  | 'unknown'        // 不清楚

// 工资支付状态
export type WagePaymentStatus =
  | 'normal'         // 正常
  | 'delayed'        // 延迟发放
  | 'withheld'       // 扣发
  | 'not_paid'       // 未发放

// 维权阶段
export type DisputePhase =
  | 'negotiation'    // 协商阶段
  | 'mediation'      // 调解阶段
  | 'arbitration'    // 仲裁阶段
  | 'litigation'     // 诉讼阶段（一审/二审）
  | 'execution'      // 执行阶段
  | 'none'           // 尚未开始

// 证据类型
export interface Evidence {
  name: string           // 证据名称
  proofPurpose: string   // 证明目的
  available: boolean     // 是否已有
  remark?: string        // 备注
}

// 工资结构项
export interface WageComponent {
  type: 'base' | 'bonus' | 'overtime' | 'allowance' | 'deduction'
  name: string
  amount: number
}

// ========================================
// 结构化案情卡
// ========================================
export interface CaseProfile {
  // 劳动者信息
  applicant: {
    name: string
    idNumber?: string
    phone?: string
    address?: string
  }

  // 用人单位信息
  respondent: {
    name: string
    creditCode?: string       // 统一社会信用代码
    legalRepresentative?: string
    address?: string
  }

  // 劳动关系信息
  laborRelation: {
    startDate: string                    // 入职日期
    endDate?: string                     // 离职日期
    duration: number                     // 在职时长（月）
    contractStatus: ContractStatus       // 合同签署状态
    contractLostRemark?: string          // 合同丢失说明
    probationPeriod?: number             // 试用期（月）
  }

  // 工资信息
  wageInfo: {
    monthlySalary: number                // 月工资
    salaryStructure: WageComponent[]    // 工资构成
    paymentStatus: WagePaymentStatus    // 支付状态
    unpaidMonths?: number               // 欠薪月数
    unpaidAmount?: number              // 欠薪金额
  }

  // 社保情况
  socialSecurity: {
    status: SocialSecurityStatus
    unpaidMonths?: number
    unpaidAmount?: number
  }

  // 离职情况
  termination: {
    way: TerminationWay
    reason: TerminationReason
    reasonDescription?: string
    noticeDate?: string                 // 通知日期
    lastWorkDate?: string               // 最后工作日
  }

  // 争议类型
  disputeTypes: DisputeType[]

  // 证据情况
  evidence: Evidence[]

  // 维权进度
  disputePhase: DisputePhase

  // 其他补充
  otherInfo?: string
}

// ========================================
// 事实时间轴
// ========================================
export interface TimelineEvent {
  date: string
  title: string
  description?: string
  type: 'entry' | 'contract' | 'wage' | 'social' | 'termination' | 'dispute' | 'other'
}

export interface FactTimeline {
  events: TimelineEvent[]
  currentPhase: DisputePhase
}

// ========================================
// 赔偿计算结果
// ========================================
export type CalculationCategory =
  | 'system_estimate'      // 系统测算
  | 'formal_judgment'       // 正式裁判结果
  | 'need_lawyer_review'   // 需律师复核

export interface CalculationItem {
  name: string
  legalBasis: string        // 法律依据
  calculationBasis: string   // 计算依据
  calculationProcess: string // 计算过程
  amount: number
  remark?: string
  category: CalculationCategory
}

export interface CalculationResult {
  items: CalculationItem[]
  totalAmount: number
  summary: string
  disclaimer: string         // 免责声明
}

// ========================================
// 对话消息
// ========================================
export type MessageRole = 'user' | 'assistant' | 'system'

export interface DialogueMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  turnId?: number
  metadata?: {
    type?: 'emotion_detected' | 'info_extracted' | 'question' | 'document'
    data?: Record<string, unknown>
  }
}

// ========================================
// 对话阶段
// ========================================
export type DialogueStage =
  | 'initial'              // 初始阶段（情绪安抚）
  | 'gathering_basic'      // 收集基本信息
  | 'gathering_labor'      // 收集劳动关系信息
  | 'gathering_wage'       // 收集工资信息
  | 'gathering_termination' // 收集离职信息
  | 'gathering_evidence'   // 收集证据信息
  | 'summarizing'          // 总结案情
  | 'calculating'          // 赔偿计算
  | 'generating_documents'  // 生成文书
  | 'lawyer_referral'      // 律师推荐
  | 'completed'            // 完成

// 引导问题配置
export interface GuidanceQuestion {
  id: string
  stage: DialogueStage
  question: string
  hint?: string
  options?: string[]
  field?: keyof CaseProfile
  subField?: string
}

// ========================================
// 文书类型
// ========================================
export type DocumentType =
  | 'arbitration_application'   // 仲裁申请书
  | 'evidence_directory'        // 证据目录
  | 'calculation_statement'     // 赔偿计算明细表
  | 'action_checklist'         // 维权行动清单

export interface DocumentContent {
  type: DocumentType
  title: string
  content: string
  generatedAt: number
}

// ========================================
// 繁简分流
// ========================================
export type CaseComplexity = 'simple' | 'moderate' | 'complex'

export interface CaseTriagResult {
  complexity: CaseComplexity
  dimensions: {
    disputeAmount: number
    evidenceScore: number      // 0-100
    legalRelations: number     // 1-5
    hasInjuryGrade: boolean
    nearDeadline: boolean
    multipleParties: boolean
    specialIndustry: boolean
  }
  recommended: {
    selfHelp: boolean
    lawyerMatch: boolean
    urgency: 'low' | 'medium' | 'high'
  }
  reason: string
}

// ========================================
// 律师推荐
// ========================================
export interface LawyerProfile {
  id: string
  name: string
  firm: string
  regions: string[]           // 服务地区
  caseTypes: DisputeType[]    // 专长案件类型
  experienceLevel: 'junior' | 'mid' | 'senior'
  reputationScore: number      // 信誉评分 0-100
  phone?: string
  consultationFee?: number
  freeConsultation: boolean
}

// ========================================
// HR风险预警
// ========================================
export type RiskScenario =
  | 'offer_letter'        // 录用通知留痕
  | 'probation'           // 试用期合规
  | 'employee_handbook'   // 员工手册公示
  | 'reward_punishment'  // 奖惩制度告知
  | 'termination'        // 离职证据留存
  | 'transfer'           // 调岗调薪程序
  | 'contract_renewal'   // 合同续签管理
  | 'working_hours'       // 工时制度

export interface RiskCheck {
  scenario: RiskScenario
  level: 'low' | 'medium' | 'high' | 'critical'
  warnings: string[]
  suggestions: string[]
  legalBasis?: string
}
