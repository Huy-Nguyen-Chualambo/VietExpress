import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import { formatCurrencyVnd } from '@/lib/customer-portal'
import { BarChart3, Package, TrendingUp, Users } from 'lucide-react'

export default async function EmployeeStatsPage() {
  await requireEmployeeSession()

  const [
    totalOrders,
    completedOrders,
    cancelledOrders,
    pendingQuotes,
    totalCustomers,
    totalEmployees,
    revenueSummary,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'completed' } }),
    prisma.order.count({ where: { status: 'cancelled' } }),
    prisma.quoteRequest.count({ where: { status: 'pending' } }),
    prisma.profile.count({ where: { role: 'customer' } }),
    prisma.profile.count({ where: { role: 'employee' } }),
    prisma.order.aggregate({
      where: { status: 'completed' },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
    }),
  ])

  const completionRate = totalOrders === 0 ? 0 : Math.round((completedOrders / totalOrders) * 100)

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-border/50 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Thong ke</p>
        <h1 className="text-2xl font-bold font-display">Bao cao tong hop van hanh</h1>
        <p className="text-sm text-muted-foreground mt-2">So lieu tong hop tu don hang, bao gia va thong tin nguoi dung.</p>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <Package className="w-5 h-5 text-brand mb-3" />
          <div className="text-2xl font-bold font-display">{totalOrders.toLocaleString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground">Tong don hang</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <TrendingUp className="w-5 h-5 text-green-600 mb-3" />
          <div className="text-2xl font-bold font-display">{completionRate}%</div>
          <div className="text-sm text-muted-foreground">Ty le hoan thanh</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <BarChart3 className="w-5 h-5 text-amber-600 mb-3" />
          <div className="text-2xl font-bold font-display">{pendingQuotes.toLocaleString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground">Bao gia dang cho</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <Users className="w-5 h-5 text-blue-600 mb-3" />
          <div className="text-2xl font-bold font-display">{totalCustomers.toLocaleString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground">Khach hang dang hoat dong</div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-2">
          <h2 className="text-base font-semibold font-display">Doanh thu</h2>
          <div className="text-2xl font-bold font-display">{formatCurrencyVnd(revenueSummary._sum.totalAmount ?? 0)}</div>
          <div className="text-sm text-muted-foreground">Tong doanh thu tu don hoan thanh</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-2">
          <h2 className="text-base font-semibold font-display">Gia tri don trung binh</h2>
          <div className="text-2xl font-bold font-display">{formatCurrencyVnd(Math.round(revenueSummary._avg.totalAmount ?? 0))}</div>
          <div className="text-sm text-muted-foreground">Tinh theo cac don da co gia tri</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-2">
          <h2 className="text-base font-semibold font-display">Nhan su va rui ro</h2>
          <div className="text-sm text-muted-foreground">Nhan vien: {totalEmployees}</div>
          <div className="text-sm text-muted-foreground">Don bi huy: {cancelledOrders}</div>
          <div className="text-sm text-muted-foreground">Don hoan thanh: {completedOrders}</div>
        </div>
      </section>
    </div>
  )
}
