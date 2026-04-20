'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LawyerReferralPanelProps {
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

export function LawyerReferralPanel({ payload, actions, onAction }: LawyerReferralPanelProps) {
  const complexity = typeof payload.complexity === 'string' ? payload.complexity : 'unknown'
  const urgency = typeof payload.urgency === 'string' ? payload.urgency : 'unknown'
  const actionHint = typeof payload.action_hint === 'string' ? payload.action_hint : '请根据案件复杂度决定是否转介。'
  const riskTags = Array.isArray(payload.risk_tags) ? payload.risk_tags.filter((item): item is string => typeof item === 'string') : []
  const lawyers = asArray(payload.recommended_lawyers)

  return (
    <Card className="border-violet-200/80 bg-violet-50/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-violet-900">繁简分流与律师转介</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary" className="bg-white text-violet-700">复杂度：{complexity}</Badge>
          <Badge variant="secondary" className="bg-white text-violet-700">紧急度：{urgency}</Badge>
          {riskTags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-violet-300 text-violet-700">
              {tag}
            </Badge>
          ))}
        </div>

        <p className="rounded-lg bg-white p-3 text-xs leading-5 text-slate-700">{actionHint}</p>

        {lawyers.length > 0 ? (
          <div className="space-y-2">
            {lawyers.map((lawyer, index) => (
              <div key={`${index}-${String(lawyer.id ?? '')}`} className="rounded-lg bg-white p-3">
                <p className="text-sm font-medium text-slate-800">{String(lawyer.name ?? '律师')}</p>
                <p className="mt-1 text-xs text-slate-600">{String(lawyer.firm ?? '律所信息待补充')}</p>
                <p className="mt-1 text-xs text-slate-600">专长：{Array.isArray(lawyer.specialties) ? lawyer.specialties.join('、') : '劳动争议'}</p>
                <p className="mt-1 text-xs text-slate-600">联系方式：{String(lawyer.contact ?? '待提供')}</p>
              </div>
            ))}
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
                className="h-8 rounded-full border-violet-300 bg-white text-violet-700 hover:bg-violet-100"
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
