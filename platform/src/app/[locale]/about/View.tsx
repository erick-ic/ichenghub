'use client';

import { useState } from 'react';
import { Link } from '@/navigation';
import QRCode from 'react-qr-code';
import { useTranslations } from 'next-intl';
import { Sparkles, ShieldCheck, Wand2, MessageCircle, BookOpen, Mail, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/copyUtils';

export default function AboutView() {
  const t = useTranslations('AboutPage');
  const [showToast, setShowToast] = useState(false);

  const handleCopyEmail = async () => {
    const email = 'ichenghub@gmail.com';
    const success = await copyToClipboard(email);
    if (success) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-4xl mx-auto py-20 px-6">
        {/* Hero 区与工作室故事 */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#e52129] text-sm font-medium mb-6">
            <Sparkles size={16} />
            <span>{t('badge')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-8">
            {t('title')}
          </h1>

          <div className="relative border-l-4 border-[#e52129]/20 pl-6 space-y-6 text-gray-600 text-lg leading-relaxed">
            <p className="text-xl text-gray-800 font-medium">
              {t('subtitle')}
            </p>
            <p>
              {t('story1')}
            </p>
            <p>
              {t('story2')}
            </p>
            <p className="font-medium text-gray-900 italic mt-4">
              {t('signature')}
            </p>
          </div>
        </div>

        {/* 核心价值 Bento 卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 核心理念 */}
          <div className="md:col-span-2 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center text-[#e52129] mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">{t('feature1Title')}</h3>
            <p className="text-gray-500 leading-relaxed">
              {t('feature1Desc')}
            </p>
          </div>

          {/* 实战提示词 */}
          <div className="p-8 bg-gray-900 text-white rounded-3xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <Wand2 className="text-red-400 mb-6" size={24} />
            <h3 className="text-xl font-bold mb-3 text-white">{t('feature2Title')}</h3>
            <p className="text-gray-400 text-sm">{t('feature2Desc')}</p>
          </div>
        </div>

        {/* 热荐工坊 自媒体引流区 */}
        {/* <div className="mt-16">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">{t('socialTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="flex items-center justify-between p-6 sm:p-8 bg-white border border-gray-100 rounded-[2rem] hover:shadow-lg hover:shadow-green-500/5 hover:border-green-100 transition-all duration-300 group">
              <div className="flex flex-col pr-4">
                <div className="flex items-center gap-2.5 mb-3 text-green-600">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    <MessageCircle size={16} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold tracking-wide">{t('wechatLabel')}</span>
                </div>
                <h4 className="text-2xl font-extrabold text-gray-900 mb-2">{t('wechatName')}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t('wechatDesc')}
                </p>
              </div>
              <div className="flex-shrink-0 relative w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl p-2 border border-gray-100 group-hover:scale-105 transition-transform duration-300 shadow-sm flex items-center justify-center">
                <QRCode
                  value="http://weixin.qq.com/r/mp/-SPP1z-EZ2IYrXu093bv"
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 sm:p-8 bg-white border border-gray-100 rounded-[2rem] hover:shadow-lg hover:shadow-red-500/5 hover:border-red-100 transition-all duration-300 group">
              <div className="flex flex-col pr-4">
                <div className="flex items-center gap-2.5 mb-3 text-[#ff2442]">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <BookOpen size={16} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold tracking-wide">{t('xiaohongshuLabel')}</span>
                </div>
                <h4 className="text-2xl font-extrabold text-gray-900 mb-2">{t('xiaohongshuName')}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t('xiaohongshuDesc')}
                </p>
              </div>
              <div className="flex-shrink-0 relative w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl p-2 border border-gray-100 group-hover:scale-105 transition-transform duration-300 shadow-sm flex items-center justify-center">
                <QRCode
                  value="http://xhslink.com/m/1zwWrtMsiTL"
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
            </div>
          </div>
        </div> */}

        {/* 底部共建按钮 */}
        <div className="mt-16 bg-gray-50 rounded-3xl p-10 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <p className="text-gray-600 leading-relaxed mb-6">
            {t('ctaText')}
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center px-8 py-3 bg-[#e52129] text-white rounded-full font-medium hover:bg-red-600 transition-all shadow-md"
          >
            {t('ctaButton')}
          </Link>

          {/* 联系方式 */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-8 border-t border-gray-200">
            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <Mail className="w-5 h-5" />
              <span>{t('contact')}</span>
            </button>
          </div>
        </div>

        {/* Toast 弹窗 */}
        {showToast && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
            <div className="bg-gray-900 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg animate-bounce pointer-events-auto">
              <Check className="w-5 h-5 text-green-400" />
              <span>{t('copiedEmail')} <span className="text-gray-300 font-mono">ichenghub@gmail.com</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
