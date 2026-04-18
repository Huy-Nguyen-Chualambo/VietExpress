import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Package,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { authOptions } from '@/lib/auth'
import {
  formatCurrencyVnd,
  formatDateOnly,
  formatDateTime,
  getCustomerOverview,
  notificationTypeClass,
  notificationTypeLabel,
  orderStatusClass,
  orderStatusLabel,
  quoteStatusClass,
  quoteStatusLabel,
} from '@/lib/customer-portal'

export default async function CustomerDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  const data = await getCustomerOverview(session.user.id)
  const profileName = data.profile?.fullName || session.user.name || 'Khách hàng'

  const overviewCards = [
    {
      label: 'Tổng đơn hàng',
      value: data.stats.totalOrders,
      icon: Package,
      hint: 'Tất cả đơn theo tài khoản',
      color: 'text-brand',
      bg: 'bg-brand-soft',
    },
    {
      label: 'Đang vận chuyển',
      value: data.stats.activeOrders,
      icon: Truck,
      hint: 'Đơn chờ giao / đang giao',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Đã hoàn thành',
      value: data.stats.completedOrders,
      icon: CheckCircle2,
      hint: 'Đơn giao thành công',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Báo giá chờ',
      value: data.stats.pendingQuotes,
      icon: Clock,
      hint: 'Yêu cầu đang chờ xử lý',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Thông báo chưa đọc',
      value: data.stats.unreadNotifications,
      icon: Bell,
      hint: 'Cập nhật mới từ hệ thống',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Tổng giá trị đơn',
      value: formatCurrencyVnd(data.stats.totalRevenue),
      icon: TrendingUp,
      hint: 'Chỉ tính các đơn đã lưu',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ]

  return (
    <div className="space-y-8">
      <section className="bg-gradient-brand rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-white/75 text-sm uppercase tracking-[0.25em]">
              Tổng quan khách hàng
            </p>
            <h1 className="text-2xl font-bold font-(family-name:--font-display)">
              Xin chào, {profileName}
            </h1>
            <p className="text-white/75 text-sm leading-relaxed">
              Đây là dữ liệu vận chuyển thật của bạn trên hệ thống. Tính đến hiện tại,
              có {data.stats.activeOrders} đơn đang chạy và {data.stats.pendingQuotes}{' '}
              yêu cầu báo giá chưa xử lý.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/khach-hang/don-hang"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand text-sm font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              <Package className="w-4 h-4" />
              Xem đơn hàng
            </Link>
            <Link
              href="/dashboard/khach-hang/bao-gia"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white text-sm font-semibold rounded-lg hover:bg-white/30 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Yêu cầu báo giá
            </Link>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-border/50 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className="text-xs text-muted-foreground text-right max-w-36">
                {card.hint}
              </span>
            </div>
            <div className="text-2xl font-bold font-(family-name:--font-display)">
              {typeof card.value === 'number' ? card.value.toLocaleString('vi-VN') : card.value}
            </div>
            <div className="text-sm text-muted-foreground">{card.label}</div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold font-(family-name:--font-display)">
              Đơn hàng gần đây
            </h3>
            <Link
              href="/dashboard/khach-hang/don-hang"
              className="text-sm text-brand font-medium hover:underline flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Chưa có đơn hàng nào. Khi có dữ liệu thật, chúng sẽ xuất hiện tại đây.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.orders.map((order) => {
                const latestEvent = order.trackingEvents[0]
                return (
                  <div key={order.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold">{order.orderCode}</div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${orderStatusClass(order.status)}`}>
                            {orderStatusLabel(order.status)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {order.origin} → {order.destination}
                          <span className="mx-1">•</span>
                          <span>{order.serviceType}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {latestEvent
                            ? `Cập nhật gần nhất: ${latestEvent.location} · ${formatDateTime(latestEvent.eventTime)}`
                            : 'Chưa có lịch sử tracking'}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-right">
                        {formatCurrencyVnd(order.totalAmount)}
                        <div className="text-xs text-muted-foreground font-normal">
                          ETA: {formatDateOnly(order.estimatedDelivery)}
                        </div>
                      </div>
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
              <h3 className="text-base font-semibold font-(family-name:--font-display)">
                Báo giá gần đây
              </h3>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>

            {data.quoteRequests.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                Chưa có yêu cầu báo giá nào.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.quoteRequests.map((quote) => (
                  <div key={quote.id} className="px-6 py-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{quote.quoteCode}</div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${quoteStatusClass(quote.status)}`}>
                        {quoteStatusLabel(quote.status)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {quote.origin} → {quote.destination}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between gap-3">
                      <span>{quote.serviceType}</span>
                      <span>{formatDateOnly(quote.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold font-(family-name:--font-display)">
                Thông báo mới
              </h3>
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>

            {data.notifications.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                Chưa có thông báo nào.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.notifications.map((notification) => (
                  <div key={notification.id} className="px-6 py-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{notification.title}</div>
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${notificationTypeClass(notification.type)}`}>
                        {notificationTypeLabel(notification.type)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {notification.message}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDateTime(notification.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border/50 overflow-hidden p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold font-(family-name:--font-display)">
                Theo dõi gần nhất
              </h3>
              <Link href="/dashboard/khach-hang/theo-doi" className="text-sm text-brand font-medium hover:underline">
                Mở chi tiết
              </Link>
            </div>
            {data.latestTracking ? (
              <>
                <div className="text-sm font-semibold">{data.latestTracking.location}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {data.latestTracking.description}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {formatDateTime(data.latestTracking.eventTime)}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Chưa có lịch sử tracking cho các đơn hàng hiện tại.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
