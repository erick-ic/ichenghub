import { Metadata } from 'next';
import { FileText } from 'lucide-react';
import InlineCopyEmail from '@/components/contact/InlineCopyEmail';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const title = isEn ? 'Terms of Service' : '服务条款';
  const description = isEn
    ? 'Terms governing the use of iChengHub online tools, guides, directory listings, and community submissions.'
    : '使用 iChengHub 在线工具、原创指南、资源导航与社区提交功能的服务条款与责任说明。';

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/terms`,
      languages: {
        zh: '/zh/terms',
        en: '/en/terms',
        'x-default': '/zh/terms',
      },
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return (
    <div className="min-h-screen">
      <article className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 border-b border-zinc-200/80 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold mb-4">
            <FileText className="w-3.5 h-3.5" />
            <span>{isEn ? 'Legal & Usage' : '使用协议'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-3">
            {isEn ? 'Terms of Service' : '服务条款'}
          </h1>
          <p className="text-sm text-zinc-500">
            {isEn ? 'Last updated: November 28, 2026' : '最后更新日期：2026 年 11 月 28 日'}
          </p>
        </header>

        <div className="space-y-8 text-[15px] md:text-base text-zinc-700 leading-[1.85] break-words">
          {isEn ? (
            <>
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using iChengHub (https://ichenghub.cn), you agree to these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the site.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">2. Use of Online Tools & Output Responsibility</h2>
                <p>
                  Our browser-based tools (Image Compressor, Shape Cropper, QR Code Generator, and AI Quota Tracker) are provided &quot;as is&quot; for lawful personal and commercial productivity use. Because files and data are processed locally in your browser, you remain solely responsible for verifying exported outputs (such as scanning printed QR codes or backing up localStorage JSON exports) and ensuring you hold the necessary rights to any images or content you process.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">3. Third-Party Links & Resources</h2>
                <p>
                  iChengHub curates links and descriptions for external AI and productivity tools for informational convenience. We do not control or guarantee the availability, pricing, accuracy, or privacy practices of third-party websites.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">4. Intellectual Property</h2>
                <p>
                  Original articles, practical guides, site code, and design elements on iChengHub belong to Heguang Studio unless otherwise noted. Trademarks, logos, and product names of third-party tools belong to their respective owners.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">5. Prohibited Conduct</h2>
                <p>
                  You agree not to abuse site APIs, submit spam or malicious links through the submission form, attempt unauthorized access to backend routes, or scrape the site in a manner that degrades service availability.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">6. Changes & Contact</h2>
                <p>
                  We may update or discontinue features and revise these terms as the platform evolves. Questions regarding these terms can be sent to{' '}
                  <InlineCopyEmail isEn />.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">一、条款接受</h2>
                <p>
                  访问或使用 iChengHub（https://ichenghub.cn）即表示你同意遵守本服务条款。如你不同意本条款的任何内容，请停止使用本站服务。
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">二、在线工具使用与结果责任</h2>
                <p>
                  本站自研工具（图片压缩器、形状裁剪器、二维码生成器与 AI 额度追踪器）按“现状”免费提供，可用于合法的个人或商业效率场景。由于计算与存储发生在你的本地浏览器中，请你自行核验最终导出结果（例如印刷前实测扫码、定期导出 JSON 备份），并确保你对所处理的图片和内容拥有合法使用权。
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">三、第三方链接免责声明</h2>
                <p>
                  本站工具导航与实用链接栏目仅提供信息筛选与访问入口。我们不对外部第三方网站的可用性、收费策略变更、内容准确性或数据安全承担担保责任。
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">四、知识产权</h2>
                <p>
                  除另有注明外，本站原创指南、技术文章、界面设计与自研工具代码归和光工作室所有。导航中收录的第三方产品名称、商标与图标均归各自权利人所有。
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">五、禁止滥用行为</h2>
                <p>
                  你不得恶意攻击或高频滥用本站接口、不得通过推荐表单批量提交垃圾外链或恶意网址、不得尝试未授权访问后台管理路径，亦不得以影响正常服务的方式抓取站点资源。
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-zinc-900">六、服务变更与联系</h2>
                <p>
                  随着功能迭代，我们可能会调整部分页面或更新本条款。如有任何疑问，请联系{' '}
                  <InlineCopyEmail isEn={false} />
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
