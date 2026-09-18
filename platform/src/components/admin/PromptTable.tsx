"use client"

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, ArrowUpToLine, Eye, Heart, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { createPrompt, updatePrompt, deletePrompt, togglePromptStatus, movePromptToTop, movePromptUp, movePromptDown } from '@/app/actions/promptActions'
import { SearchBar } from './SearchBar'

interface Prompt {
  id: string
  title: string
  titleEn: string | null
  category: string
  categoryEn: string | null
  platform: string
  platformEn: string | null
  platformUrl: string | null
  imageUrl: string
  promptText: string
  views: number
  likes: number
  comments: number
  status: number
  sortOrder: number
  createdAt: Date
}

interface PromptTableProps {
  prompts: Prompt[]
}

export function PromptTable({ prompts }: PromptTableProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null)

  const openEditDialog = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setIsFormOpen(true)
  }

  const openDeleteDialog = (prompt: Prompt) => {
    setDeletingPrompt(prompt)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingPrompt) return
    setLoadingId(deletingPrompt.id)
    await deletePrompt(deletingPrompt.id)
    router.refresh()
    setIsDeleteDialogOpen(false)
    setToastMessage('提示词已删除')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
    setDeletingPrompt(null)
  }

  const handleToggleStatus = async (prompt: Prompt) => {
    if (loadingId) return
    setLoadingId(prompt.id)
    await togglePromptStatus(prompt.id)
    router.refresh()
    setToastMessage(prompt.status === 1 ? '提示词已关闭' : '提示词已开启')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  const handleMoveToTop = async (prompt: Prompt) => {
    if (loadingId) return
    setLoadingId(prompt.id)
    await movePromptToTop(prompt.id)
    router.refresh()
    setToastMessage('提示词已置顶')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  const handleMoveUp = async (prompt: Prompt) => {
    if (loadingId) return
    setLoadingId(prompt.id)
    await movePromptUp(prompt.id)
    router.refresh()
    setToastMessage('提示词已上移')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  const handleMoveDown = async (prompt: Prompt) => {
    if (loadingId) return
    setLoadingId(prompt.id)
    await movePromptDown(prompt.id)
    router.refresh()
    setToastMessage('提示词已下移')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    setLoadingId(null)
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, formData)
    } else {
      await createPrompt(formData)
    }
    router.refresh()
    setIsFormOpen(false)
    setEditingPrompt(null)
    setToastMessage(editingPrompt ? '提示词已更新' : '提示词已添加')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
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
        <SearchBar />
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingPrompt(null)
                setIsFormOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              添加提示词
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{editingPrompt ? '编辑提示词' : '添加提示词'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit}>
              <input type="hidden" name="id" value={editingPrompt?.id || ''} />
              <div className="flex flex-col gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">标题 (中文)</Label>
                    <Input id="title" name="title" defaultValue={editingPrompt?.title || ''} placeholder="请输入提示词标题" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">标题 (English)</Label>
                    <Input id="titleEn" name="titleEn" defaultValue={editingPrompt?.titleEn || ''} placeholder="Enter prompt title" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">分类标签 (中文)</Label>
                    <Input id="category" name="category" placeholder="例如: 人像摄影" defaultValue={editingPrompt?.category || ''} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryEn">分类标签 (English)</Label>
                    <Input id="categoryEn" name="categoryEn" placeholder="e.g.: Portrait Photography" defaultValue={editingPrompt?.categoryEn || ''} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="toolId">所属平台 (中文)</Label>
                    <Input id="toolId" name="toolId" placeholder="例如: Gemini" defaultValue={editingPrompt?.platform || ''} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platformEn">所属平台 (English)</Label>
                    <Input id="platformEn" name="platformEn" placeholder="e.g.: Gemini" defaultValue={editingPrompt?.platformEn || ''} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platformUrl">平台链接</Label>
                  <Input id="platformUrl" name="platformUrl" placeholder="例如: https://gemini.google.com 或 https://chat.openai.com" defaultValue={editingPrompt?.platformUrl || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">封面图 URL</Label>
                  <Input id="imageUrl" name="imageUrl" placeholder="例如: https://example.com/prompt-cover.jpg (支持 jpg, png, webp, svg 格式)" defaultValue={editingPrompt?.imageUrl || ''} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promptText">提示词正文</Label>
                  <Textarea id="promptText" name="promptText" rows={6} placeholder="输入完整的提示词..." defaultValue={editingPrompt?.promptText || ''} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto">保存提示词</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">确认删除</DialogTitle>
            </DialogHeader>
            <p className="text-slate-500">确定要删除提示词「{deletingPrompt?.title}」吗？此操作无法撤销。</p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                取消
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={loadingId === deletingPrompt?.id}
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
        <Table className="w-full min-w-[1100px] md:min-w-0">
          <TableHeader>
            <TableRow className="hover:bg-slate-50">
              <TableHead className="w-16 whitespace-nowrap">封面</TableHead>
              <TableHead className="w-28 whitespace-nowrap">标题</TableHead>
              <TableHead className="w-28 whitespace-nowrap">英文标题</TableHead>
              <TableHead className="w-20 whitespace-nowrap">分类</TableHead>
              <TableHead className="w-auto min-w-[180px] max-w-[350px] whitespace-nowrap">提示词内容</TableHead>
              <TableHead className="w-16 whitespace-nowrap">统计</TableHead>
              <TableHead className="w-16 whitespace-nowrap">状态</TableHead>
              <TableHead className="w-36 whitespace-nowrap">创建时间</TableHead>
              <TableHead className="w-12 whitespace-nowrap">排序</TableHead>
              <TableHead className="w-24 text-center whitespace-nowrap">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-slate-500">
                  暂无提示词数据
                </TableCell>
              </TableRow>
            ) : (
              prompts.map((prompt) => (
                <TableRow key={prompt.id} className="hover:bg-slate-50">
                  <TableCell className="p-2">
                    <div 
                      className="relative h-8 w-8 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewImage(prompt.imageUrl)}
                    >
                      <Image 
                        src={prompt.imageUrl} 
                        alt={prompt.title}
                        fill
                        className="object-cover"
                        unoptimized={prompt.imageUrl?.startsWith('http')}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-[120px]" title={prompt.title}>
                    {prompt.title}
                  </TableCell>
                  <TableCell className="text-slate-500 truncate max-w-[120px]" title={prompt.titleEn || '-'}>
                    {prompt.titleEn || '-'}
                  </TableCell>
                  <TableCell className="truncate max-w-[100px]" title={prompt.category}>
                    {prompt.category}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={prompt.promptText}>
                    {prompt.promptText}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1" title="浏览">
                        <Eye className="h-2.5 w-2.5" />
                        {prompt.views}
                      </span>
                      <span className="flex items-center gap-1" title="点赞">
                        <Heart className="h-2.5 w-2.5" />
                        {prompt.likes}
                      </span>
                      <span className="flex items-center gap-1" title="评论">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {prompt.comments}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(prompt)}
                      disabled={loadingId === prompt.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        prompt.status === 1 ? 'bg-green-500' : 'bg-slate-300'
                      } ${loadingId === prompt.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          prompt.status === 1 ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs whitespace-nowrap">
                    {formatDate(prompt.createdAt)}
                  </TableCell>
                  <TableCell className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveToTop(prompt)}
                      disabled={loadingId === prompt.id}
                      className="h-6 w-6 p-0 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200"
                      title="置顶"
                    >
                      <ArrowUpToLine className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(prompt)}
                      disabled={loadingId === prompt.id || prompts.indexOf(prompt) === 0}
                      className={`h-6 w-6 p-0 transition-all duration-200 ${prompts.indexOf(prompt) === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'}`}
                      title="上移"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(prompt)}
                      disabled={loadingId === prompt.id || prompts.indexOf(prompt) === prompts.length - 1}
                      className={`h-6 w-6 p-0 transition-all duration-200 ${prompts.indexOf(prompt) === prompts.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'}`}
                      title="下移"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <div className="flex flex-row gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(prompt)}
                        className="h-7 w-7 p-0 transition-all duration-200 hover:text-blue-600 hover:bg-blue-50"
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(prompt)}
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

      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="sm:max-w-4xl p-4">
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={previewImage} 
                alt="Preview"
                className="max-h-[80vh] rounded-lg shadow-2xl object-contain" 
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
