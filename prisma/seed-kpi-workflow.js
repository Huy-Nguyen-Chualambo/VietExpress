const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const PREFIX = 'KPI0606'
const HOUR_MS = 60 * 60 * 1000

function hoursAgo(now, hours) {
  return new Date(now.getTime() - hours * HOUR_MS)
}

async function ensureCustomer(email, fullName, phone, company) {
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: fullName, passwordHash: 'mock-hash' },
    create: { email, name: fullName, passwordHash: 'mock-hash' },
  })

  return user
}

function buildOrders(now, users) {
  const owner = [users[0].id, users[1].id, users[2].id]

  const templates = [
    { code: '001', user: 0, serviceType: 'express', origin: 'Ha Noi', destination: 'Hai Phong', status: 'completed', createdAgo: 23, etaAfterHours: 8, updatedAfterHours: 7, amount: 980000, location: 'Hai Phong' },
    { code: '002', user: 1, serviceType: 'ltl', origin: 'Da Nang', destination: 'Ha Noi', status: 'completed', createdAgo: 22, etaAfterHours: 14, updatedAfterHours: 13, amount: 1680000, location: 'Ha Noi' },
    { code: '003', user: 2, serviceType: '3pl', origin: 'Can Tho', destination: 'TP. Ho Chi Minh', status: 'completed', createdAgo: 21, etaAfterHours: 10, updatedAfterHours: 12, amount: 1340000, location: 'TP. Ho Chi Minh' },
    { code: '004', user: 0, serviceType: 'ftl', origin: 'Binh Duong', destination: 'Ha Noi', status: 'completed', createdAgo: 20, etaAfterHours: 16, updatedAfterHours: 15, amount: 2860000, location: 'Ha Noi' },
    { code: '005', user: 1, serviceType: 'express', origin: 'TP. Ho Chi Minh', destination: 'Can Tho', status: 'completed', createdAgo: 19, etaAfterHours: 7, updatedAfterHours: 6, amount: 890000, location: 'Can Tho' },
    { code: '006', user: 2, serviceType: 'ltl', origin: 'Ha Noi', destination: 'Da Nang', status: 'completed', createdAgo: 18, etaAfterHours: 13, updatedAfterHours: 12, amount: 1760000, location: 'Da Nang' },
    { code: '007', user: 0, serviceType: '3pl', origin: 'Can Tho', destination: 'Hai Phong', status: 'completed', createdAgo: 17, etaAfterHours: 16, updatedAfterHours: 15, amount: 2480000, location: 'Hai Phong' },
    { code: '008', user: 1, serviceType: 'ftl', origin: 'Da Nang', destination: 'TP. Ho Chi Minh', status: 'completed', createdAgo: 16, etaAfterHours: 12, updatedAfterHours: 11, amount: 2320000, location: 'TP. Ho Chi Minh' },
    { code: '009', user: 2, serviceType: 'express', origin: 'Ha Noi', destination: 'Bac Ninh', status: 'completed', createdAgo: 15, etaAfterHours: 6, updatedAfterHours: 5, amount: 760000, location: 'Bac Ninh' },
    { code: '010', user: 0, serviceType: 'ltl', origin: 'TP. Ho Chi Minh', destination: 'Da Nang', status: 'completed', createdAgo: 14, etaAfterHours: 14, updatedAfterHours: 16, amount: 1820000, location: 'Da Nang' },
    { code: '011', user: 1, serviceType: '3pl', origin: 'Ha Noi', destination: 'Can Tho', status: 'completed', createdAgo: 13, etaAfterHours: 15, updatedAfterHours: 14, amount: 2560000, location: 'Can Tho' },
    { code: '012', user: 2, serviceType: 'ftl', origin: 'Hai Phong', destination: 'Ha Noi', status: 'completed', createdAgo: 12, etaAfterHours: 8, updatedAfterHours: 9, amount: 1240000, location: 'Ha Noi' },
    { code: '013', user: 0, serviceType: 'express', origin: 'Can Tho', destination: 'TP. Ho Chi Minh', status: 'completed', createdAgo: 11, etaAfterHours: 6, updatedAfterHours: 6, amount: 840000, location: 'TP. Ho Chi Minh' },
    { code: '014', user: 1, serviceType: 'ltl', origin: 'Ha Noi', destination: 'Hai Phong', status: 'completed', createdAgo: 10, etaAfterHours: 9, updatedAfterHours: 8, amount: 1120000, location: 'Hai Phong' },
    { code: '015', user: 2, serviceType: '3pl', origin: 'Da Nang', destination: 'Ha Noi', status: 'completed', createdAgo: 9, etaAfterHours: 11, updatedAfterHours: 12, amount: 1940000, location: 'Ha Noi' },
    { code: '016', user: 0, serviceType: 'ftl', origin: 'Binh Duong', destination: 'Can Tho', status: 'completed', createdAgo: 8, etaAfterHours: 9, updatedAfterHours: 8, amount: 1660000, location: 'Can Tho' },
    { code: '017', user: 1, serviceType: 'express', origin: 'TP. Ho Chi Minh', destination: 'Vung Tau', status: 'completed', createdAgo: 7, etaAfterHours: 5, updatedAfterHours: 5, amount: 920000, location: 'Vung Tau' },
    { code: '018', user: 2, serviceType: 'ltl', origin: 'Ha Noi', destination: 'Ninh Binh', status: 'completed', createdAgo: 6, etaAfterHours: 7, updatedAfterHours: 7, amount: 880000, location: 'Ninh Binh' },
    { code: '019', user: 0, serviceType: '3pl', origin: 'Can Tho', destination: 'Ha Noi', status: 'cancelled', createdAgo: 7, etaAfterHours: 15, updatedAfterHours: 2, amount: 2140000, location: 'Can Tho' },
    { code: '020', user: 1, serviceType: 'ftl', origin: 'Da Nang', destination: 'Hai Phong', status: 'cancelled', createdAgo: 5, etaAfterHours: 12, updatedAfterHours: 1.5, amount: 2360000, location: 'Da Nang' },
    { code: '021', user: 2, serviceType: 'ltl', origin: 'Ha Noi', destination: 'TP. Ho Chi Minh', status: 'in_transit', createdAgo: 5, etaAfterHours: 14, updatedAfterHours: 0.8, amount: 1890000, location: 'Da Nang Hub' },
    { code: '022', user: 0, serviceType: 'express', origin: 'TP. Ho Chi Minh', destination: 'Can Tho', status: 'delivering', createdAgo: 4, etaAfterHours: 6, updatedAfterHours: 0.6, amount: 970000, location: 'Can Tho' },
    { code: '023', user: 1, serviceType: '3pl', origin: 'Binh Duong', destination: 'Da Nang', status: 'picked_up', createdAgo: 3, etaAfterHours: 16, updatedAfterHours: 0.5, amount: 2050000, location: 'Binh Duong' },
    { code: '024', user: 2, serviceType: 'ftl', origin: 'Hai Phong', destination: 'Ha Noi', status: 'pending', createdAgo: 2, etaAfterHours: 8, updatedAfterHours: 0.3, amount: 1290000, location: 'Hai Phong' },
  ]

  return templates.map((template) => {
    const createdAt = hoursAgo(now, template.createdAgo)
    const estimatedDelivery = new Date(createdAt.getTime() + template.etaAfterHours * HOUR_MS)
    const updatedAt = new Date(createdAt.getTime() + template.updatedAfterHours * HOUR_MS)

    return {
      id: `${PREFIX}-ORDER-${template.code}`,
      orderCode: `${PREFIX}-${template.code}`,
      userId: owner[template.user],
      origin: template.origin,
      destination: template.destination,
      serviceType: template.serviceType,
      status: template.status,
      currentLocation: template.location,
      weightKg: 80 + Number(template.code),
      totalAmount: template.amount,
      estimatedDelivery,
      createdAt,
      updatedAt,
    }
  })
}

