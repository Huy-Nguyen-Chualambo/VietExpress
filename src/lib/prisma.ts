import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })
}

function hasCustomerPortalDelegates(client: PrismaClient | undefined) {
  if (!client) return false
  const runtime = client as unknown as Record<string, unknown>

  // In dev + HMR, a stale singleton may come from an older generated client.
  return Boolean(runtime.order && runtime.quoteRequest && runtime.notification)
}

export const prisma = hasCustomerPortalDelegates(globalForPrisma.prisma)
  ? globalForPrisma.prisma!
  : createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
