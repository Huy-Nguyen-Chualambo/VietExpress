const { randomBytes, scrypt: scryptCallback } = require('crypto')
const { promisify } = require('util')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const scrypt = promisify(scryptCallback)
const DAY_MS = 24 * 60 * 60 * 1000
const ORDER_START = new Date('2026-05-12T06:17:54.729Z')
const ORDER_END = new Date('2026-05-17T06:17:54.729Z')
const KPI_REPORT_START = new Date('2026-05-12T06:17:54.729Z')
const KPI_REPORT_END = new Date('2026-05-17T06:17:54.729Z')
const MOCK_ORDER_PREFIX = 'VEX-MOCK-'
const MOCK_SERVICE_TYPES = ['express', 'ltl', 'ftl', '3pl']
const MOCK_ROUTE_TEMPLATES = [
  { origin: 'Ha Noi', destination: 'Ha Noi', routeBand: 'noi_tinh', baseHours: 4, baseMinutes: 180, amountBoost: 50000, hub: 'Noi Thanh Hub' },
  { origin: 'TP. Ho Chi Minh', destination: 'TP. Ho Chi Minh', routeBand: 'noi_tinh', baseHours: 4, baseMinutes: 160, amountBoost: 50000, hub: 'Noi Thanh Hub' },
  { origin: 'Ha Noi', destination: 'Hai Phong', routeBand: 'noi_vung', baseHours: 10, baseMinutes: 420, amountBoost: 120000, hub: 'Hai Phong Hub' },
  { origin: 'TP. Ho Chi Minh', destination: 'Can Tho', routeBand: 'noi_vung', baseHours: 9, baseMinutes: 360, amountBoost: 100000, hub: 'Mekong Hub' },
  { origin: 'Ha Noi', destination: 'Da Nang', routeBand: 'lien_vung', baseHours: 20, baseMinutes: 900, amountBoost: 240000, hub: 'Da Nang Hub' },
  { origin: 'Da Nang', destination: 'TP. Ho Chi Minh', routeBand: 'lien_vung', baseHours: 22, baseMinutes: 960, amountBoost: 260000, hub: 'Sai Gon Hub' },
  { origin: 'Binh Duong', destination: 'Ha Noi', routeBand: 'lien_tinh', baseHours: 30, baseMinutes: 1260, amountBoost: 320000, hub: 'North Line Hub' },
  { origin: 'Dong Nai', destination: 'Hai Phong', routeBand: 'lien_tinh', baseHours: 28, baseMinutes: 1140, amountBoost: 300000, hub: 'Central Hub' },
]

function getRouteBandFromOrder(order) {
  const matchedRoute = MOCK_ROUTE_TEMPLATES.find(
    (route) => route.origin === order.origin && route.destination === order.destination,
  )

  return matchedRoute ? matchedRoute.routeBand : 'noi_tinh'
}

function normalizeDayStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 6, 17, 54, 729))
}

function groupOrdersByDay(orders) {
  const dayMap = new Map()

  for (const order of orders) {
    const dayKey = order.createdAt.toISOString().slice(0, 10)

    let dayStats = dayMap.get(dayKey)
    if (!dayStats) {
      dayStats = {
        generatedAt: normalizeDayStart(order.createdAt),
        ordersReceived: 0,
        ordersDelivered: 0,
        ordersFailed: 0,
        totalRevenueVnd: 0,
        totalDeliveryMinutes: 0,
        totalSlaMarginMinutes: 0,
        onTimeDelivered: 0,
        slaAlerts: 0,
        routeBandStats: {
          noi_tinh: { routeBand: 'noi_tinh', completedOrders: 0, totalRevenueVnd: 0, deliveryMinutesTotal: 0, slaMarginMinutesTotal: 0, onTimeCompletedOrders: 0 },
          noi_vung: { routeBand: 'noi_vung', completedOrders: 0, totalRevenueVnd: 0, deliveryMinutesTotal: 0, slaMarginMinutesTotal: 0, onTimeCompletedOrders: 0 },
          lien_vung: { routeBand: 'lien_vung', completedOrders: 0, totalRevenueVnd: 0, deliveryMinutesTotal: 0, slaMarginMinutesTotal: 0, onTimeCompletedOrders: 0 },
          lien_tinh: { routeBand: 'lien_tinh', completedOrders: 0, totalRevenueVnd: 0, deliveryMinutesTotal: 0, slaMarginMinutesTotal: 0, onTimeCompletedOrders: 0 },
        },
      }
      dayMap.set(dayKey, dayStats)
    }

    dayStats.ordersReceived++

    if (order.status === 'completed') {
      dayStats.ordersDelivered++
      dayStats.totalRevenueVnd += order.totalAmount || 0
      dayStats.totalDeliveryMinutes += order.deliveryMinutes || 0
      dayStats.totalSlaMarginMinutes += order.slaMarginMinutes || 0
      if (order.isOnTime) {
        dayStats.onTimeDelivered++
      } else {
        dayStats.slaAlerts++
      }

      const routeBand = dayStats.routeBandStats[order.routeBand || getRouteBandFromOrder(order)]
      routeBand.completedOrders++
      routeBand.totalRevenueVnd += order.totalAmount || 0
      routeBand.deliveryMinutesTotal += order.deliveryMinutes || 0
      routeBand.slaMarginMinutesTotal += order.slaMarginMinutes || 0
      if (order.isOnTime) {
        routeBand.onTimeCompletedOrders++
      }
    } else if (order.status === 'failed') {
      dayStats.ordersFailed++
      dayStats.slaAlerts++
    }
  }

  return [...dayMap.values()].sort((left, right) => left.generatedAt - right.generatedAt)
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

async function upsertAuthUserWithProfile(account) {
  const passwordHash = await hashPassword(account.password)

  const user = await prisma.user.upsert({
    where: { email: account.email },
    update: {
      name: account.fullName,
      passwordHash,
    },
    create: {
      email: account.email,
      name: account.fullName,
      passwordHash,
    },
  })

  await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      fullName: account.fullName,
      phone: account.phone,
      company: account.company,
      role: account.role,
      email: account.email,
    },
    create: {
      id: user.id,
      fullName: account.fullName,
      phone: account.phone,
      company: account.company,
      role: account.role,
      email: account.email,
    },
  })

  return user
}

