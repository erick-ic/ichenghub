import { NextRequest, NextResponse } from 'next/server'
import { withMetrics } from '@/app/actions/withMetrics';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session';

const GET = withMetrics(async function GET(request: NextRequest) {
  const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value

  if (await verifyAdminSessionToken(adminSession)) {
    return NextResponse.json({ authenticated: true })
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
});
export { GET };
