import { Metadata } from 'next';
import { Link } from '@/navigation';
import { ShieldCheck } from 'lucide-react';
import InlineCopyEmail from '@/components/contact/InlineCopyEmail';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const title = isEn ? 'Privacy Policy' : '隐私政策';
  const description = isEn
    ? 'Learn how iChengHub handles browser-local tool data, OAuth sign-in, anonymous analytics, cookies, and Google AdSense advertising.'
    : '了解 iChengHub 如何处理浏览器本地工具数据、OAuth 登录、匿名访问统计、Cookies 以及 Google AdSense 广告服务。';

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: {
        zh: '/zh/privacy',
        en: '/en/privacy',
        'x-default': '/zh/privacy',
      },
    },
  };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return (
    <div className="min-h-screen">
      <article className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 border-b border-zinc-200/80 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isEn ? 'Privacy & Transparency' : '隐私与透明说明'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-3">
            {isEn ? 'Privacy Policy' : '隐私政策'}
          </h1>
          <p className="text-sm text-zinc-500">
            {isEn ? 'Last updated: November 28, 2026' : '最后更新日期：2026 年 11 月 28 日'}
          </p>
        </header>

        <div className="space-y-8 text-[15px] md:text-base text-zinc-700 leading-[1.85] break-words">
          {isEn ? (
            <>
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">1. Overview</h2>
                <p>
                  iChengHub (https://ichenghub.cn), operated by Heguang Studio, is built with a privacy-first mindset. This policy explains what data is processed locally in your browser, what limited data is stored on our servers when you interact with the site, and how third-party services such as Google AdSense operate.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">2. Browser-Local Tools (No File Uploads)</h2>
                <p>
                  Our self-developed browser utilities—including the Image Compressor, Image Shape Cropper, QR Code Generator, and AI Quota Tracker—process your inputs locally inside your browser:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Images selected for compression or cropping are processed in browser memory via Canvas and Web Workers and are never uploaded to iChengHub servers.</li>
                  <li>Text or URLs entered into the QR Code Generator are encoded locally and never transmitted to our backend.</li>
                  <li>AI Quota Tracker configurations and daily check-in records are stored strictly in your browser&apos;s <code>localStorage</code> under the key <code>ichenghub_ai_quotas</code>.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">3. Optional Account Sign-In (GitHub / Gitee OAuth)</h2>
                <p>
                  Using our browser tools and reading articles does not require an account. If you choose to sign in via GitHub or Gitee to save favorites or submit tool recommendations, we store only the basic profile details provided by the OAuth provider (display name, verified email if available, avatar URL, and session tokens) in our PostgreSQL database.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">4. Site Analytics & Access Logs</h2>
                <p>
                  To understand which tools and articles are helpful and keep the platform reliable, we record lightweight, anonymized usage events (such as page paths, tool action counts, hashed IP addresses, and basic user-agent metadata). We never log uploaded image contents, QR payloads, or clipboard text.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">5. Cookies & Google AdSense</h2>
                <p>
                  We use essential cookies to maintain optional user sign-in sessions and language preferences. In addition, iChengHub uses Google AdSense to help fund hosting and ongoing development:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website or other websites.</li>
                  <li>Google&apos;s use of advertising cookies enables it and its partners to serve ads to users based on their visits to this site and/or other sites on the Internet.</li>
                  <li>Users may opt out of personalized advertising by visiting Google Ads Settings (https://adssettings.google.com) or aboutads.info.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">6. Third-Party Links</h2>
                <p>
                  Our Tools Directory and Useful Links pages contain links to external websites. Once you leave iChengHub, your interactions are governed by the privacy policies of those third-party services.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">7. Contact & Data Requests</h2>
                <p>
                  If you have questions about this Privacy Policy or wish to request deletion of your optional account data, please email us at{' '}
                  <InlineCopyEmail isEn />{' '}
                  or visit our{' '}
                  <Link href="/contact" className="text-[#e52129] underline underline-offset-2">
                    Contact page
                  </Link>.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">一、总则</h2>
                <p>
                  iChengHub（热荐工坊，https://ichenghub.cn）由和光工作室运营，秉持隐私优先的产品设计理念。本政策如实说明哪些数据仅在你的浏览器本地处理、哪些必要数据会保存在服务端，以及 Cookies 与 Google AdSense 广告服务的运作方式。
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">二、自研浏览器工具的数据处理（本地运行）</h2>
                <p>
                  本站提供的自研在线工具（包括图片压缩器、形状裁剪器、二维码生成器与 AI 额度追踪器）均优先在浏览器本地完成核心计算：
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>图片压缩与形状裁剪通过浏览器 Canvas 与 Web Worker 在本地内存中处理，不会将你的图片文件上传至 iChengHub 服务器。</li>
                  <li>二维码生成器在本地完成 UTF-8 编码与 SVG/PNG 导出，不会向服务端发送你输入的文本或网址。</li>
                  <li>AI 额度追踪器的平台配置与签到记录仅保存在你当前浏览器的 <code>localStorage</code>（键名 <code>ichenghub_ai_quotas</code>）中，不上传云端。</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">三、可选账号登录（GitHub / Gitee OAuth）</h2>
                <p>
                  使用自研工具、浏览指南和阅读技术文章无需注册或登录。如果你主动通过 GitHub 或 Gitee 登录以使用收藏、提交工具或查看使用足迹功能，我们仅在 PostgreSQL 数据库中保存 OAuth 授权返回的基础账户信息（昵称、已确认邮箱、头像地址及会话记录）。
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">四、站点访问日志与匿名统计</h2>
                <p>
                  为了保障服务稳定性并了解工具和文章的受欢迎程度，本站会记录轻量级的匿名访问与操作事件（包括访问路径、按钮触发类型、经哈希脱敏的 IP 以及基础浏览器 User-Agent）。我们绝不记录上传的图片内容、二维码文本内容或剪贴板数据。
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">五、Cookies 与 Google AdSense 广告服务</h2>
                <p>
                  本站使用必要 Cookies 以维持可选登录会话与语言偏好。同时，为支持服务器与持续维护成本，本站接入了 Google AdSense 广告服务：
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>包括 Google 在内的第三方供应商会使用 Cookies，根据用户此前对本网站或其他网站的访问记录展示广告。</li>
                  <li>Google 使用广告 Cookies，使其及合作伙伴能够根据用户对本站及互联网上其他网站的访问情况投放相关广告。</li>
                  <li>你可以随时访问 Google 广告设置（https://adssettings.google.com）或 aboutads.info 管理或停用个性化广告。</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">六、第三方网站链接</h2>
                <p>
                  本站的「工具分类」与「效率导航」包含指向外部第三方网站的链接。当你点击访问外部网站时，你的数据将受对应第三方网站的隐私政策约束，建议在提供敏感信息前仔细阅读对方条款。
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">七、隐私咨询与数据删除</h2>
                <p>
                  如对本隐私政策有任何疑问，或希望申请删除你的可选账号数据，请发送邮件至{' '}
                  <InlineCopyEmail isEn={false} />
                  ，或前往{' '}
                  <Link href="/contact" className="text-[#e52129] underline underline-offset-2">
                    联系我们页面
                  </Link>
                  。
                </p>
              </section>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
