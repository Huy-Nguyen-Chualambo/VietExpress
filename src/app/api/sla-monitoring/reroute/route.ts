import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sla-monitoring/reroute
 * Execute reroute intervention
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, reason, aiConfidence } = await req.json()


    // Create intervention log
    await prisma.actionLog.create({
      data: {
        actionType: 'SLA_INTERVENTION_REROUTE',
        entityType: 'Order',
        entityId: orderId,
        metadata: {
          reason,
          aiConfidence,
          timestamp: new Date().toISOString(),
        },
      },
    })

    // Create SLA alert for tracking
    await prisma.slaAlert.create({
      data: {
        orderId,
        type: 'alert',
        status: 'open',
        severity: 'high',
        message: `Reroute initiated: ${reason}`,
        metadata: {
          intervention: 'REROUTE',
          aiConfidence,
          reason,
        } as any,
        detectedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Reroute intervention executed',
      orderId,
      intervention: 'REROUTE',
      aiConfidence,
    })
  } catch (error) {
    console.error('[SLA Reroute POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    )
  }
}
