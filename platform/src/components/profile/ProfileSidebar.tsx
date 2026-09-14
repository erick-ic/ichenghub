import { CalendarDays } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import { signOut } from '../../../auth';
import UserAvatar from './UserAvatar';
import LogoutButton from './LogoutButton';

export interface ProfileUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  createdAt?: Date | string | null;
}

interface ProfileSidebarProps {
  user: ProfileUser;
}

function formatJoinedAt(value: Date | string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'long',
    timeZone: 'Asia/Shanghai',
  }).format(date);
}

// 三栏控制台 · 左侧用户卡片（服务端组件，内含 signOut server action）
export default async function ProfileSidebar({ user }: ProfileSidebarProps) {
  const [t, locale] = await Promise.all([
    getTranslations('Profile'),
    getLocale(),
  ]);
  const joinedAt = formatJoinedAt(user.createdAt, locale);

  return (
    <div className="fade-slide-up">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <UserAvatar image={user.image} name={user.name} />

        <h1 className="mt-4 truncate text-lg font-bold text-gray-900" title={user.name ?? ''}>
          {user.name}
        </h1>
        <p className="mt-1 truncate text-sm text-gray-500" title={user.email ?? ''}>
          {user.email}
        </p>

        {joinedAt && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{t('joinedAt')}</span>
            <span className="text-gray-500">{joinedAt}</span>
          </p>
        )}

        <div className="my-5 h-px bg-gray-100" />

        <LogoutButton
          action={async () => {
            'use server';
            await signOut({ redirectTo: `/${locale}/profile` });
          }}
        />
      </div>
    </div>
  );
}
