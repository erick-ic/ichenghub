'use client';

import { useState } from 'react';
import { Github } from 'lucide-react';

interface UserAvatarProps {
  image?: string | null;
  name?: string | null;
}

// 头像加载失败时回退到用户名首字母，再不行显示 GitHub 图标
export default function UserAvatar({ image, name }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={name ?? 'avatar'}
        width={96}
        height={96}
        onError={() => setFailed(true)}
        className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[#f5f5f7]"
      />
    );
  }

  const initial = (name?.trim()?.[0] || '').toUpperCase();

  return (
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#f5f5f7] text-3xl font-bold text-gray-500 ring-4 ring-[#f5f5f7]">
      {initial || <Github className="h-10 w-10 text-gray-400" />}
    </div>
  );
}
