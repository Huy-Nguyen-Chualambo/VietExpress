const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function addHours(baseDate, hours) {
  return new Date(baseDate.getTime() + hours * 60 * 60 * 1000)
}

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
  'cao bằng', 'cao bang', 'bắc kạn', 'bac kan', 'thái nguyên', 'thai nguyen', 'hà tĩnh', 'ha tinh',
])

const regionCentral = new Set([
  'quảng bình', 'quang binh', 'quảng trị', 'quang tri', 'thừa thiên huế', 'thua thien hue', 'huế', 'hue',
  'đà nẵng', 'da nang', 'quảng nam', 'quang nam', 'quảng ngãi', 'quang ngai', 'bình định', 'binh dinh',
  'phú yên', 'phu yen', 'khánh hòa', 'khanh hoa', 'ninh thuận', 'ninh thuan', 'bình thuận', 'binh thuan',
])

const regionSouth = new Set([
  'gia lai', 'gialai', 'kon tum', 'kontum', 'đắk lắk', 'dak lak', 'đắk nông', 'dak nong', 'lâm đồng', 'lam dong',
  'tp.hcm', 'tp hcm', 'tp hồ chí minh', 'hồ chí minh', 'ho chi minh', 'bình dương', 'binh duong',
  'đồng nai', 'dong nai', 'bà rịa vũng tàu', 'ba ria vung tau', 'tây ninh', 'tay ninh',
  'bình phước', 'binh phuoc', 'long an', 'tiền giang', 'tien giang', 'bến tre', 'ben tre',
  'vĩnh long', 'vinh long', 'trà vinh', 'tra vinh', 'hậu giang', 'hau giang', 'sóc trăng', 'soc trang',
  'cần thơ', 'can tho', 'cà mau', 'ca mau', 'kiên giang', 'kien giang', 'an giang', 'đồng tháp', 'dong thap',
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
  '3pl': {
    noi_tinh: { standardHours: 24, maxHours: 48 },
    noi_vung: { standardHours: 48, maxHours: 72 },
    lien_vung: { standardHours: 72, maxHours: 96 },
    lien_tinh: { standardHours: 96, maxHours: 120 },
  },
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

async function ensureDemoCustomer(account) {
  const user = await prisma.user.upsert({
    where: { email: account.email },
    update: { name: account.fullName, passwordHash: 'mock-hash' },
    create: { email: account.email, name: account.fullName, passwordHash: 'mock-hash' },
  })

  await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      fullName: account.fullName,
      phone: account.phone,
      company: account.company,
      role: 'customer',
      email: account.email,
    },
    create: {
      id: user.id,
      fullName: account.fullName,
      phone: account.phone,
      company: account.company,
      role: 'customer',
      email: account.email,
    },
  })

  return user
}

async function cleanupDemoData() {
  await prisma.order.deleteMany({
    where: { orderCode: { startsWith: 'VEX-SLA-DEMO-' } },
  })
}

