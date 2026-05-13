/**
 * SLA Intervention Logic
 * Xác định chiến lược can thiệp tối ưu cho từng order
 */

import type { SlaMetrics, GroupedAtRiskOrders } from './sla-queries'

export type InterventionType =
  | 'REROUTE'
  | 'EXPEDITE'
  | 'PROACTIVE_CONTACT'
  | 'UNRECOVERABLE'
  | 'MONITOR'
  | 'NONE'

export interface InterventionStrategy {
  type: InterventionType
  priority: 'IMMEDIATE' | 'URGENT' | 'NORMAL' | 'LOW'
  estimatedCost: number // VND
  estimatedSuccessProbability: number // 0-1
  rationale: string
  actions: string[] // Chi tiết hành động cần thực hiện
}

/**
 * Quy tắc can thiệp dựa trên risk level và thời gian còn lại
 */
export function determineInterventionStrategy(
  order: any, // Order từ fetchAtRiskOrders
): InterventionStrategy {
  const metrics = order.slaMetrics as SlaMetrics
  const { riskLevel, timeToDeadlineMinutes, isBreached } = metrics

  // Skip nếu có can thiệp gần đây
  if (metrics.hasRecentIntervention) {
    return {
      type: 'MONITOR',
      priority: 'LOW',
      estimatedCost: 0,
      estimatedSuccessProbability: 0,
      rationale: 'Đã can thiệp gần đây, đợi kết quả',
      actions: ['Watch closely', 'Check tracking updates'],
    }
  }

  // CRITICAL: < 30 phút hoặc đã quá deadline
  if (riskLevel === 'CRITICAL') {
    if (isBreached) {
      return {
        type: 'UNRECOVERABLE',
        priority: 'IMMEDIATE',
        estimatedCost: 500000, // Bù
        estimatedSuccessProbability: 0,
        rationale: 'Đã quá deadline, không thể cứu',
        actions: [
          'Mark order as unrecoverable',
          'Calculate compensation: 500k VND',
          'Notify customer immediately',
          'Create support ticket',
          'Email to operations',
        ],
      }
    }

    if (timeToDeadlineMinutes < 15) {
      return {
        type: 'UNRECOVERABLE',
        priority: 'IMMEDIATE',
        estimatedCost: 300000,
        estimatedSuccessProbability: 0.1,
        rationale: 'Quá ít thời gian để can thiệp, khó cứu',
        actions: [
          'Attempt expedited delivery',
          'Contact driver: request max speed',
          'Notify customer: prepare for late delivery',
          'Prepare compensation/credit',
        ],
      }
    }

    // 15-30 phút: Thử reroute hoặc expedite
    return {
      type: 'REROUTE',
      priority: 'IMMEDIATE',
      estimatedCost: 200000,
      estimatedSuccessProbability: 0.4,
      rationale: `Còn ${timeToDeadlineMinutes.toFixed(0)} phút, thử đổi tuyến gấp`,
      actions: [
        'Find nearest pickup/drop-off hub',
        'Contact driver for reroute possibility',
        'Update customer with new ETA',
        'If impossible: switch to EXPEDITE',
      ],
    }
  }

  // HIGH: 30-120 phút
  if (riskLevel === 'HIGH') {
    const canReroute = timeToDeadlineMinutes > 60
    const canContact = timeToDeadlineMinutes > 30

    if (canReroute) {
      return {
        type: 'REROUTE',
        priority: 'URGENT',
        estimatedCost: 150000,
        estimatedSuccessProbability: 0.65,
        rationale: `Còn ${timeToDeadlineMinutes.toFixed(0)} phút, thử reroute ngay`,
        actions: [
          'Calculate alternative routes',
          'Check driver availability',
          'Propose new route to driver',
          'Update tracking system',
          'Notify customer of changes',
        ],
      }
    }

    if (canContact) {
      return {
        type: 'PROACTIVE_CONTACT',
        priority: 'URGENT',
        estimatedCost: 30000,
        estimatedSuccessProbability: 0.6,
        rationale: `Còn ${timeToDeadlineMinutes.toFixed(0)} phút, liên hệ khách hàng`,
        actions: [
          'Call customer: explain situation',
          'Ask for flexibility on delivery time/location',
          'Offer reschedule if applicable',
          'Send SMS confirmation',
        ],
      }
    }

    // Fallback: EXPEDITE
    return {
      type: 'EXPEDITE',
      priority: 'URGENT',
      estimatedCost: 50000,
      estimatedSuccessProbability: 0.5,
      rationale: `Còn ${timeToDeadlineMinutes.toFixed(0)} phút, thúc giục driver`,
      actions: [
        'Send urgent message to driver',
        'Request max speed delivery',
        'Monitor in real-time',
        'Alert backup driver if needed',
      ],
    }
  }

  // MEDIUM: 120-240 phút
  if (riskLevel === 'MEDIUM') {
    return {
      type: 'PROACTIVE_CONTACT',
      priority: 'NORMAL',
      estimatedCost: 20000,
      estimatedSuccessProbability: 0.7,
      rationale: `Còn ${timeToDeadlineMinutes.toFixed(0)} phút, tiên phong liên hệ`,
      actions: [
        'Send SMS to customer: expected delay warning',
        'Offer time window change',
        'Monitor driver progress',
        'Prepare contingency plan',
      ],
    }
  }

  // LOW: > 240 phút - không can thiệp
  return {
    type: 'MONITOR',
    priority: 'LOW',
    estimatedCost: 0,
    estimatedSuccessProbability: 0,
    rationale: 'Còn đủ thời gian, tiếp tục giám sát',
    actions: ['Continue monitoring', 'No action needed'],
  }
}

