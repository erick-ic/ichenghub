import { Metadata } from 'next';
import { Link } from '@/navigation';
import { BookOpenCheck, CheckCircle2 } from 'lucide-react';
import InlineCopyEmail from '@/components/contact/InlineCopyEmail';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const title = isEn ? 'Editorial Policy & Tool Review Methodology' : '内容编辑规范与工具审核标准';
  const description = isEn
    ? 'How iChengHub selects topics, verifies technical guides, reviews third-party tools, handles AI assistance, and corrects errors.'
    : '了解 iChengHub 如何选题、核验技术文章、审核第三方工具导航、规范 AI 辅助写作以及处理错误更正。';

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/editorial-policy`,
      languages: {
        zh: '/zh/editorial-policy',
        en: '/en/editorial-policy',
        'x-default': '/zh/editorial-policy',
      },
    },
  };
}

export default async function EditorialPolicyPage({ params }: Props) {
  const { locale } = await params;
  const isEn = locale === 'en';

  const workflowSteps = isEn
    ? [
        { step: '1. Pending Queue', desc: 'User recommendations and candidate tools enter an unpublished review queue—never published automatically.' },
        { step: '2. Website Verification', desc: 'We verify that the official domain is active, reachable, and free of deceptive redirects.' },
        { step: '3. Practical Feature Check', desc: 'We check core functionality, target audience, free-tier limits, and pricing transparency.' },
        { step: '4. Bilingual Metadata & Publish', desc: 'We write clear Chinese and English descriptions before publishing to the directory.' },
      ]
    : [
        { step: '1. 待审核队列', desc: '用户推荐与候选工具均先进入未公开的待审列表，绝不自动生成公开索引页。' },
        { step: '2. 官网可用性核验', desc: '人工访问核实官方域名有效、无诱导下载或恶意跳转。' },
        { step: '3. 核心功能与额度检查', desc: '评估工具的实际用途、适用人群、免费额度边界与隐私说明清晰度。' },
        { step: '4. 双语信息完善后上线', desc: '补充自然准确的中英文介绍与分类标签后再正式对外发布。' },
      ];

  return (
    <div className="min-h-screen">
      <article className="container mx-auto px-6 md:px-4 py-8 md:py-12">
        <header className="mb-8 border-b border-zinc-200/80 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#e52129] text-xs font-semibold mb-4">
            <BookOpenCheck className="w-3.5 h-3.5" />
            <span>{isEn ? 'Quality & Trust' : '质量与信任体系'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-3">
            {isEn ? 'Editorial Policy & Tool Review Methodology' : '内容编辑规范与工具审核标准'}
          </h1>
          <p className="text-base text-zinc-600 leading-relaxed">
            {isEn
              ? 'We believe every indexed page should earn its place by solving a real problem clearly and honestly.'
              : '我们坚持不追求页面数量，而是让每一个对外公开的工具页、指南与导航条目都具备真实、可验证的参考价值。'}
          </p>
        </header>

        <div className="space-y-10 text-[15px] md:text-base text-zinc-700 leading-[1.85]">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900">
              {isEn ? '1. How We Write & Verify Guides and Technical Articles' : '一、指南与技术文章的编写和核验原则'}
            </h2>
            <ul className="space-y-2.5">
              {(isEn
                ? [
                    'Problem-first topics: Every guide or blog post addresses a concrete technical or workflow problem rather than chasing keyword volume.',
                    'Verified against real code: Privacy claims and feature limits for our own tools are checked directly against the running source code.',
                    'Honest limitations: We explicitly document known constraints (such as file size caps, manual tracking, or JPEG transparency limits) instead of hiding them.',
                    'Natural bilingual authoring: Chinese and English versions are written and reviewed for natural technical phrasing rather than raw machine translation.',
                    'AI assistance disclosure: When AI tools assist with outlining or language polishing, a human maintainer reviews all technical claims, code examples, and final wording before publication.',
                  ]
                : [
                    '以真实问题为导向：每篇指南与博客围绕具体开发实践、图片处理或隐私效率问题展开，不为凑字数或堆砌关键词而写。',
                    '与真实代码一致：涉及本站自研工具的功能描述、尺寸上限与隐私机制，均对照实际源码逐项核实。',
                    '明确说明局限性：主动写明工具的适用边界（如单文件限制、手动记录特性、格式兼容差异），不做夸大宣传。',
                    '中英文独立润色：中文与英文内容分别按目标语言习惯组织，不直接批量发布生硬的机器翻译。',
                    'AI 辅助规范：如在提纲整理或润色中使用 AI 辅助，所有技术事实、代码示例与最终表述均需经过人工核验后方可上线。',
                  ]
              ).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#e52129] shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">
              {isEn ? '2. Third-Party Tool Review Workflow' : '二、第三方工具与导航审核流程'}
            </h2>
            <p>
              {isEn
                ? 'Directory listings on iChengHub go through a four-stage manual review before appearing publicly:'
                : 'iChengHub 收录的第三方工具与效率链接均需经过以下四步人工审核流程：'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workflowSteps.map((item) => (
                <div key={item.step} className="rounded-xl apple-glass-card p-5">
                  <div className="font-semibold text-zinc-900 mb-1.5">{item.step}</div>
                  <p className="text-sm text-zinc-600 leading-[1.75]">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900">
              {isEn ? '3. Independence, Ratings & Advertising' : '三、独立性、评分与广告透明原则'}
            </h2>
            <p>
              {isEn
                ? 'We do not publish fabricated star ratings or fake user review counts. iChengHub displays Google AdSense advertisements to support infrastructure and maintenance, and ad placements are kept separate from core tool interactions and editorial judgment.'
                : '本站绝不虚构工具评分或用户评价数据。iChengHub 通过合理展示 Google AdSense 广告支持服务器与日常维护成本，广告展示与内容筛选、工具评测完全独立，且不干扰工具的核心操作区域。'}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900">
              {isEn ? '4. Updates & Error Corrections' : '四、内容更新与错误反馈'}
            </h2>
            <p>
              {isEn ? (
                <>
                  We periodically review published tools and guides to retire dead links and reflect product updates. If you spot a broken link, outdated detail, or technical inaccuracy, please report it via{' '}
                  <InlineCopyEmail isEn />{' '}
                  or our{' '}
                  <Link href="/contact" className="text-[#e52129] underline underline-offset-2">
                    Contact page
                  </Link>.
                </>
              ) : (
                <>
                  我们会定期复查已收录工具的有效性与指南准确性，及时下线失效链接并标注更新时间。如果你发现任何内容错误、链接失效或过时描述，欢迎发邮件至{' '}
                  <InlineCopyEmail isEn={false} />{' '}
                  或通过{' '}
                  <Link href="/contact" className="text-[#e52129] underline underline-offset-2">
                    联系我们页面
                  </Link>{' '}
                  向我们反馈。
                </>
              )}
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
