'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquareText, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { demoQuestions } from '@/features/demo/data/dismiss-demo-data'
import { useDismissDemoStore } from '@/features/demo/state/use-dismiss-demo-store'
import { DismissDemoShell } from '@/features/demo/components/dismiss-demo-shell'

export default function DismissDemoQuestionPage() {
  const router = useRouter()
  const {
    hydrated,
    currentQuestionIndex,
    totalQuestions,
    answeredPairs,
    isCompleted,
    selectAnswer,
    resetDemo,
  } = useDismissDemoStore()

  const currentQuestion = demoQuestions[currentQuestionIndex]
  const progressValue = (Math.min(currentQuestionIndex, totalQuestions) / totalQuestions) * 100

  useEffect(() => {
    if (hydrated && isCompleted) {
      router.push('/demo/dismiss/summary')
    }
  }, [hydrated, isCompleted, router])

  if (!hydrated) {
    return null
  }

  return (
    <DismissDemoShell
      step={1}
      title="多轮问诊"
      description="固定8题演示问诊，点击选项后自动进入下一题。"
    >
      <Card className="border-slate-200">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl text-slate-900">第 {Math.min(currentQuestionIndex + 1, totalQuestions)} / {totalQuestions} 题</CardTitle>
            <Button variant="outline" size="sm" onClick={resetDemo}>
              <RotateCcw className="w-4 h-4 mr-1" />
              重置演示
            </Button>
          </div>
          <Progress value={progressValue} className="h-2 bg-blue-100" />
        </CardHeader>

        {currentQuestion ? (
          <CardContent className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-slate-900 font-medium leading-7">{currentQuestion.question}</p>
            </div>
            <div className="grid gap-3">
              {currentQuestion.options.map((option, optionIndex) => (
                <Button
                  key={option}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4 text-left whitespace-normal"
                  onClick={() => selectAnswer(optionIndex)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-slate-800">
            <MessageSquareText className="w-4 h-4 text-blue-600" />
            已选答案回显
          </CardTitle>
        </CardHeader>
        <CardContent>
          {answeredPairs.length === 0 ? (
            <p className="text-sm text-slate-500">尚未选择答案，开始后会实时展示。</p>
          ) : (
            <div className="space-y-3">
              {answeredPairs.map((item) => (
                <div key={item.questionId} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-500 mb-1">问题{item.questionId}</p>
                  <p className="text-sm text-slate-800">{item.answer}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">点击即下一题</Badge>
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">支持“我不确定”继续</Badge>
          </div>
        </CardContent>
      </Card>
    </DismissDemoShell>
  )
}
