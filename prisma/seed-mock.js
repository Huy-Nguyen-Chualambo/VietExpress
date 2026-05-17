const { PrismaClient } = require('@prisma/client')
const { faker } = require('@faker-js/faker')

const prisma = new PrismaClient()

// Config
const ORDERS_COUNT = 50
const CUSTOMERS_COUNT = 5
const DAYS_RANGE = 30 // past 30 days
const FAILURE_RATE = 0.05 // 5%
const DAY_MS = 24 * 60 * 60 * 1000
const KPI_REPORT_START = new Date('2026-04-15T06:17:54.729Z')
const KPI_REPORT_END = new Date('2026-05-17T06:17:54.729Z')

const MOCK_EMAIL_PREFIX = 'mock.customer'
const MOCK_ORDER_PREFIX = 'VEX-MOCK-'
const MOCK_REPORT_PREFIX = 'KPI-MOCK-'

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDateWithinDays(daysBack) {
  const now = Date.now()
  const past = now - daysBack * 24 * 60 * 60 * 1000
  return new Date(past + Math.random() * (now - past))
}

async function createCustomers() {
  const vietnameseNames = [
    'Nguyen Van An',
    'Tran Thi Bich',
    'Le Quoc Huy',
    'Pham Minh Chau',
    'Doan Thanh Dat',
  ]
  const companies = [
    'Cong ty TNHH Minh Phat',
    'CTCP Thuong mai Sai Gon',
    'Kho van Binh Duong',
    'Nha may Dong A',
    'Shop Online Thanh Cong',
  ]

  const customers = []
  for (let i = 0; i < CUSTOMERS_COUNT; i++) {
    const fullName = vietnameseNames[i % vietnameseNames.length]
    const email = `${MOCK_EMAIL_PREFIX}${i + 1}@vietexpress.vn`
    const phone = `09${String(10000000 + i * 111111).slice(0, 8)}`
    const company = companies[i % companies.length]

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: fullName,
        passwordHash: 'mock-hash',
      },
      create: {
        name: fullName,
        email,
        passwordHash: 'mock-hash',
      },
    })

    await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        fullName,
        phone,
        company,
        email,
        role: 'customer',
      },
      create: {
        id: user.id,
        fullName,
        phone,
        company,
        email,
        role: 'customer',
      },
    })

    customers.push(user)
  }

  return customers
}

async function cleanupMockData() {
  // Keep reruns deterministic: clear previous mock dataset first.
  await prisma.dailyKpiReport.deleteMany({
    where: { reportType: 'daily_kpi_report_continuous_improvement' },
  })
  await prisma.actionLog.deleteMany({
    where: {
      actionType: {
        in: ['EMPLOYEE_CONFIRM_PICKUP', 'AUTOMATION_SEND_NOTIFICATION', 'SLA_INTERVENTION_PROACTIVE_CONTACT'],
      },
    },
  })
  await prisma.quoteRequest.deleteMany({
    where: { quoteCode: { startsWith: 'BG-MOCK-' } },
  })
  await prisma.notification.deleteMany({
    where: { title: { startsWith: 'Order VEX-MOCK-' } },
  })
  await prisma.slaAlert.deleteMany({
    where: { message: { contains: 'VEX-MOCK-' } },
  })
  await prisma.trackingEvent.deleteMany({
    where: { order: { orderCode: { startsWith: MOCK_ORDER_PREFIX } } },
  })
  await prisma.order.deleteMany({
    where: { orderCode: { startsWith: MOCK_ORDER_PREFIX } },
  })
}

