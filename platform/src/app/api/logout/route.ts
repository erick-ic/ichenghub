import { NextResponse } from 'next/server'
import { withMetrics } from '@/app/actions/withMetrics';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session';

const POST = withMetrics(async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 })
  response.cookies.delete(ADMIN_SESSION_COOKIE)
  return response
});
export { POST };
