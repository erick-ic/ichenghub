import prisma from '@/lib/prisma'
import { getBeijingDayKey, getBeijingHour } from '@/lib/time'
import { Eye, Users, MousePointerClick, Copy, Activity, Wrench, Lightbulb, Globe, Clock, FolderOpen, Smartphone, Monitor, Link2, FileText, Code } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import RefreshButton from './RefreshButton'
import { TrendChart } from './TrendChart'
import { LanguagePieChart } from './LanguagePieChart'
import { RecentActivity } from './RecentActivity'
import { TopPaths } from './TopPaths'
import { DeviceDistribution } from './DeviceDistribution'
import { HourlyChart } from './HourlyChart'

export const dynamic = 'force-dynamic'

interface AnalyticsData {
  totalPV: number
  uniqueUV: number
  toolClicks: number
  promptCopies: number
  blogViews: number
  blogCopies: number
  chartData: { date: string; pv: number; uv: number; clicks: number; copies: number }[]
  topTools: { id: string; name: string; clicks: number; views: number }[]
  topPrompts: { id: string; title: string; copies: number; views: number }[]
  topBlogs: { id: string; title: string; views: number; copies: number }[]
  topLinks: { id: string; name: string; clicks: number }[]
  languageDistribution: { name: string; value: number; percent: number }[]
  topPaths: { path: string; count: number; percent: number }[]
  deviceDistribution: { name: string; value: number; percent: number; type: 'mobile' | 'desktop' }[]
  hourlyData: { hour: string; count: number }[]
  recentActivity: {
    id: string
    actionType: string
    resourceType: string
    resourceName: string
    path: string
    ipMasked: string
    timeAgo: string
  }[]
}

function maskIP(ipHash: string | null): string {
  if (!ipHash) return '匿名用户'
  return ipHash
}

