import { Metadata } from 'next';
import { Link } from '@/navigation';
import { MessageSquarePlus, ShieldAlert, ArrowRight } from 'lucide-react';
import CopyEmailCardAction from '@/components/contact/CopyEmailCardAction';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const title = isEn ? 'Contact Us' : '联系我们';
  const description = isEn
    ? 'Reach the iChengHub team (Heguang Studio) for tool feedback, content corrections, privacy inquiries, or tool submissions.'
    : '联系 iChengHub（和光工作室），反馈工具问题、内容纠错、隐私咨询或推荐实用工具。';

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/contact`,
      languages: {
        zh: '/zh/contact',
        en: '/en/contact',
        'x-default': '/zh/contact',
      },
    },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 md:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-4">
            {isEn ? 'Contact Us' : '联系我们'}
          </h1>
          <p className="text-base md:text-lg text-zinc-600 leading-relaxed">
            {isEn
              ? 'Have a bug report, content correction, privacy question, or feature suggestion? Reach Heguang Studio directly below.'
              : '如有工具问题、内容纠错、隐私咨询或功能建议，欢迎通过以下渠道联系和光工作室。'}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <CopyEmailCardAction isEn={isEn} />

          <Link
            href="/submit"
            className="group flex flex-col justify-between rounded-2xl apple-glass-card p-6 md:p-8 gap-6"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center group-hover:bg-red-50 group-hover:text-[#e52129] transition-colors">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 group-hover:text-[#e52129] transition-colors">
                {isEn ? 'Tool Submissions & Requests' : '推荐工具与需求许愿'}
              </h2>
              <p className="text-sm sm:text-[15px] text-zinc-600 leading-[1.8]">
                {isEn
                  ? 'Want to recommend a useful AI/productivity tool or request a new browser-local utility? Use our structured submission center (all entries are manually reviewed).'
                  : '想推荐好用的效率工具，或希望我们开发某个新的浏览器本地小工具？可通过站内提交中心提交（所有内容均经过人工审核）。'}
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 group-hover:text-[#e52129] transition-colors">
                {isEn ? 'Open Submission Center' : '前往提交 / 许愿中心'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        </div>

        <div className="rounded-2xl apple-glass p-6 md:p-8 space-y-3 text-sm sm:text-[15px] text-zinc-600 leading-[1.8]">
          <div className="flex items-center gap-2 font-semibold text-zinc-900">
            <ShieldAlert className="w-4 h-4 text-zinc-700" />
            <span>{isEn ? 'Response Expectations & Privacy Reminder' : '回复说明与隐私提醒'}</span>
          </div>
          <p>
            {isEn
              ? 'This site is maintained by a small independent team (Heguang Studio). We review messages regularly and typically respond within 2–5 business days. Please do not include passwords, API keys, or sensitive personal files in email messages.'
              : '本站由独立小团队（和光工作室）持续维护，我们通常会在 2～5 个工作日内查看并回复邮件。发送邮件时请勿附带密码、API Key 或高度敏感的个人文件。'}
          </p>
        </div>
      </section>
    </div>
  );
}
