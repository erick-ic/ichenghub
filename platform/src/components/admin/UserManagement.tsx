'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Activity, Bookmark, CalendarDays, ChevronLeft, ChevronRight, Clock3, FileText, Github, LogIn, Search, Send, Users, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAnalyticsActionLabel } from '@/lib/analytics-labels'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useEscapeKey } from '@/hooks/useEscapeKey'

export interface AdminUserRow {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: string
  providers: Array<{ provider: string; providerAccountId: string }>
  favoriteCount: number
  promptFavoriteCount: number
  blogFavoriteCount: number
  submissionCount: number
  toolSubmissionCount: number
  toolDemandCount: number
  activeSessionCount: number
  sessionExpiresAt: string | null
  lastActiveAt: string | null
  recentActivities: Array<{ id: string; actionType: string; resourceType: string; path: string; timestamp: string }>
  recentSubmissions: Array<{ id: string; type: 'TOOL' | 'DEMAND'; title: string; status: string; createdAt: string }>
}

interface Props {
  users: AdminUserRow[]
  stats: { totalUsers: number; newUsers: number; activeUsers: number; activeSessions: number }
  providers: string[]
  pagination: { page: number; total: number; totalPages: number }
  filters: { query: string; provider: string; sort: string }
}

function formatDate(value: string | null) {
  if (!value) return '暂无记录'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai',
  }).format(new Date(value))
}

function providerLabel(provider: string) {
  return provider === 'github' ? 'GitHub' : provider.charAt(0).toUpperCase() + provider.slice(1)
}

export default function UserManagement({ users, stats, providers, pagination, filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  useBodyScrollLock(selectedUser !== null)
  useEscapeKey(selectedUser !== null, () => setSelectedUser(null))

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all') params.delete(key)
      else params.set(key, value)
    })
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ''}`)
  }

  const handleSearch = useDebouncedCallback((value: string) => {
    updateParams({ q: value.trim() || null, page: null })
  }, 350)

  const cards = [
    { label: '用户总数', value: stats.totalUsers, icon: Users, tone: 'bg-slate-100 text-slate-700' },
    { label: '近 7 天新增', value: stats.newUsers, icon: CalendarDays, tone: 'bg-blue-50 text-blue-700' },
    { label: '近 7 天活跃', value: stats.activeUsers, icon: Activity, tone: 'bg-emerald-50 text-emerald-700' },
    { label: '有效会话', value: stats.activeSessions, icon: LogIn, tone: 'bg-red-50 text-[#e52129]' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">用户管理</h1>
        <p className="mt-1 text-slate-500">查看注册用户、账号来源及站内行为概况</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="min-w-0 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#e52129]/20 hover:shadow-xl sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="truncate text-xs text-slate-500 sm:text-sm">{label}</p><p className="mt-1.5 break-all text-xl font-bold tabular-nums sm:mt-2 sm:text-2xl">{value}</p></div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${tone}`}><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#e52129]/20 hover:shadow-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input defaultValue={filters.query} onChange={(event) => handleSearch(event.target.value)} placeholder="搜索昵称或邮箱..." className="pl-9" />
          </div>
          <FilterSelect value={filters.provider} onChange={(value) => updateParams({ provider: value, page: null })}>
            <option value="all">全部登录方式</option>
            {providers.map((item) => <option key={item} value={item}>{providerLabel(item)}</option>)}
          </FilterSelect>
          <FilterSelect value={filters.sort} onChange={(value) => updateParams({ sort: value, page: null })}>
            <option value="created_desc">注册时间：从新到旧</option>
            <option value="created_asc">注册时间：从旧到新</option>
            <option value="active_desc">最近活跃优先</option>
          </FilterSelect>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#e52129]/20 hover:shadow-xl">
        <div className="overflow-x-auto">
          <Table className="admin-card-table admin-users-table">
            <TableHeader><TableRow className="bg-slate-50/80">
              <TableHead>用户</TableHead><TableHead>登录方式</TableHead><TableHead className="text-center">收藏</TableHead>
              <TableHead className="text-center">提交</TableHead><TableHead>最近活跃</TableHead><TableHead>注册时间</TableHead><TableHead className="text-right">操作</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {users.length === 0 ? <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-400">暂无匹配用户</TableCell></TableRow> : users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/70">
                  <TableCell><UserIdentity user={user} /></TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{user.providers.map(({ provider, providerAccountId }) => (
                    <Badge key={`${provider}-${providerAccountId}`} variant="secondary" className="gap-1 font-normal">{provider === 'github' && <Github className="h-3 w-3" />}{providerLabel(provider)}</Badge>
                  ))}</div></TableCell>
                  <TableCell className="text-center tabular-nums">{user.favoriteCount}</TableCell>
                  <TableCell className="text-center tabular-nums">{user.submissionCount}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">{formatDate(user.lastActiveAt)}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>查看详情</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-500">共 {pagination.total} 位用户，第 {pagination.page}/{pagination.totalPages} 页</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => updateParams({ page: String(pagination.page - 1) })}><ChevronLeft className="mr-1 h-4 w-4" />上一页</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => updateParams({ page: String(pagination.page + 1) })}>下一页<ChevronRight className="ml-1 h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {selectedUser && <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  )
}