function getTimeAgo(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

function isMobile(userAgent: string | null): boolean {
  if (!userAgent) return false
  return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(userAgent)
}

// 自研静态工具名称映射（不经过 toolCard 表，通过 path 推断）
const STATIC_TOOL_NAME_MAP: Record<string, string> = {
  '/qrcode': '极简二维码生成器',
  '/tools/image-compressor': '图片压缩器',
  '/imgcompress': '图片压缩器',
  '/aiquota': 'AI 额度追踪器',
}

function resolveStaticToolName(path: string | null): string {
  if (!path) return '自研工具'
  // 先精确匹配
  if (STATIC_TOOL_NAME_MAP[path]) return STATIC_TOOL_NAME_MAP[path]
  // 再前缀匹配（兼容带 locale 前缀的路径，如 /zh/qrcode）
  for (const [key, name] of Object.entries(STATIC_TOOL_NAME_MAP)) {
    if (path.endsWith(key) || path.includes(key)) return name
  }
  // 兜底：提取路径末段
  const segments = path.split('/').filter(Boolean)
  if (segments.length > 0) {
    const last = segments[segments.length - 1]
    return last.charAt(0).toUpperCase() + last.slice(1)
  }
  return '自研工具'
}

async function getAnalyticsData(): Promise<AnalyticsData> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const logs = await prisma.analyticsLog.findMany({
    where: { timestamp: { gte: sevenDaysAgo } },
    orderBy: { timestamp: 'desc' }
  })

  const totalPV = logs.length
  const uniqueUV = new Set(logs.map(l => l.ipHash).filter(Boolean)).size
  const toolClicks = logs.filter(l => l.actionType === 'CLICK' && l.resourceType === 'TOOL').length
  const promptCopies = logs.filter(l => l.actionType === 'COPY' && l.resourceType === 'PROMPT').length
  const blogViews = logs.filter(l => l.actionType === 'VIEW' && l.resourceType === 'BLOG').length
  const blogCopies = logs.filter(l => l.actionType === 'COPY' && l.resourceType === 'BLOG').length

  // 按北京时间（UTC+8）聚合日历日：服务器可能运行在 UTC，直接 toISOString() 截断
  // 会把北京凌晨的访问归到前一天，统一走 src/lib/time 的北京日 key。
  const getDayKey = getBeijingDayKey

  // 趋势固定展示最近 7 个北京日历日（含今天），无访问的日期补 0，避免 X 轴缺天
  const dayKeys: string[] = []
  for (let i = 6; i >= 0; i--) {
    dayKeys.push(getDayKey(new Date(Date.now() - i * 24 * 3600 * 1000)))
  }

  const dailyStats = new Map<string, { pv: number; uv: Set<string>; clicks: number; copies: number; blogViews: number; blogCopies: number }>()
  for (const key of dayKeys) {
    dailyStats.set(key, { pv: 0, uv: new Set(), clicks: 0, copies: 0, blogViews: 0, blogCopies: 0 })
  }
  logs.forEach(log => {
    const date = getDayKey(log.timestamp)
    const stat = dailyStats.get(date)
    // 仅累计最近 7 个日历日内的日志，更早的数据不进趋势图
    if (!stat) return
    stat.pv++
    if (log.ipHash) stat.uv.add(log.ipHash)
    if (log.actionType === 'CLICK' && log.resourceType === 'TOOL') stat.clicks++
    if (log.actionType === 'COPY' && log.resourceType === 'PROMPT') stat.copies++
    if (log.actionType === 'VIEW' && log.resourceType === 'BLOG') stat.blogViews++
    if (log.actionType === 'COPY' && log.resourceType === 'BLOG') stat.blogCopies++
  })

  const chartData = dayKeys.map((date) => {
    const stat = dailyStats.get(date)!
    return {
      date: date.substring(5),
      pv: stat.pv,
      uv: stat.uv.size,
      clicks: stat.clicks,
      copies: stat.copies
    }
  })

  const toolClickMap = new Map<string, number>()
  const toolViewMap = new Map<string, number>()
  const promptCopyMap = new Map<string, number>()
  const promptViewMap = new Map<string, number>()
  const linkClickMap = new Map<string, number>()
  const blogViewMap = new Map<string, number>()
  const blogCopyMap = new Map<string, number>()

  logs.forEach(log => {
    if (!log.resourceId) return
    if (log.resourceType === 'TOOL') {
      if (log.actionType === 'CLICK') {
        toolClickMap.set(log.resourceId, (toolClickMap.get(log.resourceId) || 0) + 1)
      }
      if (log.actionType === 'VIEW') {
        toolViewMap.set(log.resourceId, (toolViewMap.get(log.resourceId) || 0) + 1)
      }
    }
    if (log.resourceType === 'PROMPT') {
      if (log.actionType === 'COPY') {
        promptCopyMap.set(log.resourceId, (promptCopyMap.get(log.resourceId) || 0) + 1)
      }
      if (log.actionType === 'VIEW') {
        promptViewMap.set(log.resourceId, (promptViewMap.get(log.resourceId) || 0) + 1)
      }
    }
    if (log.resourceType === 'LINK') {
      if (log.actionType === 'CLICK') {
        linkClickMap.set(log.resourceId, (linkClickMap.get(log.resourceId) || 0) + 1)
      }
    }
    if (log.resourceType === 'BLOG') {
      if (log.actionType === 'VIEW') {
        blogViewMap.set(log.resourceId, (blogViewMap.get(log.resourceId) || 0) + 1)
      }
      if (log.actionType === 'COPY') {
        blogCopyMap.set(log.resourceId, (blogCopyMap.get(log.resourceId) || 0) + 1)
      }
    }
  })

  const tools = await prisma.toolCard.findMany({
    where: { id: { in: Array.from(new Set([...toolClickMap.keys(), ...toolViewMap.keys()])) } },
    select: { id: true, name: true }
  })
  const toolMap = new Map(tools.map(t => [t.id, t.name]))

  const prompts = await prisma.prompt.findMany({
    where: { id: { in: Array.from(new Set([...promptCopyMap.keys(), ...promptViewMap.keys()])) } },
    select: { id: true, title: true }
  })
  const promptMap = new Map(prompts.map(p => [p.id, p.title]))

  const blogIds = logs
    .filter(l => l.resourceType === 'BLOG' && l.resourceId)
    .map(l => l.resourceId as string)
  const blogs = await prisma.blog.findMany({
    where: { id: { in: Array.from(new Set([...blogViewMap.keys(), ...blogCopyMap.keys(), ...blogIds])) } },
    select: { id: true, titleZh: true, titleEn: true }
  })
  const blogMap = new Map(blogs.map(b => [b.id, b.titleZh || b.titleEn]))

  const blogPopularityMap = new Map<string, number>()
  blogs.forEach(blog => {
    const views = blogViewMap.get(blog.id) || 0
    const copies = blogCopyMap.get(blog.id) || 0
    blogPopularityMap.set(blog.id, views + copies)
  })

  const topBlogs = Array.from(blogPopularityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, total]) => ({
      id,
      title: blogMap.get(id) || 'Unknown Blog',
      views: blogViewMap.get(id) || 0,
      copies: blogCopyMap.get(id) || 0
    }))

  const toolPopularityMap = new Map<string, number>()
  tools.forEach(tool => {
    const clicks = toolClickMap.get(tool.id) || 0
    const views = toolViewMap.get(tool.id) || 0
    toolPopularityMap.set(tool.id, clicks + views)
  })
  
  const topTools = Array.from(toolPopularityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, total]) => ({
      id,
      name: toolMap.get(id) || 'Unknown Tool',
      clicks: toolClickMap.get(id) || 0,
      views: toolViewMap.get(id) || 0
    }))

  const topPrompts = Array.from(promptCopyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, copies]) => ({
      id,
      title: promptMap.get(id) || 'Unknown Prompt',
      copies,
      views: promptViewMap.get(id) || 0
    }))

  const links = await prisma.navLink.findMany({
    where: { id: { in: Array.from(linkClickMap.keys()) } },
    select: { id: true, name: true }
  })
  const linkMap = new Map(links.map(l => [l.id, l.name]))

  const topLinks = Array.from(linkClickMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, clicks]) => ({
      id,
      name: linkMap.get(id) || 'Unknown Link',
      clicks
    }))

  const languageMap = new Map<string, number>()
  logs.forEach(log => {
    const path = log.path || ''
    let lang = '其他'
    if (path.includes('/zh') || path.includes('/cn') || path === '/' || path === '') {
      lang = '中文 (zh)'
    } else if (path.includes('/en')) {
      lang = 'English (en)'
    }
    languageMap.set(lang, (languageMap.get(lang) || 0) + 1)
  })

  const totalLang = Array.from(languageMap.values()).reduce((a, b) => a + b, 0)
  const languageDistribution = Array.from(languageMap.entries())
    .map(([name, value]) => ({
      name,
      value,
      percent: totalLang > 0 ? Math.round((value / totalLang) * 10000) / 100 : 0
    }))
    .sort((a, b) => b.value - a.value)

  const pathMap = new Map<string, number>()
  logs.forEach(log => {
    const path = log.path || ''
    if (path && path !== '/') {
      pathMap.set(path, (pathMap.get(path) || 0) + 1)
    }
  })
  const totalPaths = Array.from(pathMap.values()).reduce((a, b) => a + b, 0)
  const topPaths = Array.from(pathMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, count]) => ({
      path,
      count,
      percent: totalPaths > 0 ? Math.round((count / totalPaths) * 10000) / 100 : 0
    }))

  const deviceMap = new Map<string, number>()
  logs.forEach(log => {
    const device = isMobile(log.userAgent) ? 'mobile' : 'desktop'
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1)
  })
  const totalDevices = Array.from(deviceMap.values()).reduce((a, b) => a + b, 0)
  const deviceDistribution = [
    {
      name: '移动端',
      value: deviceMap.get('mobile') || 0,
      percent: totalDevices > 0 ? Math.round((deviceMap.get('mobile') || 0) / totalDevices * 10000) / 100 : 0,
      type: 'mobile' as const
    },
    {
      name: 'PC 端',
      value: deviceMap.get('desktop') || 0,
      percent: totalDevices > 0 ? Math.round((deviceMap.get('desktop') || 0) / totalDevices * 10000) / 100 : 0,
      type: 'desktop' as const
    }
  ]

  const hourlyMap = new Map<number, number>()
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, 0)
  }
  logs.forEach(log => {
    const hour = getBeijingHour(log.timestamp)
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
  })
  const hourlyData = Array.from(hourlyMap.entries())
    .map(([hour, count]) => ({
      hour: hour.toString().padStart(2, '0') + ':00',
      count
    }))

  const recentLogs = logs.slice(0, 5).map(log => {
    let resourceName = 'Unknown'
    if (log.resourceType === 'TOOL') {
      if (log.resourceId && toolMap.has(log.resourceId)) {
        resourceName = toolMap.get(log.resourceId)!
      } else {
        // 自研静态工具：从 path 推断名称
        resourceName = resolveStaticToolName(log.path)
      }
    } else if (log.resourceType === 'PROMPT') {
      resourceName = promptMap.get(log.resourceId || '') || 'Unknown Prompt'
    } else if (log.resourceType === 'BLOG') {
      resourceName = blogMap.get(log.resourceId || '') || 'Unknown Blog'
    } else if (log.resourceType === 'LINK') {
      resourceName = linkMap.get(log.resourceId || '') || 'Unknown Link'
    } else if (log.resourceType === 'PAGE') {
      resourceName = log.path || 'Unknown Page'
    }
    return {
      id: log.id,
      actionType: log.actionType,
      resourceType: log.resourceType,
      resourceName,
      path: log.path,
      ipMasked: maskIP(log.ipHash),
      timeAgo: getTimeAgo(log.timestamp)
    }
  })

  return { totalPV, uniqueUV, toolClicks, promptCopies, blogViews, blogCopies, chartData, topTools, topPrompts, topBlogs, topLinks, languageDistribution, topPaths, deviceDistribution, hourlyData, recentActivity: recentLogs }
}

