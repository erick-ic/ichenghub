'use client'

import { Eye, MousePointerClick, Copy, Globe, QrCode, Download, Type, Link as LinkIcon, AlertCircle, FileImage, Heart, Star } from 'lucide-react'

interface ActivityItem {
  id: string
  actionType: string
  resourceType: string
  resourceName: string
  path: string
  ipMasked: string
  timeAgo: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

function getActionIcon(actionType: string) {
  switch (actionType) {
    case 'CLICK':
      return <MousePointerClick className="w-3 h-3 text-blue-500" />
    case 'COPY':
      return <Copy className="w-3 h-3 text-green-500" />
    case 'VIEW':
      return <Eye className="w-3 h-3 text-purple-500" />
    case 'LIKE':
      return <Heart className="w-3 h-3 text-rose-500" />
    case 'FAVORITE':
      return <Star className="w-3 h-3 text-amber-500" />
    // QR Code actions
    case 'QR_MODE_TEXT':
      return <Type className="w-3 h-3 text-indigo-500" />
    case 'QR_MODE_URL':
      return <LinkIcon className="w-3 h-3 text-indigo-500" />
    case 'QR_GENERATE_SUCCESS':
      return <QrCode className="w-3 h-3 text-emerald-500" />
    case 'QR_GENERATE_FAILURE':
      return <AlertCircle className="w-3 h-3 text-rose-500" />
    case 'QR_DOWNLOAD_SVG':
      return <Download className="w-3 h-3 text-amber-500" />
    case 'QR_DOWNLOAD_PNG':
      return <Download className="w-3 h-3 text-amber-500" />
    // Image compressor actions
    case 'IMAGE_COMPRESS_SUCCESS':
      return <FileImage className="w-3 h-3 text-emerald-500" />
    default:
      return <Globe className="w-3 h-3 text-slate-400" />
  }
}

function getActionLabel(actionType: string, resourceType: string) {
  if (resourceType === 'TOOL') {
    switch (actionType) {
      case 'CLICK':
        return '点击工具'
      case 'VIEW':
        return '浏览工具'
      case 'QR_MODE_TEXT':
        return '切换文本模式'
      case 'QR_MODE_URL':
        return '切换链接模式'
      case 'QR_GENERATE_SUCCESS':
        return '生成二维码'
      case 'QR_GENERATE_FAILURE':
        return '生成失败'
      case 'QR_DOWNLOAD_SVG':
        return '下载 SVG'
      case 'QR_DOWNLOAD_PNG':
        return '下载 PNG'
      case 'IMAGE_COMPRESS_SUCCESS':
        return '压缩图片'
      default:
        return actionType
    }
  }
  if (resourceType === 'PROMPT') {
    switch (actionType) {
      case 'COPY':
        return '复制提示词'
      case 'VIEW':
        return '浏览提示词'
      case 'LIKE':
        return '点赞提示词'
      case 'FAVORITE':
        return '收藏提示词'
      default:
        return actionType
    }
  }
  if (resourceType === 'BLOG') {
    return actionType === 'COPY' ? '复制代码' : actionType === 'VIEW' ? '访问博客' : actionType
  }
  if (resourceType === 'PAGE') {
    return actionType === 'VIEW' ? '访问页面' : actionType
  }
  return actionType
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-slate-400">
        <Globe className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">暂无最近动态</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            {getActionIcon(activity.actionType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">{activity.ipMasked}</span>
              <span className="text-[10px] text-slate-400">{activity.timeAgo}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">{getActionLabel(activity.actionType, activity.resourceType)}</span>
              <span className="text-xs text-slate-300">→</span>
              <span className="text-xs font-medium text-slate-800 truncate">{activity.resourceName}</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 flex-shrink-0 px-2 py-1 bg-slate-100 rounded">
            {activity.path || '/'}
          </span>
        </div>
      ))}
    </div>
  )
}