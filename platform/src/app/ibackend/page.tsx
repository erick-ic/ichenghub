import Link from "next/link"
import prisma from "@/lib/prisma"
import { getSystemMetrics } from "@/app/actions/metricsActions"
import { getBeijingMonthStart } from "@/lib/time"

type RecentPromptRow = {
  id: string
  title: string
  category: string
  views: number
  likes: number
  createdAt: Date
}

export const dynamic = 'force-dynamic'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wrench,
  Lightbulb,
  Eye,
  Heart,
  Link2,
  Plus,
  ArrowUpRight,
  Star,
  MessageSquare,
  FileText
} from "lucide-react"

import { SystemStatusCard } from "@/components/SystemStatusCard"

export default async function AdminDashboard() {
  const now = new Date()
  // 月份边界统一按北京时间（UTC+8）1 日 00:00，与行为日志的按天去重口径一致；
  // UTC 服务器用本地月初会偏到北京 1 日早 8 点，区间统一左闭右开
  const currentMonthStart = getBeijingMonthStart(now, 0)
  const lastMonthStart = getBeijingMonthStart(now, -1)

  // 从数据库获取真实数据
  const [
    toolCount,
    promptCount,
    linkCount,
    submissionCount,
    demandCount,
    blogCount,
    totalViews,
    totalLikes,
    totalFavorites,
    recentPrompts,
    toolCountLastMonth,
    promptCountLastMonth,
    linkCountLastMonth,
    submissionCountLastMonth,
    demandCountLastMonth,
    blogCountLastMonth,
    viewsThisMonth,
    viewsLastMonth,
    likesThisMonth,
    likesLastMonth,
    favoritesThisMonth,
    favoritesLastMonth,
    systemMetrics,
  ] = await Promise.all([
    prisma.toolCard.count(),
    prisma.prompt.count(),
    prisma.navLink.count(),
    prisma.toolSubmission.count(),
    prisma.toolDemand.count(),
    prisma.blog.count(),
    prisma.prompt.aggregate({ _sum: { views: true } }),
    prisma.prompt.aggregate({ _sum: { likes: true } }),
    prisma.prompt.aggregate({ _sum: { favorites: true } }),
    prisma.prompt.findMany({
      orderBy: { createdAt: 'desc' as const },
      take: 4,
      select: {
        id: true,
        title: true,
        category: true,
        views: true,
        likes: true,
        createdAt: true,
      },
    }) as unknown as Promise<RecentPromptRow[]>,
    prisma.toolCard.count({
      where: {
        createdAt: {
          lt: currentMonthStart,
        },
      },
    }),
    prisma.prompt.count({
      where: {
        createdAt: {
          lt: currentMonthStart,
        },
      },
    }),
    prisma.navLink.count({
      where: {
        createdAt: {
          lt: currentMonthStart,
        },
      },
    }),
    prisma.toolSubmission.count({
      where: {
        createdAt: {
          lt: currentMonthStart,
        },
      },
    }),
    prisma.toolDemand.count({
      where: {
        createdAt: {
          lt: currentMonthStart,
        },
      },
    }),
    prisma.blog.count({
      where: {
        createdAt: {
          lt: currentMonthStart,
        },
      },
    }),
    // 互动环比基于带时间戳的行为日志：本月 vs 上月的提示词浏览/点赞/收藏事件
    prisma.analyticsLog.count({
      where: { actionType: 'VIEW', resourceType: 'PROMPT', timestamp: { gte: currentMonthStart } },
    }),
    prisma.analyticsLog.count({
      where: { actionType: 'VIEW', resourceType: 'PROMPT', timestamp: { gte: lastMonthStart, lt: currentMonthStart } },
    }),
    prisma.analyticsLog.count({
      where: { actionType: 'LIKE', resourceType: 'PROMPT', timestamp: { gte: currentMonthStart } },
    }),
    prisma.analyticsLog.count({
      where: { actionType: 'LIKE', resourceType: 'PROMPT', timestamp: { gte: lastMonthStart, lt: currentMonthStart } },
    }),
    prisma.analyticsLog.count({
      where: { actionType: 'FAVORITE', resourceType: 'PROMPT', timestamp: { gte: currentMonthStart } },
    }),
    prisma.analyticsLog.count({
      where: { actionType: 'FAVORITE', resourceType: 'PROMPT', timestamp: { gte: lastMonthStart, lt: currentMonthStart } },
    }),
    getSystemMetrics(),
  ])

  // 头部大数字：全时累计总量
  const views = totalViews._sum.views || 0
  const likes = totalLikes._sum.likes || 0
  const favorites = totalFavorites._sum.favorites || 0

  // 互动数据环比：直接展示本月与上月互动量的绝对差值（基于行为日志计数，无事件即为 0）
  // 增加显示 +N（绿色），减少显示 -N（红色），持平显示 0（灰色）
  type TrendTone = 'up' | 'down' | 'flat'
  const getMonthTrend = (current: number, previous: number): { text: string; tone: TrendTone } => {
    const delta = current - previous
    if (delta > 0) return { text: `较上月 +${delta}`, tone: 'up' }
    if (delta < 0) return { text: `较上月 ${delta}`, tone: 'down' }
    return { text: '较上月 0', tone: 'flat' }
  }
  const viewsTrend = getMonthTrend(viewsThisMonth, viewsLastMonth)
  const likesTrend = getMonthTrend(likesThisMonth, likesLastMonth)
  const favoritesTrend = getMonthTrend(favoritesThisMonth, favoritesLastMonth)

  // 内容数据环比：本月新增 = 当前总量 − 上月末总量，展示规则与互动数据一致
  const toolTrend = getMonthTrend(toolCount, toolCountLastMonth)
  const blogTrend = getMonthTrend(blogCount, blogCountLastMonth)
  const linkTrend = getMonthTrend(linkCount, linkCountLastMonth)
  const promptTrend = getMonthTrend(promptCount, promptCountLastMonth)
  const submissionTrend = getMonthTrend(submissionCount, submissionCountLastMonth)
  const demandTrend = getMonthTrend(demandCount, demandCountLastMonth)

  // 环比文案配色：上升绿色、下降红色、持平灰色
  const trendClass = (tone: TrendTone) =>
    tone === 'up' ? 'text-green-600' : tone === 'down' ? 'text-red-600' : 'text-slate-400'

  const rawErrors: unknown[] = Array.isArray((systemMetrics as any)?.errorLogs) ? ((systemMetrics as any).errorLogs as unknown[]) : []
  const apiFailed = systemMetrics?.apiFailed ?? 0
  const aiErrorsCount = systemMetrics?.aiErrors ?? 0

  // 格式化数字显示
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  // 格式化日期（UTC+8）
  const formatDate = (date: Date): string => {
    const d = new Date(date)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  }

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">控制面板</h1>
        <p className="text-slate-500 mt-1">欢迎回来，查看最新的项目统计和操作</p>
      </div>

      {/* 统计卡片 */}
      <div className="space-y-6">
        {/* 内容数据 */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e52129' }}></span>
            内容数据
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总工具数</CardTitle>
                <Wrench className="h-4 w-4" style={{ color: '#e52129' }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{toolCount}</div>
                <p className={`text-[10px] mt-1 ${trendClass(toolTrend.tone)}`}>
                  {toolTrend.text}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">博客总数</CardTitle>
                <FileText className="h-4 w-4" style={{ color: '#e52129' }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{blogCount}</div>
                <p className={`text-[10px] mt-1 ${trendClass(blogTrend.tone)}`}>
                  {blogTrend.text}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">导航总数</CardTitle>
                <Link2 className="h-4 w-4" style={{ color: '#e52129' }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{linkCount}</div>
                <p className={`text-[10px] mt-1 ${trendClass(linkTrend.tone)}`}>
                  {linkTrend.text}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">提示词总数</CardTitle>
                <Lightbulb className="h-4 w-4" style={{ color: '#e52129' }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{promptCount}</div>
                <p className={`text-[10px] mt-1 ${trendClass(promptTrend.tone)}`}>
                  {promptTrend.text}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">推荐总数</CardTitle>
                <Star className="h-4 w-4" style={{ color: '#e52129' }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{submissionCount}</div>
                <p className={`text-[10px] mt-1 ${trendClass(submissionTrend.tone)}`}>
                  {submissionTrend.text}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">心愿总数</CardTitle>
                <MessageSquare className="h-4 w-4" style={{ color: '#e52129' }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{demandCount}</div>
                <p className={`text-[10px] mt-1 ${trendClass(demandTrend.tone)}`}>
                  {demandTrend.text}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 互动数据 */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e52129' }}></span>
            互动数据
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
                <Eye className="h-4 w-4" style={{ color: '#e52129' }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(views)}</div>
                <p
                  className={`text-[10px] mt-1 ${trendClass(viewsTrend.tone)}`}
                  title="本月浏览量相比上月的变化（按行为日志统计）"
                >
                  {viewsTrend.text}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">点赞数</CardTitle>
                <Heart className="h-4 w-4" style={{ color: '#e52129' }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(likes)}</div>
                <p
                  className={`text-[10px] mt-1 ${trendClass(likesTrend.tone)}`}
                  title="本月点赞量相比上月的变化（按行为日志统计）"
                >
                  {likesTrend.text}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">收藏数</CardTitle>
                <Star className="h-4 w-4" style={{ color: '#e52129' }} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(favorites)}</div>
                <p
                  className={`text-[10px] mt-1 ${trendClass(favoritesTrend.tone)}`}
                  title="本月收藏量相比上月的变化（按行为日志统计）"
                >
                  {favoritesTrend.text}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="grid gap-4 lg:grid-cols-3 items-stretch">
        {/* 左侧：最近提示词 */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>最近添加的提示词</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/ibackend/prompts">
                    查看全部
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <CardDescription>最近 7 天新增的提示词</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">提示词名称</TableHead>
                    <TableHead className="whitespace-nowrap">分类</TableHead>
                    <TableHead className="whitespace-nowrap text-right">浏览量</TableHead>
                    <TableHead className="whitespace-nowrap text-right">点赞</TableHead>
                    <TableHead className="whitespace-nowrap text-right">日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPrompts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500">
                        暂无提示词数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentPrompts.map((prompt) => (
                      <TableRow key={prompt.id}>
                        <TableCell className="font-medium max-w-[240px]">
                        <span className="block truncate" title={prompt.title}>{prompt.title}</span>
                      </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{prompt.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{prompt.views}</TableCell>
                        <TableCell className="text-right">{prompt.likes}</TableCell>
                        <TableCell className="text-right text-slate-500">
                          {formatDate(prompt.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：快捷操作 */}
        <div className="flex flex-col gap-4">
          <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
              <CardDescription>快速执行常用操作</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" asChild>
                <Link href="/ibackend/tools">
                  <Plus className="mr-2 h-4 w-4" />
                  添加新工具
                </Link>
              </Button>
              <Button className="w-full justify-start" asChild variant="outline">
                <Link href="/ibackend/prompts">
                  <Plus className="mr-2 h-4 w-4" />
                  发布提示词
                </Link>
              </Button>
              <Button className="w-full justify-start" asChild variant="outline">
                <Link href="/ibackend/blogs">
                  <Plus className="mr-2 h-4 w-4" />
                  创作新文章
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>系统状态</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <SystemStatusCard
                apiSuccess={systemMetrics?.apiSuccess ?? 0}
                apiFailed={apiFailed}
                aiErrors={aiErrorsCount}
                rawErrorCount={rawErrors.length}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}