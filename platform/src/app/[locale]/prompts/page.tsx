import PromptCard, { PromptData } from '@/components/PromptCard';
import PageViewTracker from '@/components/PageViewTracker';
import prisma from '@/lib/prisma';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PromptsPage({ params }: PageProps) {
  const { locale } = await params;
  const isEnglish = locale === 'en';

  const prompts = await prisma.prompt.findMany({
    where: { status: 1 },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  const promptData: PromptData[] = prompts.map(prompt => ({
    id: prompt.id,
    platform: prompt.platform,
    imageUrl: prompt.imageUrl,
    title: isEnglish ? (prompt.titleEn || prompt.title) : prompt.title,
    category: isEnglish ? (prompt.categoryEn || prompt.category) : prompt.category,
    promptText: prompt.promptText,
    views: prompt.views,
    likes: prompt.likes,
    comments: prompt.comments,
  }));

  return (
    <>
      <PageViewTracker path={`/${locale}/prompts`} />
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
      <header className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 mb-3">
          {isEnglish ? 'AI Prompt Architect' : 'AI 提示词构建器'}
        </h1>
        <p className="text-base md:text-lg text-zinc-500 max-w-3xl mx-auto lg:whitespace-nowrap">
          {isEnglish ? 'Turn vague ideas into precise AI instructions with chained logic.' : '将模糊需求解构为精准的 AI 指令。支持逻辑链式拆解，让复杂模型的输出可控且高效。'}
        </p>
      </header>

      {promptData.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-6xl mb-6">📭</div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">{isEnglish ? 'No prompts yet' : '暂无提示词'}</h2>
          <p className="text-zinc-500">{isEnglish ? 'Please check back later' : '敬请期待更多精彩内容'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promptData.map((prompt) => (
            <PromptCard key={prompt.id} data={prompt} />
          ))}
        </div>
      )}
    </section>
    </>
  );
}