function buildQuoteRequests(now, users) {
  const templates = [
    { id: '001', user: users[0].id, serviceType: 'express', origin: 'Ha Noi', destination: 'Hai Phong', status: 'pending', createdAgo: 21, quotedPrice: 1100000 },
    { id: '002', user: users[1].id, serviceType: 'ltl', origin: 'TP. Ho Chi Minh', destination: 'Da Nang', status: 'quoted', createdAgo: 17, quotedPrice: 1900000 },
    { id: '003', user: users[2].id, serviceType: '3pl', origin: 'Can Tho', destination: 'Ha Noi', status: 'pending', createdAgo: 12, quotedPrice: 2400000 },
    { id: '004', user: users[0].id, serviceType: 'ftl', origin: 'Binh Duong', destination: 'Hai Phong', status: 'accepted', createdAgo: 9, quotedPrice: 2600000 },
    { id: '005', user: users[1].id, serviceType: 'express', origin: 'Ha Noi', destination: 'Ninh Binh', status: 'pending', createdAgo: 5, quotedPrice: 920000 },
    { id: '006', user: users[2].id, serviceType: 'ltl', origin: 'Da Nang', destination: 'TP. Ho Chi Minh', status: 'quoted', createdAgo: 3, quotedPrice: 1750000 },
  ]

  return templates.map((template) => {
    const createdAt = hoursAgo(now, template.createdAgo)
    return {
      id: `${PREFIX}-QUOTE-${template.id}`,
      userId: template.user,
      quoteCode: `${PREFIX}-Q-${template.id}`,
      serviceType: template.serviceType,
      origin: template.origin,
      destination: template.destination,
      status: template.status,
      quotedPrice: template.quotedPrice,
      createdAt,
      updatedAt: createdAt,
      weight: '120kg',
      dimensions: '120x80x90cm',
      note: 'Mock data for KPI workflow 06/06',
    }
  })
}

function buildNotifications(now, users, orders) {
  const records = []
  let idx = 1

  for (const order of orders.slice(0, 24)) {
    const createdAt = hoursAgo(now, 23 - (idx % 20))
    records.push({
      id: `${PREFIX}-NOTIF-${String(idx).padStart(3, '0')}`,
      userId: order.userId,
      type: idx % 7 === 0 ? 'warning' : idx % 5 === 0 ? 'success' : 'info',
      title: `Cập nhật vận đơn ${order.orderCode}`,
      message: `Đơn ${order.orderCode} đang được xử lý tại ${order.currentLocation}.`,
      isRead: idx % 4 === 0,
      orderId: order.id,
      createdAt,
      sentAt: createdAt,
      channel: 'email',
    })
    idx += 1
  }

  for (let i = 0; i < 8; i++) {
    const userId = users[i % users.length].id
    const createdAt = hoursAgo(now, 7 - i * 0.6)
    records.push({
      id: `${PREFIX}-NOTIF-${String(idx).padStart(3, '0')}`,
      userId,
      type: i % 2 === 0 ? 'warning' : 'info',
      title: `Nhắc SLA khung giờ cao điểm #${i + 1}`,
      message: 'Hệ thống phát hiện đơn có nguy cơ chậm SLA, vui lòng theo dõi sát.',
      isRead: i % 3 === 0,
      orderId: orders[(i + 5) % orders.length].id,
      createdAt,
      sentAt: createdAt,
      channel: 'in_app',
    })
    idx += 1
  }

  return records
}

function buildSlaAlerts(now, orders) {
  const targetOrderCodes = ['010', '015', '019', '020', '021']

  return targetOrderCodes.map((suffix, index) => {
    const order = orders.find((item) => item.orderCode === `${PREFIX}-${suffix}`)
    const createdAt = hoursAgo(now, 11 - index * 1.2)
    const severity = index < 2 ? 'high' : 'medium'
    return {
      id: `${PREFIX}-ALERT-${String(index + 1).padStart(3, '0')}`,
      orderId: order ? order.id : null,
      type: 'alert',
      status: index < 3 ? 'open' : 'resolved',
      severity,
      message: order
        ? `Đơn ${order.orderCode} có nguy cơ vi phạm SLA.`
        : 'Đơn hàng có nguy cơ vi phạm SLA.',
      detectedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
      metadata: {
        seedTag: PREFIX,
        riskBand: severity,
      },
    }
  })
}

