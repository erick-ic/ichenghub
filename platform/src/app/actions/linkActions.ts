'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createLink(_prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const nameEn = formData.get('nameEn') as string
  const desc = formData.get('desc') as string
  const descEn = formData.get('descEn') as string
  const url = formData.get('url') as string
  const iconUrl = formData.get('iconUrl') as string
  const category = formData.get('category') as string
  const categoryEn = formData.get('categoryEn') as string

  const maxSortOrder = await prisma.navLink.aggregate({
    _max: { sortOrder: true },
  })

  const newSortOrder = maxSortOrder._max?.sortOrder !== null 
    ? maxSortOrder._max.sortOrder + 1 
    : 1

  await prisma.navLink.create({
    data: {
      name,
      nameEn: nameEn || null,
      desc,
      descEn: descEn || null,
      url,
      iconUrl: iconUrl || null,
      category,
      categoryEn: categoryEn || null,
      sortOrder: newSortOrder,
      status: 0,
    },
  })

  revalidatePath('/ibackend/links')
  revalidatePath('/')
}

export async function updateLink(_prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const nameEn = formData.get('nameEn') as string
  const desc = formData.get('desc') as string
  const descEn = formData.get('descEn') as string
  const url = formData.get('url') as string
  const iconUrl = formData.get('iconUrl') as string
  const category = formData.get('category') as string
  const categoryEn = formData.get('categoryEn') as string

  await prisma.navLink.update({
    where: { id },
    data: {
      name,
      nameEn: nameEn || null,
      desc,
      descEn: descEn || null,
      url,
      iconUrl: iconUrl || null,
      category,
      categoryEn: categoryEn || null,
    },
  })

  revalidatePath('/ibackend/links')
  revalidatePath('/')
}

export async function deleteLink(id: string) {
  await prisma.navLink.delete({
    where: { id },
  })

  revalidatePath('/ibackend/links')
  revalidatePath('/')
}

export async function toggleLinkStatus(id: string) {
  const link = await prisma.navLink.findUnique({
    where: { id },
    select: { status: true },
  })

  if (link) {
    const newStatus = link.status === 1 ? 0 : 1
    await prisma.navLink.update({
      where: { id },
      data: { status: newStatus },
    })
    revalidatePath('/ibackend/links')
    revalidatePath('/')
  }
}

export async function moveLinkToTop(id: string) {
  const allLinks = await prisma.navLink.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: { id: true },
  })

  const currentIndex = allLinks.findIndex(link => link.id === id)
  
  if (currentIndex === -1) {
    return
  }

  allLinks.splice(currentIndex, 1)
  allLinks.unshift({ id })

  for (let i = 0; i < allLinks.length; i++) {
    await prisma.navLink.update({
      where: { id: allLinks[i].id },
      data: { sortOrder: i + 1 },
    })
  }

  revalidatePath('/ibackend/links')
  revalidatePath('/')
}

export async function moveLinkUp(id: string) {
  const currentLink = await prisma.navLink.findUnique({
    where: { id },
    select: { sortOrder: true },
  })

  if (!currentLink) return

  const prevLink = await prisma.navLink.findFirst({
    where: { sortOrder: { lt: currentLink.sortOrder } },
    orderBy: { sortOrder: 'desc' },
    select: { id: true, sortOrder: true },
  })

  if (prevLink) {
    await prisma.$transaction([
      prisma.navLink.update({
        where: { id },
        data: { sortOrder: prevLink.sortOrder },
      }),
      prisma.navLink.update({
        where: { id: prevLink.id },
        data: { sortOrder: currentLink.sortOrder },
      }),
    ])

    revalidatePath('/ibackend/links')
    revalidatePath('/')
  }
}

export async function moveLinkDown(id: string) {
  const currentLink = await prisma.navLink.findUnique({
    where: { id },
    select: { sortOrder: true },
  })

  if (!currentLink) return

  const nextLink = await prisma.navLink.findFirst({
    where: { sortOrder: { gt: currentLink.sortOrder } },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, sortOrder: true },
  })

  if (nextLink) {
    await prisma.$transaction([
      prisma.navLink.update({
        where: { id },
        data: { sortOrder: nextLink.sortOrder },
      }),
      prisma.navLink.update({
        where: { id: nextLink.id },
        data: { sortOrder: currentLink.sortOrder },
      }),
    ])

    revalidatePath('/ibackend/links')
    revalidatePath('/')
  }
}