'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import { safeCreateActionLog } from '@/lib/action-log'

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Cho xu ly',
  picked_up: 'Da lay hang',
  in_transit: 'Dang van chuyen',
  delivering: 'Dang giao',
  completed: 'Hoan thanh',
  cancelled: 'Da huy',
}

const ALLOWED_ORDER_STATUSES = new Set(Object.keys(ORDER_STATUS_LABELS))
const EXECUTION_MODES = new Set(['manual', 'automation'])
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['delivering', 'cancelled'],
  delivering: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

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

function parseExecutionMode(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return 'manual'
  const mode = value.trim().toLowerCase()
  return EXECUTION_MODES.has(mode) ? mode : 'manual'
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
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

export async function confirmPickupAction(formData: FormData) {
  const session = await requireEmployeeSession()

  const orderId = parseRequiredText(formData.get('orderId'))
  const location = parseRequiredText(formData.get('location'))
  const pickupTime = parseOptionalDate(formData.get('pickupTime'))
  const notes = parseRequiredText(formData.get('notes')) ?? ''
  const executionMode = parseExecutionMode(formData.get('executionMode'))

  if (!orderId || !location) {
    return
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      orderCode: true,
      status: true,
    },
  })

  if (!order || order.status !== 'pending') {
    return
  }

  const pickupDescription = `Hang da duoc lay tu ${location}${notes ? '. ' + notes : ''}`

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'picked_up',
        currentLocation: location,
      },
    }),
    prisma.trackingEvent.create({
      data: {
        orderId: order.id,
        status: 'picked_up',
        location,
        description: pickupDescription,
        eventTime: pickupTime ?? undefined,
      },
    }),
    prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'info',
        title: `Don hang ${order.orderCode} da duoc lay`,
        message: `Hang da duoc lay tai ${location}. Theo doi van don tren ung dung.`,
      },
    }),
  ])

  await safeCreateActionLog({
    actor: { connect: { id: session.user.id } },
    mode: executionMode,
    actionType: 'EMPLOYEE_CONFIRM_PICKUP',
    entityType: 'order',
    entityId: order.id,
    metadata: {
      orderCode: order.orderCode,
      location,
      pickupTime: (pickupTime ?? new Date()).toISOString(),
    },
  })

  revalidatePath('/dashboard/nhan-vien')
  revalidatePath('/dashboard/nhan-vien/xac-nhan-lay-hang')
  revalidatePath('/dashboard/nhan-vien/bao-gia')
  revalidatePath('/dashboard/nhan-vien/van-don')
  revalidatePath('/dashboard/khach-hang')
  revalidatePath('/dashboard/khach-hang/don-hang')
  revalidatePath('/dashboard/khach-hang/theo-doi')
}

export async function updateOrderStatusAction(formData: FormData) {
  const session = await requireEmployeeSession()

  const orderId = parseRequiredText(formData.get('orderId'))
  const status = parseRequiredText(formData.get('status'))
  const location = parseRequiredText(formData.get('location')) ?? 'Dang cap nhat'
  const executionMode = parseExecutionMode(formData.get('executionMode'))
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
      status: true,
    },
  })

  if (!order) {
    return
  }

  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[order.status] ?? []
  const isSameStatus = order.status === status
  if (!isSameStatus && !allowedNextStatuses.includes(status)) {
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

  await safeCreateActionLog({
    actor: { connect: { id: session.user.id } },
    mode: executionMode,
    actionType: 'EMPLOYEE_UPDATE_ORDER_STATUS',
    entityType: 'order',
    entityId: order.id,
    metadata: {
      orderCode: order.orderCode,
      previousStatus: order.status,
      nextStatus: status,
      location,
    },
  })

  revalidatePath('/dashboard/nhan-vien')
  revalidatePath('/dashboard/nhan-vien/van-don')
  revalidatePath('/dashboard/khach-hang')
  revalidatePath('/dashboard/khach-hang/don-hang')
  revalidatePath('/dashboard/khach-hang/theo-doi')
}