function buildActionLogs(now, orders) {
  const records = []
  let idx = 1

  const push = (row) => {
    records.push({ id: `${PREFIX}-ACTION-${String(idx).padStart(3, '0')}`, ...row })
    idx += 1
  }

  for (const order of orders.slice(0, 12)) {
    const createdAt = hoursAgo(now, 22 - idx * 0.8)
    push({
      actorId: null,
      mode: 'manual',
      actionType: 'EMPLOYEE_CONFIRM_PICKUP',
      entityType: 'order',
      entityId: order.id,
      metadata: { seedTag: PREFIX },
      createdAt,
    })
    push({
      actorId: null,
      mode: 'automation',
      actionType: 'AUTOMATION_SEND_NOTIFICATION',
      entityType: 'order',
      entityId: order.id,
      metadata: { seedTag: PREFIX },
      createdAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
    })
  }

  const interventionTargets = ['010', '015', '019', '021']
  for (const suffix of interventionTargets) {
    const order = orders.find((item) => item.orderCode === `${PREFIX}-${suffix}`)
    if (!order) continue
    const createdAt = hoursAgo(now, 6 - idx * 0.2)
    push({
      actorId: null,
      mode: 'manual',
      actionType: 'SLA_INTERVENTION_PROACTIVE_CONTACT',
      entityType: 'order',
      entityId: order.id,
      metadata: { reason: 'kpi_workflow_demo', seedTag: PREFIX },
      createdAt,
    })
  }

  const rerouteOrder = orders.find((item) => item.orderCode === `${PREFIX}-021`)
  if (rerouteOrder) {
    push({
      actorId: null,
      mode: 'manual',
      actionType: 'SLA_INTERVENTION_REROUTE',
      entityType: 'order',
      entityId: rerouteOrder.id,
      metadata: { reason: 'route_congestion', seedTag: PREFIX },
      createdAt: hoursAgo(now, 2.5),
    })
  }

  const compensationOrder = orders.find((item) => item.orderCode === `${PREFIX}-020`)
  if (compensationOrder) {
    push({
      actorId: null,
      mode: 'manual',
      actionType: 'SLA_COMPENSATION_TICKET',
      entityType: 'order',
      entityId: compensationOrder.id,
      metadata: { compensation: 450000, seedTag: PREFIX },
      createdAt: hoursAgo(now, 1.5),
    })
  }

  return records
}

async function cleanupOldSeed() {
  await prisma.dailyKpiReport.deleteMany({
    where: {
      rawData: {
        path: ['seedTag'],
        equals: PREFIX,
      },
    },
  })

  await prisma.actionLog.deleteMany({ where: { id: { startsWith: `${PREFIX}-ACTION-` } } })
  await prisma.slaAlert.deleteMany({ where: { id: { startsWith: `${PREFIX}-ALERT-` } } })
  await prisma.notification.deleteMany({ where: { id: { startsWith: `${PREFIX}-NOTIF-` } } })
  await prisma.quoteRequest.deleteMany({ where: { quoteCode: { startsWith: `${PREFIX}-Q-` } } })
  await prisma.order.deleteMany({ where: { orderCode: { startsWith: `${PREFIX}-` } } })
}

async function main() {
  const now = new Date()

  console.log('Seeding realistic KPI workflow data for the last 24 hours...')
  await cleanupOldSeed()

  const users = [
    await ensureCustomer('customer.abc@vietexpress.vn', 'Cong ty ABC Logistics', '0912000001', 'ABC Logistics'),
    await ensureCustomer('customer.xyz@vietexpress.vn', 'Shop XYZ Thuong Mai', '0912000002', 'Shop XYZ'),
    await ensureCustomer('customer.mno@vietexpress.vn', 'Nha may MNO', '0912000003', 'MNO Factory'),
  ]

  const orders = buildOrders(now, users)
  const quoteRequests = buildQuoteRequests(now, users)
  const notifications = buildNotifications(now, users, orders)
  const slaAlerts = buildSlaAlerts(now, orders)
  const actionLogs = buildActionLogs(now, orders)

  await prisma.order.createMany({ data: orders })
  await prisma.quoteRequest.createMany({ data: quoteRequests })
  await prisma.notification.createMany({ data: notifications })
  await prisma.slaAlert.createMany({ data: slaAlerts })
  await prisma.actionLog.createMany({ data: actionLogs })

  console.log(`Inserted ${orders.length} orders, ${quoteRequests.length} quote requests, ${notifications.length} notifications, ${slaAlerts.length} SLA alerts, ${actionLogs.length} action logs.`)
  console.log('Now call GET /api/kpi-report/daily to generate the 06/06 KPI report from realistic mock sources.')
}

main()
  .catch((error) => {
    console.error('KPI workflow seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })