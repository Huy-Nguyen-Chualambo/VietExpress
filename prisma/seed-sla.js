const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000)
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
      estimatedDelivery: hoursFromNow(-6), // 6 hours ago => breach
      trackingEvents: [
        { status: 'picked_up', location: 'TP. Ho Chi Minh', description: 'Picked up', eventTime: hoursFromNow(-48) },
        { status: 'in_transit', location: 'Ninh Binh', description: 'Stalled at transfer', eventTime: hoursFromNow(-10) },
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
      estimatedDelivery: hoursFromNow(2), // in 2 hours
      trackingEvents: [
        { status: 'picked_up', location: 'Da Nang', description: 'Picked up', eventTime: hoursFromNow(-20) },
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
      estimatedDelivery: hoursFromNow(8),
      trackingEvents: [
        { status: 'picked_up', location: 'Can Tho', description: 'Picked up', eventTime: hoursFromNow(-2) },
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
      estimatedDelivery: hoursFromNow(24),
      trackingEvents: [
        { status: 'picked_up', location: 'Ha Noi', description: 'Picked up', eventTime: hoursFromNow(-6) },
        { status: 'in_transit', location: 'Bac Ninh', description: 'On route', eventTime: hoursFromNow(-3) },
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
      estimatedDelivery: s.estimatedDelivery,
    }

    const order = await prisma.order.upsert({ where: { orderCode: s.orderCode }, update: orderData, create: orderData })

    // upsert tracking events
    for (let i = 0; i < s.trackingEvents.length; i++) {
      const e = s.trackingEvents[i]
      const id = `sla-${s.orderCode}-${i + 1}`
      await prisma.trackingEvent.upsert({ where: { id }, update: { ...e, orderId: order.id }, create: { id, orderId: order.id, ...e } })
    }

    const alertBase = {
      orderId: order.id,
      detectedAt: new Date(),
      metadata: {
        orderCode: s.orderCode,
        serviceType: s.serviceType,
        estimatedDelivery: s.estimatedDelivery,
      },
    }

    if (s.orderCode === 'VEX-SLA-BREACH-001') {
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
    } else if (s.orderCode === 'VEX-SLA-NEARMISS-002') {
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
    } else if (s.orderCode === 'VEX-SLA-ATRISK-003') {
      await prisma.slaAlert.upsert({
        where: { id: `sla-alert-${s.orderCode}` },
        update: {
          ...alertBase,
          type: 'warning',
          status: 'open',
          severity: 'medium',
          message: `${s.orderCode} đang ở trạng thái rủi ro SLA`,
        },
        create: {
          id: `sla-alert-${s.orderCode}`,
          ...alertBase,
          type: 'warning',
          status: 'open',
          severity: 'medium',
          message: `${s.orderCode} đang ở trạng thái rủi ro SLA`,
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
    if (s.status === 'in_transit' && s.estimatedDelivery < new Date()) {
      await prisma.notification.upsert({
        where: { id: `sla-alert-${s.orderCode}` },
        update: { title: 'SLA Breach', message: `${s.orderCode} đã vượt ETA`, type: 'warning', isRead: false, userId: user.id },
        create: { id: `sla-alert-${s.orderCode}`, title: 'SLA Breach', message: `${s.orderCode} đã vượt ETA`, type: 'warning', isRead: false, userId: user.id },
      })
    } else if (s.estimatedDelivery - Date.now() < 1000 * 60 * 60 * 3) {
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
