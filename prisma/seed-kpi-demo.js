const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DAY_MS = 24 * 60 * 60 * 1000
const START = new Date('2026-05-29T03:20:51.480Z')
const END = new Date('2026-06-06T03:20:51.480Z')

const DAY_BLUEPRINTS = [
  {
    date: '2026-05-29',
    totalOrdersObserved: 42,
    ordersDelivered: 31,
    ordersFailed: 2,
    totalSlaAlerts: 3,
    totalActionLogs: 14,
    totalNotifications: 39,
    totalQuoteRequests: 6,
    totalRevenueVnd: 28500000,
    onTimeRate: 0.871,
    averageDeliveryMinutes: 875,
    averageSlaMarginMinutes: 142,
  },
  {
    date: '2026-05-30',
    totalOrdersObserved: 45,
    ordersDelivered: 34,
    ordersFailed: 1,
    totalSlaAlerts: 2,
    totalActionLogs: 15,
    totalNotifications: 41,
    totalQuoteRequests: 7,
    totalRevenueVnd: 31800000,
    onTimeRate: 0.883,
    averageDeliveryMinutes: 862,
    averageSlaMarginMinutes: 148,
  },
  {
    date: '2026-05-31',
    totalOrdersObserved: 48,
    ordersDelivered: 36,
    ordersFailed: 2,
    totalSlaAlerts: 4,
    totalActionLogs: 17,
    totalNotifications: 44,
    totalQuoteRequests: 7,
    totalRevenueVnd: 34700000,
    onTimeRate: 0.864,
    averageDeliveryMinutes: 889,
    averageSlaMarginMinutes: 136,
  },
  {
    date: '2026-06-01',
    totalOrdersObserved: 44,
    ordersDelivered: 33,
    ordersFailed: 1,
    totalSlaAlerts: 2,
    totalActionLogs: 16,
    totalNotifications: 40,
    totalQuoteRequests: 6,
    totalRevenueVnd: 30400000,
    onTimeRate: 0.89,
    averageDeliveryMinutes: 854,
    averageSlaMarginMinutes: 151,
  },
  {
    date: '2026-06-02',
    totalOrdersObserved: 47,
    ordersDelivered: 35,
    ordersFailed: 2,
    totalSlaAlerts: 3,
    totalActionLogs: 18,
    totalNotifications: 43,
    totalQuoteRequests: 7,
    totalRevenueVnd: 33600000,
    onTimeRate: 0.876,
    averageDeliveryMinutes: 869,
    averageSlaMarginMinutes: 144,
  },
  {
    date: '2026-06-03',
    totalOrdersObserved: 50,
    ordersDelivered: 38,
    ordersFailed: 1,
    totalSlaAlerts: 2,
    totalActionLogs: 18,
    totalNotifications: 46,
    totalQuoteRequests: 8,
    totalRevenueVnd: 36200000,
    onTimeRate: 0.895,
    averageDeliveryMinutes: 848,
    averageSlaMarginMinutes: 154,
  },
  {
    date: '2026-06-04',
    totalOrdersObserved: 46,
    ordersDelivered: 35,
    ordersFailed: 2,
    totalSlaAlerts: 2,
    totalActionLogs: 17,
    totalNotifications: 42,
    totalQuoteRequests: 7,
    totalRevenueVnd: 32900000,
    onTimeRate: 0.882,
    averageDeliveryMinutes: 861,
    averageSlaMarginMinutes: 147,
  },
  {
    date: '2026-06-05',
    totalOrdersObserved: 49,
    ordersDelivered: 37,
    ordersFailed: 1,
    totalSlaAlerts: 1,
    totalActionLogs: 16,
    totalNotifications: 44,
    totalQuoteRequests: 7,
    totalRevenueVnd: 35100000,
    onTimeRate: 0.901,
    averageDeliveryMinutes: 842,
    averageSlaMarginMinutes: 158,
  },
  {
    date: '2026-06-06',
    totalOrdersObserved: 52,
    ordersDelivered: 39,
    ordersFailed: 1,
    totalSlaAlerts: 2,
    totalActionLogs: 18,
    totalNotifications: 47,
    totalQuoteRequests: 8,
    totalRevenueVnd: 37800000,
    onTimeRate: 0.907,
    averageDeliveryMinutes: 835,
    averageSlaMarginMinutes: 162,
  },
]

function addHours(baseDate, hours) {
  return new Date(baseDate.getTime() + hours * 60 * 60 * 1000)
}

function allocateByWeights(total, weights) {
  const normalized = weights.reduce((sum, weight) => sum + weight, 0)
  const raw = weights.map((weight) => (total * weight) / normalized)
  const floored = raw.map((value) => Math.floor(value))
  let remainder = total - floored.reduce((sum, value) => sum + value, 0)

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((left, right) => right.fraction - left.fraction)

  for (const item of order) {
    if (remainder <= 0) break
    floored[item.index] += 1
    remainder -= 1
  }

  return floored
}

