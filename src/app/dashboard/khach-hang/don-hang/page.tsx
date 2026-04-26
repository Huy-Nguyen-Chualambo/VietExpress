import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import {
  formatCurrencyVnd,
  formatDateOnly,
  formatDateTime,
  getCustomerOrders,
  orderStatusClass,
  orderStatusLabel,
} from '@/lib/customer-portal'
import {
  ArrowRight,
  Clock,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
} from 'lucide-react'

const statusCards = [
  { key: 'pending', label: 'Chờ xử lý', icon: CircleDashed, color: 'text-slate-600', bg: 'bg-slate-50' },
  { key: 'picked_up', label: 'Đã lấy hàng', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'in_transit', label: 'Đang vận chuyển', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'delivering', label: 'Đang giao', icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'completed', label: 'Hoàn thành', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'cancelled', label: 'Đã hủy', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
]

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  const { orders } = await getCustomerOrders(session.user.id)
  const counts = statusCards.reduce<Record<string, number>>((acc, card) => {
    acc[card.key] = orders.filter((order) => order.status === card.key).length
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border border-border/50 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Đơn hàng
            </p>
            <h1 className="text-2xl font-bold font-display">
              Danh sách vận đơn của bạn
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Tất cả dữ liệu bên dưới được đọc trực tiếp từ cơ sở dữ liệu. Mỗi đơn đều
              có mã vận đơn, trạng thái và cập nhật tracking thật.
            </p>
          </div>
          <Link
            href="/dashboard/khach-hang/theo-doi"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Theo dõi đơn
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statusCards.map((card) => (
          <div key={card.key} className="bg-white rounded-xl border border-border/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className="text-2xl font-bold font-display">
                {counts[card.key] || 0}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">{card.label}</div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold font-display">
            Tất cả đơn hàng
          </h2>
          <span className="text-sm text-muted-foreground">{orders.length} đơn</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Khi có đơn thật được tạo trong hệ thống, chúng sẽ hiển thị ở đây. Bạn có
              thể bắt đầu bằng việc tạo đơn mới ngay bây giờ.
            </p>
            <Link
              href="/dashboard/khach-hang/bao-gia"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold mt-5"
            >
              Tạo đơn ngay
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => {
              const latestEvent = order.trackingEvents[0]
              const progress =
                order.status === 'completed'
                  ? 100
                  : order.status === 'delivering'
                    ? 85
                    : order.status === 'in_transit'
                      ? 60
                      : order.status === 'picked_up'
                        ? 25
                        : 10

              return (
                <article key={order.id} className="p-6 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold font-display">
                          {order.orderCode}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${orderStatusClass(order.status)}`}>
                          {orderStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                        <div className="rounded-xl bg-muted/30 p-4">
                          <div className="text-xs text-muted-foreground mb-1">Tuyến đường</div>
                          <div className="font-medium">{order.origin}</div>
                          <div className="text-muted-foreground text-xs my-1">→</div>
                          <div className="font-medium">{order.destination}</div>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-4">
                          <div className="text-xs text-muted-foreground mb-1">Dịch vụ</div>
                          <div className="font-medium">{order.serviceType}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {order.weightKg ? `${order.weightKg.toLocaleString('vi-VN')} kg` : 'Chưa khai báo trọng lượng'}
                          </div>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-4">
                          <div className="text-xs text-muted-foreground mb-1">Giá trị</div>
                          <div className="font-medium">{formatCurrencyVnd(order.totalAmount)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ETA: {formatDateOnly(order.estimatedDelivery)}
                          </div>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-4">
                          <div className="text-xs text-muted-foreground mb-1">Cập nhật gần nhất</div>
                          <div className="font-medium truncate">
                            {latestEvent ? latestEvent.location : 'Chưa có tracking'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {latestEvent ? formatDateTime(latestEvent.eventTime) : formatDateTime(order.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>Tiến độ đơn hàng</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="xl:w-60 flex flex-col gap-3">
                      <Link
                        href={`/dashboard/khach-hang/theo-doi?order=${order.orderCode}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
                      >
                        Theo dõi chi tiết
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground space-y-2">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <Clock className="w-4 h-4 text-brand" />
                          Cập nhật
                        </div>
                        <div>{formatDateTime(order.updatedAt)}</div>
                        {latestEvent && <div>{latestEvent.description}</div>}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

