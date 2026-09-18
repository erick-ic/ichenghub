'use client'

import { Eye, MousePointerClick, Copy, Globe, QrCode, Download, Type, Link as LinkIcon, AlertCircle, FileImage, Heart, Star } from 'lucide-react'
import { getAnalyticsActionLabel } from '@/lib/analytics-labels'

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
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate text-xs font-medium text-slate-600">{activity.ipMasked}</span>
              <span className="shrink-0 text-[10px] text-slate-400">{activity.timeAgo}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="shrink-0 text-xs text-slate-500">{getAnalyticsActionLabel(activity.actionType, activity.resourceType)}</span>
              <span className="shrink-0 text-xs text-slate-300">→</span>
              <span className="min-w-0 truncate text-xs font-medium text-slate-800">{activity.resourceName}</span>
            </div>
          </div>
          <span className="hidden max-w-[28%] flex-shrink-0 truncate rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-400 sm:block">
            {activity.path || '/'}
          </span>
        </div>
      ))}
    </div>
  )
}
