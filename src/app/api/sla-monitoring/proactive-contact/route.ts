import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sla-monitoring/proactive-contact
 * Execute proactive customer contact intervention
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, strategy, message } = await req.json()

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Create notification for customer
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'warning',
        title: 'Shipment Status Update',
        message,
      },
    })

    // Log intervention
    await prisma.actionLog.create({
      data: {
        actionType: 'SLA_INTERVENTION_PROACTIVE_CONTACT',
        entityType: 'Order',
        entityId: orderId,
        metadata: {
          strategy,
          message,
          customerNotified: true,
          timestamp: new Date().toISOString(),
        },
      },
    })

    // Create SLA alert
    await prisma.slaAlert.create({
      data: {
        orderId,
        type: 'warning',
        status: 'open',
        severity: 'medium',
        message: `Proactive contact made: ${message}`,
        metadata: {
          intervention: 'PROACTIVE_CONTACT',
          strategy,
          customerNotified: true,
        } as any,
        detectedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Proactive contact executed',
      orderId,
      customerNotified: true,
    })
  } catch (error) {
    console.error('[SLA Proactive Contact POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    )
  }
}
