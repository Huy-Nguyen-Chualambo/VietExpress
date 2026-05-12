const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function normalizeProvince(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .normalize('NFC')
}

const regionNorth = new Set([
  'hà nội', 'hanoi', 'hải phòng', 'hai phong', 'quảng ninh', 'quang ninh',
  'bắc ninh', 'bac ninh', 'hưng yên', 'hung yen', 'hải dương', 'hai duong',
  'thái bình', 'thai binh', 'nam định', 'nam dinh', 'ninh bình', 'ninh binh',
  'hà nam', 'ha nam', 'hòa bình', 'hoa binh', 'sơn la', 'son la', 'điện biên', 'dien bien',
  'lào cai', 'lao cai', 'yên bái', 'yen bai', 'tuyên quang', 'tuyen quang',
  'phú thọ', 'phu tho', 'vĩnh phúc', 'vinh phuc', 'bắc giang', 'bac giang', 'lạng sơn', 'lang son',
  'cao bằng', 'cao bang', 'bắc kạn', 'bac kan', 'thái nguyên', 'thai nguyen', 'hà tĩnh', 'ha tinh'
])

const regionCentral = new Set([
  'quảng bình', 'quang binh', 'quảng trị', 'quang tri', 'thừa thiên huế', 'thua thien hue', 'huế', 'hue',
  'đà nẵng', 'da nang', 'quảng nam', 'quang nam', 'quảng ngãi', 'quang ngai', 'bình định', 'binh dinh',
  'phú yên', 'phu yen', 'khánh hòa', 'khanh hoa', 'ninh thuận', 'ninh thuan', 'bình thuận', 'binh thuan'
])

const regionSouth = new Set([
  'gia lai', 'gialai', 'kon tum', 'kontum', 'đắk lắk', 'dak lak', 'đắk nông', 'dak nong', 'lâm đồng', 'lam dong',
  'tp.hcm', 'tp hcm', 'tp hồ chí minh', 'hồ chí minh', 'ho chi minh', 'bình dương', 'binh duong',
  'đồng nai', 'dong nai', 'bà rịa vũng tàu', 'ba ria vung tau', 'tây ninh', 'tay ninh',
  'bình phước', 'binh phuoc', 'long an', 'tiền giang', 'tien giang', 'bến tre', 'ben tre',
  'vĩnh long', 'vinh long', 'trà vinh', 'tra vinh', 'hậu giang', 'hau giang', 'sóc trăng', 'soc trang',
  'cần thơ', 'can tho', 'cà mau', 'ca mau', 'kiên giang', 'kien giang', 'an giang', 'đồng tháp', 'dong thap'
])

function getRegion(province) {
  const norm = normalizeProvince(province)
  if (regionNorth.has(norm)) return 'Bắc'
  if (regionCentral.has(norm)) return 'Trung'
  if (regionSouth.has(norm)) return 'Nam'
  if (/^(hải|hà|hưng|thái|nam|ninh|bắc|cao|lạng|tuyên|phú|vĩnh|yên)/i.test(norm)) return 'Bắc'
  if (/^(quảng|huế|đà|bình|phú|khánh|ninh|thuận)/i.test(norm)) return 'Trung'
  return 'Nam'
}

function classifyRoute(origin, destination) {
  const oNorm = normalizeProvince(origin)
  const dNorm = normalizeProvince(destination)
  if (oNorm === dNorm) return 'noi_tinh'
  const regO = getRegion(origin)
  const regD = getRegion(destination)
  if (regO === regD) return 'noi_vung'
  const pair = [regO, regD].sort().join('-')
  if (pair === 'Bắc-Trung' || pair === 'Nam-Trung') return 'lien_vung'
  return 'lien_tinh'
}

const transitMatrix = {
  ltl: {
    noi_tinh: { standardHours: 8, maxHours: 12 },
    noi_vung: { standardHours: 24, maxHours: 48 },
    lien_vung: { standardHours: 48, maxHours: 96 },
    lien_tinh: { standardHours: 72, maxHours: 96 },
  },
  express: {
    noi_tinh: { standardHours: 4, maxHours: 6 },
    noi_vung: { standardHours: 18, maxHours: 24 },
    lien_vung: { standardHours: 24, maxHours: 48 },
    lien_tinh: { standardHours: 36, maxHours: 48 },
  },
  ftl: {
    noi_tinh: { standardHours: 24, maxHours: 48 },
    noi_vung: { standardHours: 48, maxHours: 72 },
    lien_vung: { standardHours: 72, maxHours: 96 },
    lien_tinh: { standardHours: 96, maxHours: 120 },
  },
  cold: {
    noi_tinh: { standardHours: 30, maxHours: 54 },
    noi_vung: { standardHours: 54, maxHours: 78 },
    lien_vung: { standardHours: 84, maxHours: 108 },
    lien_tinh: { standardHours: 108, maxHours: 132 },
  },
  '3pl': {
    noi_tinh: { standardHours: 24, maxHours: 48 },
    noi_vung: { standardHours: 48, maxHours: 72 },
    lien_vung: { standardHours: 72, maxHours: 96 },
    lien_tinh: { standardHours: 96, maxHours: 120 },
  },
  doc: {
    noi_tinh: { standardHours: 24, maxHours: 48 },
    noi_vung: { standardHours: 48, maxHours: 72 },
    lien_vung: { standardHours: 72, maxHours: 96 },
    lien_tinh: { standardHours: 96, maxHours: 120 },
  },
}