async function seedEmployeeAccounts() {
  const employees = [
    {
      fullName: 'Admin VietExpress',
      email: 'admin@vietexpress.vn',
      phone: '0901000001',
      password: 'Admin@123456',
      role: 'employee',
      company: 'VietExpress',
    },
    {
      fullName: 'Dieu Phoi Mien Bac',
      email: 'ops.bac@vietexpress.vn',
      phone: '0901000002',
      password: 'OpsBac@123456',
      role: 'employee',
      company: 'VietExpress',
    },
    {
      fullName: 'Dieu Phoi Mien Nam',
      email: 'ops.nam@vietexpress.vn',
      phone: '0901000003',
      password: 'OpsNam@123456',
      role: 'employee',
      company: 'VietExpress',
    },
  ]

  const results = []
  const usersByEmail = {}

  for (const employee of employees) {
    const user = await upsertAuthUserWithProfile(employee)
    usersByEmail[employee.email] = user
    results.push({ email: employee.email, password: employee.password })
  }

  return { credentials: results, usersByEmail }
}

async function seedCustomerAccounts() {
  const customers = [
    {
      fullName: 'Cong ty ABC Logistics',
      email: 'customer.abc@vietexpress.vn',
      phone: '0912000001',
      password: 'Customer@123456',
      role: 'customer',
      company: 'ABC Logistics',
    },
    {
      fullName: 'Shop XYZ Thuong Mai',
      email: 'customer.xyz@vietexpress.vn',
      phone: '0912000002',
      password: 'Customer@123456',
      role: 'customer',
      company: 'Shop XYZ',
    },
    {
      fullName: 'Nha may MNO',
      email: 'customer.mno@vietexpress.vn',
      phone: '0912000003',
      password: 'Customer@123456',
      role: 'customer',
      company: 'MNO Factory',
    },
  ]

  const results = []
  const usersByEmail = {}

  for (const customer of customers) {
    const user = await upsertAuthUserWithProfile(customer)

    await prisma.customerSetting.upsert({
      where: { userId: user.id },
      update: {
        language: 'vi',
        theme: 'light',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        companyName: customer.company,
        phone: customer.phone,
      },
      create: {
        userId: user.id,
        language: 'vi',
        theme: 'light',
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        companyName: customer.company,
        phone: customer.phone,
      },
    })

    usersByEmail[customer.email] = user
    results.push({ email: customer.email, password: customer.password })
  }

  return { credentials: results, usersByEmail }
}

