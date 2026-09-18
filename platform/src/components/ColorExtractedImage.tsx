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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setIsPreviewOpen(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <div 
            className="relative w-full h-full max-w-4xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
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
