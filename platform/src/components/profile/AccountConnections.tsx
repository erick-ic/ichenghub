'use client';

import { useEffect, useState } from 'react';
import { createPortal, useFormStatus } from 'react-dom';
import { Github, Link2, Loader2, ShieldCheck, Unlink, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { linkOAuthAccount, unlinkOAuthAccount } from './accountActions';

interface Props {
  locale: string;
  providers: string[];
  status?: string;
}

const supportedProviders = ['github', 'gitee'] as const;

function LinkAccountButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-label={label}
      className="relative inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 px-2.5 text-xs font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={`inline-flex items-center gap-1 ${pending ? 'invisible' : ''}`}>
        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </span>
      {pending && <Loader2 className="absolute h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
    </button>
  );
}

export default function AccountConnections({ locale, providers, status }: Props) {
  const t = useTranslations('Profile.accounts');
  const [confirmProvider, setConfirmProvider] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useBodyScrollLock(Boolean(confirmProvider));
  useEscapeKey(Boolean(confirmProvider), () => setConfirmProvider(null));
  useEffect(() => setMounted(true), []);

  const statusKeys = new Set([
    'linked', 'unlinked', 'already-linked', 'not-linked', 'last-account', 'unsupported',
  ]);
  const visibleStatus = status && statusKeys.has(status) ? status : null;

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{t('title')}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{t('description')}</p>
        </div>
      </div>

      {visibleStatus && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed ${
            visibleStatus === 'last-account' || visibleStatus === 'unsupported' || visibleStatus === 'not-linked'
              ? 'bg-amber-50 text-amber-800'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {t(`status.${visibleStatus}`)}
        </p>
      )}

      <div className="mt-4 space-y-2.5">
        {supportedProviders.map((provider) => {
          const connected = providers.includes(provider);
          const providerName = t(`providers.${provider}`);
          return (
            <div key={provider} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                {provider === 'github' ? (
                  <Github className="h-4 w-4 shrink-0 text-gray-800" aria-hidden="true" />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-sm font-black text-[#c71d23]" aria-hidden="true">G</span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{providerName}</p>
                  <p className={`text-[11px] ${connected ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {connected ? t('connected') : t('notConnected')}
                  </p>
                </div>
              </div>

              {connected ? (
                <button
                  type="button"
                  onClick={() => setConfirmProvider(provider)}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Unlink className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('unlink')}
                </button>
              ) : (
                <form action={linkOAuthAccount.bind(null, provider, locale)}>
                  <LinkAccountButton label={t('link')} />
                </form>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-gray-400">{t('unlinkHint')}</p>

      {mounted && confirmProvider && createPortal((
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmProvider(null);
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="unlink-account-title" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="unlink-account-title" className="text-base font-semibold text-gray-900">{t('confirmTitle')}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  {t('confirmDescription', { provider: t(`providers.${confirmProvider}`) })}
                </p>
              </div>
              <button type="button" onClick={() => setConfirmProvider(null)} aria-label={t('cancel')} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmProvider(null)} className="h-9 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {t('cancel')}
              </button>
              <form
                action={unlinkOAuthAccount.bind(null, confirmProvider, locale)}
                onSubmit={() => setConfirmProvider(null)}
              >
                <button type="submit" className="h-9 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700">
                  {t('confirmUnlink')}
                </button>
              </form>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
