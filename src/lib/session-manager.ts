'use client'

export interface SessionRecord {
  caseId: string
  sessionId: string
  anonymousToken: string
  createdAt: number
  lastActiveAt: number
  messageCount: number
  preview: string
}

const SESSION_LIST_KEY = 'laborlawhelp.consultation.session-list'

export function saveSessionRecord(record: SessionRecord): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(SESSION_LIST_KEY)
    const list: SessionRecord[] = raw ? JSON.parse(raw) : []
    const idx = list.findIndex((s) => s.sessionId === record.sessionId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...record, lastActiveAt: Date.now() }
    } else {
      list.push({ ...record, lastActiveAt: Date.now() })
    }
    list.sort((a, b) => b.lastActiveAt - a.lastActiveAt)
    localStorage.setItem(SESSION_LIST_KEY, JSON.stringify(list))
  } catch { /* noop */ }
}

export function getSessionList(): SessionRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SESSION_LIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function removeSessionRecord(sessionId: string): void {
  if (typeof window === 'undefined') return
  try {
    const list = getSessionList().filter((s) => s.sessionId !== sessionId)
    localStorage.setItem(SESSION_LIST_KEY, JSON.stringify(list))
  } catch { /* noop */ }
}

export function clearSessionList(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SESSION_LIST_KEY)
  } catch { /* noop */ }
}

export function formatSessionTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `今天 ${time}`
  if (isYesterday) return `昨天 ${time}`
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`
}
