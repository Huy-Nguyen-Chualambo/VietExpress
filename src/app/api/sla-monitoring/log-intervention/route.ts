import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sla-monitoring/log-intervention
 * Log SLA intervention for audit trail
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, intervention, aiConfidence, metadata } = await req.json()

    const log = await prisma.actionLog.create({
      data: {
        actorId: session.user.id,
        actionType: `SLA_INTERVENTION_${intervention}`,
        entityType: 'Order',
        entityId: orderId,
        metadata: {
          intervention,
          aiConfidence,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Intervention logged',
      logId: log.id,
      status: 'logged',
    })
  } catch (error) {
    console.error('[SLA Log Intervention POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    )
  }
}
