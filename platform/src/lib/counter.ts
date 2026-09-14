import { Prisma, PrismaClient } from '@prisma/client';

// Prisma 的 @updatedAt 在任何 update/updateMany 时都会被自动刷新为当前时间。
// 但 views / favorites / likes 这类冗余计数器的变化并不代表「内容被编辑」，
// 若走普通 update 会污染 updatedAt —— 博客列表日期、详情更新时间、sitemap
// lastModified 都会因为一次浏览/点赞/收藏而变成现在。
//
// 因此计数器统一走原生 SQL，只更新计数列。表名/列名使用下方白名单常量（绝不接受
// 外部字符串），id 与步长走参数绑定，杜绝 SQL 注入。

export type CounterTable = 'Blog' | 'Prompt';
export type CounterColumn = 'views' | 'favorites' | 'likes';

type DbClient = PrismaClient | Prisma.TransactionClient;

async function changeCounter(
  db: DbClient,
  table: CounterTable,
  column: CounterColumn,
  id: string,
  delta: number,
  guardPositive: boolean,
): Promise<number | null> {
  const op = delta >= 0 ? '+' : '-';
  const amount = Math.abs(delta);
  const positiveGuard = guardPositive
    ? Prisma.sql` AND "${Prisma.raw(column)}" > 0`
    : Prisma.empty;

  const rows = await db.$queryRaw<{ value: bigint }[]>`
    UPDATE "${Prisma.raw(table)}"
    SET "${Prisma.raw(column)}" = "${Prisma.raw(column)}" ${Prisma.raw(op)} ${amount}
    WHERE id = ${id}${positiveGuard}
    RETURNING "${Prisma.raw(column)}" AS value
  `;

  if (rows.length === 0) return null;
  return Number(rows[0].value);
}

/** 计数 +N，返回更新后的计数；行不存在时返回 null */
export function incrementCounter(
  db: DbClient,
  table: CounterTable,
  column: CounterColumn,
  id: string,
  by = 1,
): Promise<number | null> {
  return changeCounter(db, table, column, id, Math.abs(by), false);
}

/**
 * 计数 -N。guardPositive=true（默认）时仅当计数 > 0 才递减，防止减成负数；
 * 被守卫拦下或行不存在时返回 null。
 */
export function decrementCounter(
  db: DbClient,
  table: CounterTable,
  column: CounterColumn,
  id: string,
  by = 1,
  guardPositive = true,
): Promise<number | null> {
  return changeCounter(db, table, column, id, -Math.abs(by), guardPositive);
}
