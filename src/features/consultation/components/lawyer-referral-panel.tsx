'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BriefcaseBusiness, ShieldAlert, UserRoundSearch } from 'lucide-react'

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

const complexityLabels: Record<string, string> = {
  simple: '低复杂度',
  moderate: '中复杂度',
  complex: '高复杂度',
  unknown: '待判断',
}

const urgencyLabels: Record<string, string> = {
  low: '可常规跟进',
  medium: '建议尽快处理',
  high: '需要优先处理',
  unknown: '待判断',
}

export function LawyerReferralPanel({ payload, actions, onAction }: LawyerReferralPanelProps) {
  const complexity = typeof payload.complexity === 'string' ? payload.complexity : 'unknown'
  const urgency = typeof payload.urgency === 'string' ? payload.urgency : 'unknown'
  const actionHint =
    typeof payload.action_hint === 'string' ? payload.action_hint : '请根据案件复杂度、风险和处理时效决定是否转介律师。'
  const riskTags = Array.isArray(payload.risk_tags)
    ? payload.risk_tags.filter((item): item is string => typeof item === 'string')
    : []
  const lawyers = asArray(payload.recommended_lawyers)

  return (
    <Card className="relative overflow-hidden border bg-white/96 py-0 ring-1 ring-black/5">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-transparent max-sm:h-1" />

      <CardHeader className="gap-2 px-3 pb-2 pt-3 sm:gap-4 sm:px-5 sm:pb-4 sm:pt-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-700 shadow-sm sm:h-11 sm:w-11">
              <UserRoundSearch className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge variant="outline" className="rounded-full border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
                  律师转介
                </Badge>
                <Badge className="bg-violet-100 text-violet-700 text-[10px] sm:text-xs">{complexityLabels[complexity] ?? complexity}</Badge>
                <Badge className="bg-fuchsia-100 text-fuchsia-700 text-[10px] sm:text-xs">{urgencyLabels[urgency] ?? urgency}</Badge>
              </div>
              <CardTitle className="mt-1.5 text-sm font-semibold leading-5 text-slate-950 sm:mt-2 sm:text-base sm:leading-6 md:text-lg">
                复杂度分流与律师推荐
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3 sm:space-y-4 sm:px-5 sm:pb-5 md:px-6 md:pb-6 max-sm:space-y-2.5">
        <section className="rounded-xl border border-violet-200/80 bg-[linear-gradient(135deg,rgba(245,243,255,0.96),rgba(255,255,255,0.98))] p-2.5 shadow-sm sm:rounded-[24px] sm:p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 sm:gap-2 sm:text-sm">
            <ShieldAlert className="h-3.5 w-3.5 text-violet-600 sm:h-4 sm:w-4" />
            转介建议
          </div>
          <p className="mt-2 rounded-xl border border-white/80 bg-white/90 px-2.5 py-2 text-xs leading-5 text-slate-700 sm:mt-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
            {actionHint}
          </p>
          {riskTags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
              {riskTags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-violet-200 bg-white text-violet-700 text-[10px] sm:text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </section>

        {lawyers.length > 0 ? (
          <section className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 sm:rounded-2xl sm:p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 sm:gap-2 sm:text-sm">
              <BriefcaseBusiness className="h-3.5 w-3.5 text-violet-600 sm:h-4 sm:w-4" />
              推荐律师
            </div>
            <div className="mt-2 grid gap-2 sm:mt-3 sm:gap-3">
              {lawyers.map((lawyer, index) => (
                <div key={`${index}-${String(lawyer.id ?? '')}`} className="rounded-xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm sm:rounded-[22px] sm:px-4 sm:py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 sm:text-base">{String(lawyer.name ?? '律师')}</p>
                      <p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">{String(lawyer.firm ?? '律所信息待补充')}</p>
                    </div>
                    <Badge className="bg-violet-100 text-violet-700 text-[10px] sm:text-xs">可联系</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-slate-700 min-[420px]:grid-cols-2 sm:mt-3 sm:gap-2 sm:text-sm">
                    <div className="rounded-xl bg-slate-50 px-2.5 py-1.5 sm:rounded-2xl sm:px-3 sm:py-2">
                      擅长: {Array.isArray(lawyer.specialties) ? lawyer.specialties.join(' / ') : '劳动争议'}
                    </div>
                    <div className="rounded-xl bg-slate-50 px-2.5 py-1.5 sm:rounded-2xl sm:px-3 sm:py-2">
                      联系方式: {String(lawyer.contact ?? '待提供')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {actions.length > 0 ? (
          <div className="border-t border-slate-200/80 pt-3 sm:pt-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {actions.map((action) => (
                <Button
                  key={action.action}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-full border-violet-200 bg-white px-3 text-xs text-violet-700 shadow-sm hover:bg-violet-50 sm:h-9 sm:px-4 sm:text-sm"
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
