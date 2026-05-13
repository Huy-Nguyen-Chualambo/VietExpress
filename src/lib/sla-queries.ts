/**
 * SLA Monitoring - Supabase Queries
 * Các truy vấn để lấy orders at-risk và tính toán SLA metrics
 */

import { prisma } from './prisma'

/**
 * Định nghĩa SLA rules theo route band và service type
 * Format: { routeBand: { serviceType: { standardHours, maxHours } } }
 */
export const SLA_CONFIG = {
  noi_tinh: {
    standard: { standardHours: 8, maxHours: 12 }, // Nội tỉnh: 8-12 giờ
    ftl: { standardHours: 12, maxHours: 24 },
  },
  noi_vung: {
    standard: { standardHours: 24, maxHours: 36 }, // Nội vùng: 24-36 giờ
    ftl: { standardHours: 24, maxHours: 48 },
  },
  lien_vung: {
    standard: { standardHours: 36, maxHours: 48 }, // Liên vùng: 36-48 giờ
    ftl: { standardHours: 48, maxHours: 72 },
  },
  lien_tinh: {
    standard: { standardHours: 48, maxHours: 72 }, // Liên tỉnh: 48-72 giờ
    ftl: { standardHours: 72, maxHours: 96 },
  },
}

export type RouteBand = keyof typeof SLA_CONFIG
export type ServiceType = 'standard' | 'ftl'

/**
 * Phân loại route dựa trên origin/destination
 */
export function classifyRouteBand(origin: string, destination: string): RouteBand {
  // Mocked logic - cần thay đổi theo logic thực tế của bạn
  // Ví dụ: dùng API tính khoảng cách, hoặc dùng bảng lookup

  const key = `${origin}_${destination}`.toLowerCase()

  // Giả sử có logic tính toán từ Google Maps Distance Matrix hoặc DB
  if (
    key.includes('ha noi') ||
    key.includes('sai gon') ||
    key.includes('ho chi minh')
  ) {
    return 'noi_tinh'
  }

  if (key.includes('dong') || key.includes('tay')) {
    return 'noi_vung'
  }

  if (key.includes('mien')) {
    return 'lien_vung'
  }

  return 'lien_tinh' // default
}

/**
 * Interface cho SLA Metrics
 */
export interface SlaMetrics {
  routeBand: RouteBand
  standardHours: number
  maxHours: number
  estimatedDelivery: Date // ETA từ order
  deadline: Date // Thời điểm must deliver
  timeToDeadlineMinutes: number // Tính từ now
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  isAtRisk: boolean
  isBreached: boolean
  hasRecentIntervention: boolean
  lastInterventionAt: Date | null
}

/**
 * Tính SLA deadline dựa trên ETA + max hours buffer
 */
export function calculateSlaDeadline(
  estimatedDelivery: Date,
  maxHours: number,
  bufferHours: number = 24,
): Date {
  const deadline = new Date(estimatedDelivery)
  deadline.setHours(deadline.getHours() + maxHours + bufferHours)
  return deadline
}

/**
 * Tính risk level dựa trên time remaining
 */
export function calculateRiskLevel(
  timeToDeadlineMinutes: number,
  isBreached: boolean,
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (isBreached) return 'CRITICAL'
  if (timeToDeadlineMinutes < 30) return 'CRITICAL'
  if (timeToDeadlineMinutes < 120) return 'HIGH'
  if (timeToDeadlineMinutes < 240) return 'MEDIUM'
  return 'LOW'
}

/**
 * Lấy danh sách at-risk orders
 * - Filter: status in (picked_up, in_transit, delivering)
 * - Filter: estimatedDelivery tồn tại
 * - Join: SlaAlerts gần nhất để kiểm tra can thiệp gần đây
 * - Sort: timeToDeadline tăng dần (ưu tiên urgent)
 * - Limit: 50 orders
 */
