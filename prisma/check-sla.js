const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function run() {
  try {
    const alerts = await prisma.slaAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        severity: true,
        message: true,
        orderId: true,
        detectedAt: true,
      },
    })

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { id: { startsWith: 'sla-' } },
          { id: { startsWith: 'sla-alert-' } },
          { id: { startsWith: 'sla-warning-' } },
          { title: { contains: 'SLA' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    console.log(`Found ${alerts.length} SLA alert row(s):`)
    if (alerts.length === 0) {
      console.log('- none')
    } else {
      for (const alert of alerts) {
        console.log(`- id=${alert.id} type=${alert.type} status=${alert.status} severity=${alert.severity} orderId=${alert.orderId}`)
      }
    }

    console.log(`Found ${notifications.length} SLA notification(s):`)
    if (notifications.length === 0) {
      console.log('- none')
    } else {
      for (const notification of notifications) {
        console.log(`- id=${notification.id} userId=${notification.userId} type=${notification.type} title=${notification.title} isRead=${notification.isRead}`)
      }
    }
  } catch (e) {
    console.error('Error querying SLA SLA data:', e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

run()