function StatCard({ title, value, icon, color, hint, trend }: { title: string; value: number; icon: React.ReactNode; color: string; hint?: string; trend?: string }) {
  return (
    <Card className="group relative overflow-hidden bg-white border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 mb-2 tracking-wide uppercase" title={hint}>{title}</p>
            <p className="text-[28px] font-bold leading-none tracking-tight tabular-nums" style={{ color }}>{value.toLocaleString()}</p>
            {trend && (
              <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: color + '60' }} />
                {trend}
              </p>
            )}
          </div>
          <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105" style={{ backgroundColor: color + '12' }}>
            <div style={{ color }}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <Activity className="w-8 h-8 mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const data = await getAnalyticsData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">数据看板</h1>
          <p className="text-slate-500 mt-1">分析用户行为和内容互动数据</p>
        </div>
        <RefreshButton />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="总访问量 (PV)"
          value={data.totalPV}
          icon={<Eye className="w-5 h-5" />}
          color="#e52129"
          hint="统计最近 7 天内所有页面浏览次数，同一用户多次访问重复记录"
        />
        <StatCard
          title="独立访客 (UV)"
          value={data.uniqueUV}
          icon={<Users className="w-5 h-5" />}
          color="#e52129"
          hint="统计最近 7 天内按 IP 哈希去重后的独立访客数"
        />
        <StatCard
          title="工具点击"
          value={data.toolClicks}
          icon={<MousePointerClick className="w-5 h-5" />}
          color="#e52129"
          hint="统计最近 7 天内对工具卡片的点击次数"
        />
        <StatCard
          title="提示词复制"
          value={data.promptCopies}
          icon={<Copy className="w-5 h-5" />}
          color="#e52129"
          hint="统计最近 7 天内提示词详情页的复制次数"
        />
        <StatCard
          title="博客访问"
          value={data.blogViews}
          icon={<FileText className="w-5 h-5" />}
          color="#e52129"
          hint="统计最近 7 天内博客详情页的访问次数"
        />
        <StatCard
          title="代码复制"
          value={data.blogCopies}
          icon={<Code className="w-5 h-5" />}
          color="#e52129"
          hint="统计最近 7 天内博客代码块右上角复制按钮被点击的次数"
        />
      </div>

      <p className="-mt-4 mb-4 text-xs text-slate-400">以上统计均基于最近 7 天的用户行为日志（本地时区）</p>

      {data.chartData.length === 0 ? (
        <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <CardContent className="py-12">
            <EmptyState message="暂无访问数据" />
          </CardContent>
        </Card>
      ) : (
        <TrendChart data={data.chartData} />
      )}

      {/* 最近动态 - 单独一行 */}
      <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: '#e52129' }} />
            <span title="最近 5 条用户行为日志">最近动态</span>
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">规则：展示最近5条用户行为记录</p>
        </CardHeader>
        <CardContent className="p-0">
          <RecentActivity activities={data.recentActivity} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: '#e52129' }} />
              <span title="统计访问请求中 Accept-Language 对应的语言偏好">语种分布</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">规则：路径含 /zh 或根路径为中文，/en 为英文</p>
          </CardHeader>
          <CardContent className="p-3">
            {data.languageDistribution.length === 0 || data.languageDistribution.every(item => item.value === 0) ? (
              <div className="h-24 flex items-center justify-center">
                <span className="text-sm text-slate-400">暂无语种数据</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20">
                    <LanguagePieChart data={data.languageDistribution} />
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {data.languageDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: index === 0 ? '#e52129' : '#3b82f6' }} />
                        <span className="text-xs text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-medium" style={{ color: index === 0 ? '#e52129' : '#3b82f6' }}>
                        {item.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" style={{ color: '#e52129' }} />
              <span title="按 User-Agent 判断移动端或 PC 端">设备分布</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">规则：通过 User-Agent 识别移动端/PC端</p>
          </CardHeader>
          <CardContent className="p-3">
            <DeviceDistribution data={data.deviceDistribution} />
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: '#e52129' }} />
              <span title="统计一天 24 个小时各自的访问次数">活跃时段</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">规则：按访问时间的小时分组统计</p>
          </CardHeader>
          <CardContent className="p-3">
            <HourlyChart data={data.hourlyData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="w-5 h-5" style={{ color: '#e52129' }} />
              <span title="统计所有用户访问的页面路径">热门路径 TOP5</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">规则：统计所有用户访问的页面路径</p>
          </CardHeader>
          <CardContent className="p-3">
            <TopPaths data={data.topPaths.slice(0, 5)} />
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5" style={{ color: '#e52129' }} />
              <span title="统计提示词的复制次数，同一用户同一提示词当日内只记1次">热门提示词 TOP5</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">规则：统计提示词的复制次数，同一用户同一提示词当日内只记1次</p>
          </CardHeader>
          <CardContent>
            {data.topPrompts.length === 0 ? (
              <EmptyState message="暂无复制数据" />
            ) : (
              <div className="space-y-3">
                {data.topPrompts.map((prompt, index) => {
                  return (
                    <div key={prompt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3 flex-[0.9] min-w-0">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: index === 0 ? '#e52129' : '#f97316' }}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700 truncate block min-w-0" title={prompt.title}>{prompt.title}</span>
                      </div>
                      <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-50 flex-shrink-0">
                        {prompt.copies} 次
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5" style={{ color: '#e52129' }} />
              <span title="统计工具的点击+浏览，同一用户同一工具当日内只记1次">热门工具 TOP5</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">规则：统计工具的点击+浏览，同一用户同一工具当日内只记1次</p>
          </CardHeader>
          <CardContent>
            {data.topTools.length === 0 ? (
              <EmptyState message="暂无工具点击数据" />
            ) : (
              <div className="space-y-3">
                {data.topTools.map((tool, index) => {
                  return (
                    <div key={tool.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3 flex-[0.9] min-w-0">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: index === 0 ? '#e52129' : '#f97316' }}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700 truncate block min-w-0" title={tool.name}>{tool.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-50 flex-shrink-0">
                        {tool.clicks + tool.views} 次
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: '#e52129' }} />
              <span title="统计博客的浏览+代码复制，同一用户同一博客当日内只记1次">热门博客 TOP5</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">规则：统计博客的浏览+代码复制，同一用户同一博客当日内只记1次</p>
          </CardHeader>
          <CardContent>
            {data.topBlogs.length === 0 ? (
              <EmptyState message="暂无博客数据" />
            ) : (
              <div className="space-y-3">
                {data.topBlogs.map((blog, index) => {
                  return (
                    <div key={blog.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3 flex-[0.9] min-w-0">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: index === 0 ? '#e52129' : '#f97316' }}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700 truncate block min-w-0" title={blog.title}>{blog.title}</span>
                      </div>
                      <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-50 flex-shrink-0">
                        浏览 {blog.views} · 复制 {blog.copies}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="w-5 h-5" style={{ color: '#e52129' }} />
              <span title="统计导航链接的点击次数，同一用户同一链接当日内只记1次">热门导航 TOP5</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">规则：统计导航链接的点击次数，同一用户同一链接当日内只记1次</p>
          </CardHeader>
          <CardContent>
            {data.topLinks.length === 0 ? (
              <EmptyState message="暂无导航点击数据" />
            ) : (
              <div className="space-y-3">
                {data.topLinks.map((link, index) => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3 flex-[0.9] min-w-0">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: index === 0 ? '#e52129' : '#f97316' }}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700 truncate block min-w-0" title={link.name}>{link.name}</span>
                      </div>
                    <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-50 flex-shrink-0">
                      {link.clicks} 次
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
  )
}
