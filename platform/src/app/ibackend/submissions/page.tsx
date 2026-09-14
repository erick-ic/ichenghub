'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Trash2, Clock, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';
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
  createdAt: Date;
}

interface ToolDemand {
  id: string;
  title: string;
  detail: string;
  referenceUrl: string | null;
  contact: string | null;
  status: string;
  createdAt: Date;
}

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'TOOL' | 'DEMAND'>('TOOL');
  const [submissions, setSubmissions] = useState<ToolSubmission[]>([]);
  const [demands, setDemands] = useState<ToolDemand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: string } | null>(null);
  const [operationStatus, setOperationStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
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

  const handleStatusChange = async (id: string, status: string) => {
    try {
      if (mode === 'TOOL') {
        await updateSubmissionStatus(id, status);
      } else {
        await updateDemandStatus(id, status);
      }
      setOperationStatus({ success: true, message: '状态更新成功' });
      loadData();
    } catch (error) {
      setOperationStatus({ success: false, message: '操作失败' });
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai',
    });
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
        <div className="overflow-x-auto">
          <table className="w-full">
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
                  联系方式
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">加载中...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <p className="text-gray-500">暂无数据</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{mode === 'TOOL' ? (item as ToolSubmission).name : (item as ToolDemand).title}</span>
                    </td>
                    <td className="px-6 py-4">
                      {mode === 'TOOL' ? (
                        <a
                          href={(item as ToolSubmission).url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#e52129] hover:underline text-sm truncate max-w-xs block"
                        >
                          {(item as ToolSubmission).url}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                          {(item as ToolDemand).detail}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {mode === 'TOOL' ? (
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                          {(item as ToolSubmission).description}
                        </p>
                      ) : (item as ToolDemand).referenceUrl ? (
                        <a
                          href={(item as ToolDemand).referenceUrl ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#e52129] hover:underline text-sm truncate max-w-xs block"
                        >
                          {(item as ToolDemand).referenceUrl}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {(mode === 'TOOL' ? (item as ToolSubmission).contact : (item as ToolDemand).contact) || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg"
                              onClick={() => handleStatusChange(item.id, 'APPROVED')}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => handleStatusChange(item.id, 'REJECTED')}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteConfirm({ id: item.id, type: mode })}
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
