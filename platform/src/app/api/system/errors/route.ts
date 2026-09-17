import { NextRequest, NextResponse } from 'next/server'
import { getRecentErrors, clearErrorLogs } from '@/app/actions/metricsActions'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

// 中间件显式放行 /api，后台专属的错误日志接口必须在路由内自行校验 admin_session，
// 否则任何游客都能读取内部错误堆栈
function isAdmin(request: NextRequest): Promise<boolean> {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
}

export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const errors = await getRecentErrors(50)
  return NextResponse.json({ errors })
}

export async function DELETE(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await clearErrorLogs()
  return NextResponse.json({ success: true })
}
