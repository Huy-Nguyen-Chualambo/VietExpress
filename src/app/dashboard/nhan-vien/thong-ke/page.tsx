import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import { formatCurrencyVnd } from '@/lib/customer-portal'
import { BarChart3, CalendarDays, Package, TrendingUp, Users, AlertTriangle, Lightbulb, BrainCircuit } from 'lucide-react'

type AiInsights = {
  executiveSummary?: string
  risks?: string[]
  recommendations?: string[]
}

/** Normalize aiInsights từ DB — xử lý các trường hợp AI trả về sai format */
function normalizeAiInsights(raw: unknown): AiInsights | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  // executiveSummary: nếu là object (Groq trả về key-value metrics), join thành string
  let summary: string | null = null
  if (typeof obj.executiveSummary === 'string') {
    summary = obj.executiveSummary
  } else if (obj.executiveSummary && typeof obj.executiveSummary === 'object') {
    summary = Object.entries(obj.executiveSummary as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ')
  }

  // risks / recommendations: lọc chỉ giữ string, bỏ object/number
  const risks = Array.isArray(obj.risks)
    ? obj.risks.filter((r): r is string => typeof r === 'string')
    : []

  const recommendations = Array.isArray(obj.recommendations)
    ? obj.recommendations.filter((r): r is string => typeof r === 'string')
    : []

  if (!summary && risks.length === 0 && recommendations.length === 0) return null

  return { executiveSummary: summary ?? undefined, risks, recommendations }
}

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
    dailyKpiReports,
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
    prisma.dailyKpiReport.findMany({
      where: {
        reportType: 'daily_kpi_report_continuous_improvement',
      },
      orderBy: {
        generatedAt: 'desc',
      },
      select: {
        id: true,
        generatedAt: true,
        summary: true,
        operations: true,
        financial: true,
        onTimeRate: true,
        slaAlerts: true,
      },
    }),
  ])

  const completionRate = totalOrders === 0 ? 0 : Math.round((completedOrders / totalOrders) * 100)
  const latestDailyReport = dailyKpiReports[0]

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
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold font-display">Daily KPI Reports</h2>
              <p className="text-sm text-muted-foreground">Hiển thị dữ liệu tổng hợp theo ngày từ bảng daily_kpi_reports.</p>
            </div>
            <div className="rounded-xl border border-border px-3 py-2 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Bản mới nhất</div>
              <div className="text-sm font-semibold font-display">
                {latestDailyReport
                  ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(latestDailyReport.generatedAt))
                  : 'Chưa có dữ liệu'}
              </div>
            </div>
          </div>

          {dailyKpiReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Chưa có daily_kpi_reports trong database.
            </div>
          ) : (
            <div className="grid gap-4">
              {dailyKpiReports.map((report) => {
                const summary = report.summary as Record<string, number | null> | null
                const operations = report.operations as Record<string, number | null> | null
                const financial = report.financial as (Record<string, unknown>) | null
                const aiInsights = normalizeAiInsights(financial?.aiInsights)

                const reportDate = new Intl.DateTimeFormat('vi-VN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }).format(new Date(report.generatedAt))

                return (
                  <div key={report.id} className="rounded-2xl border border-border/60 p-5 bg-slate-50/70">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <CalendarDays className="w-4 h-4 text-brand" />
                          {reportDate}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          SLA alerts: {report.slaAlerts ?? 0} · on-time rate: {report.onTimeRate == null ? 'N/A' : `${Math.round((report.onTimeRate || 0) * 100)}%`}
                        </div>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-border">
                        {summary?.totalOrdersObserved ?? 0} orders
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
                      <div className="rounded-xl bg-white border border-border p-4">
                        <div className="text-xs text-muted-foreground mb-1">Đơn quan sát</div>
                        <div className="text-lg font-bold font-display">{summary?.totalOrdersObserved ?? 0}</div>
                      </div>
                      <div className="rounded-xl bg-white border border-border p-4">
                        <div className="text-xs text-muted-foreground mb-1">Đơn hoàn thành</div>
                        <div className="text-lg font-bold font-display">{operations?.ordersDelivered ?? 0}</div>
                      </div>
                      <div className="rounded-xl bg-white border border-border p-4">
                        <div className="text-xs text-muted-foreground mb-1">Doanh thu</div>
                        <div className="text-lg font-bold font-display">{formatCurrencyVnd(Number(financial?.totalRevenueVnd ?? 0))}</div>
                      </div>
                      <div className="rounded-xl bg-white border border-border p-4">
                        <div className="text-xs text-muted-foreground mb-1">Tỷ lệ đúng hạn</div>
                        <div className="text-lg font-bold font-display">
                          {operations?.onTimeRate == null ? 'N/A' : `${Math.round(Number(operations.onTimeRate) * 100)}%`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                      <div className="rounded-xl border border-border bg-white p-3">Báo giá: {summary?.totalQuoteRequests ?? 0}</div>
                      <div className="rounded-xl border border-border bg-white p-3">Notifications: {summary?.totalNotifications ?? 0}</div>
                      <div className="rounded-xl border border-border bg-white p-3">Tổng action logs: {summary?.totalActionLogs ?? 0}</div>
                    </div>

                    {aiInsights && (
                      <div className="mt-4 space-y-3">
                        {aiInsights.executiveSummary && (
                          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-2">
                              <BrainCircuit className="w-3.5 h-3.5" />
                              Nhận định AI
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{aiInsights.executiveSummary}</p>
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-3">
                          {aiInsights.risks && aiInsights.risks.length > 0 && (
                            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                              <div className="flex items-center gap-2 text-xs font-semibold text-red-700 mb-2">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Rủi ro ({aiInsights.risks.length})
                              </div>
                              <ul className="space-y-1.5">
                                {aiInsights.risks.map((risk, i) => (
                                  <li key={i} className="text-xs text-slate-700 flex gap-2">
                                    <span className="text-red-400 mt-0.5 shrink-0">•</span>
                                    <span>{risk}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                              <div className="flex items-center gap-2 text-xs font-semibold text-green-700 mb-2">
                                <Lightbulb className="w-3.5 h-3.5" />
                                Khuyến nghị ({aiInsights.recommendations.length})
                              </div>
                              <ul className="space-y-1.5">
                                {aiInsights.recommendations.map((rec, i) => (
                                  <li key={i} className="text-xs text-slate-700 flex gap-2">
                                    <span className="text-green-500 mt-0.5 shrink-0">→</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
