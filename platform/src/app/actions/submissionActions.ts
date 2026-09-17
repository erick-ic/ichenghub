'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { normalizePublicUrl } from '@/lib/url-normalization';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session';

async function requireAdmin() {
  if (!await verifyAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value)) {
    throw new Error('未授权的后台操作');
  }
}

export async function getToolSubmissions() {
  await requireAdmin();
  try {
    const [data, tools] = await Promise.all([
      prisma.toolSubmission.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.toolCard.findMany({
        where: { url: { not: null } },
        select: { id: true, name: true, url: true },
      }),
    ]);

    const enriched = data.map((item) => {
      const normalizedUrl = normalizePublicUrl(item.url);
      const matchingTool = tools.find((tool) => tool.url && normalizePublicUrl(tool.url) === normalizedUrl) ?? null;
      const matchingSubmissions = data
        .filter((other) => other.id !== item.id && normalizePublicUrl(other.url) === normalizedUrl)
        .map((other) => ({ id: other.id, name: other.name, status: other.status, createdAt: other.createdAt }));
      return { ...item, duplicateCheck: { matchingTool, matchingSubmissions } };
    });

    return JSON.parse(JSON.stringify(enriched));
  } catch (error) {
    console.error('Error fetching tool submissions:', error);
    return [];
  }
}

export async function getToolDemands() {
  await requireAdmin();
  try {
    const data = await prisma.toolDemand.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Error fetching tool demands:', error);
    return [];
  }
}

export async function updateSubmissionStatus(id: string, status: string, reviewNote?: string) {
  await requireAdmin();
  if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) throw new Error('无效状态');
  const submission = await prisma.toolSubmission.findUnique({ where: { id }, select: { name: true, userId: true } });
  if (!submission) throw new Error('提交记录不存在');
  const note = reviewNote?.trim() || null;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.toolSubmission.update({
      where: { id },
      data: { status, reviewNote: note, reviewedAt: status === 'PENDING' ? null : new Date() },
    });
    if (submission.userId && status !== 'PENDING') {
      const approved = status === 'APPROVED';
      await tx.notification.create({
        data: {
          userId: submission.userId,
          type: 'SUBMISSION_REVIEW',
          title: approved ? '工具推荐已通过' : '工具推荐审核结果',
          titleEn: approved ? 'Tool recommendation approved' : 'Tool recommendation reviewed',
          message: note || `你提交的「${submission.name}」${approved ? '已通过审核。' : '暂未通过审核。'}`,
          messageEn: note || `Your submission “${submission.name}” was ${approved ? 'approved.' : 'not approved.'}`,
          href: '/profile',
        },
      });
    }
    return updated;
  });
}

export async function updateDemandStatus(id: string, status: string, reviewNote?: string) {
  await requireAdmin();
  if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) throw new Error('无效状态');
  const demand = await prisma.toolDemand.findUnique({ where: { id }, select: { title: true, userId: true } });
  if (!demand) throw new Error('提交记录不存在');
  const note = reviewNote?.trim() || null;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.toolDemand.update({
      where: { id },
      data: { status, reviewNote: note, reviewedAt: status === 'PENDING' ? null : new Date() },
    });
    if (demand.userId && status !== 'PENDING') {
      const approved = status === 'APPROVED';
      await tx.notification.create({
        data: {
          userId: demand.userId,
          type: 'DEMAND_REVIEW',
          title: approved ? '许愿已通过' : '许愿审核结果',
          titleEn: approved ? 'Wish approved' : 'Wish reviewed',
          message: note || `你提交的「${demand.title}」${approved ? '已通过审核。' : '暂未通过审核。'}`,
          messageEn: note || `Your submission “${demand.title}” was ${approved ? 'approved.' : 'not approved.'}`,
          href: '/profile',
        },
      });
    }
    return updated;
  });
}

export async function updateSubmissionReviewNote(id: string, type: 'TOOL' | 'DEMAND', reviewNote: string) {
  await requireAdmin();
  const data = { reviewNote: reviewNote.trim() || null };
  return type === 'TOOL'
    ? prisma.toolSubmission.update({ where: { id }, data })
    : prisma.toolDemand.update({ where: { id }, data });
}

export async function deleteSubmission(id: string) {
  await requireAdmin();
  return await prisma.toolSubmission.delete({
    where: { id },
  });
}

export async function deleteDemand(id: string) {
  await requireAdmin();
  return await prisma.toolDemand.delete({
    where: { id },
  });
}
