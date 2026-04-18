import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  Package,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react'
import { getEmployeeOverview, requireEmployeeSession } from '@/lib/employee-portal'
import {
  formatCurrencyVnd,
  formatDateOnly,
  formatDateTime,
  orderStatusClass,
  orderStatusLabel,
  quoteStatusClass,
  quoteStatusLabel,
} from '@/lib/customer-portal'

export default async function EmployeeDashboardPage() {
  const session = await requireEmployeeSession()
  const data = await getEmployeeOverview()

  const stats = [
    {
      label: 'Đơn hàng hôm nay',
      value: data.stats.ordersToday.toLocaleString('vi-VN'),
      icon: Package,
      hint: `${data.stats.totalOrders.toLocaleString('vi-VN')} đơn toàn hệ thống`,
      color: 'text-brand',
      bg: 'bg-brand-soft',
    },
    {
      label: 'Đang vận chuyển',
      value: data.stats.activeOrders.toLocaleString('vi-VN'),
      icon: Truck,
      hint: `${data.stats.completedOrders.toLocaleString('vi-VN')} đơn đã hoàn thành`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Khách hàng mới tuần này',
      value: data.stats.newCustomersThisWeek.toLocaleString('vi-VN'),
      icon: Users,
      hint: 'Tính theo hồ sơ role customer',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Doanh thu tháng',
      value: formatCurrencyVnd(data.stats.monthlyRevenue),
      icon: TrendingUp,
      hint: `${data.stats.pendingQuotes.toLocaleString('vi-VN')} báo giá chờ xử lý`,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="space-y-8">
      <section className="bg-[hsl(215,25%,12%)] rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-brand opacity-10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-gradient-gold opacity-10 rounded-full translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/50 uppercase tracking-wider">
              Hệ thống vận hành trực tuyến
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display mb-1">
            Dashboard nhân viên điều phối
          </h1>
          <p className="text-white/50 text-sm">
            Xin chào {session.user.name || 'Nhân viên'} - hiện có {data.stats.activeOrders}{' '}
            đơn đang xử lý và {data.stats.unreadNotifications} thông báo chưa đọc.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/nhan-vien/van-don"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-brand text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              <Package className="w-4 h-4" />
              Quản lý vận đơn
            </Link>
            <Link
              href="/dashboard/nhan-vien/thong-ke"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-lg hover:bg-white/20 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Xem thống kê
            </Link>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-border/50 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-xs text-muted-foreground text-right max-w-32">{stat.hint}</span>
            </div>
            <div className="text-2xl font-bold font-display">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold font-display">
              Đơn hàng mới cập nhật
            </h3>
            <Link
              href="/dashboard/nhan-vien/van-don"
              className="text-sm text-brand font-medium hover:underline flex items-center gap-1"
            >
              Xem danh sách <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Chưa có vận đơn nào trong hệ thống.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.recentOrders.map((order) => {
                const latestEvent = order.trackingEvents[0]
                return (
                  <div key={order.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{order.orderCode}</span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${orderStatusClass(order.status)}`}
                          >
                            {orderStatusLabel(order.status)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {order.origin} - {order.destination}
                          <span className="mx-1">•</span>
                          <span>{order.user.profile?.fullName || order.user.name || 'Khách hàng'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatCurrencyVnd(order.totalAmount)}</div>
                        <div className="text-xs text-muted-foreground">
                          ETA: {formatDateOnly(order.estimatedDelivery)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {latestEvent
                        ? `Tracking: ${latestEvent.location} - ${formatDateTime(latestEvent.eventTime)}`
                        : 'Chưa có lịch sử tracking'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold font-display">
                Cảnh báo SLA
              </h3>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            {data.slaBreaches.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Không có đơn trễ hạn.</div>
            ) : (
              <div className="divide-y divide-border">
                {data.slaBreaches.map((order) => (
                  <div key={order.id} className="px-6 py-4">
                    <div className="text-sm font-semibold">{order.orderCode}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {order.origin} - {order.destination}
                    </div>
                    <div className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Quá ETA từ {formatDateTime(order.estimatedDelivery)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold font-display">
                Báo giá chờ xử lý
              </h3>
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
            </div>
            {data.pendingQuoteRequests.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Không có yêu cầu chờ.</div>
            ) : (
              <div className="divide-y divide-border">
                {data.pendingQuoteRequests.map((quote) => (
                  <div key={quote.id} className="px-6 py-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{quote.quoteCode}</div>
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${quoteStatusClass(quote.status)}`}>
                        {quoteStatusLabel(quote.status)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {quote.origin} - {quote.destination}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {quote.user.profile?.fullName || quote.user.name || 'Khách hàng'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold font-display">
                Thông báo hệ thống
              </h3>
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
            {data.recentNotifications.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Chưa có thông báo nào.</div>
            ) : (
              <div className="divide-y divide-border">
                {data.recentNotifications.map((notification) => (
                  <div key={notification.id} className="px-6 py-4">
                    <div className="text-sm font-medium">{notification.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1.5">
                      {formatDateTime(notification.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold font-display">
                Tuyến nổi bật
              </h3>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            {data.topRoutes.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Chưa có dữ liệu tuyến.</div>
            ) : (
              <div className="p-4 space-y-3">
                {data.topRoutes.map((route) => (
                  <div key={`${route.origin}-${route.destination}`} className="rounded-lg bg-muted/30 p-3">
                    <div className="text-sm font-semibold">
                      {route.origin} - {route.destination}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {route._count._all} chuyến hoàn thành - {formatCurrencyVnd(route._sum.totalAmount ?? 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