async function seedDemoSlaOrders() {
  await cleanupDemoData()

  const customers = [
    await ensureDemoCustomer({
      fullName: 'Cong ty ABC Logistics',
      email: 'customer.abc@vietexpress.vn',
      phone: '0912000001',
      company: 'ABC Logistics',
    }),
    await ensureDemoCustomer({
      fullName: 'Shop XYZ Thuong Mai',
      email: 'customer.xyz@vietexpress.vn',
      phone: '0912000002',
      company: 'Shop XYZ',
    }),
    await ensureDemoCustomer({
      fullName: 'Nha may MNO',
      email: 'customer.mno@vietexpress.vn',
      phone: '0912000003',
      company: 'MNO Factory',
    }),
  ]

  const now = new Date()
  const samples = [
    {
      orderCode: 'VEX-SLA-DEMO-001',
      customer: customers[0],
      origin: 'TP. Ho Chi Minh',
      destination: 'Ha Noi',
      serviceType: 'ftl',
      status: 'in_transit',
      currentLocation: 'Ninh Binh',
      createdAt: addHours(now, -130),
      trackingEvents: [
        { status: 'picked_up', location: 'TP. Ho Chi Minh', description: 'Picked up from origin', offsetHours: -120 },
        { status: 'in_transit', location: 'Ninh Binh', description: 'Stalled at transfer hub', offsetHours: -40 },
      ],
    },
    {
      orderCode: 'VEX-SLA-DEMO-002',
      customer: customers[1],
      origin: 'Da Nang',
      destination: 'Ha Noi',
      serviceType: 'ltl',
      status: 'in_transit',
      currentLocation: 'Vinh',
      createdAt: addHours(now, -54),
      trackingEvents: [
        { status: 'picked_up', location: 'Da Nang', description: 'Picked up from origin', offsetHours: -50 },
      ],
    },
    {
      orderCode: 'VEX-SLA-DEMO-003',
      customer: customers[2],
      origin: 'Can Tho',
      destination: 'Ha Noi',
      serviceType: '3pl',
      status: 'picked_up',
      currentLocation: 'Can Tho',
      createdAt: addHours(now, -100),
      trackingEvents: [
        { status: 'picked_up', location: 'Can Tho', description: 'Picked up from origin', offsetHours: -2 },
      ],
    },
    {
      orderCode: 'VEX-SLA-DEMO-004',
      customer: customers[0],
      origin: 'Ha Noi',
      destination: 'Hai Phong',
      serviceType: 'express',
      status: 'completed',
      currentLocation: 'Hai Phong',
      createdAt: addHours(now, -2),
      trackingEvents: [
        { status: 'picked_up', location: 'Ha Noi', description: 'Picked up from origin', offsetHours: -6 },
        { status: 'completed', location: 'Hai Phong', description: 'Delivered successfully', offsetHours: -1 },
      ],
    },
  ]

  for (const sample of samples) {
    const estimatedDelivery = getEstimatedDelivery(
      sample.serviceType,
      sample.origin,
      sample.destination,
      sample.createdAt,
    )
    const slaPlan = getSlaDeadline(
      sample.serviceType,
      sample.origin,
      sample.destination,
      sample.createdAt,
      estimatedDelivery,
    )

    const order = await prisma.order.upsert({
      where: { orderCode: sample.orderCode },
      update: {
        userId: sample.customer.id,
        origin: sample.origin,
        destination: sample.destination,
        serviceType: sample.serviceType,
        status: sample.status,
        currentLocation: sample.currentLocation,
        estimatedDelivery,
        createdAt: sample.createdAt,
        weightKg: sample.orderCode === 'VEX-SLA-DEMO-003' ? 1000 : sample.orderCode === 'VEX-SLA-DEMO-002' ? 200 : 500,
        totalAmount: sample.orderCode === 'VEX-SLA-DEMO-003' ? 22000000 : sample.orderCode === 'VEX-SLA-DEMO-002' ? 4500000 : 12000000,
      },
      create: {
        orderCode: sample.orderCode,
        userId: sample.customer.id,
        origin: sample.origin,
        destination: sample.destination,
        serviceType: sample.serviceType,
        status: sample.status,
        currentLocation: sample.currentLocation,
        estimatedDelivery,
        createdAt: sample.createdAt,
        weightKg: sample.orderCode === 'VEX-SLA-DEMO-003' ? 1000 : sample.orderCode === 'VEX-SLA-DEMO-002' ? 200 : 500,
        totalAmount: sample.orderCode === 'VEX-SLA-DEMO-003' ? 22000000 : sample.orderCode === 'VEX-SLA-DEMO-002' ? 4500000 : 12000000,
      },
    })

    await prisma.trackingEvent.deleteMany({ where: { orderId: order.id } })

    for (const event of sample.trackingEvents) {
      await prisma.trackingEvent.create({
        data: {
          orderId: order.id,
          status: event.status,
          location: event.location,
          description: event.description,
          eventTime: addHours(sample.createdAt, event.offsetHours),
        },
      })
    }

    const alertBase = {
      orderId: order.id,
      detectedAt: new Date(),
      metadata: {
        orderCode: sample.orderCode,
        serviceType: sample.serviceType,
        estimatedDelivery,
        standardDelivery: slaPlan.standardDelivery,
        deadline: slaPlan.deadline,
      },
    }

    if (new Date() > slaPlan.deadline) {
      await prisma.slaAlert.upsert({
        where: { id: `sla-alert-${sample.orderCode}` },
        update: {
          ...alertBase,
          type: 'alert',
          status: 'open',
          severity: 'high',
          message: `${sample.orderCode} đã vượt ETA và cần xử lý ngay`,
        },
        create: {
          id: `sla-alert-${sample.orderCode}`,
          ...alertBase,
          type: 'alert',
          status: 'open',
          severity: 'high',
          message: `${sample.orderCode} đã vượt ETA và cần xử lý ngay`,
        },
      })
    } else if (new Date() >= slaPlan.standardDelivery && new Date() <= slaPlan.deadline) {
      await prisma.slaAlert.upsert({
        where: { id: `sla-alert-${sample.orderCode}` },
        update: {
          ...alertBase,
          type: 'warning',
          status: 'open',
          severity: 'medium',
          message: `${sample.orderCode} có nguy cơ trễ trong vài giờ tới`,
        },
        create: {
          id: `sla-alert-${sample.orderCode}`,
          ...alertBase,
          type: 'warning',
          status: 'open',
          severity: 'medium',
          message: `${sample.orderCode} có nguy cơ trễ trong vài giờ tới`,
        },
      })
    } else {
      await prisma.slaAlert.upsert({
        where: { id: `sla-alert-${sample.orderCode}` },
        update: {
          ...alertBase,
          type: 'info',
          status: 'resolved',
          severity: 'low',
          message: `${sample.orderCode} đang vận hành đúng SLA`,
        },
        create: {
          id: `sla-alert-${sample.orderCode}`,
          ...alertBase,
          type: 'info',
          status: 'resolved',
          severity: 'low',
          message: `${sample.orderCode} đang vận hành đúng SLA`,
        },
      })
    }
  }

  console.log('SLA demo data seeded: 3 at-risk orders + 1 completed control order.')
}

seedDemoSlaOrders()
  .catch((error) => {
    console.error('SLA demo seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })