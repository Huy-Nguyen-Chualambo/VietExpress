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

async function seedOrdersExtended() {
  console.log('🌱 Starting extended orders seed...\n')

  // Get first customer user (or create)
  let customer = await prisma.user.findFirst({
    where: { profile: { role: 'customer' } },
  })
  if (!customer) {
    console.warn('⚠️  No customer user found. Creating one...')
    customer = await prisma.user.create({
      data: {
        email: 'demo.customer.ext@vietexpress.vn',
        profile: { create: { name: 'Demo Customer Extended', role: 'customer' } },
      },
    })
  }

  const samples = [
    // === Nội tỉnh routes ===
    {
      orderCode: 'VEX-EXT-HN-001',
      origin: 'Hà Nội',
      destination: 'Bắc Ninh',
      serviceType: 'express',
      status: 'in_transit',
      currentLocation: 'Bắc Ninh',
      weightKg: 50,
      totalAmount: 450000,
      createdAt: addHours(new Date(), -2),
      trackingEvents: [
        { status: 'picked_up', location: 'Hà Nội', description: 'Picked up from warehouse', eventTime: addHours(new Date(), -2) },
        { status: 'in_transit', location: 'Bắc Ninh', description: 'On route to destination', eventTime: addHours(new Date(), -0.5) },
      ],
    },
    {
      orderCode: 'VEX-EXT-HCM-001',
      origin: 'TP. Hồ Chí Minh',
      destination: 'Bình Dương',
      serviceType: 'ltl',
      status: 'delivering',
      currentLocation: 'Bình Dương',
      weightKg: 150,
      totalAmount: 1200000,
      createdAt: addHours(new Date(), -4),
      trackingEvents: [
        { status: 'picked_up', location: 'TP. Hồ Chí Minh', description: 'Picked up', eventTime: addHours(new Date(), -4) },
        { status: 'in_transit', location: 'Long An', description: 'Checkpoint', eventTime: addHours(new Date(), -2) },
        { status: 'delivering', location: 'Bình Dương', description: 'Out for delivery', eventTime: addHours(new Date(), -0.5) },
      ],
    },

    // === Nội vùng routes ===
    {
      orderCode: 'VEX-EXT-DN-001',
      origin: 'Đà Nẵng',
      destination: 'Huế',
      serviceType: 'express',
      status: 'in_transit',
      currentLocation: 'Quảng Trị',
      weightKg: 80,
      totalAmount: 720000,
      createdAt: addHours(new Date(), -8),
      trackingEvents: [
        { status: 'picked_up', location: 'Đà Nẵng', description: 'Picked up', eventTime: addHours(new Date(), -8) },
        { status: 'in_transit', location: 'Quảng Trị', description: 'Midway checkpoint', eventTime: addHours(new Date(), -3) },
      ],
    },
    {
      orderCode: 'VEX-EXT-HCM-002',
      origin: 'TP. Hồ Chí Minh',
      destination: 'Vũng Tàu',
      serviceType: 'ltl',
      status: 'completed',
      currentLocation: 'Vũng Tàu',
      weightKg: 200,
      totalAmount: 1600000,
      createdAt: addHours(new Date(), -24),
      trackingEvents: [
        { status: 'picked_up', location: 'TP. Hồ Chí Minh', description: 'Picked up', eventTime: addHours(new Date(), -24) },
        { status: 'in_transit', location: 'Long Thành', description: 'Checkpoint', eventTime: addHours(new Date(), -20) },
        { status: 'completed', location: 'Vũng Tàu', description: 'Delivered', eventTime: addHours(new Date(), -10) },
      ],
    },

    // === Liên vùng routes ===
    {
      orderCode: 'VEX-EXT-LINK-001',
      origin: 'Hà Nội',
      destination: 'Đà Nẵng',
      serviceType: 'ftl',
      status: 'in_transit',
      currentLocation: 'Thanh Hóa',
      weightKg: 2000,
      totalAmount: 8000000,
      createdAt: addHours(new Date(), -24),
      trackingEvents: [
        { status: 'picked_up', location: 'Hà Nội', description: 'Picked up from warehouse', eventTime: addHours(new Date(), -24) },
        { status: 'in_transit', location: 'Thanh Hóa', description: 'Major checkpoint', eventTime: addHours(new Date(), -10) },
      ],
    },
    {
      orderCode: 'VEX-EXT-LINK-002',
      origin: 'TP. Hồ Chí Minh',
      destination: 'Đà Nẵng',
      serviceType: 'express',
      status: 'in_transit',
      currentLocation: 'Khánh Hòa',
      weightKg: 100,
      totalAmount: 2500000,
      createdAt: addHours(new Date(), -20),
      trackingEvents: [
        { status: 'picked_up', location: 'TP. Hồ Chí Minh', description: 'Express pickup', eventTime: addHours(new Date(), -20) },
        { status: 'in_transit', location: 'Khánh Hòa', description: 'En route', eventTime: addHours(new Date(), -4) },
      ],
    },

    // === Liên tỉnh routes (Bắc-Nam) ===
    {
      orderCode: 'VEX-EXT-LT-001',
      origin: 'Hà Nội',
      destination: 'TP. Hồ Chí Minh',
      serviceType: '3pl',
      status: 'picked_up',
      currentLocation: 'Hà Nội',
      weightKg: 5000,
      totalAmount: 15000000,
      createdAt: addHours(new Date(), -12),
      trackingEvents: [
        { status: 'picked_up', location: 'Hà Nội', description: 'Picked up for consolidation', eventTime: addHours(new Date(), -12) },
      ],
    },
    {
      orderCode: 'VEX-EXT-LT-002',
      origin: 'TP. Hồ Chí Minh',
      destination: 'Hà Nội',
      serviceType: 'cold',
      status: 'in_transit',
      currentLocation: 'Vinh',
      weightKg: 300,
      totalAmount: 5000000,
      createdAt: addHours(new Date(), -30),
      trackingEvents: [
        { status: 'picked_up', location: 'TP. Hồ Chí Minh', description: 'Picked up - refrigerated', eventTime: addHours(new Date(), -30) },
        { status: 'in_transit', location: 'Cần Thơ', description: 'Checkpoint', eventTime: addHours(new Date(), -22) },
        { status: 'in_transit', location: 'Vinh', description: 'Major station', eventTime: addHours(new Date(), -10) },
      ],
    },

    // === Pending/Recent orders ===
    {
      orderCode: 'VEX-EXT-NEW-001',
      origin: 'Hà Nội',
      destination: 'Hải Phòng',
      serviceType: 'express',
      status: 'pending',
      currentLocation: 'Hà Nội',
      weightKg: 30,
      totalAmount: 300000,
      createdAt: addHours(new Date(), -0.5),
      trackingEvents: [],
    },
    {
      orderCode: 'VEX-EXT-NEW-002',
      origin: 'TP. Hồ Chí Minh',
      destination: 'Cần Thơ',
      serviceType: 'ltl',
      status: 'pending',
      currentLocation: 'TP. Hồ Chí Minh',
      weightKg: 120,
      totalAmount: 900000,
      createdAt: addHours(new Date(), -0.25),
      trackingEvents: [],
    },
  ]

  for (const s of samples) {
    try {
      const orderData = {
        orderCode: s.orderCode,
        userId: customer.id,
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

      const order = await prisma.order.upsert({
        where: { orderCode: s.orderCode },
        update: orderData,
        create: orderData,
      })

      const slaPlan = getSlaDeadline(s.serviceType, s.origin, s.destination, s.createdAt, orderData.estimatedDelivery)

      // Upsert tracking events
      for (let i = 0; i < s.trackingEvents.length; i++) {
        const e = s.trackingEvents[i]
        const id = `ext-${s.orderCode}-${i + 1}`
        await prisma.trackingEvent.upsert({
          where: { id },
          update: { ...e, orderId: order.id },
          create: { id, orderId: order.id, ...e },
        })
      }

      // Create SLA alert if at-risk or breached
      const now = new Date()
      let alertType = 'info'
      let alertStatus = 'resolved'
      let alertSeverity = 'low'
      let alertMessage = `${s.orderCode} đang vận hành đúng SLA`

      if (now > slaPlan.deadline) {
        alertType = 'alert'
        alertStatus = 'open'
        alertSeverity = 'high'
        alertMessage = `${s.orderCode} đã vượt deadline SLA`
      } else if (now >= slaPlan.standardDelivery && now <= slaPlan.deadline) {
        alertType = 'warning'
        alertStatus = 'open'
        alertSeverity = 'medium'
        alertMessage = `${s.orderCode} đang ở trạng thái cảnh báo SLA`
      }

      await prisma.slaAlert.upsert({
        where: { id: `sla-alert-${s.orderCode}` },
        update: {
          orderId: order.id,
          type: alertType,
          status: alertStatus,
          severity: alertSeverity,
          message: alertMessage,
          detectedAt: new Date(),
          metadata: {
            routeBand: slaPlan.routeBand,
            estimatedDelivery: orderData.estimatedDelivery,
            standardDelivery: slaPlan.standardDelivery,
            maxDelivery: slaPlan.maxDelivery,
            deadline: slaPlan.deadline,
          },
        },
        create: {
          id: `sla-alert-${s.orderCode}`,
          orderId: order.id,
          type: alertType,
          status: alertStatus,
          severity: alertSeverity,
          message: alertMessage,
          detectedAt: new Date(),
          metadata: {
            routeBand: slaPlan.routeBand,
            estimatedDelivery: orderData.estimatedDelivery,
            standardDelivery: slaPlan.standardDelivery,
            maxDelivery: slaPlan.maxDelivery,
            deadline: slaPlan.deadline,
          },
        },
      })

      console.log(`✓ Seeded ${s.orderCode} (${s.serviceType}, ${s.origin} → ${s.destination}, ${s.status})`)
    } catch (error) {
      console.error(`✗ Failed to seed ${s.orderCode}:`, error.message)
    }
  }

  console.log('\n✅ Extended orders seed completed!\n')
}

seedOrdersExtended()
  .catch((e) => {
    console.error('🚨 Seed failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
