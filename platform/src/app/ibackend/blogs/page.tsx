'use client';

import { useState, useEffect, memo, Suspense, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Edit, Trash2, Save, Search, Check, RefreshCw, GripVertical, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { createBlog, updateBlog, deleteBlog, getBlogs, updateBlogsSortOrder } from '@/app/actions/blogActions';
import BlogContent from '@/components/blog/BlogContent';
import CodeCopyHandler from '@/components/blog/CodeCopyHandler';
import { extractHeadings } from '@/lib/headingUtils';
import { exportBlogAsJson, parseBlogJsonFile } from '@/lib/blog-io';

interface BlogPost {
  id: string;
  titleZh: string;
  titleEn: string;
  excerptZh: string;
  excerptEn: string;
  categoryZh: string;
  categoryEn: string;
  contentZh: string;
  contentEn: string;
  status: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BlogPostCardProps {
  blog: BlogPost;
  index: number;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}

const BlogPostCard = memo(({ blog, index, isDragOver, onDragStart, onDragOver, onDragEnd, onEdit, onDelete, onExport }: BlogPostCardProps) => {
  return (
    <Card
      key={blog.id}
      className={`cursor-move transition-all ${isDragOver ? 'ring-2 ring-primary' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
            <div>
              <Badge variant="outline" className="mr-2 font-mono">
                #{blog.sortOrder > 0 ? blog.sortOrder : index + 1}
              </Badge>
              <CardTitle className="text-xl inline">{blog.titleZh}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={blog.status === 1 ? 'default' : 'secondary'}>
              {blog.status === 1 ? '已发布' : '草稿'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">分类：</span>
              {blog.categoryZh} / {blog.categoryEn}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">摘要：</span>
              {blog.excerptZh}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              创建时间：{new Date(blog.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              导出
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              编辑
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

BlogPostCard.displayName = 'BlogPostCard';

function BlogsPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [formData, setFormData] = useState({
    titleZh: '',
    titleEn: '',
    excerptZh: '',
    excerptEn: '',
    categoryZh: '',
    categoryEn: '',
    contentZh: '',
    contentEn: '',
    status: '0',
    sortOrder: '1',
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [previewZh, setPreviewZh] = useState(false);
  const [previewEn, setPreviewEn] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 20,
  });

  const currentPage = parseInt(searchParams.get('page') || '1');

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    loadBlogs(searchParams.get('q') || undefined, currentPage);
  }, [searchParams, currentPage]);

  const loadBlogs = async (query?: string, page: number = 1) => {
    setLoading(true);
    const result = await getBlogs(query || searchQuery, page);
    if (result.success) {
      setBlogs(result.blogs);
      setPagination({
        total: result.total || 0,
        totalPages: result.totalPages || 1,
        currentPage: result.currentPage || 1,
        pageSize: result.pageSize || 20,
      });
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingBlog(null);
    setFormData({
      titleZh: '',
      titleEn: '',
      excerptZh: '',
      excerptEn: '',
      categoryZh: '',
      categoryEn: '',
      contentZh: '',
      contentEn: '',
      status: '0',
      sortOrder: '1',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormData({
      titleZh: blog.titleZh,
      titleEn: blog.titleEn,
      excerptZh: blog.excerptZh,
      excerptEn: blog.excerptEn,
      categoryZh: blog.categoryZh,
      categoryEn: blog.categoryEn,
      contentZh: blog.contentZh,
      contentEn: blog.contentEn,
      status: blog.status.toString(),
      sortOrder: blog.sortOrder.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return;

    const result = await deleteBlog(id);
    if (result.success) {
      setToastMessage('删除成功');
      setShowToast(true);
      loadBlogs();
    } else {
      setToastMessage('删除失败');
      setShowToast(true);
    }
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const data = new FormData(e.currentTarget);
    data.set('status', formData.status);
    
    if (editingBlog) {
      data.set('id', editingBlog.id);
    }

    let result;
    if (editingBlog) {
      result = await updateBlog(data);
    } else {
      result = await createBlog(data);
    }

    setSaving(false);
    if (result.success) {
      setToastMessage(editingBlog ? '更新成功' : '创建成功');
      setShowToast(true);
      setIsDialogOpen(false);
      loadBlogs();
    } else {
      setToastMessage(result.error || '操作失败');
      setShowToast(true);
    }
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleFileImport = async (file: File) => {
    try {
      const data = await parseBlogJsonFile(file);
      setFormData({
        titleZh: data.titleZh || '',
        titleEn: data.titleEn || '',
        excerptZh: data.summaryZh || '',
        excerptEn: data.summaryEn || '',
        categoryZh: data.categoryZh || '',
        categoryEn: data.categoryEn || '',
        contentZh: data.contentZh || '',
        contentEn: data.contentEn || '',
        status: '0',
        sortOrder: '1',
      });
      setToastMessage(`已成功导入文章：${data.titleZh || '无标题'}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setToastMessage((error as Error).message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {showToast && (
        <div className="fixed top-20 right-8 px-4 py-2 rounded-lg shadow-lg z-[200] flex items-center gap-2 bg-green-100 text-green-700">
          <Check className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">博客文章管理</h1>
        <p className="text-slate-500 mt-1">管理所有博客文章</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="搜索博客文章..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新建文章
        </Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out overflow-hidden">
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      ) : blogs.length === 0 ? (
        <Card className="bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">还没有发布任何文章</p>
            <Button onClick={handleCreate}>创建第一篇文章</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blogs.map((blog, index) => (
            <BlogPostCard
              key={blog.id}
              blog={blog}
              index={index}
              isDragOver={dragOverIndex === index}
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(e: React.DragEvent) => {
                e.preventDefault();
                setDragOverIndex(index);
              }}
              onDragEnd={async () => {
                if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
                  const newBlogs = [...blogs];
                  const [movedItem] = newBlogs.splice(draggedIndex, 1);
                  newBlogs.splice(dragOverIndex, 0, movedItem);
                  setBlogs(newBlogs);
                  setToastMessage('拖拽成功，排序已更新');
                  setShowToast(true);

                  const updates = newBlogs.map((b, i) => ({ id: b.id, sortOrder: i + 1 }));
                  await updateBlogsSortOrder(updates);
                  loadBlogs();
                  setTimeout(() => setShowToast(false), 2000);
                }
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onEdit={() => handleEdit(blog)}
              onDelete={() => handleDelete(blog.id)}
              onExport={() => exportBlogAsJson(blog)}
            />
          ))}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                共 {pagination.total} 篇文章 · 第 {pagination.currentPage}/{pagination.totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <ArrowLeft className="h-4 w-4" />
                  上一页
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  下一页
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingBlog ? '编辑文章' : '新建文章'}</DialogTitle>
            <DialogDescription>
              填写文章信息，支持中英文双语内容。正文内容使用 Markdown 格式。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileImport(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="mb-6 p-6 rounded-2xl bg-[#f5f5f7] border-2 border-dashed border-[#e52129]/40 hover:border-[#e52129] transition-all cursor-pointer text-center"
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileImport(file);
                }}
              />
              <p className="text-sm font-medium text-gray-700">
                将博客 JSON 备份文件拖拽至此，或{' '}
                <span className="text-[#e52129] underline">点击上传</span> 智能回填
              </p>
              <p className="text-xs text-gray-400 mt-1">仅用于表单快捷填充，发布前仍需人工确认</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titleZh">中文标题 *</Label>
                <Input
                  id="titleZh"
                  name="titleZh"
                  value={formData.titleZh}
                  onChange={(e) => setFormData({ ...formData, titleZh: e.target.value })}
                  placeholder="请输入中文标题"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleEn">英文标题 *</Label>
                <Input
                  id="titleEn"
                  name="titleEn"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="Please enter English title"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryZh">中文分类</Label>
                <Input
                  id="categoryZh"
                  name="categoryZh"
                  value={formData.categoryZh}
                  onChange={(e) => setFormData({ ...formData, categoryZh: e.target.value })}
                  placeholder="如：前端架构"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryEn">英文分类</Label>
                <Input
                  id="categoryEn"
                  name="categoryEn"
                  value={formData.categoryEn}
                  onChange={(e) => setFormData({ ...formData, categoryEn: e.target.value })}
                  placeholder="e.g., Frontend Architecture"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="excerptZh">中文摘要</Label>
                <Textarea
                  id="excerptZh"
                  name="excerptZh"
                  value={formData.excerptZh}
                  onChange={(e) => setFormData({ ...formData, excerptZh: e.target.value })}
                  placeholder="请输入中文摘要"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerptEn">英文摘要</Label>
                <Textarea
                  id="excerptEn"
                  name="excerptEn"
                  value={formData.excerptEn}
                  onChange={(e) => setFormData({ ...formData, excerptEn: e.target.value })}
                  placeholder="Please enter English excerpt"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentZh">中文正文 (Markdown) *</Label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
                <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-3 py-2 space-x-4">
                  <button
                    type="button"
                    onClick={() => setPreviewZh(false)}
                    className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                      !previewZh
                        ? 'bg-white dark:bg-gray-700 text-[#e52129] shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    编写
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZh(true)}
                    className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                      previewZh
                        ? 'bg-white dark:bg-gray-700 text-[#e52129] shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    预览
                  </button>
                </div>
                <div className="p-0">
                  <Textarea
                    id="contentZh"
                    name="contentZh"
                    value={formData.contentZh}
                    onChange={(e) => setFormData({ ...formData, contentZh: e.target.value })}
                    placeholder="请输入中文正文，支持 Markdown 格式"
                    rows={15}
                    className={`font-mono text-sm border-0 focus:ring-0 resize-y ${previewZh ? 'hidden' : ''}`}
                    required
                  />
                  {previewZh && (
                    <div className="min-h-[480px] max-h-[600px] overflow-y-auto px-6 py-4 bg-[#f5f5f7] dark:bg-gray-900/50">
                      <CodeCopyHandler blogId="" locale="zh" />
                      <div className="prose prose-slate dark:prose-invert max-w-3xl prose-pre:bg-transparent prose-pre:p-0 prose-code:before:hidden prose-code:after:hidden">
                        {formData.contentZh ? (
                          <BlogContent content={formData.contentZh} headings={extractHeadings(formData.contentZh)} />
                        ) : (
                          <p className="text-gray-400 italic">暂无内容预览</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentEn">英文正文 (Markdown) *</Label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
                <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-3 py-2 space-x-4">
                  <button
                    type="button"
                    onClick={() => setPreviewEn(false)}
                    className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                      !previewEn
                        ? 'bg-white dark:bg-gray-700 text-[#e52129] shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewEn(true)}
                    className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                      previewEn
                        ? 'bg-white dark:bg-gray-700 text-[#e52129] shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Preview
                  </button>
                </div>
                <div className="p-0">
                  <Textarea
                    id="contentEn"
                    name="contentEn"
                    value={formData.contentEn}
                    onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                    placeholder="Please enter English content, Markdown format supported"
                    rows={15}
                    className={`font-mono text-sm border-0 focus:ring-0 resize-y ${previewEn ? 'hidden' : ''}`}
                    required
                  />
                  {previewEn && (
                    <div className="min-h-[480px] max-h-[600px] overflow-y-auto px-6 py-4 bg-[#f5f5f7] dark:bg-gray-900/50">
                      <CodeCopyHandler blogId="" locale="en" />
                      <div className="prose prose-slate dark:prose-invert max-w-3xl prose-pre:bg-transparent prose-pre:p-0 prose-code:before:hidden prose-code:after:hidden">
                        {formData.contentEn ? (
                          <BlogContent content={formData.contentEn} headings={extractHeadings(formData.contentEn)} />
                        ) : (
                          <p className="text-gray-400 italic">Nothing to preview</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>状态</Label>
                <RadioGroup
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <RadioGroupItem value="0" label="草稿" />
                  <RadioGroupItem value="1" label="已发布" />
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">排序序号</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min="1"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  placeholder="数字越小越靠前"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={saving}
              >
                取消
              </Button>
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingBlog ? '更新' : '创建'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BlogsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      }
    >
      <BlogsPageContent />
    </Suspense>
  );
}
