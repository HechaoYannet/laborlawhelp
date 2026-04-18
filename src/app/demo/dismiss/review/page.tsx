'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Home, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { reviewSteps } from '@/features/demo/data/dismiss-demo-data'
import { useDismissDemoStore } from '@/features/demo/state/use-dismiss-demo-store'
import { DismissDemoShell } from '@/features/demo/components/dismiss-demo-shell'

export default function DismissDemoReviewPage() {
  const router = useRouter()
  const { hydrated, isCompleted, resetDemo } = useDismissDemoStore()

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
      step={6}
      title="全链路总结回顾"
      description="演示链路已完成，可用于评审讲解或现场重放。"
      prevHref="/demo/dismiss/triage"
    >
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">流程结果一览</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviewSteps.map((step, index) => (
            <div key={step.name} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">步骤 {index + 1}</p>
              <p className="font-medium text-slate-900 mt-1">{step.name}</p>
              <p className="text-sm text-slate-700 mt-1">{step.result}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-5 text-sm text-slate-800 leading-7">
          <p>对劳动者：从“不知道怎么开始”到“拿到可行动的结果”</p>
          <p>对律师：从“听当事人讲半小时”到“直接看案情卡接手”</p>
          <p>对律所：低成本的数字入口，沉淀本地规则，筛选案源</p>
          <p className="font-semibold text-blue-700">陕西口径价值：税前 32,500 元 vs 到手 28,000 元，差额 4,500 元</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={resetDemo} asChild>
          <Link href="/demo/dismiss">
            <RotateCcw className="w-4 h-4 mr-1" />
            重新演示
          </Link>
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/">
            <Home className="w-4 h-4 mr-1" />
            返回首页
          </Link>
        </Button>
      </div>
    </DismissDemoShell>
  )
}
