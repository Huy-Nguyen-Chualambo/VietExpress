import { NextRequest, NextResponse } from 'next/server'
import {
  fetchAtRiskOrders,
  groupOrdersByRiskLevel,
  logSlaAlert,
  logAction,
} from '@/lib/sla-queries'
import {
  determineInterventionStrategy,
  createInterventionPlan,
} from '@/lib/sla-intervention'

/**
 * POST /api/sla-monitoring/workflow
 *
 * Main SLA Monitoring Workflow
 * Chạy mỗi 60 phút:
 * 1. Lấy at-risk orders
 * 2. Phân loại theo risk level
 * 3. Xác định chiến lược can thiệp
 * 4. Tạo intervention plan
 * 5. Trả về recommendation cho manual confirmation hoặc auto-execute
 *
 * Query params:
 * - bufferMinutes: Bao nhiêu phút trước deadline mới xem là at-risk (default 120)
 * - autoExecute: true|false - có tự động thực hiện can thiệp không (default false)
 */
export async function POST(req: NextRequest) {
  try {
    const { bufferMinutes = 120, autoExecute = false } = await req.json()

    // Bước 1: Lấy all at-risk orders
    const atRiskOrders = await fetchAtRiskOrders(bufferMinutes)

    if (atRiskOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No at-risk orders detected',
        timestamp: new Date().toISOString(),
        data: {
          totalOrders: 0,
          grouped: {
            CRITICAL: [],
            HIGH: [],
            MEDIUM: [],
          },
          interventions: [],
        },
      })
    }

    // Bước 2: Phân nhóm theo risk level
    const grouped = groupOrdersByRiskLevel(atRiskOrders)

    // Bước 3: Xác định chiến lược cho từng order
    const interventions = atRiskOrders
      .map((order) => ({
        orderId: order.id,
        orderCode: order.orderCode,
        riskLevel: order.slaMetrics.riskLevel,
        timeToDeadlineMinutes: order.slaMetrics.timeToDeadlineMinutes,
        hasRecentIntervention: order.slaMetrics.hasRecentIntervention,
        strategy: determineInterventionStrategy(order),
      }))
      .filter((x) => x.strategy.type !== 'MONITOR')

    // Bước 4: Tạo intervention plan
    const plan = createInterventionPlan(grouped)

    // Bước 5: Log workflow execution
    await logAction(
      'SLA_WORKFLOW_EXECUTED',
      'system',
      {
        totalOrders: atRiskOrders.length,
        interventionCount: interventions.length,
        estimatedCost: plan.estimatedTotalCost,
        autoExecute,
      },
    )

    // Nếu autoExecute = true, thực hiện can thiệp tự động (sau)
    // Hiện tại chỉ return recommendation
    if (autoExecute && interventions.length > 0) {
      // TODO: Implement auto-execution logic
      // Điều này sẽ gọi các API reroute, contact, etc.
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        summary: {
          totalAtRiskOrders: atRiskOrders.length,
          criticalCount: grouped.CRITICAL.length,
          highCount: grouped.HIGH.length,
          mediumCount: grouped.MEDIUM.length,
          interventionCount: interventions.length,
          estimatedTotalCost: plan.estimatedTotalCost,
          estimatedSuccessRate: plan.estimatedSuccessRate,
        },
        grouped: {
          CRITICAL: grouped.CRITICAL.map((o) => ({
            id: o.id,
            orderCode: o.orderCode,
            origin: o.origin,
            destination: o.destination,
            timeToDeadline: o.slaMetrics.timeToDeadlineMinutes,
          })),
          HIGH: grouped.HIGH.map((o) => ({
            id: o.id,
            orderCode: o.orderCode,
            origin: o.origin,
            destination: o.destination,
            timeToDeadline: o.slaMetrics.timeToDeadlineMinutes,
          })),
          MEDIUM: grouped.MEDIUM.map((o) => ({
            id: o.id,
            orderCode: o.orderCode,
            origin: o.origin,
            destination: o.destination,
            timeToDeadline: o.slaMetrics.timeToDeadlineMinutes,
          })),
        },
        interventions: interventions.map((x) => ({
          orderId: x.orderId,
          orderCode: x.orderCode,
          riskLevel: x.riskLevel,
          timeToDeadlineMinutes: x.timeToDeadlineMinutes.toFixed(1),
          strategy: {
            type: x.strategy.type,
            priority: x.strategy.priority,
            cost: x.strategy.estimatedCost,
            successProbability: x.strategy.estimatedSuccessProbability,
            rationale: x.strategy.rationale,
            actions: x.strategy.actions,
          },
        })),
        plan: {
          totalOrders: plan.totalOrders,
          estimatedCost: plan.estimatedTotalCost,
          successRate: plan.estimatedSuccessRate,
        },
      },
      recommendations: {
        autoExecute,
        nextCheckIn: 60, // phút
        requiresApproval: interventions.some(
          (x) =>
            x.strategy.priority === 'IMMEDIATE' ||
            x.strategy.priority === 'URGENT',
        ),
      },
    })
  } catch (error) {
    console.error('[SLA Workflow Error]', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/sla-monitoring/workflow
 * Trigger workflow with default params
 */
export async function GET(req: NextRequest) {
  return POST(
    new NextRequest(req, {
      method: 'POST',
      body: JSON.stringify({ bufferMinutes: 120, autoExecute: false }),
    }),
  )
}
