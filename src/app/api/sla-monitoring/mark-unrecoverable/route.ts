import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sla-monitoring/mark-unrecoverable
 * Mark order as unrecoverable and prepare compensation
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, compensation, reason } = await req.json()

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Create compensation ticket
    const ticket = await prisma.actionLog.create({
      data: {
        actionType: 'SLA_COMPENSATION_TICKET',
        entityType: 'Order',
        entityId: orderId,
        metadata: {
          compensation,
          reason,
          status: 'pending_approval',
          createdAt: new Date().toISOString(),
        },
      },
    })

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'warning',
        title: 'Order Delay - Compensation Pending',
        message: `We regret that your shipment may not meet our delivery commitment. Compensation of ${compensation} VND is being processed.`,
      },
    })

    // Create SLA alert
    await prisma.slaAlert.create({
      data: {
        orderId,
        type: 'alert',
        status: 'open',
        severity: 'high',
        message: `Unrecoverable SLA violation - Compensation ${compensation} VND`,
        metadata: {
          intervention: 'UNRECOVERABLE',
          compensation,
          reason,
          ticketId: ticket.id,
        } as any,
        detectedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Order marked as unrecoverable',
      orderId,
      compensation,
      ticketId: ticket.id,
    })
  } catch (error) {
    console.error('[SLA Mark Unrecoverable POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    )
  }
}
