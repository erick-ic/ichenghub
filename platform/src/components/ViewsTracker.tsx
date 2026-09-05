'use client';

import { useEffect, useTransition } from 'react';
import { incrementViews, trackResourceAction } from '@/app/actions/statsActions';

interface ViewsTrackerProps {
  promptId: string;
  path?: string;
}

export default function ViewsTracker({ promptId, path = '' }: ViewsTrackerProps) {
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      // 先递增浏览计数（服务端按 cookie 当天去重），仅在实际计数时上报行为日志
      const result = await incrementViews(promptId, path);
      if (result?.skipped) return;
      // 独立调用并等待完成，避免 action 内 fire-and-forget 日志被运行时丢弃
      await trackResourceAction(promptId, 'PROMPT', 'VIEW', path);
    });
  }, [promptId, path]);

  return null;
}
