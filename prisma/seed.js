const { randomBytes, scrypt: scryptCallback } = require('crypto')
const { promisify } = require('util')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const scrypt = promisify(scryptCallback)

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
  const customerA = customerUsersByEmail['customer.abc@vietexpress.vn']
  const customerB = customerUsersByEmail['customer.xyz@vietexpress.vn']
  const customerC = customerUsersByEmail['customer.mno@vietexpress.vn']

  const orders = [
    {
      orderCode: 'VEX-2026-0201',
      userId: customerA.id,
      origin: 'TP. Ho Chi Minh',
      destination: 'Ha Noi',
      serviceType: 'ftl',
      status: 'in_transit',
      currentLocation: 'Da Nang',
      weightKg: 850,
      totalAmount: 28000000,
      estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 18),
    },
    {
      orderCode: 'VEX-2026-0202',
      userId: customerB.id,
      origin: 'Ha Noi',
      destination: 'Hai Phong',
      serviceType: 'ltl',
      status: 'delivering',
      currentLocation: 'Hai Phong',
      weightKg: 220,
      totalAmount: 4800000,
      estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 3),
    },
    {
      orderCode: 'VEX-2026-0203',
      userId: customerC.id,
      origin: 'Da Nang',
      destination: 'TP. Ho Chi Minh',
      serviceType: '3pl',
      status: 'pending',
      currentLocation: null,
      weightKg: 1200,
      totalAmount: 32000000,
      estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 42),
    },
    {
      orderCode: 'VEX-2026-0204',
      userId: customerA.id,
      origin: 'Can Tho',
      destination: 'TP. Ho Chi Minh',
      serviceType: 'express',
      status: 'completed',
      currentLocation: 'TP. Ho Chi Minh',
      weightKg: 90,
      totalAmount: 2400000,
      estimatedDelivery: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  ]

  const upsertedOrders = {}
  for (const order of orders) {
    const upserted = await prisma.order.upsert({
      where: { orderCode: order.orderCode },
      update: order,
      create: order,
    })
    upsertedOrders[order.orderCode] = upserted
  }

  const trackingEvents = [
    {
      id: 'trk-vex-2026-0201-1',
      orderId: upsertedOrders['VEX-2026-0201'].id,
      status: 'picked_up',
      location: 'TP. Ho Chi Minh',
      description: 'Da lay hang tai kho Binh Tan',
      eventTime: new Date(Date.now() - 1000 * 60 * 60 * 10),
    },
    {
      id: 'trk-vex-2026-0201-2',
      orderId: upsertedOrders['VEX-2026-0201'].id,
      status: 'in_transit',
      location: 'Da Nang',
      description: 'Xe dang di qua trung tam trung chuyen Da Nang',
      eventTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: 'trk-vex-2026-0202-1',
      orderId: upsertedOrders['VEX-2026-0202'].id,
      status: 'delivering',
      location: 'Hai Phong',
      description: 'Nhan vien dang giao den diem nhan',
      eventTime: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: 'trk-vex-2026-0204-1',
      orderId: upsertedOrders['VEX-2026-0204'].id,
      status: 'completed',
      location: 'TP. Ho Chi Minh',
      description: 'Don hang da giao thanh cong',
      eventTime: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
  ]

  for (const event of trackingEvents) {
    await prisma.trackingEvent.upsert({
      where: { id: event.id },
      update: event,
      create: event,
    })
  }

  const quoteRequests = [
    {
      quoteCode: 'BG-260401-101',
      userId: customerA.id,
      serviceType: 'ftl',
      origin: 'TP. Ho Chi Minh',
      destination: 'Hai Phong',
      weight: '450kg',
      dimensions: '120x120x150cm',
      note: 'Can giao vao gio hanh chinh',
      status: 'pending',
      quotedPrice: null,
    },
    {
      quoteCode: 'BG-260401-102',
      userId: customerB.id,
      serviceType: 'express',
      origin: 'Ha Noi',
      destination: 'Da Nang',
      weight: '80kg',
      dimensions: '50x60x70cm',
      note: null,
      status: 'quoted',
      quotedPrice: 6900000,
    },
  ]

  for (const quote of quoteRequests) {
    await prisma.quoteRequest.upsert({
      where: { quoteCode: quote.quoteCode },
      update: quote,
      create: quote,
    })
  }

  const notifications = [
    {
      id: 'noti-customer-abc-1',
      userId: customerA.id,
      type: 'info',
      title: 'Don hang dang tren duong',
      message: 'VEX-2026-0201 da den Da Nang va dang tiep tuc di Ha Noi.',
      isRead: false,
    },
    {
      id: 'noti-customer-xyz-1',
      userId: customerB.id,
      type: 'success',
      title: 'Don sap giao den noi',
      message: 'VEX-2026-0202 dang trong trang thai giao hang.',
      isRead: false,
    },
    {
      id: 'noti-customer-mno-1',
      userId: customerC.id,
      type: 'warning',
      title: 'Cho xac nhan don moi',
      message: 'Don VEX-2026-0203 dang cho dieu phoi vien xu ly.',
      isRead: false,
    },
  ]

  for (const notification of notifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: notification,
      create: notification,
    })
  }
}

async function main() {
  const employeeSeed = await seedEmployeeAccounts()
  const customerSeed = await seedCustomerAccounts()
  await seedOperationalData(customerSeed.usersByEmail)

  console.log('\nSeeded employee accounts:')
  for (const account of employeeSeed.credentials) {
    console.log(`- ${account.email} / ${account.password}`)
  }

  console.log('\nSeeded customer accounts:')
  for (const account of customerSeed.credentials) {
    console.log(`- ${account.email} / ${account.password}`)
  }

  console.log('\nSeeded sample operations data: orders, tracking events, quote requests, notifications.')
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
