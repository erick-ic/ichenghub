'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createTool(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const nameEn = formData.get('nameEn') as string
  const desc = formData.get('desc') as string
  const descEn = formData.get('descEn') as string
  const url = formData.get('url') as string | null
  const logoUrl = formData.get('logoUrl') as string
  const category = formData.get('category') as string
  const categoryEn = formData.get('categoryEn') as string

  // 查询当前最大的排序值，新工具排在第一位（排序值 = 最大值 + 1）
  const maxSortOrder = await prisma.toolCard.aggregate({
    _max: { sortOrder: true },
  })

  // 如果数据库为空，从1开始；否则新工具排序值 = 最大值 + 1
  const newSortOrder = maxSortOrder._max?.sortOrder !== null 
    ? maxSortOrder._max.sortOrder + 1 
    : 1

  await prisma.toolCard.create({
    data: {
      name,
      nameEn: nameEn || null,
      desc,
      descEn: descEn || null,
      url: url || null,
      logoUrl,
      category,
      categoryEn: categoryEn || null,
      sortOrder: newSortOrder,
    },
  })

  revalidatePath('/admin/tools')
  revalidatePath('/')
}

export async function updateTool(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const nameEn = formData.get('nameEn') as string
  const desc = formData.get('desc') as string
  const descEn = formData.get('descEn') as string
  const url = formData.get('url') as string | null
  const logoUrl = formData.get('logoUrl') as string
  const category = formData.get('category') as string
  const categoryEn = formData.get('categoryEn') as string

  await prisma.toolCard.update({
    where: { id },
    data: {
      name,
      nameEn: nameEn || null,
      desc,
      descEn: descEn || null,
      url: url || null,
      logoUrl,
      category,
      categoryEn: categoryEn || null,
    },
  })

  revalidatePath('/admin/tools')
  revalidatePath('/')
}

export async function deleteTool(id: string) {
  await prisma.toolCard.delete({
    where: { id },
  })

  revalidatePath('/admin/tools')
  revalidatePath('/')
}

export async function toggleToolStatus(id: string) {
  const tool = await prisma.toolCard.findUnique({
    where: { id },
    select: { status: true },
  })

  if (tool) {
    const newStatus = tool.status === 1 ? 0 : 1
    await prisma.toolCard.update({
      where: { id },
      data: { status: newStatus },
    })
    revalidatePath('/admin/tools')
    revalidatePath('/')
  }
}

export async function moveToolToTop(id: string) {
  // 获取所有工具，按当前排序排序
  const allTools = await prisma.toolCard.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: { id: true },
  })

  // 找到要置顶的工具在当前列表中的位置
  const currentIndex = allTools.findIndex(tool => tool.id === id)
  
  if (currentIndex === -1) {
    return
  }

  // 将置顶工具移到列表最前面
  allTools.splice(currentIndex, 1)
  allTools.unshift({ id })

  // 重新分配排序值，从1开始
  for (let i = 0; i < allTools.length; i++) {
    await prisma.toolCard.update({
      where: { id: allTools[i].id },
      data: { sortOrder: i + 1 },
    })
  }

  revalidatePath('/admin/tools')
  revalidatePath('/')
}

export async function moveToolUp(id: string) {
  const currentTool = await prisma.toolCard.findUnique({
    where: { id },
    select: { sortOrder: true },
  })

  if (!currentTool) return

  // 找到前一个工具（sortOrder 比当前小且最接近当前值的）
  const prevTool = await prisma.toolCard.findFirst({
    where: { sortOrder: { lt: currentTool.sortOrder } },
    orderBy: { sortOrder: 'desc' },
    select: { id: true, sortOrder: true },
  })

  if (prevTool) {
    // 交换排序值
    await prisma.$transaction([
      prisma.toolCard.update({
        where: { id },
        data: { sortOrder: prevTool.sortOrder },
      }),
      prisma.toolCard.update({
        where: { id: prevTool.id },
        data: { sortOrder: currentTool.sortOrder },
      }),
    ])

    revalidatePath('/admin/tools')
    revalidatePath('/')
  }
}

export async function moveToolDown(id: string) {
  const currentTool = await prisma.toolCard.findUnique({
    where: { id },
    select: { sortOrder: true },
  })

  if (!currentTool) return

  // 找到后一个工具（sortOrder 比当前大且最接近当前值的）
  const nextTool = await prisma.toolCard.findFirst({
    where: { sortOrder: { gt: currentTool.sortOrder } },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, sortOrder: true },
  })

  if (nextTool) {
    // 交换排序值
    await prisma.$transaction([
      prisma.toolCard.update({
        where: { id },
        data: { sortOrder: nextTool.sortOrder },
      }),
      prisma.toolCard.update({
        where: { id: nextTool.id },
        data: { sortOrder: currentTool.sortOrder },
      }),
    ])

    revalidatePath('/admin/tools')
    revalidatePath('/')
  }
}