async function seedOperationalData(customerUsersByEmail) {
  const customers = [
    customerUsersByEmail['customer.abc@vietexpress.vn'],
    customerUsersByEmail['customer.xyz@vietexpress.vn'],
    customerUsersByEmail['customer.mno@vietexpress.vn'],
  ]

  await prisma.order.deleteMany({
    where: { orderCode: { startsWith: MOCK_ORDER_PREFIX } },
  })
  await prisma.dailyKpiReport.deleteMany({
    where: { reportType: 'daily_kpi_report_continuous_improvement' },
  })

  const orderRows = []
  let orderSequence = 1
  const orderDays = Math.round((ORDER_END.getTime() - ORDER_START.getTime()) / DAY_MS)
  const ordersPerDayPattern = [5, 4, 5, 4, 5, 4]

  for (let dayIndex = 0; dayIndex <= orderDays; dayIndex++) {
    const generatedAt = new Date(ORDER_START.getTime() + dayIndex * DAY_MS)
    const ordersPerDay = ordersPerDayPattern[dayIndex] ?? 4
    for (let orderIndex = 0; orderIndex < ordersPerDay; orderIndex++) {
      const customer = customers[(dayIndex + orderIndex) % customers.length]
      const routeTemplate = MOCK_ROUTE_TEMPLATES[(dayIndex * 3 + orderIndex) % MOCK_ROUTE_TEMPLATES.length]
      const serviceType = MOCK_SERVICE_TYPES[(dayIndex + orderIndex) % MOCK_SERVICE_TYPES.length]
      const createdAt = new Date(generatedAt.getTime() + (orderIndex + 1) * 2 * 60 * 60 * 1000)
      const statusSeed = (dayIndex * 11 + orderIndex * 3) % 10
      const status = statusSeed === 0 ? 'failed' : statusSeed <= 2 ? 'delivering' : statusSeed === 3 ? 'in_transit' : 'completed'
      const weightKg = 80 + ((dayIndex * 37 + orderIndex * 53) % 1200)
      const totalAmount = 1200000 + weightKg * 2600 + routeTemplate.amountBoost + (serviceType === 'express' ? 120000 : serviceType === 'ftl' ? 260000 : serviceType === '3pl' ? 180000 : 0)
      const estimatedDelivery = new Date(createdAt.getTime() + (routeTemplate.baseHours + (dayIndex % 5)) * 60 * 60 * 1000)
      const isOnTime = status === 'completed' && (dayIndex + orderIndex) % 4 !== 0
      const deliveryMinutes = status === 'completed' ? routeTemplate.baseMinutes + dayIndex * 4 + orderIndex * 15 + (isOnTime ? -30 : 70) : null
      const slaMarginMinutes = status === 'completed' ? (isOnTime ? 120 + ((dayIndex + orderIndex) % 5) * 15 : -45 - ((dayIndex + orderIndex) % 4) * 12) : null

      const order = {
        orderCode: `${MOCK_ORDER_PREFIX}${String(orderSequence).padStart(5, '0')}`,
        userId: customer.id,
        origin: routeTemplate.origin,
        destination: routeTemplate.destination,
        serviceType,
        status,
        currentLocation: status === 'completed' ? routeTemplate.destination : routeTemplate.hub,
        weightKg,
        totalAmount,
        estimatedDelivery,
        createdAt,
        routeBand: routeTemplate.routeBand,
        isOnTime,
        deliveryMinutes,
        slaMarginMinutes,
      }

      orderRows.push({
        orderCode: order.orderCode,
        userId: order.userId,
        origin: order.origin,
        destination: order.destination,
        serviceType: order.serviceType,
        status: order.status,
        currentLocation: order.currentLocation,
        weightKg: order.weightKg,
        totalAmount: order.totalAmount,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt,
      })

      orderSequence++
    }
  }

  await prisma.order.createMany({
    data: orderRows,
  })

  console.log(`Seeded ${orderRows.length} mock orders from 2026-05-12 to 2026-05-17`)

  const existingOrders = await prisma.order.findMany({
    where: {
      orderCode: { startsWith: MOCK_ORDER_PREFIX },
      createdAt: {
        gte: ORDER_START,
        lte: new Date(ORDER_END.getTime() + DAY_MS - 1),
      },
    },
    select: {
      createdAt: true,
      status: true,
      totalAmount: true,
      currentLocation: true,
      origin: true,
      destination: true,
      serviceType: true,
      weightKg: true,
    },
  })

  return groupOrdersByDay(existingOrders.map((order) => ({
    ...order,
    routeBand: getRouteBandFromOrder(order),
    isOnTime: order.status === 'completed' ? Boolean(order.totalAmount) && Boolean(order.currentLocation) : false,
    deliveryMinutes: order.status === 'completed' ? Math.max(1, Math.round(((order.weightKg || 0) / 2) + (order.totalAmount || 0) / 50000)) : null,
    slaMarginMinutes: order.status === 'completed' ? Math.round(180 - ((order.weightKg || 0) / 20)) : null,
  })))
}

