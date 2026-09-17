import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

let pendingSuccess = 0
let pendingFailed = 0
let pendingAi = 0
let flushTimer: NodeJS.Timeout | null = null
const MAX_ERRORS = 50
const METRICS_WINDOW_MS = 24 * 60 * 60 * 1000

// 使用固定 24 小时统计周期。到期后的首次读写通过带条件的 updateMany
// 原子重置，避免多个并发请求重复清零新周期数据。
async function ensureActiveMetricsWindow() {
  const now = new Date()
  const expiredBefore = new Date(now.getTime() - METRICS_WINDOW_MS)

  await prisma.systemMetrics.upsert({
    where: { id: 'current' },
    create: { id: 'current', resetAt: now, errorLogs: [] },
    update: {}
  })

  await prisma.systemMetrics.updateMany({
    where: { id: 'current', resetAt: { lte: expiredBefore } },
    data: {
      apiSuccess: 0,
      apiFailed: 0,
      aiErrors: 0,
      errorLogs: [],
      resetAt: now
    }
  })
}

function scheduleFlush() {
  if (flushTimer !== null) return
  flushTimer = setTimeout(async () => {
    flushTimer = null
    const success = pendingSuccess
    const failed = pendingFailed
    const ai = pendingAi
    pendingSuccess = 0
    pendingFailed = 0
    pendingAi = 0
    if (success === 0 && failed === 0 && ai === 0) return
    try {
      await ensureActiveMetricsWindow()
      await prisma.systemMetrics.update({
        where: { id: 'current' },
        data: {
          apiSuccess: { increment: success },
          apiFailed: { increment: failed },
          aiErrors: { increment: ai }
        }
      })
    } catch {}
  }, 1000)
}

export function recordSuccess() {
  pendingSuccess++
  scheduleFlush()
}

export function recordFailed() {
  pendingFailed++
  scheduleFlush()
}

export function recordAiError() {
  pendingAi++
  scheduleFlush()
}

export function recordDbLatency(ms: number) {
  try {
    ensureActiveMetricsWindow()
      .then(() => prisma.systemMetrics.update({
        where: { id: 'current' },
        data: { dbLatency: ms }
      }))
      .catch(() => {})
  } catch {}
}

function safeString(v: unknown): string {
  try {
    if (typeof v === 'string') return v.slice(0, 500)
    if (v instanceof Error) return v.message.slice(0, 500)
    return String(v).slice(0, 500)
  } catch {
    return ''
  }
}

function newestFirst(list: unknown[]): any[] {
  return [...list].sort((a: any, b: any) => {
    const aTime = typeof a?.ts === 'string' ? Date.parse(a.ts) : 0
    const bTime = typeof b?.ts === 'string' ? Date.parse(b.ts) : 0
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
  })
}

export async function recordApiError(
  info: {
    message?: string
    status?: number
    path?: string
    method?: string
    detail?: unknown
  } = {}
) {
  try {
    await ensureActiveMetricsWindow()
    const err = {
      ts: new Date().toISOString(),
      message: safeString(info.message) || 'Unknown API Error',
      status: typeof info.status === 'number' ? info.status : 0,
      path: safeString(info.path) || '',
      method: safeString(info.method) || '',
      detail: safeString(
        typeof info.detail === 'string'
          ? info.detail
          : info.detail instanceof Error
          ? info.detail.stack || info.detail.message
          : JSON.stringify(info.detail).slice(0, 500)
      )
    }
    await prisma.$transaction(async (tx) => {
      const metrics = await tx.systemMetrics.findUnique({
        where: { id: 'current' },
        select: { errorLogs: true }
      })
      const existing = Array.isArray(metrics?.errorLogs) ? metrics.errorLogs : []
      const nextLogs = newestFirst([err, ...existing]).slice(0, MAX_ERRORS)

      await tx.systemMetrics.upsert({
        where: { id: 'current' },
        create: { id: 'current', errorLogs: nextLogs as Prisma.InputJsonValue },
        update: { errorLogs: nextLogs as Prisma.InputJsonValue }
      })
    })
  } catch {}
}

export async function getRecentErrors(limit = 20) {
  try {
    await ensureActiveMetricsWindow()
    const m = await prisma.systemMetrics.findUnique({
      where: { id: 'current' },
      select: { errorLogs: true }
    })
    const list: any[] = Array.isArray(m?.errorLogs) ? (m.errorLogs as any[]) : []
    return newestFirst(list).slice(0, Math.max(0, Math.min(limit, MAX_ERRORS)))
  } catch {
    return []
  }
}

export async function trimErrorLogs() {
  try {
    await ensureActiveMetricsWindow()
    const m = await prisma.systemMetrics.findUnique({
      where: { id: 'current' },
      select: { errorLogs: true }
    })
    const list: any[] = Array.isArray(m?.errorLogs) ? (m.errorLogs as any[]) : []
    const trimmed = newestFirst(list).slice(0, MAX_ERRORS)
    if (list.length > MAX_ERRORS || list.some((entry, index) => entry !== trimmed[index])) {
      await prisma.systemMetrics.update({
        where: { id: 'current' },
        data: { errorLogs: trimmed as Prisma.InputJsonValue }
      })
    }
  } catch {}
}

export async function clearErrorLogs() {
  try {
    await ensureActiveMetricsWindow()
    await prisma.systemMetrics.update({
      where: { id: 'current' },
      data: { errorLogs: [] }
    })
  } catch {}
}

export async function getSystemMetrics() {
  try {
    await ensureActiveMetricsWindow()
    return await prisma.systemMetrics.findUnique({ where: { id: 'current' } })
  } catch {
    return null
  }
}
