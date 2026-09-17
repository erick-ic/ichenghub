'use server';

import prisma from '@/lib/prisma';
import { auth } from '../../../auth';
import { normalizePublicUrl } from '@/lib/url-normalization';

interface SubmitState {
  success: boolean;
  error?: string;
}

// 服务端解析当前用户 ID：登录则关联提交记录，游客返回 null（继续允许游客提交）。
// 不从 contact 或表单字段推断用户身份。
async function resolveCurrentUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id ?? null;
  } catch (error) {
    console.error('[submit] resolve user id failed:', error);
    return null;
  }
}

export async function submitRecommendation(_prevState: SubmitState, formData: FormData): Promise<SubmitState> {
  try {
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    const description = formData.get('description') as string;
    const contact = formData.get('contact') as string | null;

    // 验证必填字段
    if (!name?.trim()) {
      return { success: false, error: '请输入工具名称' };
    }
    if (!url?.trim()) {
      return { success: false, error: '请输入官网链接' };
    }
    if (!description?.trim()) {
      return { success: false, error: '请输入推荐理由' };
    }
    if (name.trim().length > 80 || description.trim().length > 2000 || (contact?.trim().length ?? 0) > 200) {
      return { success: false, error: '提交内容过长，请精简后重试' };
    }
    const normalizedUrl = normalizePublicUrl(url);
    if (!normalizedUrl) {
      return { success: false, error: '请输入有效的 http 或 https 官网链接' };
    }

    const userId = await resolveCurrentUserId();

    await prisma.toolSubmission.create({
      data: {
        name: name.trim(),
        url: normalizedUrl,
        description: description.trim(),
        contact: contact?.trim() || null,
        userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Submit recommendation error:', error);
    return { success: false, error: '提交失败，请稍后重试' };
  }
}

export async function submitDemand(_prevState: SubmitState, formData: FormData): Promise<SubmitState> {
  try {
    const title = formData.get('title') as string;
    const detail = formData.get('detail') as string;
    const referenceUrl = formData.get('referenceUrl') as string | null;
    const contact = formData.get('contact') as string | null;

    // 验证必填字段
    if (!title?.trim()) {
      return { success: false, error: '请输入需求标题' };
    }
    if (!detail?.trim()) {
      return { success: false, error: '请输入详细描述' };
    }
    if (title.trim().length > 120 || detail.trim().length > 3000 || (contact?.trim().length ?? 0) > 200) {
      return { success: false, error: '提交内容过长，请精简后重试' };
    }
    const normalizedReferenceUrl = referenceUrl?.trim() ? normalizePublicUrl(referenceUrl) : null;
    if (referenceUrl?.trim() && !normalizedReferenceUrl) {
      return { success: false, error: '请输入有效的 http 或 https 参考链接' };
    }

    const userId = await resolveCurrentUserId();

    await prisma.toolDemand.create({
      data: {
        title: title.trim(),
        detail: detail.trim(),
        referenceUrl: normalizedReferenceUrl,
        contact: contact?.trim() || null,
        userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Submit demand error:', error);
    return { success: false, error: '提交失败，请稍后重试' };
  }
}
