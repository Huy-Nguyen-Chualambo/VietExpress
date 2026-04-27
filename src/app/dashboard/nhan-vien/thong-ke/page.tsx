import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import { formatCurrencyVnd } from '@/lib/customer-portal'
import { safeCountActionLogs } from '@/lib/action-log'
import { BarChart3, Package, TrendingUp, Users } from 'lucide-react'

function getStartOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export default async function EmployeeStatsPage() {
  await requireEmployeeSession()

  const startOfToday = getStartOfToday()

  const [
    totalOrders,
    completedOrders,
    cancelledOrders,
    pendingQuotes,
    totalCustomers,
    totalEmployees,
    revenueSummary,
    manualActionsToday,
    automationActionsToday,
    manualOrderCreatesToday,
    manualPickupConfirmsToday,
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
    safeCountActionLogs({
      mode: 'manual',
      createdAt: { gte: startOfToday },
    }),
    safeCountActionLogs({
      mode: 'automation',
      createdAt: { gte: startOfToday },
    }),
    safeCountActionLogs({
      mode: 'manual',
      actionType: 'CUSTOMER_CREATE_ORDER',
      createdAt: { gte: startOfToday },
    }),
    safeCountActionLogs({
      mode: 'manual',
      actionType: 'EMPLOYEE_CONFIRM_PICKUP',
      createdAt: { gte: startOfToday },
    }),
  ])

  const completionRate = totalOrders === 0 ? 0 : Math.round((completedOrders / totalOrders) * 100)

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-border/50 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Thống kê</p>
        <h1 className="text-2xl font-bold font-display">Báo cáo tổng hợp vận hành</h1>
        <p className="text-sm text-muted-foreground mt-2">Số liệu tổng hợp từ đơn hàng, báo giá và thông tin người dùng.</p>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <Package className="w-5 h-5 text-brand mb-3" />
          <div className="text-2xl font-bold font-display">{totalOrders.toLocaleString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground">Tổng đơn hàng</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <TrendingUp className="w-5 h-5 text-green-600 mb-3" />
          <div className="text-2xl font-bold font-display">{completionRate}%</div>
          <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <BarChart3 className="w-5 h-5 text-amber-600 mb-3" />
          <div className="text-2xl font-bold font-display">{pendingQuotes.toLocaleString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground">Báo giá đang chờ</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <Users className="w-5 h-5 text-blue-600 mb-3" />
          <div className="text-2xl font-bold font-display">{totalCustomers.toLocaleString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground">Khách hàng đang hoạt động</div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-2">
          <h2 className="text-base font-semibold font-display">Doanh thu</h2>
          <div className="text-2xl font-bold font-display">{formatCurrencyVnd(revenueSummary._sum.totalAmount ?? 0)}</div>
          <div className="text-sm text-muted-foreground">Tổng doanh thu từ đơn hoàn thành</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-2">
          <h2 className="text-base font-semibold font-display">Giá trị đơn trung bình</h2>
          <div className="text-2xl font-bold font-display">{formatCurrencyVnd(Math.round(revenueSummary._avg.totalAmount ?? 0))}</div>
          <div className="text-sm text-muted-foreground">Tính theo các đơn đã có giá trị</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-2">
          <h2 className="text-base font-semibold font-display">Nhân sự và rủi ro</h2>
          <div className="text-sm text-muted-foreground">Nhân viên: {totalEmployees}</div>
          <div className="text-sm text-muted-foreground">Đơn bị hủy: {cancelledOrders}</div>
          <div className="text-sm text-muted-foreground">Đơn hoàn thành: {completedOrders}</div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-3">
          <h2 className="text-base font-semibold font-display">Baseline thủ công (hôm nay)</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border p-4">
              <div className="text-muted-foreground text-xs mb-1">Tác vụ manual</div>
              <div className="text-xl font-bold font-display">{manualActionsToday}</div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="text-muted-foreground text-xs mb-1">Tạo đơn manual</div>
              <div className="text-xl font-bold font-display">{manualOrderCreatesToday}</div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="text-muted-foreground text-xs mb-1">Xác nhận lấy hàng</div>
              <div className="text-xl font-bold font-display">{manualPickupConfirmsToday}</div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="text-muted-foreground text-xs mb-1">Tác vụ automation</div>
              <div className="text-xl font-bold font-display">{automationActionsToday}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Giữ chế độ manual trước để lấy baseline, sau đó bật workflow và so sánh theo cùng khung thời gian.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-3">
          <h2 className="text-base font-semibold font-display">Gợi ý so sánh</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>1. Thu baseline manual liên tục 7-14 ngày.</div>
            <div>2. Bật workflow với executionMode=automation cho cùng quy trình.</div>
            <div>3. So sánh số tác vụ, thời gian xử lý và tỷ lệ trạng thái hoàn thành.</div>
            <div>4. Đối chiếu thêm tỷ lệ lỗi và retry để đánh giá ổn định vận hành.</div>
          </div>
        </div>
      </section>
    </div>
  )
}
