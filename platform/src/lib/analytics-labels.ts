const TOOL_ACTION_LABELS: Record<string, string> = {
  CLICK: '点击工具',
  VIEW: '浏览工具',
  QR_MODE_TEXT: '切换文本模式',
  QR_MODE_URL: '切换链接模式',
  QR_GENERATE_SUCCESS: '生成二维码',
  QR_GENERATE_FAILURE: '二维码生成失败',
  QR_DOWNLOAD_SVG: '下载 SVG 二维码',
  QR_DOWNLOAD_PNG: '下载 PNG 二维码',
  IMAGE_COMPRESS_SUCCESS: '压缩图片',
  AI_QUOTA_ADD_PLATFORM: '新增额度平台',
  AI_QUOTA_EDIT_PLATFORM: '编辑额度平台',
  AI_QUOTA_DELETE_PLATFORM: '删除额度平台',
  AI_QUOTA_RESET_PLATFORM: '重置平台额度',
  AI_QUOTA_RESET_ALL: '重置全部额度',
  AI_QUOTA_IMPORT: '导入额度数据',
  AI_QUOTA_OPEN_PLATFORM: '打开额度平台',
}

const RESOURCE_ACTION_LABELS: Record<string, Record<string, string>> = {
  PROMPT: {
    COPY: '复制提示词',
    VIEW: '浏览提示词',
    LIKE: '点赞提示词',
    FAVORITE: '收藏提示词',
  },
  BLOG: {
    COPY: '复制博客代码',
    VIEW: '访问博客',
    LIKE: '点赞博客',
    FAVORITE: '收藏博客',
  },
  LINK: {
    CLICK: '点击导航',
    VIEW: '浏览导航',
  },
  PAGE: {
    VIEW: '访问页面',
    CLICK: '点击页面内容',
  },
}

const GENERIC_ACTION_LABELS: Record<string, string> = {
  VIEW: '浏览内容',
  CLICK: '点击内容',
  COPY: '复制内容',
  LIKE: '点赞内容',
  FAVORITE: '收藏内容',
}

export function getAnalyticsActionLabel(actionType: string, resourceType: string): string {
  if (resourceType === 'TOOL' && TOOL_ACTION_LABELS[actionType]) {
    return TOOL_ACTION_LABELS[actionType]
  }

  return RESOURCE_ACTION_LABELS[resourceType]?.[actionType]
    || GENERIC_ACTION_LABELS[actionType]
    || '其他操作'
}
