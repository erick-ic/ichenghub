'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from "next/link"
import {
  LayoutDashboard,
  Wrench,
  Lightbulb,
  Users,
  Link2,
  LogOut,
  FileText,
  Loader2,
  BarChart3,
  BookOpen,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useEscapeKey } from '@/hooks/useEscapeKey'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  useBodyScrollLock(isMobileNavOpen)
  useEscapeKey(isMobileNavOpen, () => setIsMobileNavOpen(false))

  // 客户端检查是否已登录
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        if (!response.ok) {
          router.replace('/ibackendlogin')
        }
      } catch (error) {
        router.replace('/ibackendlogin')
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [pathname])

  const navItems = [
    { title: "控制面板", href: "/ibackend", icon: LayoutDashboard },
    { title: "数据看板", href: "/ibackend/dashboard", icon: BarChart3 },
    { title: "工具管理", href: "/ibackend/tools", icon: Wrench },
    { title: "导航管理", href: "/ibackend/links", icon: Link2 },
    { title: "提示词管理", href: "/ibackend/prompts", icon: Lightbulb },
    { title: "博客管理", href: "/ibackend/blogs", icon: BookOpen },
    { title: "提交管理", href: "/ibackend/submissions", icon: FileText },
    { title: "用户管理", href: "/ibackend/users", icon: Users },
  ]

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        router.replace('/')
      } else {
        console.error('Logout failed')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoading(false)
    }
  }

  const isNavItemActive = (href: string) => {
    if (href === '/ibackend') return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const navigation = (
    <>
      <nav className="flex-1 overflow-y-auto overscroll-contain p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = isNavItemActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'ml-[-2px] border-l-2 border-[#e52129] bg-slate-800 text-[#e52129]'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.title}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Separator className="mb-4 bg-slate-700" />
        <Button
          variant="ghost"
          className="min-h-11 w-full justify-start text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          onClick={() => setIsConfirmOpen(true)}
        >
          <LogOut className="mr-2 h-4 w-4" />
          退出
        </Button>
      </div>
    </>
  )

  return (
    <div className="admin-shell flex min-h-screen bg-slate-50/50">
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-56 flex-col border-r border-slate-800 bg-slate-900 text-slate-200 lg:flex">
        <div className="flex h-16 items-center px-6">
          <Link
            href="/ibackend"
            className="flex items-baseline font-extrabold italic tracking-tighter hover:opacity-80 transition-opacity"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            <span className="text-2xl text-white">iCheng</span>
            <span className="text-2xl text-[#e52129]">Hub</span>
          </Link>
        </div>

        {navigation}
      </aside>

      <div className="min-w-0 flex-1 overflow-x-hidden lg:ml-56">
        <header className="sticky top-0 z-30 grid h-14 grid-cols-[2.75rem_1fr_2.75rem] items-center border-b border-slate-200 bg-white/95 px-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setIsMobileNavOpen(true)} aria-label="打开后台导航" aria-controls="admin-mobile-navigation" aria-expanded={isMobileNavOpen}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/ibackend" className="mx-auto flex items-baseline font-extrabold italic tracking-tighter" style={{ fontFamily: "'Exo 2', sans-serif" }} aria-label="返回后台首页">
            <span className="text-xl text-slate-900">iCheng</span>
            <span className="text-xl text-[#e52129]">Hub</span>
          </Link>
          <span aria-hidden="true" className="h-11 w-11" />
        </header>

        <main className="admin-main min-h-[calc(100dvh-3.5rem)] bg-slate-50/50 px-4 py-5 sm:px-6 sm:py-6 lg:min-h-screen lg:p-8">
          {children}
        </main>
      </div>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="后台导航">
          <button className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]" onClick={() => setIsMobileNavOpen(false)} aria-label="关闭后台导航" />
          <aside id="admin-mobile-navigation" className="absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] flex-col bg-slate-900 text-slate-200 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex h-16 items-center justify-between px-5">
              <Link href="/ibackend" className="flex items-baseline font-extrabold italic tracking-tighter" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                <span className="text-2xl text-white">iCheng</span><span className="text-2xl text-[#e52129]">Hub</span>
              </Link>
              <Button variant="ghost" size="icon" className="h-11 w-11 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setIsMobileNavOpen(false)} aria-label="关闭后台导航">
                <X className="h-5 w-5" />
              </Button>
            </div>
            {navigation}
          </aside>
        </div>
      )}

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">确认退出</DialogTitle>
            <DialogDescription className="text-slate-500">
              确定要退出后台管理系统吗？退出后将返回网站首页。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isLoading}
              className="flex-1 px-6 py-2.5 text-sm font-medium border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              取消
            </Button>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  退出中...
                </>
              ) : (
                '确认'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
