import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import OrderDispatchClient from './OrderDispatchClient'

export default async function EmployeeOrderDispatchPage() {
  // Verify employee session
  await requireEmployeeSession()

  // Fetch all pending orders from the database
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'pending',
    },
    orderBy: {
      createdAt: 'asc', // Process oldest orders first
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  })

  // Normalize data to avoid serialization issues
  const serializedOrders = pendingOrders.map((order) => ({
    id: order.id,
    orderCode: order.orderCode,
    origin: order.origin,
    destination: order.destination,
    serviceType: order.serviceType,
    status: order.status,
    weightKg: order.weightKg,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    user: {
      name: order.user.name,
      profile: order.user.profile
        ? {
            fullName: order.user.profile.fullName,
            company: order.user.profile.company,
          }
        : null,
    },
  }))

  return <OrderDispatchClient initialOrders={serializedOrders} />
}
