'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Building2, Send, Shield, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { triageResult } from '@/features/demo/data/dismiss-demo-data'
import { useDismissDemoStore } from '@/features/demo/state/use-dismiss-demo-store'
import { DismissDemoShell } from '@/features/demo/components/dismiss-demo-shell'

export default function DismissDemoTriagePage() {
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

  const handleSendSummary = () => {
    window.alert('演示模式：案情摘要已发送')
  }

  return (
    <DismissDemoShell
      step={5}
      title="繁简分流与律师转介"
      description="固定展示复杂度评估、口径风险提示与推荐律师卡片。"
      prevHref="/demo/dismiss/documents"
      nextHref="/demo/dismiss/review"
      nextLabel="下一步：总结回顾"
    >
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            分流评估结果
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-800">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">案件复杂度</p>
            <p className="mt-1 font-medium">{triageResult.complexity}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">诉讼风险</p>
            <p className="mt-1 font-medium">{triageResult.risk}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-700">口径风险提示</p>
            <p className="mt-1 text-amber-900">{triageResult.caliberRisk}</p>
          </div>
          <Badge className="bg-blue-600 text-white">{triageResult.recommendation}</Badge>
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            推荐律师卡片
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">北京德恒（西安高新区）律师事务所</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">劳动争议</Badge>
                  <Badge variant="outline">违法解除</Badge>
                  <Badge variant="outline">社保争议</Badge>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <User className="w-6 h-6 text-slate-500" />
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-700 space-y-1">
              <p>律师姓名：李某某（演示用）</p>
              <p>执业证号：1610120XXXXXXXXXX（演示用）</p>
            </div>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSendSummary}>
            <Send className="w-4 h-4 mr-1" />
            一键发送案情摘要至律师端
          </Button>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <span>演示提示：此操作仅展示链路闭环，不触发真实对接。</span>
          </div>
        </CardContent>
      </Card>
    </DismissDemoShell>
  )
}
