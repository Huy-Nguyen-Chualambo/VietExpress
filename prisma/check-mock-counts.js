const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const whereOrders = { orderCode: { startsWith: 'VEX-MOCK-' } }

  const orders = await prisma.order.count({ where: whereOrders })
  const failed = await prisma.order.count({ where: { ...whereOrders, status: 'failed' } })
  const alerts = await prisma.slaAlert.count({
    where: { message: { contains: 'VEX-MOCK-' } },
  })
  const notifications = await prisma.notification.count({
    where: { title: { startsWith: 'Order VEX-MOCK-' } },
  })

  console.log(JSON.stringify({ orders, failed, alerts, notifications }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
