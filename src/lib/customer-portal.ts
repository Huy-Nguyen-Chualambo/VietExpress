import { prisma } from '@/lib/prisma'

export function formatCurrencyVnd(amount: number | null | undefined) {
  if (amount == null) return 'Chưa có'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return 'Chưa cập nhật'
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) return 'Chưa cập nhật'
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function orderStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Chờ xử lý'
    case 'picked_up':
      return 'Đã lấy hàng'
    case 'in_transit':
      return 'Đang vận chuyển'
    case 'delivering':
      return 'Đang giao'
    case 'completed':
      return 'Hoàn thành'
    case 'cancelled':
      return 'Đã hủy'
    default:
      return status
  }
}

export function orderStatusClass(status: string) {
  switch (status) {
    case 'completed':
      return 'text-green-700 bg-green-50 border-green-200'
    case 'in_transit':
    case 'delivering':
      return 'text-blue-700 bg-blue-50 border-blue-200'
    case 'picked_up':
      return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'cancelled':
      return 'text-red-700 bg-red-50 border-red-200'
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200'
  }
}

export function quoteStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Chờ báo giá'
    case 'quoted':
      return 'Đã báo giá'
    case 'accepted':
      return 'Đã chấp nhận'
    case 'rejected':
      return 'Từ chối'
    default:
      return status
  }
}

export function quoteStatusClass(status: string) {
  switch (status) {
    case 'quoted':
      return 'text-blue-700 bg-blue-50 border-blue-200'
    case 'accepted':
      return 'text-green-700 bg-green-50 border-green-200'
    case 'rejected':
      return 'text-red-700 bg-red-50 border-red-200'
    default:
      return 'text-amber-700 bg-amber-50 border-amber-200'
  }
}

export function notificationTypeClass(type: string) {
  switch (type) {
    case 'success':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'error':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200'
  }
}

export function notificationTypeLabel(type: string) {
  switch (type) {
    case 'success':
      return 'Thành công'
    case 'warning':
      return 'Cảnh báo'
    case 'error':
      return 'Lỗi'
    default:
      return 'Thông tin'
  }
}

export async function getCustomerOverview(userId: string) {
  const [profile, orders, quoteRequests, notifications, settings] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: userId },
      include: { user: true },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        trackingEvents: {
          orderBy: { eventTime: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.quoteRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.customerSetting.findUnique({ where: { userId } }),
  ])

  const [totalOrders, activeOrders, completedOrders, pendingQuotes, unreadNotifications] =
    await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.count({
        where: { userId, status: { in: ['pending', 'picked_up', 'in_transit', 'delivering'] } },
      }),
      prisma.order.count({ where: { userId, status: 'completed' } }),
      prisma.quoteRequest.count({ where: { userId, status: 'pending' } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ])

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0)

  const latestTracking = orders[0]?.trackingEvents[0] ?? null

  return {
    profile,
    settings,
    orders,
    quoteRequests,
    notifications,
    stats: {
      totalOrders,
      activeOrders,
      completedOrders,
      pendingQuotes,
      unreadNotifications,
      totalRevenue,
    },
    latestTracking,
  }
}

export async function getCustomerOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      trackingEvents: {
        orderBy: { eventTime: 'desc' },
        take: 3,
      },
    },
  })

  return { orders }
}

export async function getCustomerQuotes(userId: string) {
  const quoteRequests = await prisma.quoteRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return { quoteRequests }
}

export async function getCustomerTracking(userId: string, orderCode?: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      trackingEvents: {
        orderBy: { eventTime: 'desc' },
      },
    },
  })

  const selectedOrder =
    orders.find((order) => order.orderCode === orderCode) ?? orders[0] ?? null

  return {
    orders,
    selectedOrder,
  }
}

export async function getCustomerNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return { notifications }
}

export async function getCustomerSettings(userId: string) {
  const [profile, settings] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: userId },
      include: { user: true },
    }),
    prisma.customerSetting.findUnique({ where: { userId } }),
  ])

  return { profile, settings }
}
