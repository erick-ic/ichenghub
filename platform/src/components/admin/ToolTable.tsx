'use client'

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Image from 'next/image'
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
import { Plus, Search, Pencil, Trash2, ChevronUp, ChevronDown, ArrowUpToLine } from "lucide-react"
import { ToolForm } from "./ToolForm"
import { createTool, updateTool, deleteTool, toggleToolStatus, moveToolUp, moveToolDown, moveToolToTop } from "@/app/actions/toolActions"

interface Tool {
  id: string
  name: string
  nameEn: string | null
  desc: string
  descEn: string | null
  logoUrl: string
  url: string | null
  category: string
  categoryEn: string | null
  status: number
  sortOrder: number
  createdAt: Date
}

interface ToolTableProps {
  tools: Tool[]
}

export function ToolTable({ tools }: ToolTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [deletingTool, setDeletingTool] = useState<Tool | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isLogoPreviewOpen, setIsLogoPreviewOpen] = useState(false)
  const [previewLogoUrl, setPreviewLogoUrl] = useState('')

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }, 300)

  const handleCreateTool = async (prevState: any, formData: FormData) => {
    await createTool(prevState, formData)
    setIsDialogOpen(false)
    setToastMessage('工具添加成功！')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    return { message: '添加成功', success: true }
  }

  const handleEditTool = async (prevState: any, formData: FormData) => {
    await updateTool(prevState, formData)
    router.refresh()
    setIsEditDialogOpen(false)
    setEditingTool(null)
    setToastMessage('工具更新成功！')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    return { message: '更新成功', success: true }
  }

  const openEditDialog = (tool: Tool) => {
    setEditingTool(tool)
    setIsEditDialogOpen(true)
  }

  const handleDeleteTool = async () => {
    if (deletingTool) {
      await deleteTool(deletingTool.id)
      router.refresh()
      setIsDeleteDialogOpen(false)
      setDeletingTool(null)
      setToastMessage('工具删除成功！')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  const openDeleteDialog = (tool: Tool) => {
    setDeletingTool(tool)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleStatus = async (tool: Tool) => {
    if (loadingId) return
    setLoadingId(tool.id)
    await toggleToolStatus(tool.id)
    router.refresh()
    setToastMessage(tool.status === 1 ? '工具已关闭' : '工具已开启')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  const handleMoveToTop = async (tool: Tool) => {
    if (loadingId) return
    setLoadingId(tool.id)
    await moveToolToTop(tool.id)
    router.refresh()
    setToastMessage('工具已置顶')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  const handleMoveUp = async (tool: Tool) => {
    if (loadingId) return
    setLoadingId(tool.id)
    await moveToolUp(tool.id)
    router.refresh()
    setToastMessage('工具已上移')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  const handleMoveDown = async (tool: Tool) => {
    if (loadingId) return
    setLoadingId(tool.id)
    await moveToolDown(tool.id)
    router.refresh()
    setToastMessage('工具已下移')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  return (
    <div className="space-y-4">
      {/* 成功提示 Toast */}
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

      {/* 顶部操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜索工具..."
            defaultValue={searchParams.get('q') || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加工具
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新工具</DialogTitle>
              <DialogDescription>
                填写工具信息，点击保存后将添加到数据库。
              </DialogDescription>
            </DialogHeader>
            <ToolForm action={handleCreateTool} />
          </DialogContent>
        </Dialog>

        {/* 编辑工具对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑工具</DialogTitle>
              <DialogDescription>
                修改工具信息，点击保存后将更新到数据库。
              </DialogDescription>
            </DialogHeader>
            {editingTool && (
              <ToolForm
                action={handleEditTool}
                defaultValues={{
                  id: editingTool.id,
                  name: editingTool.name,
                  nameEn: editingTool.nameEn || undefined,
                  desc: editingTool.desc,
                  descEn: editingTool.descEn || undefined,
                  url: editingTool.url || undefined,
                  logoUrl: editingTool.logoUrl,
                  category: editingTool.category,
                  categoryEn: editingTool.categoryEn || undefined,
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">确认删除</DialogTitle>
              <DialogDescription>
                确定要删除工具「{deletingTool?.name}」吗？此操作无法撤销。
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                取消
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteTool}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Logo预览对话框 */}
        <Dialog open={isLogoPreviewOpen} onOpenChange={setIsLogoPreviewOpen}>
          <DialogContent className="sm:max-w-lg p-4">
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={previewLogoUrl} 
                alt="Logo预览" 
                className="max-h-96 object-contain" 
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 表格 */}
      <div className="rounded-md border bg-white overflow-x-auto">
        <Table className="w-full min-w-[900px] md:min-w-0">
          <TableHeader>
            <TableRow className="hover:bg-slate-50">
              <TableHead className="w-16 whitespace-nowrap">Logo</TableHead>
              <TableHead className="w-28 whitespace-nowrap">工具名称</TableHead>
              <TableHead className="w-20 whitespace-nowrap">分类</TableHead>
              <TableHead className="w-[30%] whitespace-nowrap">描述</TableHead>
              <TableHead className="w-24 whitespace-nowrap">状态</TableHead>
              <TableHead className="w-40 whitespace-nowrap">创建时间</TableHead>
              <TableHead className="w-12 whitespace-nowrap">排序</TableHead>
              <TableHead className="w-24 whitespace-nowrap text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500">
                  暂无工具数据
                </TableCell>
              </TableRow>
            ) : (
              tools.map((tool) => (
                <TableRow key={tool.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div 
                      className="relative h-10 w-10 overflow-hidden rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setPreviewLogoUrl(tool.logoUrl)
                        setIsLogoPreviewOpen(true)
                      }}
                    >
                      <Image
                        src={tool.logoUrl}
                        alt={tool.name}
                        fill
                        className="object-cover"
                        style={{
                          clipPath: 'polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)'
                        }}
                        unoptimized={tool.logoUrl?.startsWith('http')}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate whitespace-nowrap font-medium" title={tool.name}>
                    {tool.name}
                  </TableCell>
                  <TableCell className="max-w-[100px] truncate whitespace-nowrap" title={tool.category}>
                    {tool.category}
                  </TableCell>
                  <TableCell className="w-[30%] max-w-xs truncate" title={tool.desc}>
                    {tool.desc}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(tool)}
                      disabled={loadingId === tool.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        tool.status === 1 ? 'bg-green-500' : 'bg-slate-300'
                      } ${loadingId === tool.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          tool.status === 1 ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-sm whitespace-nowrap">
                    {(() => {
                      const d = new Date(tool.createdAt)
                      const pad = (n: number) => n.toString().padStart(2, '0')
                      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
                    })()}
                  </TableCell>
                  <TableCell className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveToTop(tool)}
                      disabled={loadingId === tool.id}
                      className="h-7 w-7 p-0 hover:bg-orange-50 hover:text-orange-600"
                      title="置顶"
                    >
                      <ArrowUpToLine className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(tool)}
                      disabled={loadingId === tool.id || tools.indexOf(tool) === 0}
                      className={`h-7 w-7 p-0 ${tools.indexOf(tool) === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'}`}
                      title="上移"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(tool)}
                      disabled={loadingId === tool.id || tools.indexOf(tool) === tools.length - 1}
                      className={`h-7 w-7 p-0 ${tools.indexOf(tool) === tools.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'}`}
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
                        onClick={() => openEditDialog(tool)}
                        className="h-7 w-7 p-0 transition-all duration-200 hover:text-blue-600 hover:bg-blue-50"
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(tool)}
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