function addHours(baseDate, hours) {
  return new Date(baseDate.getTime() + hours * 60 * 60 * 1000)
}

function getEstimatedDelivery(serviceType, origin, destination, baseDate) {
  const routeBand = classifyRoute(origin, destination)
  const serviceKey = String(serviceType || '').toLowerCase()
  const windows = transitMatrix[serviceKey] || transitMatrix.ftl
  return addHours(baseDate, windows[routeBand].standardHours)
}

function getSlaDeadline(serviceType, origin, destination, baseDate, estimatedDelivery) {
  const routeBand = classifyRoute(origin, destination)
  const serviceKey = String(serviceType || '').toLowerCase()
  const windows = transitMatrix[serviceKey] || transitMatrix.ftl
  const standardDelivery = estimatedDelivery || addHours(baseDate, windows[routeBand].standardHours)
  const bufferHours = 24
  const extraHoursBeyondStandard = Math.max(0, windows[routeBand].maxHours - windows[routeBand].standardHours)

  return {
    routeBand,
    standardDelivery,
    maxDelivery: addHours(standardDelivery, extraHoursBeyondStandard),
    deadline: addHours(standardDelivery, extraHoursBeyondStandard + bufferHours),
  }
}

async function seedSlaSamples() {
  // Orders to represent different SLA states
  const samples = [
    // Breached: ETA in past, still not completed
    {
      orderCode: 'VEX-SLA-BREACH-001',
      userEmail: 'customer.abc@vietexpress.vn',
      origin: 'TP. Ho Chi Minh',
      destination: 'Ha Noi',
      serviceType: 'ftl',
      status: 'in_transit',
      currentLocation: 'Ninh Binh',
      weightKg: 500,
      totalAmount: 12000000,
      createdAt: addHours(new Date(), -130),
      trackingEvents: [
        { status: 'picked_up', location: 'TP. Ho Chi Minh', description: 'Picked up', eventTime: addHours(new Date(), -120) },
        { status: 'in_transit', location: 'Ninh Binh', description: 'Stalled at transfer', eventTime: addHours(new Date(), -40) },
      ],
    },

    // Near-miss: ETA in ~2 hours but last tracking old -> candidate for predictive alert
    {
      orderCode: 'VEX-SLA-NEARMISS-002',
      userEmail: 'customer.xyz@vietexpress.vn',
      origin: 'Da Nang',
      destination: 'Ha Noi',
      serviceType: 'ltl',
      status: 'in_transit',
      currentLocation: 'Ninh Binh',
      weightKg: 200,
      totalAmount: 4500000,
      createdAt: addHours(new Date(), -54),
      trackingEvents: [
        { status: 'picked_up', location: 'Da Nang', description: 'Picked up', eventTime: addHours(new Date(), -50) },
      ],
    },

    // At-risk: ETA in 8 hours but only picked_up and long distance left
    {
      orderCode: 'VEX-SLA-ATRISK-003',
      userEmail: 'customer.mno@vietexpress.vn',
      origin: 'Can Tho',
      destination: 'Ha Noi',
      serviceType: '3pl',
      status: 'picked_up',
      currentLocation: 'Can Tho',
      weightKg: 1000,
      totalAmount: 22000000,
      createdAt: addHours(new Date(), -100),
      trackingEvents: [
        { status: 'picked_up', location: 'Can Tho', description: 'Picked up', eventTime: addHours(new Date(), -2) },
      ],
    },

    // On-time control
    {
      orderCode: 'VEX-SLA-ONTIME-004',
      userEmail: 'customer.abc@vietexpress.vn',
      origin: 'Ha Noi',
      destination: 'Hai Phong',
      serviceType: 'express',
      status: 'delivering',
      currentLocation: 'Hai Phong',
      weightKg: 50,
      totalAmount: 900000,
      createdAt: addHours(new Date(), -2),
      trackingEvents: [
        { status: 'picked_up', location: 'Ha Noi', description: 'Picked up', eventTime: addHours(new Date(), -6) },
        { status: 'in_transit', location: 'Bac Ninh', description: 'On route', eventTime: addHours(new Date(), -3) },
      ],
    },
  ]

  // Helper: find user id by email
  async function findUserByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } })
    return user
  }

  for (const s of samples) {
    const user = await findUserByEmail(s.userEmail)
    if (!user) {
      console.warn(`Skipping ${s.orderCode}: user ${s.userEmail} not found`)
      continue
    }

    const orderData = {
      orderCode: s.orderCode,
      userId: user.id,
      origin: s.origin,
      destination: s.destination,
      serviceType: s.serviceType,
      status: s.status,
      currentLocation: s.currentLocation,
      weightKg: s.weightKg,
      totalAmount: s.totalAmount,
      createdAt: s.createdAt,
      estimatedDelivery: getEstimatedDelivery(s.serviceType, s.origin, s.destination, s.createdAt),
    }

    const order = await prisma.order.upsert({ where: { orderCode: s.orderCode }, update: orderData, create: orderData })
    const slaPlan = getSlaDeadline(s.serviceType, s.origin, s.destination, s.createdAt, orderData.estimatedDelivery)

    // upsert tracking events
    for (let i = 0; i < s.trackingEvents.length; i++) {
      const e = s.trackingEvents[i]
      const id = `sla-${s.orderCode}-${i + 1}`
      await prisma.trackingEvent.upsert({
        where: { id },
        update: { ...e, orderId: order.id },
        create: { id, orderId: order.id, ...e },
      })
    }

    const alertBase = {
      orderId: order.id,
      detectedAt: new Date(),
      metadata: {
        orderCode: s.orderCode,
        serviceType: s.serviceType,
        estimatedDelivery: orderData.estimatedDelivery,
        standardDelivery: slaPlan.standardDelivery,
        deadline: slaPlan.deadline,
      },
    }

    if (new Date() > slaPlan.deadline) {
      await prisma.slaAlert.upsert({
        where: { id: `sla-alert-${s.orderCode}` },
        update: {
          ...alertBase,
          type: 'alert',
          status: 'open',
          severity: 'high',
          message: `${s.orderCode} đã vượt ETA và cần xử lý ngay`,
        },
        create: {
          id: `sla-alert-${s.orderCode}`,
          ...alertBase,
          type: 'alert',
          status: 'open',
          severity: 'high',
          message: `${s.orderCode} đã vượt ETA và cần xử lý ngay`,
        },
      })
    } else if (new Date() >= slaPlan.standardDelivery && new Date() <= slaPlan.deadline) {
      await prisma.slaAlert.upsert({
        where: { id: `sla-alert-${s.orderCode}` },
        update: {
          ...alertBase,
          type: 'warning',
          status: 'open',
          severity: 'medium',
          message: `${s.orderCode} có nguy cơ trễ trong vài giờ tới`,
        },
        create: {
          id: `sla-alert-${s.orderCode}`,
          ...alertBase,
          type: 'warning',
          status: 'open',
          severity: 'medium',
          message: `${s.orderCode} có nguy cơ trễ trong vài giờ tới`,
        },
      })
    } else {
      await prisma.slaAlert.upsert({
        where: { id: `sla-alert-${s.orderCode}` },
        update: {
          ...alertBase,
          type: 'info',
          status: 'resolved',
          severity: 'low',
          message: `${s.orderCode} đang vận hành đúng SLA`,
        },
        create: {
          id: `sla-alert-${s.orderCode}`,
          ...alertBase,
          type: 'info',
          status: 'resolved',
          severity: 'low',
          message: `${s.orderCode} đang vận hành đúng SLA`,
        },
      })
    }

    // create notification for at-risk / breach to simulate alert
    if (new Date() > slaPlan.deadline) {
      await prisma.notification.upsert({
        where: { id: `sla-alert-${s.orderCode}` },
        update: { title: 'SLA Breach', message: `${s.orderCode} đã vượt ETA`, type: 'warning', isRead: false, userId: user.id },
        create: { id: `sla-alert-${s.orderCode}`, title: 'SLA Breach', message: `${s.orderCode} đã vượt ETA`, type: 'warning', isRead: false, userId: user.id },
      })
    } else if (new Date() >= slaPlan.standardDelivery && new Date() <= slaPlan.deadline) {
      await prisma.notification.upsert({
        where: { id: `sla-warning-${s.orderCode}` },
        update: { title: 'SLA Near Miss', message: `${s.orderCode} có nguy cơ trễ trong vài giờ`, type: 'info', isRead: false, userId: user.id },
        create: { id: `sla-warning-${s.orderCode}`, title: 'SLA Near Miss', message: `${s.orderCode} có nguy cơ trễ trong vài giờ`, type: 'info', isRead: false, userId: user.id },
      })
    }
  }

  console.log('SLA sample data seeded.')
}

seedSlaSamples()
  .catch((e) => {
    console.error('SLA seed failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
