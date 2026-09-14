'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface OAuthProviderButtonProps {
  // 来自父级（Server Component）的 bound server action，作为原生 form action 触发 signIn 跳转
  action: () => Promise<void>;
  label: string;
  redirectingLabel: string;
  icon: ReactNode;
  // 扩展：支持未来主要/次要 Provider 的按钮样式区分
  variant?: 'primary' | 'secondary';
  // 可选的自定义按钮样式（用于未来不同 Provider 的品牌色微调）
  buttonClassName?: string;
}

// 单个 OAuth Provider 提交按钮。
// 项目当前为 React 18.2 + react-dom 18.2，尚未提供 useFormStatus，
// 因此使用原生 form action + 乐观 onSubmit 来呈现 pending：
//   1. 点击后立即进入 loading，禁止重复提交；
//   2. signIn 成功即触发外部重定向，页面自然卸载；
//   3. 若 Server Action 抛出非预期错误未跳转，安全超时后自动恢复可点击。
// 未来升级到 React 19 后可平滑切换为 useFormStatus 实现。
//
// variant 说明：
//   - 'primary'（默认）：深色实心按钮，用于当前 GitHub
//   - 'secondary'：白色描边按钮，保留结构供未来次要 Provider 使用
export default function OAuthProviderButton({
  action,
  label,
  redirectingLabel,
  icon,
  variant = 'primary',
  buttonClassName = '',
}: OAuthProviderButtonProps) {
  const [pending, setPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (pending) return;
    setPending(true);
    // 安全兜底：12s 内未完成重定向则恢复可点击，避免按钮卡死
    timerRef.current = setTimeout(() => setPending(false), 12000);
  };

  // variant: primary = 深色实心（当前 GitHub）；secondary = 白色描边（未来次要 Provider）
  const variantClass =
    variant === 'secondary'
      ? 'border border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
      : 'border border-transparent bg-[#18181b] text-white hover:bg-[#242426] hover:shadow-[0_2px_12px_rgba(24,24,27,0.18)]';

  return (
    <form action={action} onSubmit={handleSubmit} aria-busy={pending || undefined}>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className={`group relative flex h-[52px] w-full min-h-11 items-center rounded-[11px] px-5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e52129] focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${buttonClassName}`}
      >
        {/* 文字层居中：箭头通过 absolute 定位，不挤占文字居中 */}
        <span className="pointer-events-none flex w-full items-center justify-center gap-3">
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">
              {icon}
            </span>
          )}
          <span>{pending ? redirectingLabel : label}</span>
        </span>
        {/* 箭头：默认灰色，hover 变品牌红 + 右移 3px；pending 时隐藏 */}
        <ArrowRight
          className={`absolute right-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 shrink-0 transition-all duration-200 ${
            pending
              ? 'opacity-0'
              : variant === 'secondary'
                ? 'text-gray-400 group-hover:translate-x-[3px] group-hover:text-[#e52129]'
                : 'text-gray-500 group-hover:translate-x-[3px] group-hover:text-[#e52129]'
          }`}
          aria-hidden="true"
        />
      </button>
    </form>
  );
}