function buildRouteBandStats(dayStat) {
  const weights = [0.22, 0.32, 0.26, 0.20]
  const revenueWeights = [0.19, 0.27, 0.31, 0.23]
  const completedOrders = allocateByWeights(dayStat.ordersDelivered, weights)
  const revenue = allocateByWeights(dayStat.totalRevenueVnd, revenueWeights)
  const baseMinutes = [378, 615, 844, 1035]
  const baseMargin = [98, 121, 134, 141]
  const baseRate = [0.932, 0.889, 0.871, 0.853]
  const dayShift = (dayStat.totalSlaAlerts - 2) * 2

  return [
    {
      routeBand: 'noi_tinh',
      onTimeRate: Number((baseRate[0] + dayShift * 0.001).toFixed(3)),
      completedOrders: completedOrders[0],
      totalRevenueVnd: revenue[0],
      averageDeliveryMinutes: baseMinutes[0] + dayShift,
      averageSlaMarginMinutes: baseMargin[0] - dayShift,
    },
    {
      routeBand: 'noi_vung',
      onTimeRate: Number((baseRate[1] + dayShift * 0.001).toFixed(3)),
      completedOrders: completedOrders[1],
      totalRevenueVnd: revenue[1],
      averageDeliveryMinutes: baseMinutes[1] + dayShift,
      averageSlaMarginMinutes: baseMargin[1] - dayShift,
    },
    {
      routeBand: 'lien_vung',
      onTimeRate: Number((baseRate[2] + dayShift * 0.001).toFixed(3)),
      completedOrders: completedOrders[2],
      totalRevenueVnd: revenue[2],
      averageDeliveryMinutes: baseMinutes[2] + dayShift,
      averageSlaMarginMinutes: baseMargin[2] - dayShift,
    },
    {
      routeBand: 'lien_tinh',
      onTimeRate: Number((baseRate[3] + dayShift * 0.001).toFixed(3)),
      completedOrders: completedOrders[3],
      totalRevenueVnd: revenue[3],
      averageDeliveryMinutes: baseMinutes[3] + dayShift,
      averageSlaMarginMinutes: baseMargin[3] - dayShift,
    },
  ]
}

function buildHourlySeries(generatedAt, dayStat) {
  const start = new Date(generatedAt.getTime() - DAY_MS)
  const orderWeights = [0.01, 0.01, 0.01, 0.01, 0.02, 0.03, 0.04, 0.06, 0.08, 0.09, 0.08, 0.08, 0.08, 0.08, 0.07, 0.06, 0.05, 0.05, 0.04, 0.03, 0.02, 0.02, 0.01, 0.01]
  const notificationWeights = [0.01, 0.01, 0.01, 0.02, 0.02, 0.03, 0.03, 0.04, 0.05, 0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.07, 0.06, 0.06, 0.05, 0.04, 0.04, 0.03, 0.02, 0.01]
  const revenueWeights = [0, 0, 0, 0, 0, 0, 0.03, 0.04, 0.05, 0.07, 0.08, 0.09, 0.08, 0.08, 0.09, 0.1, 0.09, 0.08, 0.07, 0.05, 0.04, 0.03, 0.02, 0.01]
  const actionWeights = [0.01, 0.01, 0.01, 0.01, 0.02, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.09, 0.1, 0.1, 0.09, 0.08, 0.07, 0.07, 0.05, 0.04, 0.03, 0.02, 0.01, 0.01]
  const alertWeights = [0, 0, 0, 0, 0, 0, 0.05, 0.06, 0.08, 0.12, 0.12, 0.12, 0.08, 0.08, 0.1, 0.09, 0.06, 0.05, 0.04, 0.03, 0.01, 0.01, 0, 0]

  const ordersPattern = allocateByWeights(dayStat.totalOrdersObserved, orderWeights)
  const notificationsPattern = allocateByWeights(dayStat.totalNotifications, notificationWeights)
  const revenuePattern = allocateByWeights(dayStat.totalRevenueVnd, revenueWeights)
  const actionPattern = allocateByWeights(dayStat.totalActionLogs, actionWeights)
  const alertPattern = allocateByWeights(dayStat.totalSlaAlerts, alertWeights)
  const deliveredPattern = allocateByWeights(dayStat.ordersDelivered, orderWeights)
  const failedPattern = allocateByWeights(dayStat.ordersFailed, alertWeights)

  return ordersPattern.map((ordersReceived, index) => {
    const hour = new Date(start.getTime() + index * 60 * 60 * 1000)
    const manualActions = actionPattern[index]
    const alerts = alertPattern[index]
    const ordersDelivered = deliveredPattern[index]
    const ordersFailed = failedPattern[index]

    return {
      hour: hour.toISOString(),
      alerts,
      actions: manualActions,
      revenueVnd: revenuePattern[index],
      ordersFailed,
      manualActions,
      notifications: notificationsPattern[index],
      ordersReceived,
      ordersDelivered,
      automationActions: Math.max(0, Math.round(manualActions * 0.32)),
    }
  })
}

