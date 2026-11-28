'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, X } from 'lucide-react';
import { Link } from '@/navigation';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

type NotificationItem = {
  id: string;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationBell({
  locale,
  isLoggedIn = true,
  showLabel = false,
  onNavigate,
}: {
  locale: string;
  isLoggedIn?: boolean;
  showLabel?: boolean;
  onNavigate?: () => void;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isEnglish = locale === 'en';
  useBodyScrollLock(open && isMobile);
  useEscapeKey(open, () => setOpen(false));

  const loadNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    const response = await fetch('/api/notifications', { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) return;
    const data = await response.json();
    setItems(Array.isArray(data.notifications) ? data.notifications : []);
    setUnreadCount(Number(data.unreadCount) || 0);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setItems([]);
      setUnreadCount(0);
      setOpen(false);
      return;
    }
    loadNotifications();
    const handleFocus = () => loadNotifications();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoggedIn, loadNotifications]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const markRead = async (id?: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      keepalive: true,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id } : {}),
    });
    setItems((current) => current.map((item) => !id || item.id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item));
    setUnreadCount((current) => id ? Math.max(0, current - (items.find((item) => item.id === id)?.readAt ? 0 : 1)) : 0);
  };

  const notificationPanel = (
    <div
      ref={panelRef}
      role={isMobile ? 'dialog' : undefined}
      aria-modal={isMobile ? true : undefined}
      aria-label={isEnglish ? 'Notifications' : '消息通知'}
      className={isMobile
        ? 'w-full max-w-sm overflow-hidden rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-zinc-200/80 shadow-2xl'
        : 'absolute right-0 top-10 z-[80] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white/95 dark:bg-zinc-950/95 border border-zinc-200/80 shadow-xl'}
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/70 px-5 py-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{isEnglish ? 'Notifications' : '消息通知'}</p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
            unreadCount > 0
              ? 'bg-red-50 text-[#e52129]'
              : 'bg-zinc-100 text-zinc-500'
          }`}>
            {isEnglish ? `${unreadCount} unread` : `${unreadCount} 未读`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markRead()}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-[#e52129]"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>{isEnglish ? 'Mark all read' : '全部已读'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={isEnglish ? 'Close notifications' : '关闭消息通知'}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100/80 text-zinc-500 transition-colors hover:bg-zinc-200/80 hover:text-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={isMobile ? 'max-h-[min(60dvh,30rem)] overflow-y-auto overscroll-contain divide-y divide-zinc-100' : 'max-h-80 overflow-y-auto divide-y divide-zinc-100'}>
        {items.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">{isEnglish ? 'No notifications yet' : '暂无消息'}</div>
        ) : items.map((item) => (
          <Link
            key={item.id}
            href={item.href || '/profile'}
            onClick={() => {
              if (!item.readAt) markRead(item.id);
              setOpen(false);
              onNavigate?.();
            }}
            className={`block px-5 py-3.5 transition-colors hover:bg-zinc-50/90 ${item.readAt ? '' : 'bg-red-50/35'}`}
          >
            <div className="flex items-start gap-2.5">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? 'bg-zinc-200' : 'bg-[#e52129]'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 leading-snug">{isEnglish ? item.titleEn : item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{isEnglish ? item.messageEn : item.message}</p>
                <time className="mt-1.5 block text-[11px] text-zinc-400 tabular-nums">{new Date(item.createdAt).toLocaleString(isEnglish ? 'en-US' : 'zh-CN')}</time>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={showLabel
          ? 'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          : 'relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[#e52129]/10 hover:text-[#e52129]'}
        aria-label={isEnglish ? 'Notifications' : '消息通知'}
        aria-expanded={open}
      >
        {showLabel && <span>{isEnglish ? 'Notifications' : '消息通知'}</span>}
        <span className={showLabel ? 'relative flex h-8 w-8 items-center justify-center rounded-full bg-[#e52129]/10 text-[#e52129]' : undefined}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-[#e52129] px-1 text-[10px] font-semibold leading-none text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      </button>

      {open && (isMobile
        ? createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]" onClick={() => setOpen(false)}>
              <div className="w-full max-w-sm" onClick={(event) => event.stopPropagation()}>{notificationPanel}</div>
            </div>,
            document.body
          )
        : notificationPanel)}
    </div>
  );
}
