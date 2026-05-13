import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sla-monitoring/schedule-callback
 * Schedule a callback to check intervention status
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, callbackIn = 60, intervention } = await req.json()

    const callbackTime = new Date(Date.now() + callbackIn * 60 * 1000)

    const log = await prisma.actionLog.create({
      data: {
        actionType: 'SLA_CALLBACK_SCHEDULED',
        entityType: 'Order',
        entityId: orderId,
        metadata: {
          intervention,
          callbackInMinutes: callbackIn,
          scheduledFor: callbackTime.toISOString(),
          createdAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Callback scheduled for ${callbackTime.toLocaleString('vi-VN')}`,
      orderId,
      callbackScheduledAt: callbackTime,
      logId: log.id,
    })
  } catch (error) {
    console.error('[SLA Schedule Callback POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    )
  }
}
