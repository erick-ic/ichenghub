import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withMetrics } from '@/app/actions/withMetrics';
import { trackResourceAction } from '@/app/actions/statsActions';

const POST = withMetrics(async function POST(request: Request) {
  try {
    const body = await request.json();
    const { promptId } = body;

    if (!promptId) {
      return NextResponse.json({ success: false, message: '缺少提示词ID' }, { status: 400 });
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { favorites: true },
    });

    if (!prompt) {
      return NextResponse.json({ success: false, message: '提示词不存在' }, { status: 404 });
    }

    const updatedPrompt = await prisma.prompt.update({
      where: { id: promptId },
      data: {
        favorites: prompt.favorites + 1,
      },
    });

    // 记录收藏事件（用于后台环比统计），await 确保响应前写入完成，失败不影响主流程
    try {
      await trackResourceAction(promptId, 'PROMPT', 'FAVORITE', '');
    } catch {
      // 日志失败不阻断收藏响应
    }

    return NextResponse.json({
      success: true,
      message: '收藏成功',
      favorites: updatedPrompt.favorites
    });
  } catch (error) {
    console.error('收藏操作失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
  });

export { POST };
