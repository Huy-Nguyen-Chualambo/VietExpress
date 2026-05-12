import Link from 'next/link'
import { AlertCircle, ArrowRight, Clock, MapPin, Package, TriangleAlert } from 'lucide-react'
import { getEmployeeOverview, requireEmployeeSession } from '@/lib/employee-portal'
import { formatDateOnly, formatDateTime } from '@/lib/customer-portal'

export default async function EmployeeSlaWarningsPage() {
  await requireEmployeeSession()
  const data = await getEmployeeOverview()

  const overdueOrders = data.slaBreaches
  const riskOrders = data.slaRiskOrders

  return (
    <div className="space-y-6">
      <section className="bg-[hsl(215,25%,12%)] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-brand opacity-10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-gradient-gold opacity-10 rounded-full translate-y-1/2" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-white/60 text-xs uppercase tracking-[0.2em]">
              <TriangleAlert className="w-4 h-4" />
              SLA Monitoring
            </div>
            <h1 className="text-2xl font-bold font-display">Cảnh báo SLA</h1>
            <p className="text-sm text-white/55 mt-2 max-w-2xl">
              Danh sách này lấy trực tiếp từ đơn hàng để đảm bảo tính nhất quán: đơn đã trễ và đơn đang có nguy cơ trễ.
            </p>
          </div>
          <Link
            href="/dashboard/nhan-vien/van-don"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-lg hover:bg-white/20 transition-colors"
          >
            <Package className="w-4 h-4" />
            Sang vận đơn
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-display">{overdueOrders.length.toLocaleString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground">Đã trễ</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-display">{riskOrders.length.toLocaleString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground">Có nguy cơ trễ</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold font-display">{data.stats.activeOrders.toLocaleString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground">Đang theo dõi</div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold font-display">Đơn hàng đã trễ</h2>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>

          {overdueOrders.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">Không có đơn nào vượt ETA.</div>
          ) : (
            <div className="divide-y divide-border">
              {overdueOrders.map((order) => {
                const latestEvent = order.trackingEvents[0]
                return (
                  <article key={order.id} className="p-6 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{order.orderCode}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.origin} - {order.destination}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-1">
                        high
                      </span>
                    </div>
                    <div className="text-xs text-red-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ETA: {formatDateOnly(order.estimatedDelivery)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.user.profile?.fullName || order.user.name || 'Khách hàng'}
                    </div>
                    <div className="text-xs text-slate-600">
                      {latestEvent
                        ? `Tracking gần nhất: ${latestEvent.location} - ${formatDateTime(latestEvent.eventTime)}`
                        : 'Chưa có tracking gần nhất'}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold font-display">Đơn hàng có nguy cơ trễ</h2>
            <TriangleAlert className="w-4 h-4 text-blue-600" />
          </div>

          {riskOrders.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">Không có đơn nào ở mức rủi ro.</div>
          ) : (
            <div className="divide-y divide-border">
              {riskOrders.map((order) => {
                const latestEvent = order.trackingEvents[0]
                return (
                  <article key={order.id} className="p-6 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{order.orderCode}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.origin} - {order.destination}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-1">
                        medium
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ETA: {formatDateOnly(order.estimatedDelivery)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.user.profile?.fullName || order.user.name || 'Khách hàng'}
                    </div>
                    <div className="text-xs text-slate-600">
                      {latestEvent
                        ? `Tracking gần nhất: ${latestEvent.location} - ${formatDateTime(latestEvent.eventTime)}`
                        : 'Chưa có tracking gần nhất'}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold font-display">Gợi ý xử lý nhanh</h2>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="p-6 grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
          <div className="rounded-xl border border-border p-4">Ưu tiên liên hệ với đơn đã trễ để xác nhận vị trí hiện tại.</div>
          <div className="rounded-xl border border-border p-4">Đơn có nguy cơ trễ nên được theo dõi thêm tracking hoặc đẩy webhook nội bộ.</div>
          <div className="rounded-xl border border-border p-4">Cập nhật trạng thái vận đơn để kiểm tra lại ETA và ngăn trễ tiếp diễn.</div>
        </div>
      </section>
    </div>
  )
}
