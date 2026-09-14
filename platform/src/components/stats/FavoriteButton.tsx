'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useRouter, usePathname } from '@/navigation';
import AnimatedNumber from './AnimatedNumber';

type FavoriteResourceType = 'PROMPT' | 'BLOG';

interface FavoriteButtonProps {
  resourceType?: FavoriteResourceType;
  resourceId: string;
  initialFavorited: boolean;
  initialCount: number;
  isEnglish?: boolean;
  variant?: 'card' | 'compact';
  isLoggedIn?: boolean;
}

export default function FavoriteButton({
  resourceType = 'PROMPT',
  resourceId,
  initialFavorited,
  initialCount,
  isEnglish = false,
  variant = 'card',
  isLoggedIn = false,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [favoritesCount, setFavoritesCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // 未登录直接引导登录：带上当前页地址，登录后自动返回
  const goLogin = () => {
    const returnTo = encodeURIComponent(pathname || '/');
    router.push(`/profile?callbackUrl=${returnTo}`);
  };

  const handleFavorite = async () => {
    // 游客：不做任何收藏动作，直接引导登录（无乐观更新、无接口请求）
    if (!isLoggedIn) {
      goLogin();
      return;
    }

    // 防止连续点击造成并发请求
    if (isAnimating) return;

    setIsAnimating(true);

    const prevFavorited = isFavorited;
    const prevCount = favoritesCount;

    // 乐观更新
    setIsFavorited(!prevFavorited);
    setFavoritesCount(prevFavorited ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const response = await fetch('/api/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceType, resourceId }),
      });

      const result = await response.json();

      if (result.requiresLogin) {
        // 兜底：会话已过期等情况下，回滚乐观状态并引导登录
        setIsFavorited(prevFavorited);
        setFavoritesCount(prevCount);
        goLogin();
        return;
      }

      if (!response.ok || !result.success) {
        setIsFavorited(prevFavorited);
        setFavoritesCount(prevCount);
        console.error('收藏失败:', result.message);
        alert(result.message || (isEnglish ? 'Operation failed, please retry' : '操作失败，请重试'));
        return;
      }

      // 以服务端事务结果为准
      setIsFavorited(!!result.favorited);
      setFavoritesCount(typeof result.favoritesCount === 'number' ? result.favoritesCount : prevCount);
    } catch (error) {
      setIsFavorited(prevFavorited);
      setFavoritesCount(prevCount);
      console.error('收藏请求失败:', error);
      alert(isEnglish ? 'Network error, please retry' : '网络错误，请重试');
    } finally {
      setIsAnimating(false);
    }
  };

  const label = isEnglish ? 'Favorites' : '收藏';
  const ariaLabel = isFavorited
    ? isEnglish
      ? 'Remove from favorites'
      : '取消收藏'
    : isEnglish
      ? 'Add to favorites'
      : '收藏';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleFavorite}
        aria-pressed={isFavorited}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={`inline-flex items-center gap-1 text-xs font-normal tabular-nums transition-colors ${
          isFavorited
            ? 'text-amber-500'
            : 'text-gray-400 dark:text-gray-500 hover:text-[#e52129]'
        }`}
      >
        <Star
          className="w-3 h-3"
          fill={isFavorited ? 'currentColor' : 'none'}
          strokeWidth={1.6}
        />
        <span>{favoritesCount}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={isFavorited}
      aria-label={ariaLabel}
      className="relative w-full bg-white/90 backdrop-blur-md border border-zinc-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden h-24 text-left"
      onClick={handleFavorite}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full transition-colors duration-300 ${
        isFavorited ? 'bg-gradient-to-bl from-amber-100/40 to-transparent' : 'bg-gradient-to-bl from-yellow-50/40 to-transparent'
      }`}></div>
      <div className="relative h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ring-2 transition-all duration-300 ${
            isFavorited
              ? 'bg-gradient-to-br from-amber-50 to-amber-100 ring-amber-100/50'
              : 'bg-gradient-to-br from-yellow-50 to-yellow-100 ring-yellow-100/50'
          }`}>
            <Star
              className={`w-5 h-5 transition-all duration-300 ${
                isAnimating ? 'favorite-pop' : ''
              } ${hovered && isFavorited ? 'animate-star-liked' : ''} ${isFavorited ? 'text-amber-500' : 'text-yellow-500'}`}
              fill={isFavorited ? 'currentColor' : 'none'}
            />
            <div className={`absolute inset-0 rounded-xl transition-colors duration-300 ${
              isFavorited ? 'bg-amber-500/5' : 'bg-yellow-500/5'
            }`}></div>
            {hovered && !isFavorited && (
              <Star className="w-5 h-5 text-yellow-400 absolute animate-star" fill="currentColor" />
            )}
            {hovered && isFavorited && (
              <Star className="w-5 h-5 text-amber-400 absolute animate-star-liked-secondary opacity-50" fill="currentColor" />
            )}
          </div>
          <span className="text-zinc-500 text-sm font-medium">{label}</span>
        </div>
        <AnimatedNumber value={favoritesCount} className={`text-3xl font-bold text-zinc-900 transition-all duration-300 ${
          isAnimating ? 'scale-125 text-amber-500' : ''
        }`} />
      </div>
      <style>{`
        @keyframes star {
          0% { transform: scale(1) rotate(0deg); opacity: 0.5; }
          50% { transform: scale(1.5) rotate(15deg); opacity: 0.8; }
          100% { transform: scale(2) rotate(30deg); opacity: 0; }
        }
        @keyframes star-liked {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes star-liked-secondary {
          0% { transform: scale(1) rotate(0deg); opacity: 0.5; }
          50% { transform: scale(1.3) rotate(15deg); opacity: 0.7; }
          100% { transform: scale(1.6) rotate(30deg); opacity: 0; }
        }
        @keyframes favorite-pop {
          0% { transform: scale(1) rotate(0deg); }
          30% { transform: scale(1.3) rotate(15deg); }
          50% { transform: scale(0.9) rotate(-10deg); }
          70% { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .animate-star {
          animation: star 0.6s ease-in-out infinite;
        }
        .animate-star-liked {
          animation: star-liked 0.5s ease-in-out infinite;
        }
        .animate-star-liked-secondary {
          animation: star-liked-secondary 0.6s ease-in-out infinite;
        }
        .favorite-pop {
          animation: favorite-pop 0.5s ease-out;
        }
      `}</style>
    </button>
  );
}
