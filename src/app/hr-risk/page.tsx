'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Shield,
  FileText,
  Users,
  Building2,
  Clock,
  Download,
  ChevronRight,
  Scale,
} from 'lucide-react'
import {
  checkOfferLetterRisk,
  checkProbationRisk,
  checkEmployeeHandbookRisk,
  checkRewardPunishmentRisk,
  checkTerminationRisk,
  checkTransferRisk,
  checkContractRenewalRisk,
  checkWorkingHoursRisk,
  generateComprehensiveRiskReport,
  SCENARIO_NAMES,
} from '@/lib/hr-risk-check'
import type { RiskCheck, RiskScenario } from '@/lib/types'

// 风险场景组件映射
const RISK_CHECK_FUNCTIONS: Record<RiskScenario, () => RiskCheck> = {
  offer_letter: () => checkOfferLetterRisk(true, false, true),
  probation: () => checkProbationRisk(6, false, false, false),
  employee_handbook: () => checkEmployeeHandbookRisk(true, 'v1.0', false, false),
  reward_punishment: () => checkRewardPunishmentRisk(false, false, false),
  termination: () => checkTerminationRisk('oral', false, false, false),
  transfer: () => checkTransferRisk(false, false, false, false),
  contract_renewal: () => checkContractRenewalRisk('2025-01-01', false, 0, false),
  working_hours: () => checkWorkingHoursRisk('standard', false, false, false),
}

