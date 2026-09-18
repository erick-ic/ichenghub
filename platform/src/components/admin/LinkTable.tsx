'use client'

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ToolIcon } from "@/components/ui/ToolIcon"
import { Plus, Search, Pencil, Trash2, ChevronUp, ChevronDown, ArrowUpToLine } from "lucide-react"
import { createLink, updateLink, deleteLink, toggleLinkStatus, moveLinkUp, moveLinkDown, moveLinkToTop } from "@/app/actions/linkActions"

interface Link {
  id: string
  name: string
  nameEn: string | null
  desc: string
  descEn: string | null
  url: string
  iconUrl: string | null
  category: string
  categoryEn: string | null
  status: number
  sortOrder: number
  createdAt: Date
}

interface LinkTableProps {
  links: Link[]
}

export function LinkTable({ links }: LinkTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [deletingLink, setDeletingLink] = useState<Link | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }, 300)

  const handleCreateLink = async (prevState: any, formData: FormData) => {
    await createLink(prevState, formData)
    setIsDialogOpen(false)
    setToastMessage('链接添加成功！')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    return { message: '添加成功', success: true }
  }

  const handleEditLink = async (prevState: any, formData: FormData) => {
    await updateLink(prevState, formData)
    router.refresh()
    setIsEditDialogOpen(false)
    setEditingLink(null)
    setToastMessage('链接更新成功！')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    return { message: '更新成功', success: true }
  }

  const openEditDialog = (link: Link) => {
    setEditingLink(link)
    setIsEditDialogOpen(true)
  }

  const handleDeleteLink = async () => {
    if (deletingLink) {
      await deleteLink(deletingLink.id)
      router.refresh()
      setIsDeleteDialogOpen(false)
      setDeletingLink(null)
      setToastMessage('链接删除成功！')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  const openDeleteDialog = (link: Link) => {
    setDeletingLink(link)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleStatus = async (link: Link) => {
    if (loadingId) return
    setLoadingId(link.id)
    await toggleLinkStatus(link.id)
    router.refresh()
    setToastMessage(link.status === 1 ? '链接已关闭' : '链接已开启')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  const handleMoveToTop = async (link: Link) => {
    if (loadingId) return
    setLoadingId(link.id)
    await moveLinkToTop(link.id)
    router.refresh()
    setToastMessage('链接已置顶')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  const handleMoveUp = async (link: Link) => {
    if (loadingId) return
    setLoadingId(link.id)
    await moveLinkUp(link.id)
    router.refresh()
    setToastMessage('链接已上移')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  const handleMoveDown = async (link: Link) => {
    if (loadingId) return
    setLoadingId(link.id)
    await moveLinkDown(link.id)
    router.refresh()
    setToastMessage('链接已下移')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  return (
    <div className="space-y-4">
      {showToast && (
        <div className="fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 bg-green-100 border border-green-400 rounded-lg text-green-800 shadow-lg animate-in fade-in slide-in-from-right-4 duration-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{toastMessage}</span>
          <button
            onClick={() => setShowToast(false)}
            className="ml-2 text-green-600 hover:text-green-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜索链接..."
            defaultValue={searchParams.get('q') || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加链接
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新链接</DialogTitle>
              <DialogDescription>
                填写链接信息，点击保存后将添加到数据库。
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              await handleCreateLink(null, formData)
              router.refresh()
            }} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名称 (中文)</Label>
                  <Input id="name" name="name" placeholder="请输入链接名称" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">名称 (English)</Label>
                  <Input id="nameEn" name="nameEn" placeholder="Enter link name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desc">描述 (中文)</Label>
                  <Input id="desc" name="desc" placeholder="请输入描述" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descEn">描述 (English)</Label>
                  <Input id="descEn" name="descEn" placeholder="Enter description" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">链接地址</Label>
                <Input id="url" name="url" placeholder="https://" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iconUrl">自定义图标 URL（可选）</Label>
                <Input id="iconUrl" name="iconUrl" placeholder="手动指定图标地址，用于修复无法自动获取图标的网站" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">分类 (中文)</Label>
                  <Input id="category" name="category" placeholder="例如: AI 对话" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryEn">分类 (English)</Label>
                  <Input id="categoryEn" name="categoryEn" placeholder="e.g.: AI Chat" />
                </div>
              </div>
              <Button type="submit" className="w-full">保存链接</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑链接</DialogTitle>
              <DialogDescription>
                修改链接信息，点击保存后将更新到数据库。
              </DialogDescription>
            </DialogHeader>
            {editingLink && (
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                await handleEditLink(null, formData)
              }} className="space-y-4 py-4">
                <input type="hidden" name="id" value={editingLink.id} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">名称 (中文)</Label>
                    <Input id="edit-name" name="name" defaultValue={editingLink.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nameEn">名称 (English)</Label>
                    <Input id="edit-nameEn" name="nameEn" defaultValue={editingLink.nameEn || ''} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-desc">描述 (中文)</Label>
                    <Input id="edit-desc" name="desc" defaultValue={editingLink.desc} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-descEn">描述 (English)</Label>
                    <Input id="edit-descEn" name="descEn" defaultValue={editingLink.descEn || ''} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-url">链接地址</Label>
                  <Input id="edit-url" name="url" defaultValue={editingLink.url} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-iconUrl">自定义图标 URL（可选）</Label>
                  <Input id="edit-iconUrl" name="iconUrl" defaultValue={editingLink.iconUrl || ''} placeholder="手动指定图标地址" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">分类 (中文)</Label>
                    <Input id="edit-category" name="category" defaultValue={editingLink.category} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-categoryEn">分类 (English)</Label>
                    <Input id="edit-categoryEn" name="categoryEn" defaultValue={editingLink.categoryEn || ''} />
                  </div>
                </div>
                <Button type="submit" className="w-full">更新链接</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">确认删除</DialogTitle>
              <DialogDescription>
                确定要删除链接「{deletingLink?.name}」吗？此操作无法撤销。
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                取消
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteLink}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <Table className="w-full min-w-[900px] md:min-w-0">
          <TableHeader>
            <TableRow className="hover:bg-slate-50">
              <TableHead className="w-16 whitespace-nowrap">Logo</TableHead>
              <TableHead className="w-28 whitespace-nowrap">链接名称</TableHead>
              <TableHead className="w-20 whitespace-nowrap">分类</TableHead>
              <TableHead className="w-[30%] whitespace-nowrap">描述</TableHead>
              <TableHead className="w-24 whitespace-nowrap">状态</TableHead>
              <TableHead className="w-40 whitespace-nowrap">创建时间</TableHead>
              <TableHead className="w-12 whitespace-nowrap">排序</TableHead>
              <TableHead className="w-24 whitespace-nowrap text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500">
                  暂无链接数据
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => (
                <TableRow key={link.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center">
                      <ToolIcon url={link.url} title={link.name} iconUrl={link.iconUrl || undefined} />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate whitespace-nowrap font-medium" title={link.name}>
                    {link.name}
                  </TableCell>
                  <TableCell className="max-w-[100px] truncate whitespace-nowrap" title={link.category}>
                    {link.category}
                  </TableCell>
                  <TableCell className="w-[30%] max-w-xs truncate" title={link.desc}>
                    {link.desc}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(link)}
                      disabled={loadingId === link.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        link.status === 1 ? 'bg-green-500' : 'bg-slate-300'
                      } ${loadingId === link.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          link.status === 1 ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-sm whitespace-nowrap">
                    {(() => {
                      const d = new Date(link.createdAt)
                      const pad = (n: number) => n.toString().padStart(2, '0')
                      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
                    })()}
                  </TableCell>
                  <TableCell className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveToTop(link)}
                      disabled={loadingId === link.id}
                      className="h-7 w-7 p-0 hover:bg-orange-50 hover:text-orange-600"
                      title="置顶"
                    >
                      <ArrowUpToLine className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(link)}
                      disabled={loadingId === link.id || links.indexOf(link) === 0}
                      className={`h-7 w-7 p-0 ${links.indexOf(link) === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'}`}
                      title="上移"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(link)}
                      disabled={loadingId === link.id || links.indexOf(link) === links.length - 1}
                      className={`h-7 w-7 p-0 ${links.indexOf(link) === links.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'}`}
                      title="下移"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <div className="flex flex-row gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(link)}
                        className="h-7 w-7 p-0 transition-all duration-200 hover:text-blue-600 hover:bg-blue-50"
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(link)}
                        className="h-7 w-7 p-0 text-red-600 transition-all duration-200 hover:bg-red-50"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
