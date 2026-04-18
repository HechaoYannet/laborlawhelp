'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { caseSummary } from '@/features/demo/data/dismiss-demo-data'
import { useDismissDemoStore } from '@/features/demo/state/use-dismiss-demo-store'
import { DismissDemoShell } from '@/features/demo/components/dismiss-demo-shell'

const summaryItems: Array<{ label: string; value: string }> = [
  { label: '劳动关系期间', value: caseSummary.period },
  { label: '合同约定工资', value: caseSummary.contractSalary },
  { label: '实际到手工资', value: caseSummary.actualSalary },
  { label: '劳动合同状态', value: caseSummary.hasContract },
  { label: '辞退通知方式', value: caseSummary.dismissMethod },
  { label: '辞退理由', value: caseSummary.dismissReason },
  { label: '社保状态', value: caseSummary.socialSecurity },
  { label: '交接与协议', value: caseSummary.handover },
]

export default function DismissDemoSummaryPage() {
  const router = useRouter()
  const { hydrated, isCompleted } = useDismissDemoStore()

  useEffect(() => {
    if (hydrated && !isCompleted) {
      router.replace('/demo/dismiss')
    }
  }, [hydrated, isCompleted, router])

  if (!hydrated || !isCompleted) {
    return null
  }

  return (
    <DismissDemoShell
      step={2}
      title="要素抽取与案情摘要"
      description="基于固定问诊答案生成结构化案情卡片（演示模式）。"
      prevHref="/demo/dismiss"
      nextHref="/demo/dismiss/calculation"
      nextLabel="下一步：规则测算"
    >
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-4 text-amber-900 text-sm">
          基于陕西口径：工资基数以到手工资为准。
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">案情摘要卡</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-sm text-slate-800 leading-6">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">证据清单</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {caseSummary.evidence.map((evidence) => (
            <div key={evidence} className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{evidence}</span>
            </div>
          ))}
          <div className="pt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">结构化字段仅用于演示，不调用后端接口</Badge>
          </div>
        </CardContent>
      </Card>
    </DismissDemoShell>
  )
}
