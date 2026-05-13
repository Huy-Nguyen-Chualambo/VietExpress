import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sla-monitoring/check-intervention
 * Check if recent intervention exists (last N minutes)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const apiKey = process.env.SLA_MONITORING_API_KEY
    const authorization = req.headers.get('authorization')?.trim()

    if (!session?.user && authorization !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, minutesThreshold = 30 } = await req.json()

    const thresholdTime = new Date(Date.now() - minutesThreshold * 60 * 1000)

    // Check for recent intervention
    const recentIntervention = await prisma.slaAlert.findFirst({
      where: {
        orderId,
        createdAt: { gte: thresholdTime },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      orderId,
      hasRecentIntervention: !!recentIntervention,
      minutesThreshold,
      recentIntervention: recentIntervention
        ? {
            id: recentIntervention.id,
            type: recentIntervention.type,
            status: recentIntervention.status,
            severity: recentIntervention.severity,
            message: recentIntervention.message,
            detectedAt: recentIntervention.detectedAt,
          }
        : null,
    })
  } catch (error) {
    console.error('[SLA Check Intervention POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    )
  }
}
