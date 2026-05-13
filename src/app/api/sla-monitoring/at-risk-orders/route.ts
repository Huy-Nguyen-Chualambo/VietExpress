import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSlaDeadline } from '@/lib/sla'

/**
 * GET /api/sla-monitoring/at-risk-orders
 * Fetch all orders at risk of SLA violation
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const bufferMinutes = 120 // Start monitoring 2 hours before deadline

    // Get all active orders
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['picked_up', 'in_transit', 'delivering'] },
      },
      include: {
        trackingEvents: {
          orderBy: { eventTime: 'desc' },
          take: 1,
        },
        slaAlerts: {
          orderBy: { detectedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { estimatedDelivery: 'asc' },
    })

    const atRiskOrders = orders
      .map((order) => {
        const slaPlan = getSlaDeadline(
          order.serviceType,
          order.origin,
          order.destination,
          order.createdAt,
          order.estimatedDelivery || undefined,
        )

        const timeToDeadline = (slaPlan.deadline.getTime() - now.getTime()) / (60 * 1000) // minutes
        const isAtRisk = timeToDeadline <= bufferMinutes
        const isBreached = now > slaPlan.deadline

        return {
          ...order,
          slaMetrics: {
            estimatedDelivery: slaPlan.standardDelivery,
            deadline: slaPlan.deadline,
            routeBand: slaPlan.routeBand,
            timeToDeadline,
            isAtRisk,
            isBreached,
          },
        }
      })
      .filter((o) => o.slaMetrics.isAtRisk || o.slaMetrics.isBreached)
      .sort((a, b) => a.slaMetrics.timeToDeadline - b.slaMetrics.timeToDeadline)
      .slice(0, 50) // Limit to 50 for performance

    return NextResponse.json({
      success: true,
      count: atRiskOrders.length,
      orders: atRiskOrders,
      operationEmail: process.env.OPERATION_EMAIL || 'ops@vietexpress.vn',
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[SLA At-Risk Orders GET]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    )
  }
}