export default function HRRiskCheckPage() {
  const [checks, setChecks] = useState<RiskCheck[]>([])
  const [selectedCheck, setSelectedCheck] = useState<RiskCheck | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 执行所有检查
  const runAllChecks = () => {
    const results: RiskCheck[] = []
    for (const scenario of Object.keys(RISK_CHECK_FUNCTIONS) as RiskScenario[]) {
      results.push(RISK_CHECK_FUNCTIONS[scenario]())
    }
    setChecks(results)
  }

  // 执行单个检查
  const runSingleCheck = (scenario: RiskScenario) => {
    const check = RISK_CHECK_FUNCTIONS[scenario]()
    setSelectedCheck(check)
    setSheetOpen(true)
  }

  // 综合报告
  const report = checks.length > 0 ? generateComprehensiveRiskReport(checks) : null

  const getLevelColor = (level: RiskCheck['level']) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getLevelIcon = (level: RiskCheck['level']) => {
    switch (level) {
      case 'low':
        return <CheckCircle2 className="w-4 h-4" />
      case 'medium':
        return <Info className="w-4 h-4" />
      case 'high':
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">HR风险预警</h1>
              <p className="text-xs text-slate-500">中小企业用工合规助手</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Building2 className="w-3 h-3 mr-1" />
            企业端工具
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 介绍卡片 */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Scale className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 mb-2">HR风险预警与轻合规模块</h2>
                <p className="text-sm text-slate-600">
                  为中小企业提供低成本的前置辅助工具，帮助识别常见用工风险，<br />
                  覆盖录用通知留痕、试用期规则、员工手册公示、奖惩制度告知、<br />
                  离职证据留存、调岗调薪程序等常见场景。
                </p>
                <Button
                  onClick={runAllChecks}
                  className="mt-4 bg-amber-500 hover:bg-amber-600"
                >
                  开始风险评估
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 综合评估报告 */}
        {report && (
          <Card className={`border-2 ${
            report.overallLevel === 'critical' ? 'border-red-300' :
            report.overallLevel === 'high' ? 'border-orange-300' :
            report.overallLevel === 'medium' ? 'border-yellow-300' :
            'border-green-300'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                综合风险评估报告
              </CardTitle>
              <CardDescription>
                基于{checks.length}项风险场景的全面检查
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`text-center p-4 rounded-xl ${
                  report.overallLevel === 'critical' ? 'bg-red-100' :
                  report.overallLevel === 'high' ? 'bg-orange-100' :
                  report.overallLevel === 'medium' ? 'bg-yellow-100' :
                  'bg-green-100'
                }`}>
                  <p className={`text-3xl font-bold ${
                    report.overallLevel === 'critical' ? 'text-red-600' :
                    report.overallLevel === 'high' ? 'text-orange-600' :
                    report.overallLevel === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {report.overallLevel === 'critical' ? '极高' :
                     report.overallLevel === 'high' ? '较高' :
                     report.overallLevel === 'medium' ? '中等' : '较低'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">整体风险等级</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-100">
                  <p className="text-3xl font-bold text-slate-600">{checks.length}</p>
                  <p className="text-xs text-slate-500 mt-1">检查项目</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-red-100">
                  <p className="text-3xl font-bold text-red-600">
                    {checks.filter(c => c.level === 'high' || c.level === 'critical').length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">高风险项</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-100">
                  <p className="text-3xl font-bold text-green-600">
                    {checks.filter(c => c.level === 'low').length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">低风险项</p>
                </div>
              </div>

              <p className="text-sm text-slate-700">{report.summary}</p>

              {report.priorityItems.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <h4 className="font-medium text-slate-800 mb-2">优先整改项目</h4>
                  <div className="space-y-2">
                    {report.priorityItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-red-800">{SCENARIO_NAMES[item.scenario]}</p>
                          <p className="text-xs text-red-600">{item.warnings[0]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 风险场景列表 */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="high">高风险</TabsTrigger>
            <TabsTrigger value="medium">中风险</TabsTrigger>
            <TabsTrigger value="low">低风险</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid gap-4">
              {Object.entries(SCENARIO_NAMES).map(([scenario, name]) => (
                <RiskScenarioCard
                  key={scenario}
                  scenario={scenario as RiskScenario}
                  name={name}
                  check={checks.find(c => c.scenario === scenario)}
                  onCheck={() => runSingleCheck(scenario as RiskScenario)}
                  getLevelColor={getLevelColor}
                  getLevelIcon={getLevelIcon}
                />
              ))}
            </div>
          </TabsContent>

          {['high', 'medium', 'low'].map(level => (
            <TabsContent key={level} value={level} className="mt-4">
              <div className="grid gap-4">
                {checks
                  .filter(c => c.level === level)
                  .map(check => (
                    <RiskScenarioCard
                      key={check.scenario}
                      scenario={check.scenario}
                      name={SCENARIO_NAMES[check.scenario]}
                      check={check}
                      onCheck={() => runSingleCheck(check.scenario)}
                      getLevelColor={getLevelColor}
                      getLevelIcon={getLevelIcon}
                    />
                  ))}
                {checks.filter(c => c.level === level).length === 0 && (
                  <Card className="bg-slate-50">
                    <CardContent className="py-8 text-center text-slate-500">
                      暂无{level === 'high' ? '高' : level === 'medium' ? '中' : '低'}风险项目
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* 风险详情弹窗 */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[600px] max-w-full">
            {selectedCheck && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {SCENARIO_NAMES[selectedCheck.scenario]}
                    <Badge className={getLevelColor(selectedCheck.level)}>
                      {getLevelIcon(selectedCheck.level)}
                      <span className="ml-1">
                        {selectedCheck.level === 'low' ? '低风险' :
                         selectedCheck.level === 'medium' ? '中风险' :
                         selectedCheck.level === 'high' ? '高风险' : '极高风险'}
                      </span>
                    </Badge>
                  </SheetTitle>
                  <SheetDescription>
                    {selectedCheck.legalBasis && (
                      <span className="text-blue-600">法律依据：{selectedCheck.legalBasis}</span>
                    )}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* 风险警告 */}
                  {selectedCheck.warnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        风险提示
                      </h4>
                      <ul className="space-y-2">
                        {selectedCheck.warnings.map((warning, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-red-500">•</span>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 整改建议 */}
                  {selectedCheck.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        整改建议
                      </h4>
                      <ul className="space-y-2">
                        {selectedCheck.suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-green-500">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <Button className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      下载整改方案
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      导出报告
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </main>

      {/* 底部提示 */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <p className="text-xs text-slate-500 text-center">
            本工具仅提供合规参考，不替代专业法务服务。如有复杂问题，请咨询专业律师。
          </p>
        </div>
      </footer>
    </div>
  )
}

// 风险场景卡片组件
interface RiskScenarioCardProps {
  scenario: RiskScenario
  name: string
  check?: RiskCheck
  onCheck: () => void
  getLevelColor: (level: RiskCheck['level']) => string
  getLevelIcon: (level: RiskCheck['level']) => React.ReactNode
}

function RiskScenarioCard({
  scenario,
  name,
  check,
  onCheck,
  getLevelColor,
  getLevelIcon,
}: RiskScenarioCardProps) {
  const getScenarioIcon = (scenario: RiskScenario) => {
    switch (scenario) {
      case 'offer_letter':
        return <FileText className="w-5 h-5" />
      case 'probation':
        return <Clock className="w-5 h-5" />
      case 'employee_handbook':
        return <Book className="w-5 h-5" />
      case 'reward_punishment':
        return <AlertTriangle className="w-5 h-5" />
      case 'termination':
        return <Users className="w-5 h-5" />
      case 'transfer':
        return <Building2 className="w-5 h-5" />
      case 'contract_renewal':
        return <FileText className="w-5 h-5" />
      case 'working_hours':
        return <Clock className="w-5 h-5" />
      default:
        return <Shield className="w-5 h-5" />
    }
  }

  return (
    <Card className={check && (check.level === 'high' || check.level === 'critical') ? 'border-orange-200' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              check && (check.level === 'high' || check.level === 'critical')
                ? 'bg-orange-100 text-orange-600'
                : check && check.level === 'medium'
                ? 'bg-yellow-100 text-yellow-600'
                : check && check.level === 'low'
                ? 'bg-green-100 text-green-600'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {getScenarioIcon(scenario)}
            </div>
            <div>
              <p className="font-medium text-slate-800">{name}</p>
              {check ? (
                <p className="text-xs text-slate-500">
                  发现{check.warnings.length}项风险提示
                </p>
              ) : (
                <p className="text-xs text-slate-500">点击开始检查</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {check && (
              <Badge className={getLevelColor(check.level)}>
                {getLevelIcon(check.level)}
                <span className="ml-1">
                  {check.level === 'low' ? '低' :
                   check.level === 'medium' ? '中' :
                   check.level === 'high' ? '高' : '极高'}
                </span>
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={onCheck}>
              {check ? '查看详情' : '开始检查'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Book 图标组件
function Book({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}
