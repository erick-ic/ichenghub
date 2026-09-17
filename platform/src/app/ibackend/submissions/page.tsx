'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Trash2, Clock, CheckCircle, XCircle, Search, RefreshCw, ExternalLink, Copy, RotateCcw, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getToolSubmissions,
  getToolDemands,
  updateSubmissionStatus,
  updateDemandStatus,
  updateSubmissionReviewNote,
  deleteSubmission,
  deleteDemand,
} from '@/app/actions/submissionActions';

interface ToolSubmission {
  id: string;
  name: string;
  url: string;
  description: string;
  contact: string | null;
  status: string;
  reviewNote: string | null;
  reviewedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: { name: string | null; email: string | null } | null;
  duplicateCheck: {
    matchingTool: { id: string; name: string; url: string | null } | null;
    matchingSubmissions: Array<{ id: string; name: string; status: string; createdAt: Date | string }>;
  };
}

interface ToolDemand {
  id: string;
  title: string;
  detail: string;
  referenceUrl: string | null;
  contact: string | null;
  status: string;
  reviewNote: string | null;
  reviewedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: { name: string | null; email: string | null } | null;
}

type SubmissionItem = ToolSubmission | ToolDemand;

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'TOOL' | 'DEMAND'>('TOOL');
  const [submissions, setSubmissions] = useState<ToolSubmission[]>([]);
  const [demands, setDemands] = useState<ToolDemand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<SubmissionItem | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [operationStatus, setOperationStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setSelectedItem(null);
    loadData();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (mode === 'TOOL') {
        const data = await getToolSubmissions();
        setSubmissions(Array.isArray(data) ? data : []);
      } else {
        const data = await getToolDemands();
        setDemands(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      if (mode === 'TOOL') {
        setSubmissions([]);
      } else {
        setDemands([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openDetails = (item: SubmissionItem) => {
    setSelectedItem(item);
    setReviewNote(item.reviewNote || '');
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      if (mode === 'TOOL') {
        await updateSubmissionStatus(id, status, selectedItem?.id === id ? reviewNote : undefined);
      } else {
        await updateDemandStatus(id, status, selectedItem?.id === id ? reviewNote : undefined);
      }
      setSelectedItem((current) => current?.id === id ? { ...current, status } : current);
      setOperationStatus({ success: true, message: '状态更新成功' });
      loadData();
    } catch (error) {
      setOperationStatus({ success: false, message: '操作失败' });
    }
    setTimeout(() => setOperationStatus(null), 3000);
  };

  const handleSaveNote = async () => {
    if (!selectedItem) return;
    try {
      await updateSubmissionReviewNote(selectedItem.id, mode, reviewNote);
      setSelectedItem({ ...selectedItem, reviewNote: reviewNote.trim() || null });
      setOperationStatus({ success: true, message: '处理说明已保存' });
      loadData();
    } catch {
      setOperationStatus({ success: false, message: '保存失败' });
    }
    setTimeout(() => setOperationStatus(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (mode === 'TOOL') {
        await deleteSubmission(deleteConfirm.id);
      } else {
        await deleteDemand(deleteConfirm.id);
      }
      setOperationStatus({ success: true, message: '删除成功' });
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      setOperationStatus({ success: false, message: '删除失败' });
    }
    setTimeout(() => setOperationStatus(null), 3000);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: '待审核', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'APPROVED': { label: '已通过', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'REJECTED': { label: '已拒绝', color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai',
    });
  };

  const formatDisplayUrl = (value: string) => {
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '');
      const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
      return `${host}${path}`;
    } catch {
      return value;
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setOperationStatus({ success: true, message: '已复制到剪贴板' });
    } catch {
      setOperationStatus({ success: false, message: '复制失败，请手动复制' });
    }
    setTimeout(() => setOperationStatus(null), 3000);
  };

  const filteredData = mode === 'TOOL'
    ? (submissions || []).filter(item => {
        const matchesSearch = searchQuery === '' ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : (demands || []).filter(item => {
        const matchesSearch = searchQuery === '' ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.detail.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

  return (
    <div className="space-y-6">
      {/* 操作状态提示 */}
      {operationStatus && (
        <div className={`fixed top-20 right-8 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
          operationStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {operationStatus.success ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {operationStatus.message}
        </div>
      )}

      {/* 标题区域 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">提交管理</h1>
        <p className="text-slate-500 mt-1">查看和管理用户提交的推荐和心愿</p>
      </div>

      {/* Tab 切换器 */}
      <div className="bg-white rounded-xl p-1 flex shadow-sm">
        <button
          onClick={() => setMode('TOOL')}
          className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
            mode === 'TOOL'
              ? 'bg-black text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          推荐收录
        </button>
        <button
          onClick={() => setMode('DEMAND')}
          className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
            mode === 'DEMAND'
              ? 'bg-black text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          定制许愿
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={`搜索${mode === 'TOOL' ? '工具名称' : '需求标题'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e52129]/20 focus:border-[#e52129]"
          >
            <option value="ALL">全部状态</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已拒绝</option>
          </select>
          <Button
            variant="outline"
            onClick={loadData}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <div className="text-2xl font-bold text-gray-900">{filteredData.length}</div>
          <div className="text-sm text-gray-500">总记录数</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <div className="text-2xl font-bold text-yellow-600">
            {filteredData.filter(item => item.status === 'PENDING').length}
          </div>
          <div className="text-sm text-gray-500">待审核</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <div className="text-2xl font-bold text-green-600">
            {filteredData.filter(item => item.status === 'APPROVED').length}
          </div>
          <div className="text-sm text-gray-500">已通过</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out">
          <div className="text-2xl font-bold text-red-600">
            {filteredData.filter(item => item.status === 'REJECTED').length}
          </div>
          <div className="text-sm text-gray-500">已拒绝</div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:-translate-y-0.5 hover:shadow-xl hover:border-[#e52129]/20 transition-all duration-300 ease-out overflow-hidden">
        <div className="overflow-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[23%]" />
              <col />
              <col className="w-[7rem]" />
              <col className="w-[10rem]" />
              <col className="w-[10rem]" />
            </colgroup>
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mode === 'TOOL' ? '工具名称' : '需求标题'}
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mode === 'TOOL' ? '链接' : '详情描述'}
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mode === 'TOOL' ? '推荐理由' : '参考链接'}
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">加载中...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <p className="text-gray-500">暂无数据</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetails(item)}>
                    <td className="px-6 py-4 align-middle">
                      <div className="min-w-0">
                        <span
                          className="line-clamp-2 break-words font-semibold leading-5 text-gray-900"
                          title={mode === 'TOOL' ? (item as ToolSubmission).name : (item as ToolDemand).title}
                        >
                          {mode === 'TOOL' ? (item as ToolSubmission).name : (item as ToolDemand).title}
                        </span>
                        {mode === 'TOOL' && ((item as ToolSubmission).duplicateCheck.matchingTool || (item as ToolSubmission).duplicateCheck.matchingSubmissions.length > 0) && (
                          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                            <AlertTriangle className="h-3 w-3" />可能重复
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="min-w-0 px-6 py-4">
                      {mode === 'TOOL' ? (
                        <a
                          href={(item as ToolSubmission).url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="group flex min-w-0 items-center gap-1.5 text-sm text-[#e52129] hover:underline"
                          title={(item as ToolSubmission).url}
                        >
                          <span className="truncate">{formatDisplayUrl((item as ToolSubmission).url)}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                        </a>
                      ) : (
                        <p className="line-clamp-2 break-words border-l-2 border-slate-200 pl-3 text-sm leading-5 text-gray-600" title={(item as ToolDemand).detail}>
                          {(item as ToolDemand).detail}
                        </p>
                      )}
                    </td>
                    <td className="min-w-0 px-6 py-4">
                      {mode === 'TOOL' ? (
                        <p className="line-clamp-2 break-words border-l-2 border-slate-200 pl-3 text-sm leading-5 text-gray-600" title={(item as ToolSubmission).description}>
                          {(item as ToolSubmission).description}
                        </p>
                      ) : (item as ToolDemand).referenceUrl ? (
                        <a
                          href={(item as ToolDemand).referenceUrl ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="group flex min-w-0 items-center gap-1.5 text-sm text-[#e52129] hover:underline"
                          title={(item as ToolDemand).referenceUrl ?? undefined}
                        >
                          <span className="truncate">{formatDisplayUrl((item as ToolDemand).referenceUrl!)}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg"
                              onClick={(event) => { event.stopPropagation(); handleStatusChange(item.id, 'APPROVED'); }}
                              title="通过"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={(event) => { event.stopPropagation(); handleStatusChange(item.id, 'REJECTED'); }}
                              title="拒绝"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(event) => { event.stopPropagation(); setDeleteConfirm({ id: item.id, type: mode }); }}
                          title="删除"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 提交详情 */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent
          className="sm:max-w-2xl max-h-[85vh] overflow-hidden [&>div:first-child]:max-h-[calc(85vh-3rem)]"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div>
                    <DialogTitle className="text-xl">
                      {mode === 'TOOL' ? (selectedItem as ToolSubmission).name : (selectedItem as ToolDemand).title}
                    </DialogTitle>
                    <DialogDescription className="mt-2">提交于 {formatDate(selectedItem.createdAt)}</DialogDescription>
                  </div>
                  {getStatusBadge(selectedItem.status)}
                </div>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {mode === 'TOOL' ? (
                  <>
                    {((selectedItem as ToolSubmission).duplicateCheck.matchingTool || (selectedItem as ToolSubmission).duplicateCheck.matchingSubmissions.length > 0) && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <div className="flex items-center gap-2 font-semibold">
                          <AlertTriangle className="h-4 w-4" />检测到相同官网链接
                        </div>
                        {(selectedItem as ToolSubmission).duplicateCheck.matchingTool && (
                          <p className="mt-2">
                            已收录工具：{(selectedItem as ToolSubmission).duplicateCheck.matchingTool!.name}
                          </p>
                        )}
                        {(selectedItem as ToolSubmission).duplicateCheck.matchingSubmissions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p>其他提交：</p>
                            {(selectedItem as ToolSubmission).duplicateCheck.matchingSubmissions.map((duplicate) => (
                              <p key={duplicate.id} className="pl-3 text-amber-800">
                                {duplicate.name} · {formatDate(duplicate.createdAt)} · {duplicate.status === 'APPROVED' ? '已通过' : duplicate.status === 'REJECTED' ? '已拒绝' : '待审核'}
                              </p>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 text-xs text-amber-700">仅作审核参考，不影响用户提交。</p>
                      </div>
                    )}
                    <DetailField label="官网链接">
                      <div className="flex items-center gap-2">
                        <a href={(selectedItem as ToolSubmission).url} target="_blank" rel="noopener noreferrer" className="break-all text-[#e52129] hover:underline">{(selectedItem as ToolSubmission).url}</a>
                        <button onClick={() => copyText((selectedItem as ToolSubmission).url)} className="shrink-0 text-slate-400 hover:text-slate-700" title="复制链接"><Copy className="h-4 w-4" /></button>
                      </div>
                    </DetailField>
                    <DetailField label="完整推荐理由">
                      <p className="whitespace-pre-wrap break-words leading-7 text-slate-700">{(selectedItem as ToolSubmission).description}</p>
                    </DetailField>
                  </>
                ) : (
                  <>
                    <DetailField label="完整需求描述">
                      <p className="whitespace-pre-wrap break-words leading-7 text-slate-700">{(selectedItem as ToolDemand).detail}</p>
                    </DetailField>
                    <DetailField label="参考链接">
                      {(selectedItem as ToolDemand).referenceUrl ? <a href={(selectedItem as ToolDemand).referenceUrl!} target="_blank" rel="noopener noreferrer" className="break-all text-[#e52129] hover:underline">{(selectedItem as ToolDemand).referenceUrl}</a> : <span className="text-slate-400">未提供</span>}
                    </DetailField>
                  </>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="联系方式">
                    <div className="flex items-center gap-2">
                      <span className="break-all">{selectedItem.contact || '未提供'}</span>
                      {selectedItem.contact && <button onClick={() => copyText(selectedItem.contact!)} className="text-slate-400 hover:text-slate-700" title="复制联系方式"><Copy className="h-4 w-4" /></button>}
                    </div>
                  </DetailField>
                  <DetailField label="提交用户">
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" /><span className="break-all">{selectedItem.user?.name || selectedItem.user?.email || '匿名提交'}</span></div>
                  </DetailField>
                </div>
                <DetailField label="处理说明（提交用户可见）">
                  <textarea
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="例如：已收录；或说明拒绝原因、需要补充的信息……"
                    className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#e52129] focus:ring-2 focus:ring-[#e52129]/10"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{selectedItem.reviewedAt ? `最近审核：${formatDate(selectedItem.reviewedAt)}` : '尚未审核'}</span>
                    <Button size="sm" variant="outline" onClick={handleSaveNote}>保存说明</Button>
                  </div>
                </DetailField>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                {mode === 'TOOL' && <Button variant="outline" asChild><a href={(selectedItem as ToolSubmission).url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />访问官网</a></Button>}
                {selectedItem.status !== 'PENDING' && <Button variant="outline" onClick={() => handleStatusChange(selectedItem.id, 'PENDING')}><RotateCcw className="mr-2 h-4 w-4" />恢复待审核</Button>}
                {selectedItem.status !== 'REJECTED' && <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleStatusChange(selectedItem.id, 'REJECTED')}><X className="mr-2 h-4 w-4" />拒绝</Button>}
                {selectedItem.status !== 'APPROVED' && <Button className="bg-green-600 text-white hover:bg-green-700" onClick={() => handleStatusChange(selectedItem.id, 'APPROVED')}><Check className="mr-2 h-4 w-4" />通过</Button>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">确认删除</DialogTitle>
            <DialogDescription className="text-slate-500">
              确定要删除这条{mode === 'TOOL' ? '推荐' : '心愿'}记录吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-6 py-2.5 text-sm font-medium border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
            >
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">{children}</div>
    </div>
  );
}
