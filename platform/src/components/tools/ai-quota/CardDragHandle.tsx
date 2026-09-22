'use client';

import { useRef } from 'react';
import { GripVertical } from 'lucide-react';

export default function CardDragHandle({ id, label, hint, onPreview, onMove, onStep }: {
  id: string;
  label: string;
  hint: string;
  onPreview: (source: string | null, target: string | null) => void;
  onMove: (source: string, target: string) => void;
  onStep: (direction: number) => void;
}) {
  const drag = useRef<{ pointer: number; x: number; y: number; active: boolean; target: string | null } | null>(null);
  const cancel = () => {
    drag.current = null;
    onPreview(null, null);
  };
  return <button type="button" aria-label={label} title={hint}
    className="flex h-9 w-9 shrink-0 touch-none select-none items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 cursor-grab active:cursor-grabbing sm:h-8 sm:w-8"
    onPointerDown={(event) => {
      if (!event.isPrimary || event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, active: false, target: null };
    }}
    onPointerMove={(event) => {
      const current = drag.current;
      if (!current || current.pointer !== event.pointerId) return;
      if (!current.active && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 6) return;
      current.active = true;
      const card = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-quota-card]');
      current.target = card?.dataset.quotaCard ?? null;
      onPreview(id, current.target);
      if (event.clientY < 70) window.scrollBy(0, -20);
      else if (event.clientY > window.innerHeight - 70) window.scrollBy(0, 20);
    }}
    onPointerUp={(event) => {
      const current = drag.current;
      if (!current || current.pointer !== event.pointerId) return;
      if (current.active && current.target) onMove(id, current.target);
      cancel();
    }}
    onPointerCancel={cancel}
    onLostPointerCapture={cancel}
    onKeyDown={(event) => {
      if (event.key === 'Escape') cancel();
      if (['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        onStep(event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}>
    <GripVertical className="h-4 w-4" aria-hidden="true" />
  </button>;
}