async function seedOrders(customers) {
  const serviceTypes = ['express', 'ltl', 'ftl', '3pl']
  const cityMap = ['Ha Noi', 'TP. Ho Chi Minh', 'Da Nang', 'Hai Phong', 'Can Tho', 'Binh Duong', 'Dong Nai']
  const failedCount = Math.max(1, Math.round(ORDERS_COUNT * FAILURE_RATE))
  const failedIndexes = new Set()

  while (failedIndexes.size < failedCount) {
    failedIndexes.add(faker.number.int({ min: 0, max: ORDERS_COUNT - 1 }))
  }

  for (let i = 0; i < ORDERS_COUNT; i++) {
    const customer = randomFrom(customers)
    const createdAt = randomDateWithinDays(DAYS_RANGE)
    const weightKg = faker.number.int({ min: 1, max: 1500 })
    const totalAmount = faker.number.int({ min: 20000, max: 50000000 })
    const serviceType = randomFrom(serviceTypes)
    const willFail = failedIndexes.has(i)

    const orderCode = `${MOCK_ORDER_PREFIX}${String(i + 1).padStart(4, '0')}`
    const origin = randomFrom(cityMap)
    const destination = randomFrom(cityMap.filter((city) => city !== origin))

    // estimated delivery within 1-7 days from createdAt
    const estimatedDelivery = new Date(createdAt.getTime() + faker.number.int({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000)

    const status = willFail ? 'failed' : randomFrom(['completed', 'in_transit', 'delivering'])

    const order = await prisma.order.create({
      data: {
        orderCode,
        userId: customer.id,
        origin,
        destination,
        serviceType,
        status,
        currentLocation: status === 'completed' ? destination : null,
        weightKg,
        totalAmount,
        estimatedDelivery,
        createdAt,
        trackingEvents: {
          create: createTrackingForOrder(createdAt, status, origin, destination),
        },
        slaAlerts: willFail
          ? {
              create: [
                {
                  type: 'alert',
                  status: 'open',
                  severity: 'high',
                  message: `Order ${orderCode} failed or delayed`,
                  detectedAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
                },
              ],
            }
          : undefined,
      },
    })

    await prisma.notification.createMany({
      data: createNotificationsForOrder(customer.id, orderCode),
    })

    // create action logs for order
    const actionLogs = createActionLogsForOrder(order.id, createdAt, willFail)
    for (const log of actionLogs) {
      await prisma.actionLog.create({ data: log })
    }

    // occasional quote requests
    if (Math.random() < 0.3) {
      const quote = createQuoteRequestsForCustomer(customer.id, createdAt, orderCode)
      await prisma.quoteRequest.create({ data: quote })
    }

    console.log(`Seeded order ${order.orderCode} (${status})`)
  }
}

function createTrackingForOrder(createdAt, status, origin, destination) {
  const events = []

  // picked up
  events.push({
    status: 'picked_up',
    location: origin,
    description: 'Picked up from origin',
    eventTime: new Date(createdAt.getTime() + faker.number.int({ min: 1, max: 6 }) * 60 * 60 * 1000),
  })

  // in transit
  events.push({
    status: 'in_transit',
    location: 'On route',
    description: 'In transit',
    eventTime: new Date(createdAt.getTime() + faker.number.int({ min: 7, max: 48 }) * 60 * 60 * 1000),
  })

  // delivering or failed/completed
  if (status === 'completed') {
    events.push({
      status: 'delivering',
      location: destination,
      description: 'Out for delivery',
      eventTime: new Date(createdAt.getTime() + faker.number.int({ min: 48, max: 96 }) * 60 * 60 * 1000),
    })
    events.push({
      status: 'completed',
      location: destination,
      description: 'Delivered successfully',
      eventTime: new Date(createdAt.getTime() + faker.number.int({ min: 72, max: 120 }) * 60 * 60 * 1000),
    })
  } else if (status === 'failed') {
    events.push({
      status: 'delivering',
      location: destination,
      description: 'Delivery attempt failed',
      eventTime: new Date(createdAt.getTime() + faker.number.int({ min: 48, max: 96 }) * 60 * 60 * 1000),
    })
    events.push({
      status: 'failed',
      location: destination,
      description: 'Delivery failed - recipient not available or damaged',
      eventTime: new Date(createdAt.getTime() + faker.number.int({ min: 72, max: 144 }) * 60 * 60 * 1000),
    })
  } else {
    events.push({
      status: 'in_transit',
      location: 'En route',
      description: 'Still in transit',
      eventTime: new Date(createdAt.getTime() + faker.number.int({ min: 48, max: 96 }) * 60 * 60 * 1000),
    })
  }

  return events
}

function createNotificationsForOrder(userId, orderCode) {
  return [
    {
      userId,
      type: 'info',
      title: `Order ${orderCode} created`,
      message: `Your order ${orderCode} has been created and is being processed.`,
    },
  ]
}

function createActionLogsForOrder(orderId, createdAt, willFail) {
  const logs = []
  // pickup confirm (manual)
  logs.push({
    actorId: null,
    mode: 'manual',
    actionType: 'EMPLOYEE_CONFIRM_PICKUP',
    entityType: 'order',
    entityId: orderId,
    metadata: null,
    createdAt: new Date(createdAt.getTime() + 1 * 60 * 60 * 1000),
  })

  // automation notification
  logs.push({
    actorId: null,
    mode: 'automation',
    actionType: 'AUTOMATION_SEND_NOTIFICATION',
    entityType: 'order',
    entityId: orderId,
    metadata: null,
    createdAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
  })

  if (willFail) {
    // add an intervention action for failed orders
    logs.push({
      actorId: null,
      mode: 'manual',
      actionType: 'SLA_INTERVENTION_PROACTIVE_CONTACT',
      entityType: 'order',
      entityId: orderId,
      metadata: { reason: 'failed_delivery' },
      createdAt: new Date(createdAt.getTime() + 3 * 60 * 60 * 1000),
    })
  }

  return logs
}

function createQuoteRequestsForCustomer(userId, createdAt, orderCode) {
  const serviceTypes = ['express', 'ltl', 'ftl', '3pl']
  const origin = randomFrom(['Ha Noi', 'TP. Ho Chi Minh', 'Da Nang'])
  const destination = randomFrom(['Hai Phong', 'Can Tho', 'Binh Duong'])
  return {
    userId,
    quoteCode: `BG-MOCK-${orderCode.replace('VEX-MOCK-', '')}`,
    serviceType: randomFrom(serviceTypes),
    origin,
    destination,
    weight: `${faker.number.int({ min: 1, max: 1200 })}kg`,
    dimensions: `${faker.number.int({ min: 10, max: 200 })}x${faker.number.int({ min: 10, max: 200 })}x${faker.number.int({ min: 10, max: 200 })}cm`,
    note: null,
    status: 'pending',
    createdAt,
  }
}

function buildDailyKpiReport(dayIndex, generatedAt) {
  const dayFactor = 1 + dayIndex * 0.012
  const seasonality = 0.85 + Math.sin(dayIndex / 3) * 0.12
  const ordersReceived = Math.round(38 * dayFactor * seasonality)
  const onTimeRate = Number((0.88 + Math.sin(dayIndex / 5) * 0.04).toFixed(3))
  const ordersDelivered = Math.round(ordersReceived * (0.7 + (onTimeRate - 0.8) * 0.5))
  const ordersFailed = Math.max(1, Math.round(ordersReceived * (0.03 + (dayIndex % 7 === 0 ? 0.03 : 0))))
  const slaAlerts = Math.max(0, Math.round(ordersFailed * 1.2))
  const totalRevenue = BigInt(Math.round(ordersDelivered * (680000 + dayIndex * 12000)))
  const manualActionsCount = Math.round(ordersReceived * 0.42)
  const automationActionsCount = Math.round(ordersReceived * 0.58)
  const interventionCostVnd = slaAlerts * 140000
  const estimatedManualLaborSavingsVnd = manualActionsCount * 12000
  const automationExecutionCostVnd = automationActionsCount * 2500 + interventionCostVnd
  const automationNetBenefitVnd = estimatedManualLaborSavingsVnd - automationExecutionCostVnd

  const operations = {
    ordersReceived,
    ordersDelivered,
    ordersFailed,
    averageDeliveryMinutes: Math.round(900 - dayIndex * 4 + Math.sin(dayIndex / 2) * 25),
    onTimeRate,
    averageSlaMarginMinutes: Math.round(180 - dayIndex * 1.5 + Math.sin(dayIndex / 4) * 30),
    pickupEfficiencyProxy: {
      pickupActionsCount: Math.max(1, Math.round(ordersDelivered * 0.62)),
      ordersPerPickupAction: Number((ordersDelivered / Math.max(1, Math.round(ordersDelivered * 0.62))).toFixed(2)),
      method: 'completed_orders_divided_by_pickup_confirm_actions',
    },
    routeOptimizationQuality: {
      score: Math.max(55, Math.min(96, Math.round(onTimeRate * 100 - dayIndex * 0.2))),
      method: 'on_time_rate_and_positive_sla_margin_proxy',
    },
  }

  const financial = {
    totalRevenueVnd: Number(totalRevenue),
    averageOrderValueVnd: ordersDelivered > 0 ? Math.round(Number(totalRevenue) / ordersDelivered) : 0,
    interventionCostVnd,
    compensationCostVnd: Math.round(slaAlerts * 90000),
    estimatedManualLaborSavingsVnd,
    automationExecutionCostVnd,
    automationNetBenefitVnd,
    automationRoiPercent:
      automationExecutionCostVnd === 0 ? null : Math.round((automationNetBenefitVnd / automationExecutionCostVnd) * 100),
    manualActionsCount,
    automationActionsCount,
  }

  const summary = {
    totalOrdersObserved: ordersReceived,
    totalQuoteRequests: Math.max(2, Math.round(ordersReceived * 0.18)),
    totalNotifications: Math.round(ordersReceived * 0.95),
    totalSlaAlerts: slaAlerts,
    totalActionLogs: manualActionsCount + automationActionsCount,
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
    rawData: {
      reportType: 'daily_kpi_report_continuous_improvement',
      generatedAt: generatedAt.toISOString(),
      period: {
        from: new Date(generatedAt.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        to: generatedAt.toISOString(),
      },
      summary,
      operations,
      financial,
      sourceCoverage: {
        orders: true,
        quoteRequests: true,
        notifications: true,
        slaAlerts: true,
        actionLogs: true,
      },
      assumptions: {
        mockData: true,
        model: 'synthetic_history',
      },
    },
  }
}

async function seedDailyKpiReports() {
  await prisma.dailyKpiReport.deleteMany({
    where: { reportType: 'daily_kpi_report_continuous_improvement' },
  })

  const reports = []
  for (
    let generatedAt = new Date(KPI_REPORT_START),
      dayIndex = 0;
    generatedAt <= KPI_REPORT_END;
    generatedAt = new Date(generatedAt.getTime() + DAY_MS),
      dayIndex++
  ) {
    const report = buildDailyKpiReport(dayIndex, generatedAt)
    reports.push({
      generatedAt: report.generatedAt,
      reportType: report.reportType,
      summary: report.summary,
      operations: report.operations,
      financial: report.financial,
      totalRevenue: report.totalRevenue,
      onTimeRate: report.onTimeRate,
      slaAlerts: report.slaAlerts,
      rawData: report.rawData,
    })
  }

  await prisma.dailyKpiReport.createMany({
    data: reports,
  })

  console.log(`Seeded ${reports.length} historical KPI daily reports from 2026-04-15 to 2026-05-17`)
}

async function main() {
  console.log('Starting mock seed...')

  await cleanupMockData()

  const customers = await createCustomers()
  console.log(`Created ${customers.length} customers`)

  await seedOrders(customers)
  await seedDailyKpiReports()

  console.log('Mock seed finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
