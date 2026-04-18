import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ACTIVE_ORDER_STATUSES = ['pending', 'picked_up', 'in_transit', 'delivering']

function getStartOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function getStartOfWeek() {
  const date = new Date()
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function getStartOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export async function requireEmployeeSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  if (session.user.role !== 'employee') {
    redirect('/dashboard/khach-hang')
  }

  return session
}

export async function getEmployeeOverview() {
  const [
    totalOrders,
    ordersToday,
    activeOrders,
    completedOrders,
    pendingQuotes,
    unreadNotifications,
    newCustomersThisWeek,
    monthlyRevenue,
    recentOrders,
    pendingQuoteRequests,
    recentNotifications,
    slaBreaches,
    topRoutes,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: getStartOfToday() } } }),
    prisma.order.count({ where: { status: { in: ACTIVE_ORDER_STATUSES } } }),
    prisma.order.count({ where: { status: 'completed' } }),
    prisma.quoteRequest.count({ where: { status: 'pending' } }),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.profile.count({
      where: {
        role: 'customer',
        createdAt: { gte: getStartOfWeek() },
      },
    }),
    prisma.order.aggregate({
      where: {
        status: 'completed',
        createdAt: { gte: getStartOfMonth() },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: {
          include: { profile: true },
        },
        trackingEvents: {
          orderBy: { eventTime: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.quoteRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 6,
      include: {
        user: {
          include: { profile: true },
        },
      },
    }),
    prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        user: {
          include: { profile: true },
        },
      },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ACTIVE_ORDER_STATUSES },
        estimatedDelivery: { lt: new Date() },
      },
      orderBy: { estimatedDelivery: 'asc' },
      take: 5,
      include: {
        user: {
          include: { profile: true },
        },
      },
    }),
    prisma.order.groupBy({
      by: ['origin', 'destination'],
      where: { status: 'completed' },
      _count: { _all: true },
      _sum: { totalAmount: true },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    }),
  ])

  return {
    stats: {
      totalOrders,
      ordersToday,
      activeOrders,
      completedOrders,
      pendingQuotes,
      unreadNotifications,
      newCustomersThisWeek,
      monthlyRevenue: monthlyRevenue._sum.totalAmount ?? 0,
    },
    recentOrders,
    pendingQuoteRequests,
    recentNotifications,
    slaBreaches,
    topRoutes,
  }
}
