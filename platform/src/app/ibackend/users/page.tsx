import { Prisma } from '@prisma/client'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import UserManagement, { AdminUserRow } from '@/components/admin/UserManagement'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

type SearchParams = {
  q?: string
  provider?: string
  sort?: string
  page?: string
}

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  if (!await verifyAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect('/ibackendlogin')
  }

  const query = (searchParams.q || '').trim().slice(0, 100)
  const provider = (searchParams.provider || 'all').slice(0, 50)
  const sort = ['created_desc', 'created_asc', 'active_desc'].includes(searchParams.sort || '')
    ? searchParams.sort!
    : 'created_desc'
  const requestedPage = Math.max(1, Number.parseInt(searchParams.page || '1', 10) || 1)
  const where: Prisma.UserWhereInput = {
    ...(query ? { OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ] } : {}),
    ...(provider !== 'all' ? { accounts: { some: { provider } } } : {}),
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const now = new Date()
  const [totalUsers, newUsers, activeGroups, activeSessions, filteredCount, providerRows] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.analyticsLog.groupBy({ by: ['userId'], where: { userId: { not: null }, timestamp: { gte: sevenDaysAgo } } }),
    prisma.session.count({ where: { expires: { gt: now } } }),
    prisma.user.count({ where }),
    prisma.account.findMany({ select: { provider: true }, distinct: ['provider'], orderBy: { provider: 'asc' } }),
  ])

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  const skip = (page - 1) * PAGE_SIZE
  let orderedIds: string[]

  if (sort === 'active_desc') {
    const pattern = `%${query}%`
    const result = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT u."id" FROM "User" u
      LEFT JOIN "AnalyticsLog" l ON l."userId" = u."id"
      WHERE (${query === ''} OR COALESCE(u."name", '') ILIKE ${pattern} OR COALESCE(u."email", '') ILIKE ${pattern})
      AND (${provider === 'all'} OR EXISTS (
        SELECT 1 FROM "Account" a WHERE a."userId" = u."id" AND a."provider" = ${provider}
      ))
      GROUP BY u."id", u."createdAt"
      ORDER BY MAX(l."timestamp") DESC NULLS LAST, u."createdAt" DESC
      LIMIT ${PAGE_SIZE} OFFSET ${skip}
    `)
    orderedIds = result.map((item) => item.id)
  } else {
    const result = await prisma.user.findMany({
      where,
      select: { id: true },
      orderBy: { createdAt: sort === 'created_asc' ? 'asc' : 'desc' },
      skip,
      take: PAGE_SIZE,
    })
    orderedIds = result.map((item) => item.id)
  }

  const users = orderedIds.length ? await prisma.user.findMany({
    where: { id: { in: orderedIds } },
    include: {
      accounts: { select: { provider: true, providerAccountId: true } },
      sessions: { where: { expires: { gt: now } }, select: { expires: true }, orderBy: { expires: 'desc' } },
      analyticsLogs: {
        select: { id: true, actionType: true, resourceType: true, path: true, timestamp: true },
        orderBy: { timestamp: 'desc' },
        take: 8,
      },
      toolSubmissions: {
        select: { id: true, name: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      toolDemands: {
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: { select: { promptFavorites: true, blogFavorites: true, toolSubmissions: true, toolDemands: true } },
    },
  }) : []

  const userMap = new Map(users.map((user) => [user.id, user]))
  const rows: AdminUserRow[] = orderedIds.flatMap((id) => {
    const user = userMap.get(id)
    if (!user) return []
    return [{
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      providers: user.accounts,
      favoriteCount: user._count.promptFavorites + user._count.blogFavorites,
      promptFavoriteCount: user._count.promptFavorites,
      blogFavoriteCount: user._count.blogFavorites,
      submissionCount: user._count.toolSubmissions + user._count.toolDemands,
      toolSubmissionCount: user._count.toolSubmissions,
      toolDemandCount: user._count.toolDemands,
      activeSessionCount: user.sessions.length,
      sessionExpiresAt: user.sessions[0]?.expires.toISOString() || null,
      lastActiveAt: user.analyticsLogs[0]?.timestamp.toISOString() || null,
      recentActivities: user.analyticsLogs.map((log) => ({ ...log, timestamp: log.timestamp.toISOString() })),
      recentSubmissions: [
        ...user.toolSubmissions.map((item) => ({ id: item.id, type: 'TOOL' as const, title: item.name, status: item.status, createdAt: item.createdAt.toISOString() })),
        ...user.toolDemands.map((item) => ({ id: item.id, type: 'DEMAND' as const, title: item.title, status: item.status, createdAt: item.createdAt.toISOString() })),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    }]
  })

  return <UserManagement
    users={rows}
    stats={{ totalUsers, newUsers, activeUsers: activeGroups.length, activeSessions }}
    providers={providerRows.map((item) => item.provider)}
    pagination={{ page, total: filteredCount, totalPages }}
    filters={{ query, provider, sort }}
  />
}