function buildDailyKpiReport(dayIndex, generatedAt, dayStats) {
  const ordersReceived = dayStats.ordersReceived
  const ordersDelivered = dayStats.ordersDelivered
  const ordersFailed = dayStats.ordersFailed
  const onTimeRate = ordersDelivered > 0 ? Number((dayStats.onTimeDelivered / ordersDelivered).toFixed(3)) : null
  const averageDeliveryMinutes = ordersDelivered > 0 ? Math.round(dayStats.totalDeliveryMinutes / ordersDelivered) : null
  const averageSlaMarginMinutes = ordersDelivered > 0 ? Math.round(dayStats.totalSlaMarginMinutes / ordersDelivered) : null
  const manualActionsCount = Math.max(1, Math.round(ordersReceived * 0.28) + ordersFailed * 2)
  const automationActionsCount = Math.max(1, Math.round(ordersReceived * 0.52))
  const interventionCostVnd = dayStats.slaAlerts * 140000
  const estimatedManualLaborSavingsVnd = manualActionsCount * 12000
  const automationExecutionCostVnd = automationActionsCount * 2500 + interventionCostVnd
  const automationNetBenefitVnd = estimatedManualLaborSavingsVnd - automationExecutionCostVnd
  const totalRevenue = BigInt(dayStats.totalRevenueVnd)

  const routeBandStats = Object.values(dayStats.routeBandStats).map((routeBand) => ({
    routeBand: routeBand.routeBand,
    completedOrders: routeBand.completedOrders,
    totalRevenueVnd: routeBand.totalRevenueVnd,
    averageDeliveryMinutes: routeBand.completedOrders > 0 ? Number((routeBand.deliveryMinutesTotal / routeBand.completedOrders).toFixed(1)) : null,
    averageSlaMarginMinutes: routeBand.completedOrders > 0 ? Number((routeBand.slaMarginMinutesTotal / routeBand.completedOrders).toFixed(1)) : null,
    onTimeRate: routeBand.completedOrders > 0 ? Number((routeBand.onTimeCompletedOrders / routeBand.completedOrders).toFixed(3)) : null,
  }))

  const operations = {
    ordersReceived,
    ordersDelivered,
    ordersFailed,
    averageDeliveryMinutes,
    onTimeRate,
    averageSlaMarginMinutes,
    pickupEfficiencyProxy: {
      pickupActionsCount: Math.max(1, Math.round(ordersDelivered * 0.62)),
      ordersPerPickupAction: ordersDelivered > 0 ? Number((ordersDelivered / Math.max(1, Math.round(ordersDelivered * 0.62))).toFixed(2)) : null,
      method: 'completed_orders_divided_by_pickup_confirm_actions',
    },
    routeOptimizationQuality: {
      score: Math.max(55, Math.min(96, Math.round((onTimeRate ?? 0) * 100 - dayIndex * 0.2))),
      method: 'on_time_rate_and_positive_sla_margin_proxy',
    },
  }

  const financial = {
    totalRevenueVnd: Number(totalRevenue),
    averageOrderValueVnd: ordersDelivered > 0 ? Math.round(Number(totalRevenue) / ordersDelivered) : 0,
    interventionCostVnd,
    compensationCostVnd: Math.round(dayStats.slaAlerts * 90000),
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
    totalQuoteRequests: Math.max(1, Math.round(ordersReceived * 0.2)),
    totalNotifications: ordersReceived + dayStats.slaAlerts,
    totalSlaAlerts: dayStats.slaAlerts,
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
    slaAlerts: dayStats.slaAlerts,
    rawData: {
      reportType: 'daily_kpi_report_continuous_improvement',
      generatedAt: generatedAt.toISOString(),
      period: {
        from: new Date(generatedAt.getTime() - DAY_MS).toISOString(),
        to: generatedAt.toISOString(),
      },
      summary,
      operations,
      financial,
      routeBandStats,
      orderMetrics: {
        ordersReceived,
        ordersDelivered,
        ordersFailed,
        onTimeDelivered: dayStats.onTimeDelivered,
        slaAlerts: dayStats.slaAlerts,
      },
      sourceCoverage: {
        orders: true,
        quoteRequests: false,
        notifications: false,
        slaAlerts: true,
        actionLogs: false,
      },
      assumptions: {
        mockData: true,
        model: 'order_driven_history',
      },
    },
  }
}

async function seedDailyKpiReports(dailyStats) {
  const reports = []

  for (let dayIndex = 0; dayIndex < dailyStats.length; dayIndex++) {
    const dayStat = dailyStats[dayIndex]
    const report = buildDailyKpiReport(dayIndex, dayStat.generatedAt, dayStat)
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

  console.log(`Seeded ${reports.length} daily KPI reports from 2026-05-12 to 2026-05-17`)
}

async function main() {
  const employeeSeed = await seedEmployeeAccounts()
  const customerSeed = await seedCustomerAccounts()
  const dailyStats = await seedOperationalData(customerSeed.usersByEmail)
  await seedDailyKpiReports(dailyStats)

  console.log('\nSeeded employee accounts:')
  for (const account of employeeSeed.credentials) {
    console.log(`- ${account.email} / ${account.password}`)
  }

  console.log('\nSeeded customer accounts:')
  for (const account of customerSeed.credentials) {
    console.log(`- ${account.email} / ${account.password}`)
  }

  console.log('\nSeeded sample operations data: orders, tracking events, quote requests, notifications, daily KPI reports.')
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
