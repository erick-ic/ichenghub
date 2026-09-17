import prisma from './prisma';

// 个人主页 MVP 数据层：
// - 所有查询只针对当前会话 userId（由页面从 auth() 取得后传入），禁止外部指定 userId
// - 先取足迹 ID 再批量解析资源，避免 N+1；指向已删除/下线资源的旧日志直接忽略
// - 每个区块独立容错，单区失败不影响其他区块

export const TOOL_OVERVIEW_ACTIONS = [
  'VIEW',
  'CLICK',
  'QR_GENERATE_SUCCESS',
  'IMAGE_COMPRESS_SUCCESS',
] as const;

const OVERVIEW_LIMIT = 5;
// 收藏与提交展示全部个人数据，不设上限
const FAVORITES_LIMIT = 9999;
const SUBMISSIONS_LIMIT = 9999;
// 取足夠多的足迹日志用于按资源去重后仍能凑满 5 个有效资源
const FOOTPRINT_FETCH = 100;

export interface OverviewToolItem {
  id: string;
  name: string;
  url: string | null;
  logoUrl: string;
  lastUsedAt: string;
}

export interface OverviewBlogItem {
  id: string;
  title: string;
  category: string;
  lastReadAt: string;
}

export interface OverviewPromptItem {
  id: string;
  title: string;
  category: string;
  platform: string;
  lastCopiedAt: string;
}

export type FavoriteItem =
  | {
      kind: 'PROMPT';
      id: string;
      title: string;
      category: string;
      platform: string;
      createdAt: string;
    }
  | {
      kind: 'BLOG';
      id: string;
      title: string;
      category: string;
      createdAt: string;
    };

export interface SubmissionItem {
  id: string;
  kind: 'TOOL' | 'DEMAND';
  title: string;
  url: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
}

export interface ProfileStats {
  favoritesCount: number;
  submissionsCount: number;
  recentToolCount: number;
  recentBlogCount: number;
}

export interface ProfileData {
  recentTools: OverviewToolItem[];
  recentBlogs: OverviewBlogItem[];
  recentPrompts: OverviewPromptItem[];
  favorites: FavoriteItem[];
  submissions: SubmissionItem[];
  stats: ProfileStats;
}

function isEn(locale: string) {
  return locale === 'en';
}

// 按时间倒序拉取足迹，按 resourceId 去重（保留最近一次），返回前 limit 个资源 ID 与时间
function distinctResourceIds(
  logs: Array<{ resourceId: string | null; timestamp: Date }>,
  limit: number,
): Array<{ id: string; at: Date }> {
  const map = new Map<string, Date>();
  for (const log of logs) {
    if (!log.resourceId) continue;
    if (!map.has(log.resourceId)) map.set(log.resourceId, log.timestamp);
    if (map.size >= limit) break;
  }
  return [...map.entries()].map(([id, at]) => ({ id, at }));
}

// 与后台 ibackend/dashboard 的 STATIC_TOOL_NAME_MAP 保持同一口径：
// 内置工具（二维码/图片压缩/AI 额度）历史埋点 resourceId 为空，通过 path 识别。
// ToolCard.id 标准化留到第二阶段，本文件不改变任何埋点结果，只做读取侧解析。
const STATIC_TOOL_NAME_MAP: Record<string, string> = {
  '/qrcode': '极简二维码生成器',
  '/tools/image-compressor': '图片压缩器',
  '/imgcompress': '图片压缩器',
  '/aiquota': 'AI 额度追踪器',
};

// 静态工具的实际站内路由（旧埋点 label /tools/image-compressor 归一到真实页面 /imgcompress）
const STATIC_TOOL_CANONICAL_URL: Record<string, string> = {
  极简二维码生成器: '/qrcode',
  图片压缩器: '/imgcompress',
  'AI 额度追踪器': '/aiquota',
};

// 复刻后台 resolveStaticToolName 的匹配规则：精确 → endsWith/includes（兼容 /zh 前缀）
function resolveStaticTool(path: string | null): { name: string; canonicalUrl: string } | null {
  if (!path) return null;
  if (STATIC_TOOL_NAME_MAP[path]) {
    const name = STATIC_TOOL_NAME_MAP[path];
    return { name, canonicalUrl: STATIC_TOOL_CANONICAL_URL[name] };
  }
  for (const [key, name] of Object.entries(STATIC_TOOL_NAME_MAP)) {
    if (path.endsWith(key) || path.includes(key)) {
      return { name, canonicalUrl: STATIC_TOOL_CANONICAL_URL[name] };
    }
  }
  return null;
}

