'use client';

import { useEffect } from 'react';

let lockCount = 0;
let scrollY = 0;
let savedBodyStyles: Partial<CSSStyleDeclaration> = {};
let savedHtmlOverflow = '';

function lockBody() {
  if (lockCount === 0) {
    scrollY = window.scrollY;
    savedHtmlOverflow = document.documentElement.style.overflow;
    savedBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  }
  lockCount += 1;
}

function unlockBody() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount !== 0) return;
  document.documentElement.style.overflow = savedHtmlOverflow;
  document.body.style.overflow = savedBodyStyles.overflow ?? '';
  document.body.style.position = savedBodyStyles.position ?? '';
  document.body.style.top = savedBodyStyles.top ?? '';
  document.body.style.width = savedBodyStyles.width ?? '';
  window.scrollTo(0, scrollY);
}

/** Locks the page behind a modal while keeping the modal's own scroller available. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lockBody();
    return unlockBody;
  }, [locked]);
}
