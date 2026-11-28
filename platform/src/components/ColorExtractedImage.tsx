'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ColorExtractedImageProps {
  src: string;
  alt: string;
  className?: string;
  unoptimized?: boolean;
}

export default function ColorExtractedImage({ src, alt, className = '', unoptimized = false }: ColorExtractedImageProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  useBodyScrollLock(isPreviewOpen);
  useEscapeKey(isPreviewOpen, () => setIsPreviewOpen(false));

  return (
    <>
      <div 
        className={`relative w-full rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-[#D2D2D7] ${className}`}
        onClick={() => setIsPreviewOpen(true)}
      >
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={src}
            alt=""
            fill
            className="object-cover cursor-pointer"
            style={{
              filter: 'blur(10px) brightness(0.85)',
              transform: 'scale(1.1)'
            }}
            unoptimized={unoptimized}
          />
        </div>
        
        <div className="relative z-10 w-full h-[450px]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain cursor-pointer"
            unoptimized={unoptimized}
          />
        </div>
      </div>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 touch-manipulation animate-fade-in"
          onClick={() => setIsPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close preview"
            className="fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white border border-white/15 backdrop-blur-md active:scale-95 hover:bg-black/80 transition-all touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(false);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[85dvh] pointer-events-none">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              unoptimized={unoptimized}
            />
          </div>
        </div>
      )}
    </>
  );
}