// ToolCard.url 归一化（去 locale 前缀）后若命中静态工具表，返回静态工具名
function staticNameByToolUrl(url: string | null): string | null {
  if (!url) return null;
  const normalized = url.replace(/^\/(zh|en)(?=\/)/, '');
  return STATIC_TOOL_NAME_MAP[normalized] ?? null;
}

interface ToolFootprintResult {
  items: OverviewToolItem[];
  // 全部不同工具数（不受展示上限 5 限制），供右侧数据概览
  distinctCount: number;
}

async function getRecentTools(userId: string, locale: string): Promise<ToolFootprintResult> {
  // 注意：不过滤 resourceId —— 内置工具历史埋点 resourceId 为 null，需要靠 path 解析
  const logs = await prisma.analyticsLog.findMany({
    where: {
      userId,
      resourceType: 'TOOL',
      actionType: { in: [...TOOL_OVERVIEW_ACTIONS] },
    },
    orderBy: { timestamp: 'desc' },
    take: FOOTPRINT_FETCH,
    select: { resourceId: true, path: true, timestamp: true },
  });

  if (logs.length === 0) return { items: [], distinctCount: 0 };

  // 第一遍：收集出现过的 resourceId（批量查 ToolCard，避免 N+1）
  const resourceIds = [
    ...new Set(logs.map((log) => log.resourceId).filter((v): v is string => !!v)),
  ];
  const toolCards =
    resourceIds.length > 0
      ? await prisma.toolCard.findMany({
          where: { id: { in: resourceIds } },
          select: { id: true, name: true, nameEn: true, url: true, logoUrl: true, status: true },
        })
      : [];
  const cardById = new Map(toolCards.map((card) => [card.id, card]));

  // 静态工具可能只有 resourceId 为空的日志，用 url 批量补一次 ToolCard，仅用于名称/logo 展示
  const staticUrls = [...new Set(Object.values(STATIC_TOOL_CANONICAL_URL))];
  const staticCards = await prisma.toolCard.findMany({
    where: { url: { in: staticUrls } },
    select: { name: true, nameEn: true, url: true, logoUrl: true, status: true },
  });
  const staticCardByUrl = new Map(
    staticCards.filter((card) => card.status === 1).map((card) => [card.url, card]),
  );

  // 第二遍：按「工具身份」分组合并（logs 已按时间倒序，首次出现即最近一次）
  // - 有 resourceId 且 ToolCard 是内置工具：合并进对应静态组
  // - 有 resourceId 的其他 ToolCard：独立成组；卡片已删除/下线则忽略
  // - resourceId 为空：按 path 匹配静态表，匹配不上忽略（无法可靠识别）
  interface Group {
    key: string;
    at: Date;
    cardId?: string;
    staticName?: string;
    canonicalUrl?: string;
  }
  const groups = new Map<string, Group>();

  for (const log of logs) {
    let key: string | null = null;
    let group: Omit<Group, 'key'> | null = null;

    if (log.resourceId) {
      const card = cardById.get(log.resourceId);
      if (!card || card.status !== 1) continue;
      const staticName = staticNameByToolUrl(card.url);
      if (staticName) {
        key = `static:${staticName}`;
        group = {
          at: log.timestamp,
          staticName,
          canonicalUrl: STATIC_TOOL_CANONICAL_URL[staticName],
          cardId: card.id,
        };
      } else {
        key = `id:${card.id}`;
        group = { at: log.timestamp, cardId: card.id };
      }
    } else {
      const resolved = resolveStaticTool(log.path);
      if (!resolved) continue;
      key = `static:${resolved.name}`;
      group = { at: log.timestamp, staticName: resolved.name, canonicalUrl: resolved.canonicalUrl };
    }

    if (key && !groups.has(key)) groups.set(key, { key, ...group });
  }

  const en = isEn(locale);
  const items: OverviewToolItem[] = [];
  for (const group of groups.values()) {
    if (group.staticName) {
      const card = group.canonicalUrl ? staticCardByUrl.get(group.canonicalUrl) : undefined;
      items.push({
        id: group.key,
        name: card
          ? en && card.nameEn
            ? card.nameEn
            : card.name
          : group.staticName,
        url: group.canonicalUrl ?? null,
        logoUrl: card?.logoUrl ?? '',
        lastUsedAt: group.at.toISOString(),
      });
    } else if (group.cardId) {
      const card = cardById.get(group.cardId);
      if (!card || card.status !== 1) continue;
      items.push({
        id: card.id,
        name: en && card.nameEn ? card.nameEn : card.name,
        url: card.url,
        logoUrl: card.logoUrl,
        lastUsedAt: group.at.toISOString(),
      });
    }
  }

  items.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());

  return { items: items.slice(0, OVERVIEW_LIMIT), distinctCount: items.length };
}