function buildDailyReport(generatedAt, dayStat) {
  const ordersReceived = dayStat.totalOrdersObserved
  const ordersDelivered = dayStat.ordersDelivered
  const ordersFailed = dayStat.ordersFailed
  const averageDeliveryMinutes = dayStat.averageDeliveryMinutes
  const averageSlaMarginMinutes = dayStat.averageSlaMarginMinutes
  const onTimeRate = dayStat.onTimeRate
  const totalRevenueVnd = dayStat.totalRevenueVnd
  const averageOrderValueVnd = ordersDelivered > 0 ? Math.round(totalRevenueVnd / ordersDelivered) : 0
  const manualActionsCount = dayStat.totalActionLogs
  const automationActionsCount = Math.max(3, Math.round(ordersReceived * 0.22))
  const interventionCostVnd = dayStat.totalSlaAlerts * 140000
  const compensationCostVnd = Math.round(dayStat.totalSlaAlerts * 90000)
  const estimatedManualLaborSavingsVnd = manualActionsCount * 12000
  const automationExecutionCostVnd = automationActionsCount * 2500 + interventionCostVnd
  const automationNetBenefitVnd = estimatedManualLaborSavingsVnd - automationExecutionCostVnd
  const routeBandStats = buildRouteBandStats(dayStat)

  const summary = {
    totalSlaAlerts: dayStat.totalSlaAlerts,
    totalActionLogs: dayStat.totalActionLogs,
    totalNotifications: dayStat.totalNotifications,
    totalQuoteRequests: dayStat.totalQuoteRequests,
    totalOrdersObserved: dayStat.totalOrdersObserved,
  }

  const operations = {
    onTimeRate,
    ordersFailed,
    ordersReceived,
    routeBandStats,
    ordersDelivered,
    averageDeliveryMinutes,
    averageSlaMarginMinutes,
  }

  const financial = {
    aiInsights: {
      risks: [
        'Các tuyến liên tỉnh vẫn có biên SLA mỏng hơn, nên các ngày tăng SLA alerts cần được ưu tiên điều phối sớm hơn.',
        'Doanh thu tăng khá đều, nhưng nếu số đơn tăng nhanh hơn năng lực xử lý thì tỷ lệ đúng hạn sẽ giảm trước khi doanh thu phản ánh.',
        'Tỷ lệ mở thông báo và hoàn tất phản hồi vẫn chưa đồng đều giữa các ngày, có thể gây chậm vòng phản hồi vận hành.',
      ],
      recommendations: [
        'Ưu tiên cảnh báo cho đơn liên tỉnh và các khung giờ cao điểm 09:00-17:00.',
        'Theo dõi chênh lệch giữa SLA alerts và onTimeRate theo ngày để phát hiện sớm ngày quá tải.',
        'Bổ sung thêm telemetry phản hồi khách hàng và trạng thái chốt can thiệp để đo hiệu quả automation chính xác hơn.',
        'Dùng weekly trend thay vì chỉ nhìn một ngày đơn lẻ để đánh giá ROI của automation.',
      ],
      executiveSummary: 'Dữ liệu mô phỏng cho thấy vận hành tương đối ổn định với on-time rate quanh mức 87-91%, doanh thu tăng đều và SLA alerts dao động nhẹ theo tải đơn. Các ngày có alert tăng cao thường đi kèm SLA margin thấp hơn ở nhóm liên tỉnh, nên cần ưu tiên giám sát tuyến dài và giờ cao điểm.',
    },
    totalRevenueVnd,
    automationRoiPercent:
      automationExecutionCostVnd === 0 ? null : Math.round((automationNetBenefitVnd / automationExecutionCostVnd) * 100),
    averageOrderValueVnd,
    automationNetBenefitVnd,
  }

  const rawCounts = {
    failedOrders: ordersFailed,
    alertedOrders: dayStat.totalSlaAlerts,
    createdOrders: ordersReceived,
    quoteRequests: dayStat.totalQuoteRequests,
    completedOrders: ordersDelivered,
    notificationsRead: Math.max(0, dayStat.totalNotifications - Math.max(3, Math.round(dayStat.totalNotifications * 0.18))),
    interventionActions: Math.max(1, Math.round(manualActionsCount * 0.38)),
    notificationsUnread: Math.max(0, dayStat.totalNotifications - Math.max(0, dayStat.totalNotifications - Math.max(3, Math.round(dayStat.totalNotifications * 0.18)))),
  }

  const preview = {
    topRouteBand: {
      ...routeBandStats[1],
    },
  }

  const hourlySeries = buildHourlySeries(generatedAt, dayStat)

  const rawData = {
    period: {
      from: new Date(generatedAt.getTime() - DAY_MS).toISOString(),
      to: new Date(generatedAt).toISOString(),
    },
    preview,
    success: true,
    summary,
    financial: {
      totalRevenueVnd,
      manualActionsCount,
      compensationCostVnd,
      interventionCostVnd,
      automationRoiPercent: financial.automationRoiPercent,
      averageOrderValueVnd,
      automationActionsCount,
      automationNetBenefitVnd,
      automationExecutionCostVnd,
      estimatedManualLaborSavingsVnd,
    },
    rawCounts,
    operations: {
      ...operations,
      pickupEfficiencyProxy: {
        method: 'completed_orders_divided_by_pickup_confirm_actions',
        pickupActionsCount: Math.max(1, Math.round(ordersDelivered * 0.7)),
        ordersPerPickupAction: ordersDelivered > 0 ? Number((ordersDelivered / Math.max(1, Math.round(ordersDelivered * 0.7))).toFixed(2)) : 0,
      },
      routeOptimizationQuality: {
        score: Math.max(62, Math.min(97, Math.round((onTimeRate ?? 0) * 100 - dayStat.totalSlaAlerts * 1.5))),
        method: 'on_time_rate_and_positive_sla_margin_proxy',
      },
    },
    reportType: 'daily_kpi_report_continuous_improvement',
    assumptions: {
      aiMetricNotes: {
        feedbackCompletionRate: 'derived from synthetic customer feedback telemetry',
        serviceClassificationAccuracy: 'derived from synthetic labeled routing data',
      },
      routeQualityModel: 'positive_sla_margin_and_on_time_proxy',
      manualActionCostVnd: 12000,
      automationActionCostVnd: 2500,
    },
    generatedAt: new Date(generatedAt).toISOString(),
    windowHours: 24,
    hourlySeries,
    aiPerformance: {
      notificationOpenRate: Number((0.56 + (dayStat.totalNotifications % 5) * 0.04).toFixed(2)),
      feedbackCompletionRate: Number((0.28 + (dayStat.totalQuoteRequests % 3) * 0.03).toFixed(2)),
      riskPredictionAccuracy: Number((0.78 + (dayStat.totalSlaAlerts % 3) * 0.02).toFixed(2)),
      interventionSuccessRate: Number((0.72 + (dayStat.totalSlaAlerts % 2) * 0.03).toFixed(2)),
      parseAddressSuccessRate: 0.99,
      serviceClassificationAccuracy: Number((0.86 + (dayStat.totalOrdersObserved % 4) * 0.01).toFixed(2)),
      serviceClassificationCoverage: 1,
    },
    missingMetrics: [],
    routeBandStats,
    sourceCoverage: {
      orders: true,
      slaAlerts: true,
      actionLogs: true,
      notifications: true,
      quoteRequests: true,
    },
    ruleBasedRecommendations: [
      'Tăng cảnh báo trước giờ cao điểm cho tuyến liên tỉnh.',
      'So sánh on-time rate với SLA alerts theo ngày để phát hiện ngày vận hành bất thường.',
      'Giữ tỷ lệ manual/automation ở mức cân bằng để tránh tăng chi phí xử lý.',
    ],
  }

  return {
    generatedAt,
    reportType: 'daily_kpi_report_continuous_improvement',
    summary,
    operations,
    financial,
    totalRevenue: BigInt(totalRevenueVnd),
    onTimeRate,
    slaAlerts: dayStat.totalSlaAlerts,
    rawData,
  }
}

async function main() {
  console.log('Resetting daily_kpi_reports for demo range...')

  await prisma.dailyKpiReport.deleteMany({
    where: {
      reportType: 'daily_kpi_report_continuous_improvement',
      generatedAt: {
        gte: START,
        lte: END,
      },
    },
  })

  const reports = DAY_BLUEPRINTS.map((dayStat, index) => {
    const generatedAt = new Date(START.getTime() + index * DAY_MS)
    const report = buildDailyReport(generatedAt, dayStat)

    return {
      generatedAt: report.generatedAt,
      reportType: report.reportType,
      summary: report.summary,
      operations: report.operations,
      financial: report.financial,
      totalRevenue: report.totalRevenue,
      onTimeRate: report.onTimeRate,
      slaAlerts: report.slaAlerts,
      rawData: report.rawData,
    }
  })

  await prisma.dailyKpiReport.createMany({ data: reports })
  console.log(`Re-seeded ${reports.length} daily KPI reports from 2026-05-29 to 2026-06-06`)
}

main()
  .catch((error) => {
    console.error('KPI demo seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