function FilterSelect({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-[#e52129] focus:outline-none focus:ring-2 focus:ring-red-100">{children}</select>
}

function UserIdentity({ user, large = false }: { user: AdminUserRow; large?: boolean }) {
  const size = large ? 'h-14 w-14 text-xl' : 'h-9 w-9 text-sm'
  return <div className="flex min-w-0 items-center gap-3 sm:min-w-[220px]">
    {user.image ? (
      // OAuth 头像来源会随登录渠道扩展，保留原始远程地址，避免限制到单一图片域名。
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.image} alt="" className={`${size} rounded-full object-cover ring-1 ring-slate-200`} />
    ) : <div className={`flex ${size} items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-500`}>{(user.name || user.email || '?').charAt(0).toUpperCase()}</div>}
    <div className="min-w-0"><p className={`${large ? 'text-lg' : ''} truncate font-semibold text-slate-900`}>{user.name || '未设置昵称'}</p><p className="truncate text-xs text-slate-500">{user.email || '未提供邮箱'}</p></div>
  </div>
}

function UserDrawer({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  return createPortal(<div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-labelledby="user-detail-title">
    <button className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]" onClick={onClose} aria-label="关闭详情" />
    <aside className="absolute inset-y-0 right-0 flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="z-10 flex shrink-0 items-center justify-between gap-3 border-b bg-white px-4 py-4 sm:px-6">
        <div className="min-w-0"><h2 id="user-detail-title" className="text-lg font-semibold">用户详情</h2><p className="mt-0.5 truncate text-xs text-slate-400" title={user.id}>ID：{user.id}</p></div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="关闭"><X className="h-5 w-5" /></Button>
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
        <section className="rounded-xl bg-slate-50 p-4"><UserIdentity user={user} large /><div className="mt-3 flex gap-1.5">{user.providers.map((item) => <Badge key={`${item.provider}-${item.providerAccountId}`} variant="secondary">{providerLabel(item.provider)}</Badge>)}</div></section>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="提示词收藏" value={user.promptFavoriteCount} icon={Bookmark} /><Metric label="博客收藏" value={user.blogFavoriteCount} icon={Bookmark} />
          <Metric label="工具推荐" value={user.toolSubmissionCount} icon={Send} /><Metric label="需求许愿" value={user.toolDemandCount} icon={FileText} />
        </section>
        <Section title="账号与会话"><div className="divide-y rounded-xl border text-sm"><Info label="注册时间" value={formatDate(user.createdAt)} /><Info label="最近活跃" value={formatDate(user.lastActiveAt)} /><Info label="有效会话" value={`${user.activeSessionCount} 个`} /><Info label="会话最晚过期" value={formatDate(user.sessionExpiresAt)} /></div></Section>
        <Section title="最近行为">
          <div className="min-w-0 space-y-2">
            {user.recentActivities.length ? user.recentActivities.map((item) => (
              <div key={item.id} className="flex min-w-0 items-start gap-3 overflow-hidden rounded-lg border p-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{getAnalyticsActionLabel(item.actionType, item.resourceType)}</p>
                    <time className="shrink-0 whitespace-nowrap text-xs text-slate-400">{formatDate(item.timestamp)}</time>
                  </div>
                  <p className="mt-1 line-clamp-2 break-all text-xs leading-5 text-slate-400" title={item.path || '未记录路径'}>
                    {item.path || '未记录路径'}
                  </p>
                </div>
              </div>
            )) : <Empty text="暂无行为记录" />}
          </div>
        </Section>
        <Section title="最近提交"><div className="space-y-2">{user.recentSubmissions.length ? user.recentSubmissions.map((item) => <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-slate-400">{item.type === 'TOOL' ? '工具推荐' : '需求许愿'} · {formatDate(item.createdAt)}</p></div><Badge variant="outline">{item.status}</Badge></div>) : <Empty text="暂无提交记录" />}</div></Section>
      </div>
    </aside>
  </div>, document.body)
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return <div className="rounded-xl border p-3"><Icon className="h-4 w-4 text-slate-400" /><p className="mt-3 text-xl font-semibold tabular-nums">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-3"><h3 className="font-semibold">{title}</h3>{children}</section> }
function Info({ label, value }: { label: string; value: string }) { return <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between sm:gap-4"><span className="text-slate-500">{label}</span><span className="break-words sm:text-right">{value}</span></div> }
function Empty({ text }: { text: string }) { return <div className="rounded-lg border border-dashed py-7 text-center text-sm text-slate-400">{text}</div> }