async function getRecentBlogs(userId: string, locale: string): Promise<OverviewBlogItem[]> {
  const logs = await prisma.analyticsLog.findMany({
    where: { userId, resourceType: 'BLOG', actionType: 'VIEW', resourceId: { not: null } },
    orderBy: { timestamp: 'desc' },
    take: FOOTPRINT_FETCH,
    select: { resourceId: true, timestamp: true },
  });

  const targets = distinctResourceIds(logs, OVERVIEW_LIMIT);
  if (targets.length === 0) return [];

  const blogs = await prisma.blog.findMany({
    where: { id: { in: targets.map((t) => t.id) }, status: 1 },
    select: { id: true, titleZh: true, titleEn: true, categoryZh: true, categoryEn: true },
  });
  const blogMap = new Map(blogs.map((blog) => [blog.id, blog]));

  const en = isEn(locale);
  return targets.filter((target) => blogMap.has(target.id)).map((target) => {
    const blog = blogMap.get(target.id)!;
    return {
      id: blog.id,
      title: en ? blog.titleEn : blog.titleZh,
      category: en ? blog.categoryEn : blog.categoryZh,
      lastReadAt: target.at.toISOString(),
    };
  });
}

async function getRecentPrompts(userId: string, locale: string): Promise<OverviewPromptItem[]> {
  const logs = await prisma.analyticsLog.findMany({
    where: { userId, resourceType: 'PROMPT', actionType: 'COPY', resourceId: { not: null } },
    orderBy: { timestamp: 'desc' },
    take: FOOTPRINT_FETCH,
    select: { resourceId: true, timestamp: true },
  });

  const targets = distinctResourceIds(logs, OVERVIEW_LIMIT);
  if (targets.length === 0) return [];

  const prompts = await prisma.prompt.findMany({
    where: { id: { in: targets.map((t) => t.id) }, status: 1 },
    select: {
      id: true,
      title: true,
      titleEn: true,
      category: true,
      categoryEn: true,
      platform: true,
      platformEn: true,
    },
  });
  const promptMap = new Map(prompts.map((prompt) => [prompt.id, prompt]));

  const en = isEn(locale);
  return targets.filter((target) => promptMap.has(target.id)).map((target) => {
    const prompt = promptMap.get(target.id)!;
    return {
      id: prompt.id,
      title: en && prompt.titleEn ? prompt.titleEn : prompt.title,
      category: en && prompt.categoryEn ? prompt.categoryEn : prompt.category,
      platform: en && prompt.platformEn ? prompt.platformEn : prompt.platform,
      lastCopiedAt: target.at.toISOString(),
    };
  });
}

