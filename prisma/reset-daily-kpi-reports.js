const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const DAY_MS = 24 * 60 * 60 * 1000
const KPI_REPORT_START = new Date('2026-04-15T06:17:54.729Z')
const KPI_REPORT_END = new Date('2026-05-17T06:17:54.729Z')

function buildReport(dayIndex, generatedAt) {
  const ordersReceived = Math.round(40 + Math.sin(dayIndex / 3) * 6)
  const onTimeRate = Number((0.86 + Math.sin(dayIndex / 5) * 0.05).toFixed(3))
  const ordersDelivered = Math.round(ordersReceived * (0.7 + (onTimeRate - 0.8) * 0.5))
  const ordersFailed = Math.max(1, Math.round(ordersReceived * 0.04))
  const slaAlerts = Math.max(0, Math.round(ordersFailed * 1.1))
  const totalRevenue = BigInt(Math.round(ordersDelivered * 700000))

  const operations = {
    ordersReceived,
    ordersDelivered,
    ordersFailed,
    averageDeliveryMinutes: Math.round(900 - dayIndex * 4),
    onTimeRate,
    averageSlaMarginMinutes: Math.round(180 - dayIndex * 1.5),
  }

  const financial = {
    totalRevenueVnd: Number(totalRevenue),
    averageOrderValueVnd: ordersDelivered > 0 ? Math.round(Number(totalRevenue) / ordersDelivered) : 0,
  }

  const summary = {
    totalOrdersObserved: ordersReceived,
    totalQuoteRequests: Math.max(1, Math.round(ordersReceived * 0.15)),
    totalNotifications: Math.round(ordersReceived * 0.9),
    totalSlaAlerts: slaAlerts,
  }

  return {
    generatedAt,
    reportType: 'daily_kpi_report_continuous_improvement',
    summary,
    operations,
    financial,
    totalRevenue,
    onTimeRate,
    slaAlerts,
    rawData: { summary, operations, financial },
  }
}

async function main() {
  console.log('Resetting daily_kpi_reports...')
  await prisma.dailyKpiReport.deleteMany({ where: { reportType: 'daily_kpi_report_continuous_improvement' } })

  const reports = []
  for (
    let generatedAt = new Date(KPI_REPORT_START),
      dayIndex = 0;
    generatedAt <= KPI_REPORT_END;
    generatedAt = new Date(generatedAt.getTime() + DAY_MS),
      dayIndex++
  ) {
    const r = buildReport(dayIndex, generatedAt)
    reports.push({
      generatedAt: r.generatedAt,
      reportType: r.reportType,
      summary: r.summary,
      operations: r.operations,
      financial: r.financial,
      totalRevenue: r.totalRevenue,
      onTimeRate: r.onTimeRate,
      slaAlerts: r.slaAlerts,
      rawData: r.rawData,
    })
  }

  await prisma.dailyKpiReport.createMany({ data: reports })
  console.log(`Inserted ${reports.length} daily_kpi_report rows from 2026-04-15 to 2026-05-17`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
