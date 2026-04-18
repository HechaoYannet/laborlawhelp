import Link from 'next/link'
import { ArrowLeft, ArrowRight, Scale } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { flowSteps } from '@/features/demo/data/dismiss-demo-data'

interface DismissDemoShellProps {
  step: number
  title: string
  description: string
  children: React.ReactNode
  prevHref?: string
  nextHref?: string
  nextLabel?: string
}

export function DismissDemoShell({
  step,
  title,
  description,
  children,
  prevHref,
  nextHref,
  nextLabel = '下一步',
}: DismissDemoShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">违法辞退演示</p>
              <p className="text-xs text-slate-500">陕西口径 · 全前端Mock流程</p>
            </div>
          </div>
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200">演示模式</Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              {flowSteps.map((flowStep, index) => {
                const current = index + 1
                const isActive = current === step
                const isDone = current < step
                return (
                  <Badge
                    key={flowStep}
                    variant="outline"
                    className={
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isDone
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-slate-500 border-slate-200'
                    }
                  >
                    {current}. {flowStep}
                  </Badge>
                )
              })}
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h1>
              <p className="mt-2 text-slate-600">{description}</p>
            </div>
          </CardContent>
        </Card>

        {children}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {prevHref ? (
            <Link href={prevHref}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-1" />
                上一步
              </Button>
            </Link>
          ) : (
            <div />
          )}

          {nextHref ? (
            <Link href={nextHref}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {nextLabel}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  )
}