async function getFavorites(userId: string, locale: string): Promise<FavoriteItem[]> {
  const [promptFavorites, blogFavorites] = await Promise.all([
    prisma.userPromptFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: FAVORITES_LIMIT,
      select: {
        createdAt: true,
        prompt: {
          select: {
            id: true,
            status: true,
            title: true,
            titleEn: true,
            category: true,
            categoryEn: true,
            platform: true,
            platformEn: true,
          },
        },
      },
    }),
    prisma.userBlogFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: FAVORITES_LIMIT,
      select: {
        createdAt: true,
        blog: {
          select: {
            id: true,
            status: true,
            titleZh: true,
            titleEn: true,
            categoryZh: true,
            categoryEn: true,
          },
        },
      },
    }),
  ]);

  const en = isEn(locale);

  const promptItems: FavoriteItem[] = promptFavorites
    .filter((row) => row.prompt && row.prompt.status === 1)
    .map((row) => ({
      kind: 'PROMPT' as const,
      id: row.prompt!.id,
      title: en && row.prompt!.titleEn ? row.prompt!.titleEn : row.prompt!.title,
      category: en && row.prompt!.categoryEn ? row.prompt!.categoryEn : row.prompt!.category,
      platform: en && row.prompt!.platformEn ? row.prompt!.platformEn : row.prompt!.platform,
      createdAt: row.createdAt.toISOString(),
    }));

  const blogItems: FavoriteItem[] = blogFavorites
    .filter((row) => row.blog && row.blog.status === 1)
    .map((row) => ({
      kind: 'BLOG' as const,
      id: row.blog!.id,
      title: en ? row.blog!.titleEn : row.blog!.titleZh,
      category: en ? row.blog!.categoryEn : row.blog!.categoryZh,
      createdAt: row.createdAt.toISOString(),
    }));

  return [...promptItems, ...blogItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

async function getSubmissions(userId: string): Promise<SubmissionItem[]> {
  const [toolSubmissions, demands] = await Promise.all([
    prisma.toolSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: SUBMISSIONS_LIMIT,
      select: { id: true, name: true, url: true, status: true, reviewNote: true, createdAt: true },
    }),
    prisma.toolDemand.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: SUBMISSIONS_LIMIT,
      select: { id: true, title: true, status: true, reviewNote: true, createdAt: true },
    }),
  ]);

  const items: SubmissionItem[] = [
    ...toolSubmissions.map((row) => ({
      id: row.id,
      kind: 'TOOL' as const,
      title: row.name,
      url: row.url,
      status: row.status,
      reviewNote: row.reviewNote,
      createdAt: row.createdAt.toISOString(),
    })),
    ...demands.map((row) => ({
      id: row.id,
      kind: 'DEMAND' as const,
      title: row.title,
      url: null,
      status: row.status,
      reviewNote: row.reviewNote,
      createdAt: row.createdAt.toISOString(),
    })),
  ];

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// 右侧数据概览：收藏数、提交数、最近阅读博客数为简单 count；
// 最近使用工具数与概览页采用同一套「resourceId + path 静态表」身份合并口径
async function getStats(userId: string, recentToolCount: number): Promise<ProfileStats> {
  const [blogFavCount, promptFavCount, toolSubmissionCount, demandCount, blogGroups] =
    await Promise.all([
      prisma.userBlogFavorite.count({ where: { userId } }),
      prisma.userPromptFavorite.count({ where: { userId } }),
      prisma.toolSubmission.count({ where: { userId } }),
      prisma.toolDemand.count({ where: { userId } }),
      prisma.analyticsLog.groupBy({
        by: ['resourceId'],
        where: { userId, resourceType: 'BLOG', actionType: 'VIEW', resourceId: { not: null } },
      }),
    ]);

  return {
    favoritesCount: blogFavCount + promptFavCount,
    submissionsCount: toolSubmissionCount + demandCount,
    recentToolCount,
    recentBlogCount: blogGroups.length,
  };
}

// 区块级容错：任一查询失败仅让该区块为空，其余区块正常
async function safeSection<T>(label: string, factory: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await factory();
  } catch (error) {
    console.error(`[profile-data] section "${label}" failed:`, error);
    return fallback;
  }
}

export async function getProfileData(userId: string, locale: string): Promise<ProfileData> {
  // 工具足迹只查一次，概览列表与右侧数量共用结果
  const toolFootprint = await safeSection(
    'recentTools',
    () => getRecentTools(userId, locale),
    { items: [], distinctCount: 0 },
  );

  const [recentBlogs, recentPrompts, favorites, submissions, stats] = await Promise.all([
    safeSection('recentBlogs', () => getRecentBlogs(userId, locale), []),
    safeSection('recentPrompts', () => getRecentPrompts(userId, locale), []),
    safeSection('favorites', () => getFavorites(userId, locale), []),
    safeSection('submissions', () => getSubmissions(userId), []),
    safeSection('stats', () => getStats(userId, toolFootprint.distinctCount), {
      favoritesCount: 0,
      submissionsCount: 0,
      recentToolCount: 0,
      recentBlogCount: 0,
    }),
  ]);

  return {
    recentTools: toolFootprint.items,
    recentBlogs,
    recentPrompts,
    favorites,
    submissions,
    stats,
  };
}
