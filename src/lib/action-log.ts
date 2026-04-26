import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type ActionLogDelegate = {
  create: (args: { data: Prisma.ActionLogCreateInput }) => Promise<unknown>
  count: (args?: { where?: Prisma.ActionLogWhereInput }) => Promise<number>
}

function getActionLogDelegate(): ActionLogDelegate | null {
  const runtime = prisma as unknown as { actionLog?: ActionLogDelegate }
  return runtime.actionLog ?? null
}

function isMissingActionLogTableError(error: unknown) {
  if (typeof error !== 'object' || error === null) return false
  const code = (error as { code?: string }).code
  return code === 'P2021'
}

export async function safeCreateActionLog(data: Prisma.ActionLogCreateInput) {
  const delegate = getActionLogDelegate()
  if (!delegate) return

  try {
    await delegate.create({ data })
  } catch (error) {
    if (isMissingActionLogTableError(error)) {
      return
    }
    throw error
  }
}

export async function safeCountActionLogs(where: Prisma.ActionLogWhereInput) {
  const delegate = getActionLogDelegate()
  if (!delegate) return 0

  try {
    return await delegate.count({ where })
  } catch (error) {
    if (isMissingActionLogTableError(error)) {
      return 0
    }
    throw error
  }
}
