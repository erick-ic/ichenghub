import { NextRequest, NextResponse } from 'next/server'
import { getRecentErrors } from '@/app/actions/metricsActions'

export const dynamic = 'force-dynamic'

// 中间件显式放行 /api，后台专属的错误日志导出必须在路由内校验 admin_session
export async function GET(request: NextRequest) {
  if (!request.cookies.get('admin_session')?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const errors = await getRecentErrors(50)
  const now = new Date().toISOString().replace(/[:.]/g, '-')
  const body = JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: errors.length,
    errors
  }, null, 2)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="ichengHub-error-logs-${now}.json"`
    }
  })
}
