'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { trackResourceAction } from '@/app/actions/statsActions';

interface PageViewTrackerProps {
  path?: string;
  resourceId?: string | null;
  resourceType?: string;
}

function getCookie(name: string): boolean {
  if (typeof document === 'undefined') return false;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return true;
  return false;
}

function setCookie(name: string, maxAge: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=1; max-age=${maxAge}; path=/; samesite=lax`;
}

export default function PageViewTracker({ path = '', resourceId = null, resourceType = 'PAGE' }: PageViewTrackerProps) {
  const locale = useLocale();

  useEffect(() => {
    // PAGE 级浏览无需资源 ID；TOOL/BLOG/PROMPT 等资源事件必须携带稳定资源 ID，
    // 缺失时直接跳过，避免写入无法关联的脏数据。
    if (resourceType !== 'PAGE' && !resourceId) {
      return;
    }

    const cookieName = `view_lock_${resourceType}_${resourceId || 'home'}`;

    if (getCookie(cookieName)) {
      return;
    }

    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const maxAge = Math.floor((midnight.getTime() - now.getTime()) / 1000);

    setCookie(cookieName, maxAge);

    let fullPath = path;
    if (fullPath && !fullPath.startsWith('/' + locale)) {
      fullPath = '/' + locale + fullPath;
    }

    trackResourceAction(resourceId, resourceType, 'VIEW', fullPath).catch(() => {});
  }, [resourceId, resourceType, locale, path]);

  return null;
}