/**
 * Tính chi phí bù đắp dựa trên service type và độ trễ
 */
export function calculateCompensation(
  totalAmount: number,
  riskLevel: string,
  delayHours: number,
): number {
  // Bù từ 10% - 50% giá trị đơn hàng
  const baseCompensation = totalAmount * 0.1

  if (riskLevel === 'CRITICAL') {
    return Math.min(baseCompensation * 5, totalAmount * 0.5) // Max 50%
  }

  if (riskLevel === 'HIGH') {
    return baseCompensation * 3
  }

  if (riskLevel === 'MEDIUM') {
    return baseCompensation * 2
  }

  return baseCompensation
}

/**
 * Tổng hợp intervention plan cho nhóm orders
 */
export interface InterventionPlan {
  totalOrders: number
  criticalOrders: Array<{ orderCode: string; strategy: InterventionStrategy }>
  highRiskOrders: Array<{ orderCode: string; strategy: InterventionStrategy }>
  estimatedTotalCost: number
  estimatedSuccessRate: number
}

export function createInterventionPlan(
  groupedOrders: GroupedAtRiskOrders,
): InterventionPlan {
  const criticalWithStrategy = (groupedOrders.CRITICAL || []).map((order) => ({
    orderCode: order.orderCode,
    strategy: determineInterventionStrategy(order),
  }))

  const highRiskWithStrategy = (groupedOrders.HIGH || []).map((order) => ({
    orderCode: order.orderCode,
    strategy: determineInterventionStrategy(order),
  }))

  const allStrategies = [
    ...criticalWithStrategy,
    ...highRiskWithStrategy,
  ].map((x) => x.strategy)

  const totalCost = allStrategies.reduce((sum, s) => sum + s.estimatedCost, 0)
  const avgSuccessRate =
    allStrategies.reduce((sum, s) => sum + s.estimatedSuccessProbability, 0) /
    (allStrategies.length || 1)

  return {
    totalOrders: (groupedOrders.CRITICAL || []).length + (groupedOrders.HIGH || []).length,
    criticalOrders: criticalWithStrategy,
    highRiskOrders: highRiskWithStrategy,
    estimatedTotalCost: Math.round(totalCost),
    estimatedSuccessRate: Math.round(avgSuccessRate * 100),
  }
}
