'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toggleLike } from '@/app/actions/statsActions';
import AnimatedNumber from './AnimatedNumber';

interface LikeButtonProps {
  promptId: string;
  initialLiked: boolean;
  initialCount: number;
  isEnglish?: boolean;
}

export default function LikeButton({ 
  promptId, 
  initialLiked, 
  initialCount, 
  isEnglish = false 
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleLike = async () => {
    if (isAnimating) return;

    setIsAnimating(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const result = await toggleLike(promptId);
      
      if (!result.success) {
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
        console.error('点赞失败:', result.message);
        alert(result.message || '操作失败，请重试');
      }
    } catch (error) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      console.error('点赞请求失败:', error);
      alert('网络错误，请重试');
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <div 
      className="relative bg-white/90 backdrop-blur-md border border-zinc-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden h-24"
      onClick={handleLike}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full transition-colors duration-300 ${
        isLiked ? 'bg-gradient-to-bl from-red-100/40 to-transparent' : 'bg-gradient-to-bl from-pink-100/40 to-transparent'
      }`}></div>
      <div className="relative h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ring-2 transition-all duration-300 ${
            isLiked 
              ? 'bg-gradient-to-br from-red-50 to-red-100 ring-red-100/50' 
              : 'bg-gradient-to-br from-pink-50 to-pink-100 ring-pink-100/50'
          }`}>
            <Heart 
              className={`w-5 h-5 transition-all duration-300 ${
                isAnimating ? 'like-pop' : ''
              } ${hovered && isLiked ? 'animate-heartbeat-liked' : ''} ${isLiked ? 'text-red-500' : 'text-pink-500'}`}
              fill={isLiked ? 'currentColor' : 'none'}
            />
            <div className={`absolute inset-0 rounded-xl transition-colors duration-300 ${
              isLiked ? 'bg-red-500/5' : 'bg-pink-500/5'
            }`}></div>
            {hovered && !isLiked && (
              <Heart className="w-5 h-5 text-pink-400 absolute animate-heartbeat opacity-50" fill="currentColor" />
            )}
            {hovered && isLiked && (
              <Heart className="w-5 h-5 text-red-400 absolute animate-heartbeat-liked-secondary opacity-50" fill="currentColor" />
            )}
          </div>
          <span className="text-zinc-500 text-sm font-medium">{isEnglish ? 'Likes' : '点赞'}</span>
        </div>
        <AnimatedNumber value={likesCount} className={`text-3xl font-bold text-zinc-900 transition-all duration-300 ${
          isAnimating ? 'scale-125 text-red-500' : ''
        }`} />
      </div>
      <style>{`
        @keyframes heartbeat {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes heartbeat-liked {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes heartbeat-liked-secondary {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes like-pop {
          0% { transform: scale(1); }
          30% { transform: scale(1.3); }
          50% { transform: scale(0.9); }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-heartbeat {
          animation: heartbeat 0.6s ease-in-out infinite;
        }
        .animate-heartbeat-liked {
          animation: heartbeat-liked 0.5s ease-in-out infinite;
        }
        .animate-heartbeat-liked-secondary {
          animation: heartbeat-liked-secondary 0.6s ease-in-out infinite;
        }
        .like-pop {
          animation: like-pop 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
