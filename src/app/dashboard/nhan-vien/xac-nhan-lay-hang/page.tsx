import { requireEmployeeSession } from '@/lib/employee-portal'
import { prisma } from '@/lib/prisma'
import PickupConfirmationClient from './client'

export default async function PickupConfirmationPage() {
  await requireEmployeeSession()

  const [orders, pendingCount] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    }),
    prisma.order.count({ where: { status: 'pending' } }),
  ])

  return <PickupConfirmationClient orders={orders} pendingCount={pendingCount} />
}

