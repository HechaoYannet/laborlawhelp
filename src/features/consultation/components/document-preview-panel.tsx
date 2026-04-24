'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, FolderKanban } from 'lucide-react'

interface DocumentPreviewPanelProps {
  title: string
  payload: Record<string, unknown>
  actions: Array<{ action: string; label: string }>
  onAction?: (action: string, payload: Record<string, unknown>) => void
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
}

export function DocumentPreviewPanel({ title, payload, actions, onAction }: DocumentPreviewPanelProps) {
  const content = typeof payload.content === 'string' ? payload.content : ''
  const checklist = asArray(payload.checklist)
  const standardEvidence = asArray(payload.standard_evidence)
  const missingEvidence = asArray(payload.missing_evidence)

  return (
    <Card className="relative overflow-hidden border bg-white/96 py-0 ring-1 ring-black/5">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-300 to-transparent max-sm:h-1" />

      <CardHeader className="gap-2 px-3 pb-2 pt-3 sm:gap-4 sm:px-5 sm:pb-4 sm:pt-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm sm:h-11 sm:w-11">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
                  文书草稿
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs">证据 {standardEvidence.length}</Badge>
                {missingEvidence.length > 0 ? (
                  <Badge className="bg-amber-100 text-amber-700 text-[10px] sm:text-xs">待补 {missingEvidence.length}</Badge>
                ) : null}
              </div>
              <CardTitle className="mt-1.5 text-sm font-semibold leading-5 text-slate-950 sm:mt-2 sm:text-base sm:leading-6 md:text-lg">
                {title}
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3 sm:space-y-4 sm:px-5 sm:pb-5 md:px-6 md:pb-6 max-sm:space-y-2.5">
        {content ? (
          <section className="rounded-xl border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.9),rgba(255,255,255,0.98))] p-2.5 shadow-sm sm:rounded-[24px] sm:p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 sm:gap-2 sm:text-sm">
              <FolderKanban className="h-3.5 w-3.5 text-emerald-600 sm:h-4 sm:w-4" />
              文书预览
            </div>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-white/80 bg-white/90 p-2.5 text-[11px] leading-5 text-slate-700 sm:mt-3 sm:max-h-72 sm:rounded-2xl sm:p-4 sm:text-sm sm:leading-6">
              {content}
            </pre>
          </section>
        ) : null}

        {checklist.length > 0 ? (
          <section className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 sm:rounded-2xl sm:p-4">
            <p className="text-xs font-semibold text-slate-900 sm:text-sm">下一步行动</p>
            <div className="mt-2 grid gap-1.5 sm:mt-3 sm:gap-2">
              {checklist.map((item, index) => (
                <div key={`${index}-${String(item.action ?? '')}`} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs leading-5 text-slate-700 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
                  {String(item.action ?? '待办事项')}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-2 sm:gap-3 min-[420px]:grid-cols-2">
          {standardEvidence.length > 0 ? (
            <section className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 sm:rounded-2xl sm:p-4">
              <p className="text-xs font-semibold text-slate-900 sm:text-sm">标准证据</p>
              <div className="mt-2 grid gap-1.5 sm:mt-3 sm:gap-2">
                {standardEvidence.slice(0, 6).map((item, index) => (
                  <div key={`${index}-${String(item.name ?? '')}`} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    {String(item.name ?? '证据项')}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {missingEvidence.length > 0 ? (
            <section className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-2.5 sm:rounded-2xl sm:p-4">
              <p className="text-xs font-semibold text-slate-900 sm:text-sm">建议补齐</p>
              <div className="mt-2 grid gap-1.5 sm:mt-3 sm:gap-2">
                {missingEvidence.slice(0, 6).map((item, index) => (
                  <div key={`${index}-${String(item.name ?? '')}`} className="rounded-xl border border-amber-200/80 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    {String(item.name ?? '待补证据')}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="border-t border-slate-200/80 pt-3 sm:pt-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {actions.map((action) => (
                <Button
                  key={action.action}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full border-emerald-200 bg-white px-3 text-xs text-emerald-700 shadow-sm hover:bg-emerald-50 sm:h-9 sm:px-4 sm:text-sm"
                  onClick={() => onAction?.(action.action, payload)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
