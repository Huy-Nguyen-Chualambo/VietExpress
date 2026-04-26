import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import {
  formatDateTime,
  getCustomerTracking,
  orderStatusClass,
  orderStatusLabel,
} from '@/lib/customer-portal'
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Package,
  Route,
  Truck,
} from 'lucide-react'

function getProgress(status: string) {
  switch (status) {
    case 'completed':
      return 100
    case 'delivering':
      return 85
    case 'in_transit':
      return 60
    case 'picked_up':
      return 30
    case 'pending':
      return 10
    default:
      return 0
  }
}

export default async function TrackingPage({
  searchParams,
}: {
  searchParams?: Promise<{ order?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  const params = searchParams ? await searchParams : undefined
  const { orders, selectedOrder } = await getCustomerTracking(session.user.id, params?.order)

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border border-border/50 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Theo dõi
            </p>
            <h1 className="text-2xl font-bold font-display">
              Trạng thái vận đơn theo thời gian thực
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Chọn một đơn hàng để xem dòng thời gian tracking thật của nó trong hệ
              thống.
            </p>
          </div>
          <Link
            href="/dashboard/khach-hang/don-hang"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
          >
            Về đơn hàng
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="grid lg:grid-cols-5 gap-6">
        <aside className="lg:col-span-2 bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold font-display">
              Danh sách đơn
            </h2>
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Chưa có đơn hàng nào để theo dõi.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((order) => {
                const active = selectedOrder?.id === order.id
                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/khach-hang/theo-doi?order=${order.orderCode}`}
                    className={`block p-5 transition-colors ${active ? 'bg-brand-soft/40' : 'hover:bg-muted/30'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{order.orderCode}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.origin} → {order.destination}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${orderStatusClass(order.status)}`}>
                        {orderStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{order.serviceType}</span>
                      <span>{formatDateTime(order.updatedAt)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </aside>

        <main className="lg:col-span-3 bg-white rounded-2xl border border-border/50 overflow-hidden">
          {selectedOrder ? (
            <>
              <div className="px-6 py-4 border-b border-border flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold font-display">
                    {selectedOrder.orderCode}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.origin} → {selectedOrder.destination}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${orderStatusClass(selectedOrder.status)}`}>
                  {orderStatusLabel(selectedOrder.status)}
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-muted/30 p-4">
                    <div className="text-xs text-muted-foreground mb-1">Dịch vụ</div>
                    <div className="font-semibold">{selectedOrder.serviceType}</div>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-4">
                    <div className="text-xs text-muted-foreground mb-1">Vị trí hiện tại</div>
                    <div className="font-semibold">{selectedOrder.currentLocation || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-4">
                    <div className="text-xs text-muted-foreground mb-1">ETA</div>
                    <div className="font-semibold">{selectedOrder.estimatedDelivery ? formatDateTime(selectedOrder.estimatedDelivery) : 'Chưa xác định'}</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">Tiến độ vận chuyển</span>
                    <span className="text-muted-foreground">{getProgress(selectedOrder.status)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${getProgress(selectedOrder.status)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Route className="w-4 h-4 text-brand" />
                    <h3 className="font-semibold font-display">
                      Dòng thời gian tracking
                    </h3>
                  </div>

                  {selectedOrder.trackingEvents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      Chưa có sự kiện tracking nào cho đơn này.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedOrder.trackingEvents.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${index === 0 ? 'bg-brand text-white' : 'bg-brand-soft text-brand'}`}>
                              {index === 0 ? <Truck className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            {index < selectedOrder.trackingEvents.length - 1 && <div className="w-px flex-1 bg-border my-2" />}
                          </div>
                          <div className="flex-1 pb-5">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div className="font-medium">{event.location}</div>
                              <div className="text-xs text-muted-foreground">{formatDateTime(event.eventTime)}</div>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Trạng thái: {event.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border p-5 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-brand" />
                    <h3 className="font-semibold font-display">
                      Thông tin tóm tắt
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div>Ngày tạo: {formatDateTime(selectedOrder.createdAt)}</div>
                    <div>Cập nhật: {formatDateTime(selectedOrder.updatedAt)}</div>
                    <div>Tuyến: {selectedOrder.origin} → {selectedOrder.destination}</div>
                    <div>Vị trí hiện tại: {selectedOrder.currentLocation || 'Chưa cập nhật'}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-10 text-center">
              <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Không có đơn để theo dõi</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Khi hệ thống có đơn hàng, bạn sẽ thấy timeline tracking thật tại đây.
              </p>
            </div>
          )}
        </main>
      </section>
    </div>
  )
}

