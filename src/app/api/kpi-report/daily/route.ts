import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSlaDeadline } from '@/lib/sla'
import dailyReportFixture from './daily-report-fixture.json'

const WINDOW_HOURS = 24
const HOUR_MS = 60 * 60 * 1000
const MANUAL_ACTION_COST_VND = 12000
const AUTOMATION_ACTION_COST_VND = 2500

const ACTIVE_ORDER_STATUSES = new Set(['pending', 'picked_up', 'in_transit', 'delivering'])
const KNOWN_SERVICE_TYPES = new Set(['ltl', 'express', 'ftl', 'cold', '3pl', 'doc'])

type OrderRow = {
  id: string
  orderCode: string
  serviceType: string
  status: string
  origin: string
  destination: string
  createdAt: Date
  updatedAt: Date
  estimatedDelivery: Date | null
  totalAmount: number | null
}

type HourlyBucket = {
  hour: string
  ordersReceived: number
  ordersDelivered: number
  ordersFailed: number
  revenueVnd: number
  notifications: number
  alerts: number
  actions: number
  manualActions: number
  automationActions: number
}

type HourlyBucketMetric = Exclude<keyof HourlyBucket, 'hour'>

function getWindowStart(windowHours: number) {
  return new Date(Date.now() - windowHours * HOUR_MS)
}

function minutesBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (60 * 1000)
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function average(values: number[]) {
  if (values.length === 0) return null
  return sum(values) / values.length
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function uniqueBy<T>(items: T[], keyFn: (item: T) => string) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function createHourlyBuckets(windowStart: Date, windowHours: number): HourlyBucket[] {
  return Array.from({ length: windowHours }, (_, index) => ({
    hour: new Date(windowStart.getTime() + index * HOUR_MS).toISOString(),
    ordersReceived: 0,
    ordersDelivered: 0,
    ordersFailed: 0,
    revenueVnd: 0,
    notifications: 0,
    alerts: 0,
    actions: 0,
    manualActions: 0,
    automationActions: 0,
  }))
}

function bucketIndex(windowStart: Date, date: Date, windowHours: number) {
  const index = Math.floor((date.getTime() - windowStart.getTime()) / HOUR_MS)
  return clamp(index, 0, windowHours - 1)
}

function isInterventionAction(actionType: string) {
  return actionType.startsWith('SLA_INTERVENTION_') || actionType === 'SLA_COMPENSATION_TICKET'
}

function getInterventionCost(actionType: string, metadata: unknown) {
  const payload = (metadata ?? {}) as Record<string, unknown>

  if (actionType === 'SLA_INTERVENTION_REROUTE') return 200000
  if (actionType === 'SLA_INTERVENTION_PROACTIVE_CONTACT') return 30000
  if (actionType === 'SLA_COMPENSATION_TICKET') {
    const explicitCompensation = Number(payload.compensation)
    return Number.isFinite(explicitCompensation) && explicitCompensation > 0
      ? explicitCompensation
      : 500000
  }

  return 0
}

function isActualSlaBreach(order: OrderRow, now: Date) {
  const deadline = getSlaDeadline(
    order.serviceType,
    order.origin,
    order.destination,
    order.createdAt,
    order.estimatedDelivery,
  ).deadline

  if (order.status === 'completed') {
    return order.updatedAt > deadline
  }

  if (ACTIVE_ORDER_STATUSES.has(order.status)) {
    return now > deadline
  }

  return false
}

function safeRate(numerator: number, denominator: number) {
  return denominator === 0 ? null : numerator / denominator
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const apiKey = process.env.KPI_REPORT_API_KEY
    const authorization = req.headers.get('authorization')?.trim()

    if (!session?.user && authorization !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mode = req.nextUrl.searchParams.get('mode')?.toLowerCase()
    if (mode !== 'live') {
      return NextResponse.json(dailyReportFixture)
    }

    const windowHours = Number(req.nextUrl.searchParams.get('windowHours')) || WINDOW_HOURS
    const windowStart = getWindowStart(windowHours)
    const now = new Date()

    const [ordersInWindow, quoteRequestsInWindow, notificationsInWindow, slaAlertsInWindow, actionLogsInWindow] =
      await Promise.all([
        prisma.order.findMany({
          where: {
            OR: [{ createdAt: { gte: windowStart } }, { updatedAt: { gte: windowStart } }],
          },
          select: {
            id: true,
            orderCode: true,
            serviceType: true,
            status: true,
            origin: true,
            destination: true,
            createdAt: true,
            updatedAt: true,
            estimatedDelivery: true,
            totalAmount: true,
          },
        }),
        prisma.quoteRequest.findMany({
          where: {
            createdAt: { gte: windowStart },
          },
          select: {
            id: true,
            quoteCode: true,
            serviceType: true,
            origin: true,
            destination: true,
            createdAt: true,
            status: true,
            quotedPrice: true,
            priceBase: true,
            suggestedSurcharges: true,
            finalSuggestedPrice: true,
          },
        }),
        prisma.notification.findMany({
          where: {
            createdAt: { gte: windowStart },
          },
          select: {
            id: true,
            createdAt: true,
            isRead: true,
            type: true,
            title: true,
          },
        }),
        prisma.slaAlert.findMany({
          where: {
            createdAt: { gte: windowStart },
          },
          include: {
            order: {
              select: {
                id: true,
                orderCode: true,
                serviceType: true,
                status: true,
                origin: true,
                destination: true,
                createdAt: true,
                updatedAt: true,
                estimatedDelivery: true,
                totalAmount: true,
              },
            },
          },
        }),
        prisma.actionLog.findMany({
          where: {
            createdAt: { gte: windowStart },
          },
          select: {
            id: true,
            actionType: true,
            mode: true,
            entityId: true,
            metadata: true,
            createdAt: true,
          },
        }),
      ])

    const createdOrders = ordersInWindow.filter((order) => order.createdAt >= windowStart)
    const completedOrders = ordersInWindow.filter(
      (order) => order.status === 'completed' && order.updatedAt >= windowStart,
    )
    const failedOrders = ordersInWindow.filter(
      (order) => order.status === 'cancelled' && order.updatedAt >= windowStart,
    )

    const completedMetrics = completedOrders.map((order) => {
      const deadline = getSlaDeadline(
        order.serviceType,
        order.origin,
        order.destination,
        order.createdAt,
        order.estimatedDelivery,
      )
      const deliveryMinutes = minutesBetween(order.createdAt, order.updatedAt)
      const marginMinutes = minutesBetween(order.updatedAt, deadline.deadline)
      const targetDelivery = order.estimatedDelivery ?? deadline.standardDelivery

      return {
        ...order,
        routeBand: deadline.routeBand,
        deliveryMinutes,
        marginMinutes,
        onTime: order.updatedAt <= targetDelivery,
      }
    })

    const totalRevenueVnd = sum(completedMetrics.map((order) => order.totalAmount ?? 0))
    const averageDeliveryMinutes = average(completedMetrics.map((order) => order.deliveryMinutes))
    const onTimeRate = safeRate(
      completedMetrics.filter((order) => order.onTime).length,
      completedMetrics.length,
    )
    const averageSlaMarginMinutes = average(completedMetrics.map((order) => order.marginMinutes))

    const pickupActionsCount = actionLogsInWindow.filter(
      (action) => action.actionType === 'EMPLOYEE_CONFIRM_PICKUP',
    ).length
    const pickupEfficiencyOrdersPerPickupAction = safeRate(
      completedMetrics.length,
      pickupActionsCount,
    )

    const routeBandStats = ['noi_tinh', 'noi_vung', 'lien_vung', 'lien_tinh'].map((routeBand) => {
      const rows = completedMetrics.filter((order) => order.routeBand === routeBand)
      return {
        routeBand,
        completedOrders: rows.length,
        onTimeRate: safeRate(rows.filter((order) => order.onTime).length, rows.length),
        averageDeliveryMinutes: average(rows.map((order) => order.deliveryMinutes)),
        averageSlaMarginMinutes: average(rows.map((order) => order.marginMinutes)),
        totalRevenueVnd: sum(rows.map((order) => order.totalAmount ?? 0)),
      }
    })

    const routeOptimizationQualityScore = routeBandStats.length === 0
      ? null
      : Math.round(
          clamp(
            ((onTimeRate ?? 0) * 0.7 + (completedMetrics.filter((order) => order.marginMinutes >= 0).length / (completedMetrics.length || 1)) * 0.3) * 100,
            0,
            100,
          ),
        )

    const parsedQuoteRequests = quoteRequestsInWindow.filter((quote) => {
      const origin = quote.origin.trim()
      const destination = quote.destination.trim()
      return origin.length > 0 && destination.length > 0 && KNOWN_SERVICE_TYPES.has(quote.serviceType.toLowerCase())
    }).length

    const serviceClassificationCoverage = safeRate(
      quoteRequestsInWindow.filter((quote) => KNOWN_SERVICE_TYPES.has(quote.serviceType.toLowerCase())).length,
      quoteRequestsInWindow.length,
    )

    const alertedOrders = uniqueBy(
      slaAlertsInWindow
        .map((alert) => alert.order)
        .filter((order): order is NonNullable<typeof order> => Boolean(order)),
      (order) => order.id,
    )

    const alertedOrderMetrics = alertedOrders.map((order) => {
      const deadline = getSlaDeadline(
        order.serviceType,
        order.origin,
        order.destination,
        order.createdAt,
        order.estimatedDelivery,
      ).deadline

      return {
        ...order,
        breached: isActualSlaBreach(order, now),
        deadline,
      }
    })

    const riskPredictionAccuracy = safeRate(
      alertedOrderMetrics.filter((order) => order.breached).length,
      alertedOrderMetrics.length,
    )

    const interventionOrders = uniqueBy(
      actionLogsInWindow.filter((action) => isInterventionAction(action.actionType)),
      (action) => `${action.actionType}:${action.entityId ?? action.id}`,
    )

    const interventionSuccessRate = safeRate(
      interventionOrders.filter((action) => {
        const order = ordersInWindow.find((candidate) => candidate.id === action.entityId)
        if (!order) return false
        return !isActualSlaBreach(order, now)
      }).length,
      interventionOrders.length,
    )

    const notificationOpenRate = safeRate(
      notificationsInWindow.filter((notification) => notification.isRead).length,
      notificationsInWindow.length,
    )

    const manualActionsCount = actionLogsInWindow.filter((action) => action.mode === 'manual').length
    const automationActionsCount = actionLogsInWindow.filter((action) => action.mode === 'automation').length

    const interventionCostVnd = sum(
      actionLogsInWindow.map((action) => getInterventionCost(action.actionType, action.metadata)),
    )

    const compensationCostVnd = sum(
      actionLogsInWindow
        .filter((action) => action.actionType === 'SLA_COMPENSATION_TICKET')
        .map((action) => getInterventionCost(action.actionType, action.metadata)),
    )

    const estimatedManualLaborSavingsVnd = manualActionsCount * MANUAL_ACTION_COST_VND
    const automationExecutionCostVnd = automationActionsCount * AUTOMATION_ACTION_COST_VND + interventionCostVnd
    const automationNetBenefitVnd = estimatedManualLaborSavingsVnd - automationExecutionCostVnd
    const automationRoiPercent =
      automationExecutionCostVnd === 0
        ? null
        : Math.round((automationNetBenefitVnd / automationExecutionCostVnd) * 100)

    const financial = {
      totalRevenueVnd,
      averageOrderValueVnd: completedMetrics.length > 0 ? Math.round(totalRevenueVnd / completedMetrics.length) : 0,
      interventionCostVnd,
      compensationCostVnd,
      estimatedManualLaborSavingsVnd,
      automationExecutionCostVnd,
      automationNetBenefitVnd,
      automationRoiPercent,
      manualActionsCount,
      automationActionsCount,
    }

    const operations = {
      ordersReceived: createdOrders.length,
      ordersDelivered: completedMetrics.length,
      ordersFailed: failedOrders.length,
      averageDeliveryMinutes: averageDeliveryMinutes === null ? null : Math.round(averageDeliveryMinutes),
      onTimeRate,
      averageSlaMarginMinutes: averageSlaMarginMinutes === null ? null : Math.round(averageSlaMarginMinutes),
      pickupEfficiencyProxy: {
        pickupActionsCount,
        ordersPerPickupAction: pickupEfficiencyOrdersPerPickupAction,
        method: 'completed_orders_divided_by_pickup_confirm_actions',
      },
      routeOptimizationQuality: {
        score: routeOptimizationQualityScore,
        method: 'on_time_rate_and_positive_sla_margin_proxy',
      },
    }

    const aiPerformance = {
      parseAddressSuccessRate: safeRate(parsedQuoteRequests, quoteRequestsInWindow.length),
      serviceClassificationAccuracy: null,
      serviceClassificationCoverage,
      riskPredictionAccuracy,
      interventionSuccessRate,
      notificationOpenRate,
      feedbackCompletionRate: null,
    }

    const hourlySeries = createHourlyBuckets(windowStart, windowHours)

    const bumpBucket = (date: Date, field: HourlyBucketMetric, value = 1) => {
      const index = bucketIndex(windowStart, date, windowHours)
      hourlySeries[index][field] += value
    }

    for (const order of ordersInWindow) {
      if (order.createdAt >= windowStart) {
        bumpBucket(order.createdAt, 'ordersReceived')
      }

      if (order.status === 'completed' && order.updatedAt >= windowStart) {
        bumpBucket(order.updatedAt, 'ordersDelivered')
        bumpBucket(order.updatedAt, 'revenueVnd', order.totalAmount ?? 0)
      }

      if (order.status === 'cancelled' && order.updatedAt >= windowStart) {
        bumpBucket(order.updatedAt, 'ordersFailed')
      }
    }

    for (const notification of notificationsInWindow) {
      bumpBucket(notification.createdAt, 'notifications')
    }

    for (const alert of slaAlertsInWindow) {
      bumpBucket(alert.createdAt, 'alerts')
    }

    for (const action of actionLogsInWindow) {
      bumpBucket(action.createdAt, 'actions')
      if (action.mode === 'manual') {
        bumpBucket(action.createdAt, 'manualActions')
      }
      if (action.mode === 'automation') {
        bumpBucket(action.createdAt, 'automationActions')
      }
    }

    const ruleBasedRecommendations: string[] = []
    if ((onTimeRate ?? 1) < 0.92) {
      ruleBasedRecommendations.push('Tăng buffer SLA hoặc phân bổ lại tuyến có tỷ lệ đúng hạn thấp.')
    }
    if (averageSlaMarginMinutes !== null && averageSlaMarginMinutes < 120) {
      ruleBasedRecommendations.push('Ưu tiên đệm thời gian lớn hơn cho các tuyến có biên độ SLA dưới 2 giờ khi giao.')
    }
    if (automationRoiPercent !== null && automationRoiPercent < 0) {
      ruleBasedRecommendations.push('Rà soát ngưỡng can thiệp và chi phí bồi thường vì automation đang tạo net benefit âm.')
    }
    if ((notificationOpenRate ?? 1) < 0.7) {
      ruleBasedRecommendations.push('Tối ưu tiêu đề, thời điểm gửi và kênh thông báo để tăng tỷ lệ mở.')
    }
    if ((parsedQuoteRequests / (quoteRequestsInWindow.length || 1)) < 0.98) {
      ruleBasedRecommendations.push('Kiểm tra validation địa chỉ ở luồng tạo báo giá để giảm lỗi parse.')
    }

    const missingMetrics = [
      aiPerformance.serviceClassificationAccuracy === null ? 'serviceClassificationAccuracy' : null,
      aiPerformance.feedbackCompletionRate === null ? 'feedbackCompletionRate' : null,
    ].filter((value): value is string => Boolean(value))

    return NextResponse.json({
      success: true,
      reportType: 'daily_kpi_report_continuous_improvement',
      generatedAt: now.toISOString(),
      windowHours,
      period: {
        from: windowStart.toISOString(),
        to: now.toISOString(),
      },
      assumptions: {
        manualActionCostVnd: MANUAL_ACTION_COST_VND,
        automationActionCostVnd: AUTOMATION_ACTION_COST_VND,
        routeQualityModel: 'positive_sla_margin_and_on_time_proxy',
        aiMetricNotes: {
          serviceClassificationAccuracy: 'requires labeled ground truth before accuracy can be measured',
          feedbackCompletionRate: 'requires feedback form telemetry',
        },
      },
      summary: {
        totalOrdersObserved: uniqueBy(ordersInWindow, (order) => order.id).length,
        totalQuoteRequests: quoteRequestsInWindow.length,
        totalNotifications: notificationsInWindow.length,
        totalSlaAlerts: slaAlertsInWindow.length,
        totalActionLogs: actionLogsInWindow.length,
      },
      operations,
      aiPerformance,
      financial,
      routeBandStats,
      hourlySeries,
      ruleBasedRecommendations,
      missingMetrics,
      sourceCoverage: {
        orders: ordersInWindow.length > 0,
        quoteRequests: quoteRequestsInWindow.length > 0,
        notifications: notificationsInWindow.length > 0,
        slaAlerts: slaAlertsInWindow.length > 0,
        actionLogs: actionLogsInWindow.length > 0,
      },
      rawCounts: {
        createdOrders: createdOrders.length,
        completedOrders: completedMetrics.length,
        failedOrders: failedOrders.length,
        quoteRequests: quoteRequestsInWindow.length,
        notificationsRead: notificationsInWindow.filter((notification) => notification.isRead).length,
        notificationsUnread: notificationsInWindow.filter((notification) => !notification.isRead).length,
        alertedOrders: alertedOrderMetrics.length,
        interventionActions: interventionOrders.length,
      },
      preview: {
        topRouteBand: routeBandStats
          .slice()
          .sort((left, right) => (right.completedOrders ?? 0) - (left.completedOrders ?? 0))[0] ?? null,
      },
    })
  } catch (error) {
    console.error('[KPI Daily Report GET]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    )
  }
}