export async function fetchAtRiskOrders(
  bufferMinutes: number = 120,
): Promise<Array<any>> {
  try {
    const now = new Date()

    // Bước 1: Lấy tất cả orders active
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['picked_up', 'in_transit', 'delivering'],
        },
        estimatedDelivery: {
          not: null, // Chỉ lấy orders có ETA
        },
      },
      include: {
        trackingEvents: {
          orderBy: { eventTime: 'desc' },
          take: 1, // Lấy event mới nhất
        },
        slaAlerts: {
          where: { status: 'open' }, // Chỉ alert chưa resolve
          orderBy: { detectedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { estimatedDelivery: 'asc' },
    })

    // Bước 2: Tính SLA metrics cho mỗi order
    const atRiskOrders = orders
      .map((order) => {
            const routeBand = classifyRouteBand(order.origin, order.destination)
            const serviceType = (order.serviceType as ServiceType) || 'standard'
            const slaConfig =
              SLA_CONFIG[routeBand][serviceType] ?? SLA_CONFIG[routeBand].standard ?? {
                standardHours: 48,
                maxHours: 72,
              }

        const deadline = calculateSlaDeadline(
          order.estimatedDelivery!,
          slaConfig.maxHours,
        )

        const timeToDeadlineMinutes =
          (deadline.getTime() - now.getTime()) / (60 * 1000)

        const isBreached = now > deadline
        const isAtRisk = timeToDeadlineMinutes <= bufferMinutes

        const riskLevel = calculateRiskLevel(timeToDeadlineMinutes, isBreached)

        // Kiểm tra can thiệp gần đây (trong 30 phút)
        const lastAlert = order.slaAlerts[0]
        const hasRecentIntervention = lastAlert
          ? (now.getTime() - lastAlert.detectedAt.getTime()) / (60 * 1000) < 30
          : false

        return {
          id: order.id,
          orderCode: order.orderCode,
          userId: order.userId,
          origin: order.origin,
          destination: order.destination,
          serviceType: order.serviceType,
          status: order.status,
          currentLocation: order.currentLocation,
          weightKg: order.weightKg,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          slaMetrics: {
            routeBand,
            standardHours: slaConfig.standardHours,
            maxHours: slaConfig.maxHours,
            estimatedDelivery: order.estimatedDelivery!,
            deadline,
            timeToDeadlineMinutes,
            riskLevel,
            isAtRisk,
            isBreached,
            hasRecentIntervention,
            lastInterventionAt: lastAlert?.detectedAt || null,
          } as SlaMetrics,
          lastTracking: order.trackingEvents[0] || null,
          lastAlert: lastAlert || null,
        }
      })
      .filter(
        (o) =>
          o.slaMetrics.isAtRisk ||
          o.slaMetrics.isBreached ||
          o.slaMetrics.riskLevel === 'CRITICAL',
      )
      .sort(
        (a, b) =>
          a.slaMetrics.timeToDeadlineMinutes - b.slaMetrics.timeToDeadlineMinutes,
      )
      .slice(0, 50) // Limit 50

    return atRiskOrders
  } catch (error) {
    console.error('[SLA fetchAtRiskOrders Error]', error)
    throw error
  }
}

/**
 * Kiểm tra xem order đã có can thiệp gần đây không (trong N phút)
 */
export async function checkRecentIntervention(
  orderId: string,
  minutesThreshold: number = 30,
): Promise<boolean> {
  try {
    const now = new Date()
    const thresholdTime = new Date(now.getTime() - minutesThreshold * 60 * 1000)

    const recentAlert = await prisma.slaAlert.findFirst({
      where: {
        orderId,
        status: 'open',
        detectedAt: {
          gte: thresholdTime,
        },
      },
      orderBy: { detectedAt: 'desc' },
    })

    return !!recentAlert
  } catch (error) {
    console.error('[SLA checkRecentIntervention Error]', error)
    return false
  }
}

/**
 * Ghi nhận một SLA alert
 */
export async function logSlaAlert(
  orderId: string,
  type: 'alert' | 'warning' | 'info',
  severity: 'high' | 'medium' | 'low',
  message: string,
  metadata: Record<string, any>,
): Promise<any> {
  try {
    const alert = await prisma.slaAlert.create({
      data: {
        orderId,
        type,
        status: 'open',
        severity,
        message,
        metadata,
        detectedAt: new Date(),
      },
    })

    return alert
  } catch (error) {
    console.error('[SLA logSlaAlert Error]', error)
    throw error
  }
}

/**
 * Ghi nhận action log (audit trail)
 */
export async function logAction(
  actionType: string,
  orderId: string,
  metadata: Record<string, any>,
  actorId?: string,
): Promise<any> {
  try {
    const log = await prisma.actionLog.create({
      data: {
        actionType,
        entityType: 'Order',
        entityId: orderId,
        metadata,
        actorId,
        mode: 'automated', // Tự động từ system
      },
    })

    return log
  } catch (error) {
    console.error('[SLA logAction Error]', error)
    throw error
  }
}

/**
 * Phân nhóm orders theo risk level
 */
export type AtRiskOrder = Awaited<ReturnType<typeof fetchAtRiskOrders>>[number]

export interface GroupedAtRiskOrders {
  CRITICAL: AtRiskOrder[]
  HIGH: AtRiskOrder[]
  MEDIUM: AtRiskOrder[]
}

export function groupOrdersByRiskLevel(
  orders: Awaited<ReturnType<typeof fetchAtRiskOrders>>,
): GroupedAtRiskOrders {
  return {
    CRITICAL: orders.filter((o) => o.slaMetrics.riskLevel === 'CRITICAL'),
    HIGH: orders.filter((o) => o.slaMetrics.riskLevel === 'HIGH'),
    MEDIUM: orders.filter((o) => o.slaMetrics.riskLevel === 'MEDIUM'),
  }
}
