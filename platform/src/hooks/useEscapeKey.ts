'use client';

import { useEffect, useRef } from 'react';

const escapeStack: symbol[] = [];

/** Runs the latest callback when Escape is pressed while the overlay is active. */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  const callbackRef = useRef(onEscape);
  callbackRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const token = Symbol('escape-layer');
    escapeStack.push(token);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || escapeStack.at(-1) !== token) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      callbackRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      const index = escapeStack.lastIndexOf(token);
      if (index >= 0) escapeStack.splice(index, 1);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);
}
