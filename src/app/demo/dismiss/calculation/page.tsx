'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Calculator, Scale } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculationResult } from '@/features/demo/data/dismiss-demo-data'
import { useDismissDemoStore } from '@/features/demo/state/use-dismiss-demo-store'
import { DismissDemoShell } from '@/features/demo/components/dismiss-demo-shell'

export default function DismissDemoCalculationPage() {
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
      step={3}
      title="本地规则引擎测算（演示）"
      description="本页展示固定测算结果，用于评审演示口径表达。"
      prevHref="/demo/dismiss/summary"
      nextHref="/demo/dismiss/documents"
      nextLabel="下一步：生成文书"
    >
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-4 flex items-start gap-2 text-amber-900 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <span>陕西口径说明：工资基数采用银行实发到手工资，不以合同税前工资直接替代。</span>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            赔偿测算结果
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-slate-700">工龄折算</p>
            <p className="font-semibold text-slate-900 mt-1">{calculationResult.workYears}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-sm text-slate-700">赔偿基数</p>
            <p className="font-semibold text-slate-900 mt-1">{calculationResult.monthlyBase}</p>
          </div>
          <div className="rounded-xl bg-white border-2 border-blue-300 p-4">
            <p className="text-sm text-slate-700">违法解除赔偿金</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{calculationResult.compensation}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-sm text-slate-700">税前口径对比</p>
            <p className="font-medium text-slate-900 mt-1">{calculationResult.comparison}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-xs text-slate-500">其他主张</p>
              <p className="text-sm text-slate-800 mt-1">{calculationResult.otherClaim}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-xs text-slate-500">仲裁时效</p>
              <p className="text-sm text-slate-800 mt-1">{calculationResult.limitation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="py-4 text-sm text-slate-700 flex items-start gap-2">
          <Scale className="w-4 h-4 mt-0.5 text-slate-500" />
          <span>规则来源：{calculationResult.legalBasis}</span>
        </CardContent>
      </Card>
    </DismissDemoShell>
  )
}
