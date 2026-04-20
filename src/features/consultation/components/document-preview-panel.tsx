'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <Card className="border-emerald-200/80 bg-emerald-50/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-emerald-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {content ? (
          <pre className="max-h-56 overflow-auto rounded-lg bg-white p-3 text-xs leading-5 text-slate-700 whitespace-pre-wrap">{content}</pre>
        ) : null}

        {checklist.length > 0 ? (
          <div className="rounded-lg bg-white p-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">维权行动清单</p>
            <ul className="space-y-2 text-xs text-slate-600">
              {checklist.map((item, index) => (
                <li key={`${index}-${String(item.action ?? '')}`}>• {String(item.action ?? '待办事项')}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {standardEvidence.length > 0 ? (
          <div className="rounded-lg bg-white p-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">标准证据</p>
            <ul className="space-y-1 text-xs text-slate-600">
              {standardEvidence.slice(0, 5).map((item, index) => (
                <li key={`${index}-${String(item.name ?? '')}`}>• {String(item.name ?? '证据项')}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {missingEvidence.length > 0 ? (
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="mb-2 text-xs font-semibold text-amber-800">建议补齐</p>
            <ul className="space-y-1 text-xs text-amber-700">
              {missingEvidence.slice(0, 5).map((item, index) => (
                <li key={`${index}-${String(item.name ?? '')}`}>• {String(item.name ?? '待补证据')}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.action}
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100"
                onClick={() => onAction?.(action.action, payload)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
