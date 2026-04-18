'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Cho xu ly',
  picked_up: 'Da lay hang',
  in_transit: 'Dang van chuyen',
  delivering: 'Dang giao',
  completed: 'Hoan thanh',
  cancelled: 'Da huy',
}

const ALLOWED_ORDER_STATUSES = new Set(Object.keys(ORDER_STATUS_LABELS))

function parsePositiveInteger(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.round(parsed)
}

function parseRequiredText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function approveQuoteAction(formData: FormData) {
  await requireEmployeeSession()

  const quoteId = parseRequiredText(formData.get('quoteId'))
  const quotedPrice = parsePositiveInteger(formData.get('quotedPrice'))

  if (!quoteId || !quotedPrice) {
    return
  }

  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      userId: true,
      quoteCode: true,
      status: true,
    },
  })

  if (!quote || quote.status !== 'pending') {
    return
  }

  await prisma.$transaction([
    prisma.quoteRequest.update({
      where: { id: quote.id },
      data: {
        status: 'quoted',
        quotedPrice,
      },
    }),
    prisma.notification.create({
      data: {
        userId: quote.userId,
        type: 'info',
        title: 'Da co bao gia moi',
        message: `Yeu cau ${quote.quoteCode} da duoc bao gia: ${quotedPrice.toLocaleString('vi-VN')} VND`,
      },
    }),
  ])

  revalidatePath('/dashboard/nhan-vien/bao-gia')
  revalidatePath('/dashboard/nhan-vien')
  revalidatePath('/dashboard/khach-hang')
  revalidatePath('/dashboard/khach-hang/bao-gia')
}

export async function rejectQuoteAction(formData: FormData) {
  await requireEmployeeSession()

  const quoteId = parseRequiredText(formData.get('quoteId'))
  const reason = parseRequiredText(formData.get('reason')) ?? 'Yeu cau chua du dieu kien de bao gia.'

  if (!quoteId) {
    return
  }

  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      userId: true,
      quoteCode: true,
      status: true,
    },
  })

  if (!quote || quote.status !== 'pending') {
    return
  }

  await prisma.$transaction([
    prisma.quoteRequest.update({
      where: { id: quote.id },
      data: {
        status: 'rejected',
      },
    }),
    prisma.notification.create({
      data: {
        userId: quote.userId,
        type: 'warning',
        title: 'Yeu cau bao gia da bi tu choi',
        message: `${quote.quoteCode}: ${reason}`,
      },
    }),
  ])

  revalidatePath('/dashboard/nhan-vien/bao-gia')
  revalidatePath('/dashboard/nhan-vien')
  revalidatePath('/dashboard/khach-hang')
  revalidatePath('/dashboard/khach-hang/bao-gia')
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireEmployeeSession()

  const orderId = parseRequiredText(formData.get('orderId'))
  const status = parseRequiredText(formData.get('status'))
  const location = parseRequiredText(formData.get('location')) ?? 'Dang cap nhat'
  const description =
    parseRequiredText(formData.get('description')) ??
    `Trang thai van don duoc cap nhat: ${ORDER_STATUS_LABELS[status ?? ''] ?? status ?? 'Khac'}`

  if (!orderId || !status || !ALLOWED_ORDER_STATUSES.has(status)) {
    return
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      orderCode: true,
    },
  })

  if (!order) {
    return
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status,
        currentLocation: location,
      },
    }),
    prisma.trackingEvent.create({
      data: {
        orderId: order.id,
        status,
        location,
        description,
      },
    }),
    prisma.notification.create({
      data: {
        userId: order.userId,
        type: status === 'completed' ? 'success' : status === 'cancelled' ? 'warning' : 'info',
        title: `Cap nhat don hang ${order.orderCode}`,
        message: `Trang thai moi: ${ORDER_STATUS_LABELS[status]}. Vi tri: ${location}.`,
      },
    }),
  ])

  revalidatePath('/dashboard/nhan-vien')
  revalidatePath('/dashboard/nhan-vien/van-don')
  revalidatePath('/dashboard/khach-hang')
  revalidatePath('/dashboard/khach-hang/don-hang')
  revalidatePath('/dashboard/khach-hang/theo-doi')
}
