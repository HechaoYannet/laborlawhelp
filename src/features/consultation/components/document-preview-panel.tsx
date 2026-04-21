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
    <Card className="relative overflow-hidden rounded-[26px] border border-emerald-200/80 bg-white/96 py-0 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-300 to-transparent" />

      <CardHeader className="gap-4 px-5 pt-5 pb-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  文书草稿
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-700">证据 {standardEvidence.length}</Badge>
                {missingEvidence.length > 0 ? (
                  <Badge className="bg-amber-100 text-amber-700">待补 {missingEvidence.length}</Badge>
                ) : null}
              </div>
              <CardTitle className="mt-2 text-base leading-6 font-semibold text-slate-950 md:text-lg">
                {title}
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-5 md:px-6 md:pb-6">
        {content ? (
          <section className="rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.9),rgba(255,255,255,0.98))] p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FolderKanban className="h-4 w-4 text-emerald-600" />
              文书预览
            </div>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/80 bg-white/90 p-4 text-sm leading-6 text-slate-700">
              {content}
            </pre>
          </section>
        ) : null}

        {checklist.length > 0 ? (
          <section className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-slate-900">下一步行动</p>
            <div className="mt-3 grid gap-2">
              {checklist.map((item, index) => (
                <div key={`${index}-${String(item.action ?? '')}`} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                  {String(item.action ?? '待办事项')}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {standardEvidence.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-900">标准证据</p>
              <div className="mt-3 grid gap-2">
                {standardEvidence.slice(0, 6).map((item, index) => (
                  <div key={`${index}-${String(item.name ?? '')}`} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                    {String(item.name ?? '证据项')}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {missingEvidence.length > 0 ? (
            <section className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
              <p className="text-sm font-semibold text-slate-900">建议补齐</p>
              <div className="mt-3 grid gap-2">
                {missingEvidence.slice(0, 6).map((item, index) => (
                  <div key={`${index}-${String(item.name ?? '')}`} className="rounded-2xl border border-amber-200/80 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm">
                    {String(item.name ?? '待补证据')}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="border-t border-slate-200/80 pt-4">
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.action}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-full border-emerald-200 bg-white px-4 text-sm text-emerald-700 shadow-sm hover:bg-emerald-50"
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
