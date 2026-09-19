'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import OAuthProviderButton from './OAuthProviderButton';
import LoginErrorAlert from './LoginErrorAlert';

interface LoginPanelProps {
  title: string;
  subtitle: string;
  privacy: string;
  providers: Array<{
    id: string;
    label: string;
    redirectingLabel: string;
    icon: React.ReactNode;
    variant: 'primary' | 'secondary';
    action: () => Promise<void>;
    availabilityCheckUrl?: string;
  }>;
  showError: boolean;
  errorTitle: string;
  errorMessage: string;
  errorCloseLabel: string;
  mounted: boolean;
}

export default function LoginPanelClient({
  title,
  subtitle,
  privacy,
  providers,
  showError,
  errorTitle,
  errorMessage,
  errorCloseLabel,
  mounted,
}: LoginPanelProps) {
  const EASE = 'var(--ease-out-expo)';
  const [availabilityError, setAvailabilityError] = useState(false);
  const shouldShowError = showError || availabilityError;

  return (
    <div
      className="w-full max-w-full rounded-[16px] border border-black/[0.065] bg-white p-6 shadow-[0_10px_32px_rgba(24,24,27,0.06)] backdrop-blur-[14px] sm:max-w-[420px] sm:rounded-[20px] sm:bg-white/[0.92] sm:p-10 sm:shadow-[0_18px_48px_rgba(24,24,27,0.075),0_2px_8px_rgba(24,24,27,0.025)]"
      style={{
        ...(mounted
          ? { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' }
          : { opacity: 0, transform: 'translate3d(0, 12px, 0) scale(0.985)' }),
        transition: `opacity 560ms ${EASE} 400ms, transform 560ms ${EASE} 400ms`,
      }}
    >
      {/* 标题 */}
      <div
        style={{
          ...(mounted
            ? { opacity: 1, transform: 'translateY(0)' }
            : { opacity: 0, transform: 'translateY(5px)' }),
          transition: `opacity 300ms ${EASE} 445ms, transform 300ms ${EASE} 445ms`,
        }}
      >
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-[#18181b] sm:text-[30px]">
          {title}
        </h1>
      </div>

      {/* 副标题 */}
      <div
        style={{
          ...(mounted
            ? { opacity: 1, transform: 'translateY(0)' }
            : { opacity: 0, transform: 'translateY(5px)' }),
          transition: `opacity 300ms ${EASE} 490ms, transform 300ms ${EASE} 490ms`,
        }}
      >
        <p className="mt-1.5 text-[14px] text-[#71717a]">{subtitle}</p>
      </div>

      {shouldShowError && (
        <div className="mt-4">
          <LoginErrorAlert
            title={errorTitle}
            message={errorMessage}
            closeLabel={errorCloseLabel}
          />
        </div>
      )}

      {/* GitHub 按钮 */}
      <div
        className="mt-5 space-y-3"
        style={{
          ...(mounted
            ? { opacity: 1, transform: 'translateY(0)' }
            : { opacity: 0, transform: 'translateY(5px)' }),
          transition: `opacity 300ms ${EASE} 535ms, transform 300ms ${EASE} 535ms`,
        }}
      >
        {providers.map((provider) => (
          <OAuthProviderButton
            key={provider.id}
            action={provider.action}
            label={provider.label}
            redirectingLabel={provider.redirectingLabel}
            icon={provider.icon}
            variant={provider.variant}
            availabilityCheckUrl={provider.availabilityCheckUrl}
            onAvailabilityError={() => setAvailabilityError(true)}
          />
        ))}
      </div>

      {/* 隐私说明 */}
      <div
        className="mt-4 flex items-start gap-2"
        style={{
          ...(mounted
            ? { opacity: 1, transform: 'translateY(0)' }
            : { opacity: 0, transform: 'translateY(5px)' }),
          transition: `opacity 300ms ${EASE} 580ms, transform 300ms ${EASE} 580ms`,
        }}
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#71717a]" aria-hidden="true" />
        <p className="text-[12px] leading-relaxed text-[#71717a]">{privacy}</p>
      </div>
    </div>
  );
}
